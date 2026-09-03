type GetBoard = typeof import("./service").getBoard;

/** Строка `getBoard`. На клиенте после JSON даты — ISO-строки, не `Date`. */
export type BoardDetail = Awaited<ReturnType<GetBoard>>;
export type BoardColumn = BoardDetail["columns"][number];
export type BoardCard = BoardColumn["cards"][number];
