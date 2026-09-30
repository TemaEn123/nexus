import { createGroq, type GroqLanguageModelChatOptions } from "@ai-sdk/groq";
import { createTextStreamResponse, Output, streamText } from "ai";
import {
  SUGGEST_SUBTASKS_INSTRUCTIONS,
  suggestSubtasksPrompt,
} from "@/features/ai-assistant/prompt";
import { reserveSuggestAttempt } from "@/features/ai-assistant/rate-limit";
import { suggestSubtasksSchema } from "@/features/ai-assistant/schemas";
import { toTextStreamOrFail } from "@/features/ai-assistant/text-stream";
import { idSchema } from "@/features/board/schemas";
import { getOwnedCard, handleBoardError } from "@/features/board/service";
import { withApiLog } from "@/server/api-log";
import { jsonError, parseIdParam } from "@/server/api-response";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logger";
import { requireApiUser } from "@/server/require-api-user";

/**
 * Proxy к Groq: ключ только на сервере. Body не читаем — карточка из БД.
 * Чужой / нет id → 404, как у остального API. Нет ключа → 503.
 * Своя карточка и ключ есть → резерв суточного лимита, иначе 429 без Groq.
 * Ошибка стрима после 200 рвёт body — иначе `useObject` молчит на пустом 200.
 */
const suggestModel = "openai/gpt-oss-20b";

const groqReasoning = {
  reasoningEffort: "low",
} satisfies GroqLanguageModelChatOptions;

export const maxDuration = 30;

export const POST = withApiLog(async function POST(
  _request: Request,
  ctx: RouteContext<"/api/cards/[cardId]/suggest">,
) {
  const gate = await requireApiUser();
  if (!gate.ok) {
    return gate.response;
  }

  const apiKey = getEnv().GROQ_API_KEY;
  if (!apiKey) {
    return jsonError(
      503,
      "unavailable",
      "AI is not configured. Add GROQ_API_KEY.",
    );
  }

  const { cardId } = await ctx.params;
  const path = parseIdParam(cardId, idSchema);
  if (!path.ok) {
    return path.response;
  }

  try {
    const card = await getOwnedCard(gate.user.id, path.data);
    const reserved = await reserveSuggestAttempt(gate.user.id);
    if (!reserved) {
      logger.warn("suggest_rate_limited", {
        status: 429,
        code: "rate_limited",
      });
      return jsonError(
        429,
        "rate_limited",
        "Daily suggestion limit reached. Try again tomorrow.",
      );
    }

    const result = streamText({
      model: createGroq({ apiKey })(suggestModel),
      providerOptions: { groq: groqReasoning },
      instructions: SUGGEST_SUBTASKS_INSTRUCTIONS,
      prompt: suggestSubtasksPrompt(card),
      output: Output.object({ schema: suggestSubtasksSchema }),
    });

    return createTextStreamResponse({
      stream: toTextStreamOrFail({ stream: result.stream }),
    });
  } catch (error) {
    return handleBoardError(error);
  }
});
