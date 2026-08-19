import { createBoardSchema } from "@/features/board/schemas";
import {
  createBoard,
  handleBoardError,
  listBoards,
} from "@/features/board/service";
import { jsonOk, parseBody } from "@/server/api-response";
import { requireApiUser } from "@/server/require-api-user";

/**
 * Коллекция досок текущего пользователя.
 * Тонкий handler: сессия → Zod → service. Prisma сюда не импортируем.
 * Сессию проверяем здесь, не в proxy: API должен ответить 401, не 302.
 */

export async function GET() {
  const gate = await requireApiUser();
  if (!gate.ok) {
    return gate.response;
  }

  try {
    const boards = await listBoards(gate.user.id);
    return jsonOk(boards);
  } catch (error) {
    return handleBoardError(error);
  }
}

export async function POST(request: Request) {
  const gate = await requireApiUser();
  if (!gate.ok) {
    return gate.response;
  }

  const body = await parseBody(request, createBoardSchema);
  if (!body.ok) {
    return body.response;
  }

  try {
    const board = await createBoard(gate.user.id, body.data.title);
    return jsonOk(board, 201);
  } catch (error) {
    return handleBoardError(error);
  }
}
