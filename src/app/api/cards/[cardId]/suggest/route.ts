import { createTextStreamResponse, Output, streamText } from "ai";
import {
  GROQ_UNAVAILABLE_MESSAGE,
  groqApiKey,
  groqModel,
  groqProviderOptions,
} from "@/features/ai-assistant/groq";
import {
  SUGGEST_SUBTASKS_INSTRUCTIONS,
  suggestSubtasksPrompt,
} from "@/features/ai-assistant/prompt";
import { suggestSubtasksSchema } from "@/features/ai-assistant/schemas";
import { toTextStreamOrFail } from "@/features/ai-assistant/text-stream";
import { idSchema } from "@/features/board/schemas";
import {
  getBoard,
  getOwnedCard,
  handleBoardError,
} from "@/features/board/service";
import { jsonError, parseIdParam } from "@/server/api-response";
import { requireApiUser } from "@/server/require-api-user";

/**
 * Proxy к Groq: ключ только на сервере. Body не читаем — карточка и доска из БД.
 * Чужой / нет id → 404, как у остального API. Нет ключа → 503.
 * Ошибка стрима после 200 рвёт body — иначе `useObject` молчит на пустом 200.
 */
export const maxDuration = 30;

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/cards/[cardId]/suggest">,
) {
  const gate = await requireApiUser();
  if (!gate.ok) {
    return gate.response;
  }

  const apiKey = groqApiKey();
  if (!apiKey) {
    return jsonError(503, "unavailable", GROQ_UNAVAILABLE_MESSAGE);
  }

  const { cardId } = await ctx.params;
  const path = parseIdParam(cardId, idSchema);
  if (!path.ok) {
    return path.response;
  }

  try {
    const card = await getOwnedCard(gate.user.id, path.data);
    const board = await getBoard(gate.user.id, card.column.boardId);
    const result = streamText({
      model: groqModel(apiKey),
      providerOptions: groqProviderOptions,
      instructions: SUGGEST_SUBTASKS_INSTRUCTIONS,
      prompt: suggestSubtasksPrompt(card, board),
      output: Output.object({ schema: suggestSubtasksSchema }),
    });

    return createTextStreamResponse({
      stream: toTextStreamOrFail({ stream: result.stream }),
    });
  } catch (error) {
    return handleBoardError(error);
  }
}
