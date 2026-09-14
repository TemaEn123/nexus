import { expect, test } from "vitest";
import { boardKeys } from "@/shared/api/query-keys";

test("boardKeys.all is the boards prefix", () => {
  expect(boardKeys.all).toEqual(["boards"]);
});

test("detail is all plus boardId", () => {
  expect(boardKeys.detail("abc")).toEqual(["boards", "abc"]);
});

test("same id is structurally equal, not the same array", () => {
  const first = boardKeys.detail("abc");
  const second = boardKeys.detail("abc");

  expect(first).toEqual(second);
  expect(first).not.toBe(second);
});

test("different ids do not share a cache key", () => {
  expect(boardKeys.detail("board-1")).not.toEqual(boardKeys.detail("board-2"));
});

test("detail starts with all so a prefix invalidate still matches", () => {
  const detail = boardKeys.detail("abc");

  expect(detail.slice(0, boardKeys.all.length)).toEqual([...boardKeys.all]);
});
