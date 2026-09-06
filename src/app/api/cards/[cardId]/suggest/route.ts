import { createTextStreamResponse, Output, streamText, toTextStream } from "ai";
import {
  SUGGEST_SUBTASKS_INSTRUCTIONS,
  suggestSubtasksPrompt,
} from "@/features/ai-assistant/prompt";
import { suggestSubtasksSchema } from "@/features/ai-assistant/schemas";
import { idSchema } from "@/features/board/schemas";
import { getOwnedCard, handleBoardError } from "@/features/board/service";
import { jsonError, parseIdParam } from "@/server/api-response";
import { requireApiUser } from "@/server/require-api-user";

/**
 * Proxy к модели: ключ только на сервере. Body не читаем — карточка из БД.
 * Чужой / нет id → 404, как у остального API. Нет ключа → 503.
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

  if (!process.env.AI_GATEWAY_API_KEY?.trim()) {
    return jsonError(
      503,
      "unavailable",
      "AI is not configured. Add AI_GATEWAY_API_KEY.",
    );
  }

  const { cardId } = await ctx.params;
  const path = parseIdParam(cardId, idSchema);
  if (!path.ok) {
    return path.response;
  }

  try {
    const card = await getOwnedCard(gate.user.id, path.data);
    const result = streamText({
      model: "openai/gpt-4o-mini",
      instructions: SUGGEST_SUBTASKS_INSTRUCTIONS,
      prompt: suggestSubtasksPrompt(card),
      output: Output.object({ schema: suggestSubtasksSchema }),
    });

    return createTextStreamResponse({
      stream: toTextStream({ stream: result.stream }),
    });
  } catch (error) {
    return handleBoardError(error);
  }
}
