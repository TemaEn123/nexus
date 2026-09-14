import { expect, test } from "vitest";
import { suggestError } from "@/features/ai-assistant/form-error";
import { ApiClientError } from "@/shared/api/http";

const GENERIC = "Something went wrong. Try again.";

test("suggestError maps API codes and status", () => {
  expect(
    suggestError(new ApiClientError(401, "unauthorized", "no session")),
  ).toBe("Sign in to suggest subtasks.");
  expect(suggestError(new ApiClientError(401, "internal", "no session"))).toBe(
    "Sign in to suggest subtasks.",
  );
  expect(suggestError(new ApiClientError(404, "not_found", "missing"))).toBe(
    "Card not found.",
  );
  expect(suggestError(new ApiClientError(503, "unavailable", "no key"))).toBe(
    "AI is not configured. Add AI_GATEWAY_API_KEY.",
  );
});

test("suggestError unknown errors stay generic without leaking JSON", () => {
  expect(
    suggestError(new ApiClientError(500, "internal", '{"raw":true}')),
  ).toBe(GENERIC);
  expect(suggestError(new Error('{"error":{"code":"unavailable"}}'))).toBe(
    GENERIC,
  );
});
