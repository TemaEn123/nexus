type GetBoard = typeof import("./service").getBoard;

/** Строка `getBoard` до JSON: Prisma `Date`. */
export type BoardRecord = Awaited<ReturnType<GetBoard>>;

/**
 * После hydrate / REST даты — ISO-строки, не `Date`.
 * Клиентский кэш и optimistic UI живут в этой форме.
 */
type IsoDates<T> = T extends Date
  ? string
  : T extends (infer Item)[]
    ? IsoDates<Item>[]
    : T extends object
      ? { [Key in keyof T]: IsoDates<T[Key]> }
      : T;

export type BoardDetail = IsoDates<BoardRecord>;
export type BoardColumn = BoardDetail["columns"][number];
export type BoardCard = BoardColumn["cards"][number];
