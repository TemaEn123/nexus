import { createColumnSchema, idSchema } from "@/features/board/schemas";
import { createColumn, handleBoardError } from "@/features/board/service";
import { jsonOk, parseBody, parseIdParam } from "@/server/api-response";
import { requireApiUser } from "@/server/require-api-user";

/**
 * Создать колонку на доске. `boardId` только из URL, не из body.
 * Список колонок отдаёт `GET /api/boards/:boardId`.
 */

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/boards/[boardId]/columns">,
) {
  const gate = await requireApiUser();
  if (!gate.ok) {
    return gate.response;
  }

  const { boardId } = await ctx.params;
  const path = parseIdParam(boardId, idSchema);
  if (!path.ok) {
    return path.response;
  }

  const body = await parseBody(request, createColumnSchema);
  if (!body.ok) {
    return body.response;
  }

  try {
    const column = await createColumn(gate.user.id, path.data, body.data.title);
    return jsonOk(column, 201);
  } catch (error) {
    return handleBoardError(error);
  }
}
