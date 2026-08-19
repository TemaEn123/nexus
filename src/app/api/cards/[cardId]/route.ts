import { idSchema, updateCardSchema } from "@/features/board/schemas";
import {
  deleteCard,
  handleBoardError,
  updateCard,
} from "@/features/board/service";
import { jsonOk, parseBody, parseIdParam } from "@/server/api-response";
import { requireApiUser } from "@/server/require-api-user";

/**
 * Карточка по своему id: PATCH (в т.ч. перенос) и DELETE.
 */

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/cards/[cardId]">,
) {
  const gate = await requireApiUser();
  if (!gate.ok) {
    return gate.response;
  }

  const { cardId } = await ctx.params;
  const path = parseIdParam(cardId, idSchema);
  if (!path.ok) {
    return path.response;
  }

  const body = await parseBody(request, updateCardSchema);
  if (!body.ok) {
    return body.response;
  }

  try {
    const card = await updateCard(gate.user.id, path.data, body.data);
    return jsonOk(card);
  } catch (error) {
    return handleBoardError(error);
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/cards/[cardId]">,
) {
  const gate = await requireApiUser();
  if (!gate.ok) {
    return gate.response;
  }

  const { cardId } = await ctx.params;
  const path = parseIdParam(cardId, idSchema);
  if (!path.ok) {
    return path.response;
  }

  try {
    const result = await deleteCard(gate.user.id, path.data);
    return jsonOk(result);
  } catch (error) {
    return handleBoardError(error);
  }
}
