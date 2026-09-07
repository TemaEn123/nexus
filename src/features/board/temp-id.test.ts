import { expect, test } from "vitest";
import { createTempId, isTempId } from "@/features/board/temp-id";

test("createTempId uses temp- prefix and a uuid", () => {
  const id = createTempId();

  expect(id.startsWith("temp-")).toBe(true);
  expect(id.length).toBeGreaterThan("temp-".length);
  expect(createTempId()).not.toBe(id);
});

test("isTempId is true only with the temp- prefix", () => {
  expect(isTempId("temp-abc")).toBe(true);
  expect(isTempId(createTempId())).toBe(true);
  expect(isTempId("clxyzcuid")).toBe(false);
  expect(isTempId("temp")).toBe(false);
  expect(isTempId("")).toBe(false);
});
