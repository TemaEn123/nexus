import { describe, expect, test } from "vitest";
import {
  boardFormError,
  cardActionError,
  mutationFormError,
} from "@/features/board/form-error";
import { ApiClientError } from "@/shared/api/http";

const GENERIC = "Something went wrong. Try again.";
const CONFLICT = "Someone else updated the board. Try again.";
const CARD_TITLE = "Card title is required (1–200 characters).";

describe("boardFormError", () => {
  test("skips empty searchParam values", () => {
    expect(boardFormError(undefined)).toBeUndefined();
    expect(boardFormError([])).toBeUndefined();
  });

  test("maps known codes and takes the first array item", () => {
    expect(boardFormError("invalid")).toBe(
      "Title is required (1–120 characters).",
    );
    expect(boardFormError("column")).toBe(
      "Column title is required (1–80 characters).",
    );
    expect(boardFormError(["card", "conflict"])).toBe(CARD_TITLE);
    expect(boardFormError("conflict")).toBe(CONFLICT);
  });

  test("unknown codes stay generic", () => {
    expect(boardFormError("P2002")).toBe(GENERIC);
  });
});

describe("mutationFormError", () => {
  test("conflict ApiClientError keeps the conflict copy", () => {
    expect(
      mutationFormError(new ApiClientError(409, "conflict", "slot taken")),
    ).toBe(CONFLICT);
  });

  test("other errors stay generic without leaking the message", () => {
    expect(
      mutationFormError(new ApiClientError(500, "internal", '{"secret":true}')),
    ).toBe(GENERIC);
    expect(mutationFormError(new Error('{"error":{"code":"P2002"}}'))).toBe(
      GENERIC,
    );
  });
});

describe("cardActionError", () => {
  test("write maps empty title codes; delete does not", () => {
    expect(cardActionError("invalid")).toBe(CARD_TITLE);
    expect(cardActionError("card", "write")).toBe(CARD_TITLE);
    expect(cardActionError("invalid", "delete")).toBe(GENERIC);
  });

  test("conflict and unknown codes", () => {
    expect(cardActionError("conflict", "delete")).toBe(CONFLICT);
    expect(cardActionError("not_found", "delete")).toBe(GENERIC);
  });
});
