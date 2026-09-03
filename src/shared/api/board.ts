import type {
  BoardCard,
  BoardColumn,
  BoardDetail,
} from "@/features/board/types";
import { deleteJson, getJson, patchJson, postJson } from "@/shared/api/http";

/** Prisma `Date` → ISO string, как в `GET /api/boards/:id`. */
export function toBoardDto(board: BoardDetail): BoardDetail {
  return JSON.parse(JSON.stringify(board)) as BoardDetail;
}

export function fetchBoard(boardId: string) {
  return getJson<BoardDetail>(`/api/boards/${encodeURIComponent(boardId)}`);
}

/** Целевой индекс, не сырой слот. `boardId` в body нет — его нет в `updateCardSchema`. */
export function moveCard(input: {
  cardId: string;
  columnId: string;
  position: number;
}) {
  return patchJson<BoardCard>(
    `/api/cards/${encodeURIComponent(input.cardId)}`,
    {
      columnId: input.columnId,
      position: input.position,
    },
  );
}

export function createCard(input: {
  columnId: string;
  title: string;
  description?: string;
}) {
  const body: { title: string; description?: string } = { title: input.title };
  if (input.description) {
    body.description = input.description;
  }

  return postJson<BoardCard>(
    `/api/columns/${encodeURIComponent(input.columnId)}/cards`,
    body,
  );
}

export function createColumn(input: { boardId: string; title: string }) {
  return postJson<Omit<BoardColumn, "cards">>(
    `/api/boards/${encodeURIComponent(input.boardId)}/columns`,
    { title: input.title },
  );
}

export function deleteCard(cardId: string) {
  return deleteJson<{ id: string }>(`/api/cards/${encodeURIComponent(cardId)}`);
}

export function deleteColumn(columnId: string) {
  return deleteJson<{ id: string }>(
    `/api/columns/${encodeURIComponent(columnId)}`,
  );
}
