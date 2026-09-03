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

export function toCardDto(card: BoardCard): BoardCard {
  return JSON.parse(JSON.stringify(card)) as BoardCard;
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

export function createColumn(input: { boardId: string; title: string }) {
  return postJson<Omit<BoardColumn, "cards">>(
    `/api/boards/${encodeURIComponent(input.boardId)}/columns`,
    { title: input.title },
  );
}

export function deleteColumn(columnId: string) {
  return deleteJson<{ id: string }>(
    `/api/columns/${encodeURIComponent(columnId)}`,
  );
}
