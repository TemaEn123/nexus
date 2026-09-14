import { describe, expect, test } from "vitest";
import {
  createBoardSchema,
  createCardSchema,
  createColumnSchema,
  idSchema,
  updateBoardSchema,
  updateCardContentSchema,
  updateCardSchema,
  updateColumnSchema,
} from "@/features/board/schemas";

describe("idSchema", () => {
  test("accepts any non-empty string, not a cuid format", () => {
    expect(idSchema.safeParse("x")).toEqual({ success: true, data: "x" });
    expect(idSchema.safeParse("").success).toBe(false);
  });
});

describe("createBoardSchema", () => {
  test("trims title and rejects empty, overlong, or extra keys", () => {
    expect(createBoardSchema.safeParse({ title: "  Sprint  " })).toEqual({
      success: true,
      data: { title: "Sprint" },
    });
    expect(createBoardSchema.safeParse({ title: "" }).success).toBe(false);
    expect(createBoardSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(
      createBoardSchema.safeParse({ title: "a".repeat(121) }).success,
    ).toBe(false);
    expect(
      createBoardSchema.safeParse({ title: "Sprint", titel: "typo" }).success,
    ).toBe(false);
  });

  test("updateBoardSchema is the same contract", () => {
    expect(updateBoardSchema).toBe(createBoardSchema);
  });
});

describe("createColumnSchema", () => {
  test("trims title, caps at 80, rejects position in create body", () => {
    expect(createColumnSchema.safeParse({ title: "  To Do  " })).toEqual({
      success: true,
      data: { title: "To Do" },
    });
    expect(
      createColumnSchema.safeParse({ title: "a".repeat(81) }).success,
    ).toBe(false);
    expect(
      createColumnSchema.safeParse({ title: "To Do", position: 0 }).success,
    ).toBe(false);
  });
});

describe("createCardSchema", () => {
  test("trims title and leaves empty description to the service", () => {
    expect(createCardSchema.safeParse({ title: "  Ship  " })).toEqual({
      success: true,
      data: { title: "Ship" },
    });
    expect(
      createCardSchema.safeParse({ title: "Ship", description: "   " }),
    ).toEqual({
      success: true,
      data: { title: "Ship", description: "" },
    });
    expect(createCardSchema.safeParse({ title: "a".repeat(201) }).success).toBe(
      false,
    );
  });
});

describe("updateColumnSchema", () => {
  test("requires at least one field", () => {
    expect(updateColumnSchema.safeParse({}).success).toBe(false);
  });

  test("accepts title or a non-negative integer position", () => {
    expect(updateColumnSchema.safeParse({ title: "  Done  " })).toEqual({
      success: true,
      data: { title: "Done" },
    });
    expect(updateColumnSchema.safeParse({ position: 0 })).toEqual({
      success: true,
      data: { position: 0 },
    });
    expect(updateColumnSchema.safeParse({ position: -1 }).success).toBe(false);
    expect(updateColumnSchema.safeParse({ position: 1.5 }).success).toBe(false);
    expect(updateColumnSchema.safeParse({ position: "0" }).success).toBe(false);
  });
});

describe("updateCardSchema", () => {
  test("requires at least one field and allows clearing description", () => {
    expect(updateCardSchema.safeParse({}).success).toBe(false);
    expect(updateCardSchema.safeParse({ description: null })).toEqual({
      success: true,
      data: { description: null },
    });
    expect(updateCardSchema.safeParse({ columnId: "" }).success).toBe(false);
    expect(updateCardSchema.safeParse({ columnId: "col-2" })).toEqual({
      success: true,
      data: { columnId: "col-2" },
    });
  });
});

describe("updateCardContentSchema", () => {
  test("needs ids plus title or description, not DnD fields", () => {
    expect(
      updateCardContentSchema.safeParse({
        cardId: "card-1",
        boardId: "board-1",
      }).success,
    ).toBe(false);
    expect(
      updateCardContentSchema.safeParse({
        cardId: "card-1",
        boardId: "board-1",
        title: "  Renamed  ",
      }),
    ).toEqual({
      success: true,
      data: { cardId: "card-1", boardId: "board-1", title: "Renamed" },
    });
    expect(
      updateCardContentSchema.safeParse({
        cardId: "card-1",
        boardId: "board-1",
        title: "Renamed",
        position: 0,
      }).success,
    ).toBe(false);
  });
});
