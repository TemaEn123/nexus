import { createTextStreamResponse, Output, streamText } from "ai";
import { boardCardCount } from "@/features/ai-assistant/board-snapshot";
import {
  GROQ_UNAVAILABLE_MESSAGE,
  groqApiKey,
  groqModel,
  groqProviderOptions,
} from "@/features/ai-assistant/groq";
import {
  SUGGEST_PRIORITY_INSTRUCTIONS,
  suggestPriorityPrompt,
} from "@/features/ai-assistant/prompt";
import { suggestPrioritySchema } from "@/features/ai-assistant/schemas";
import { toTextStreamOrFail } from "@/features/ai-assistant/text-stream";
import { idSchema } from "@/features/board/schemas";
import { getBoard, handleBoardError } from "@/features/board/service";
import { jsonError, parseIdParam } from "@/server/api-response";
import { requireApiUser } from "@/server/require-api-user";

/**
 * Proxy к Groq: ключ только на сервере. Body не читаем — доска из БД.
 * Чужой / нет id → 404. Нет ключа → 503. Пустая доска → 400 (нечего выбирать).
 * Карточки не двигаем: ответ `{ pick, reason }`, UI подсветит индекс.
 */
export const maxDuration = 30;

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/boards/[boardId]/priority">,
) {
  const gate = await requireApiUser();
  if (!gate.ok) {
    return gate.response;
  }

  const apiKey = groqApiKey();
  if (!apiKey) {
    return jsonError(503, "unavailable", GROQ_UNAVAILABLE_MESSAGE);
  }

  const { boardId } = await ctx.params;
  const path = parseIdParam(boardId, idSchema);
  if (!path.ok) {
    return path.response;
  }

  try {
    const board = await getBoard(gate.user.id, path.data);

    if (boardCardCount(board) === 0) {
      return jsonError(
        400,
        "validation_error",
        "Board has no cards to prioritize.",
      );
    }

    const result = streamText({
      model: groqModel(apiKey),
      providerOptions: groqProviderOptions,
      instructions: SUGGEST_PRIORITY_INSTRUCTIONS,
      prompt: suggestPriorityPrompt(board),
      output: Output.object({ schema: suggestPrioritySchema }),
    });

    return createTextStreamResponse({
      stream: toTextStreamOrFail({ stream: result.stream }),
    });
  } catch (error) {
    return handleBoardError(error);
  }
}
