type GetBoard = typeof import("@/features/board/service").getBoard;

export type BoardDetail = Awaited<ReturnType<GetBoard>>;
export type BoardColumn = BoardDetail["columns"][number];
export type BoardCard = BoardColumn["cards"][number];
