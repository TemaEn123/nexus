import { createCardSchema, idSchema } from "@/features/board/schemas";
import { createCard, handleBoardError } from "@/features/board/service";
import { jsonOk, parseBody, parseIdParam } from "@/server/api-response";
import { requireApiUser } from "@/server/require-api-user";

/**
 * Создать карточку в колонке. `columnId` только из URL.
 * Список карточек отдаёт `GET /api/boards/:boardId`.
 */

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/columns/[columnId]/cards">,
) {
  const gate = await requireApiUser();
  if (!gate.ok) {
    return gate.response;
  }

  const { columnId } = await ctx.params;
  const path = parseIdParam(columnId, idSchema);
  if (!path.ok) {
    return path.response;
  }

  const body = await parseBody(request, createCardSchema);
  if (!body.ok) {
    return body.response;
  }

  try {
    const card = await createCard(gate.user.id, path.data, body.data);
    return jsonOk(card, 201);
  } catch (error) {
    return handleBoardError(error);
  }
}
