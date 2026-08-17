import { idSchema, updateColumnSchema } from "@/features/board/schemas";
import {
  deleteColumn,
  handleBoardError,
  updateColumn,
} from "@/features/board/service";
import { jsonOk, parseBody, parseIdParam } from "@/server/api-response";
import { requireApiUser } from "@/server/require-api-user";

/**
 * Колонка по своему id: PATCH/DELETE без длинного `/boards/:id/columns/:id`.
 */

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/columns/[columnId]">,
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

  const body = await parseBody(request, updateColumnSchema);
  if (!body.ok) {
    return body.response;
  }

  try {
    const column = await updateColumn(gate.user.id, path.data, body.data);
    return jsonOk(column);
  } catch (error) {
    return handleBoardError(error);
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/columns/[columnId]">,
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

  try {
    const result = await deleteColumn(gate.user.id, path.data);
    return jsonOk(result);
  } catch (error) {
    return handleBoardError(error);
  }
}
