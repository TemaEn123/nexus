import { expect, test } from "vitest";
import { priorityError } from "@/features/ai-assistant/form-error";
import {
  priorityStreamFields,
  suggestStreamView,
} from "@/features/ai-assistant/suggest-stream-view";
import { ApiClientError } from "@/shared/api/http";

test("suggestStreamView hides errors and empty copy after Stop", () => {
  expect(
    suggestStreamView({
      stopped: true,
      sdkError: new Error("broken pipe"),
      hasPartial: false,
      finishedInvalid: true,
    }),
  ).toEqual({ error: undefined, empty: false });
  expect(
    suggestStreamView({
      stopped: true,
      sdkError: undefined,
      hasPartial: true,
      finishedInvalid: true,
    }),
  ).toEqual({ error: undefined, empty: false });
});

test("suggestStreamView treats a finished empty object as empty, not an error", () => {
  expect(
    suggestStreamView({
      stopped: false,
      sdkError: undefined,
      hasPartial: false,
      finishedInvalid: true,
    }),
  ).toEqual({ error: undefined, empty: true });
});

test("suggestStreamView keeps a partial object without an error", () => {
  expect(
    suggestStreamView({
      stopped: false,
      sdkError: undefined,
      hasPartial: true,
      finishedInvalid: true,
    }),
  ).toEqual({ error: undefined, empty: false });
});

test("suggestStreamView still maps real API errors", () => {
  expect(
    suggestStreamView({
      stopped: false,
      sdkError: new ApiClientError(503, "unavailable", "no key"),
      hasPartial: false,
      finishedInvalid: false,
    }),
  ).toEqual({
    error: "AI is not configured. Add GROQ_API_KEY.",
    empty: false,
  });
  expect(
    suggestStreamView({
      stopped: false,
      sdkError: new ApiClientError(401, "unauthorized", "no session"),
      hasPartial: false,
      finishedInvalid: false,
      mapError: priorityError,
    }),
  ).toEqual({
    error: "Sign in to suggest priority.",
    empty: false,
  });
});

test("priorityStreamFields drops pick and reason after Stop", () => {
  expect(
    priorityStreamFields({
      stopped: true,
      pick: 1,
      reason: "Login unblocks OAuth.",
    }),
  ).toEqual({ pick: undefined, reason: undefined });
  expect(
    priorityStreamFields({
      stopped: false,
      pick: 1,
      reason: "Login unblocks OAuth.",
    }),
  ).toEqual({ pick: 1, reason: "Login unblocks OAuth." });
});
