import { expect, test } from "vitest";
import { toBoardDto, toCardDto } from "@/features/board/dto";
import type { BoardRecord } from "@/features/board/types";

const createdAt = new Date("2026-01-15T12:00:00.000Z");

const record = {
  id: "board-1",
  title: "Sprint",
  ownerId: "user-1",
  createdAt,
  updatedAt: createdAt,
  columns: [
    {
      id: "column-1",
      title: "To Do",
      position: 0,
      boardId: "board-1",
      createdAt,
      updatedAt: createdAt,
      cards: [
        {
          id: "card-1",
          title: "Write tests",
          description: null,
          position: 0,
          columnId: "column-1",
          createdAt,
          updatedAt: createdAt,
        },
      ],
    },
  ],
} satisfies BoardRecord;

test("toBoardDto serializes Prisma Date fields to ISO strings", () => {
  const dto = toBoardDto(record);

  expect(dto.createdAt).toBe("2026-01-15T12:00:00.000Z");
  expect(dto.columns[0]?.cards[0]?.createdAt).toBe("2026-01-15T12:00:00.000Z");
  expect(typeof dto.columns[0]?.updatedAt).toBe("string");
});

test("toCardDto serializes a single card the same way", () => {
  const card = record.columns[0].cards[0];
  const dto = toCardDto(card);

  expect(dto.createdAt).toBe("2026-01-15T12:00:00.000Z");
  expect(dto.title).toBe("Write tests");
});
