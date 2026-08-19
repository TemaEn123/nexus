import { idSchema, updateBoardSchema } from "@/features/board/schemas";
import {
  deleteBoard,
  getBoard,
  handleBoardError,
  updateBoard,
} from "@/features/board/service";
import { jsonOk, parseBody, parseIdParam } from "@/server/api-response";
import { requireApiUser } from "@/server/require-api-user";

/**
 * Одна доска по id. `params` в Next 16 — Promise, тип даёт `RouteContext`.
 * Id только из URL, не из body.
 */

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/boards/[boardId]">,
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

  try {
    const board = await getBoard(gate.user.id, path.data);
    return jsonOk(board);
  } catch (error) {
    return handleBoardError(error);
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/boards/[boardId]">,
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

  const body = await parseBody(request, updateBoardSchema);
  if (!body.ok) {
    return body.response;
  }

  try {
    const board = await updateBoard(gate.user.id, path.data, body.data.title);
    return jsonOk(board);
  } catch (error) {
    return handleBoardError(error);
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/boards/[boardId]">,
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

  try {
    const result = await deleteBoard(gate.user.id, path.data);
    return jsonOk(result);
  } catch (error) {
    return handleBoardError(error);
  }
}
