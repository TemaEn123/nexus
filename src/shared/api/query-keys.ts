export const boardKeys = {
  all: ["boards"] as const,
  detail: (boardId: string) => [...boardKeys.all, boardId] as const,
};
