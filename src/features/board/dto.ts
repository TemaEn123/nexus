import type {
  BoardCard,
  BoardDetail,
  BoardRecord,
} from "@/features/board/types";

type BoardCardRecord = BoardRecord["columns"][number]["cards"][number];

/** Prisma `Date` → ISO string, как в `GET /api/boards/:id`. */
export function toBoardDto(board: BoardRecord): BoardDetail {
  return JSON.parse(JSON.stringify(board)) as BoardDetail;
}

export function toCardDto(card: BoardCardRecord): BoardCard {
  return JSON.parse(JSON.stringify(card)) as BoardCard;
}
