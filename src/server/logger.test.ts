import { afterEach, expect, test, vi } from "vitest";
import {
  logger,
  pathFromRequest,
  requestIdFrom,
  setLogUserId,
  withLogContext,
} from "@/server/logger";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.restoreAllMocks();
});

function captureLog(run: () => void) {
  const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  run();

  expect(consoleSpy).toHaveBeenCalledTimes(1);
  return JSON.parse(String(consoleSpy.mock.calls[0][0])) as Record<
    string,
    unknown
  >;
}

test("logger writes one JSON line with common fields", () => {
  const payload = captureLog(() => {
    logger.info("api_request", {
      method: "GET",
      path: "/api/boards",
      status: 200,
      durationMs: 12,
      userId: "user_1",
    });
  });

  expect(payload).toMatchObject({
    level: "info",
    msg: "api_request",
    method: "GET",
    path: "/api/boards",
    status: 200,
    durationMs: 12,
    userId: "user_1",
  });
  expect(Number.isNaN(Date.parse(String(payload.time)))).toBe(false);
});

test("logger serializes errors without stack traces", () => {
  const error = Object.assign(new Error("Unique constraint failed"), {
    code: "P2002",
  });

  const payload = captureLog(() => {
    logger.error("api_error", { error });
  });

  expect(payload.error).toEqual({
    name: "Error",
    message: "Unique constraint failed",
    code: "P2002",
  });
  expect(payload.error).not.toHaveProperty("stack");
});

test("logger redacts sensitive fields", () => {
  const payload = captureLog(() => {
    logger.warn("api_request", {
      password: "secret",
      headers: {
        authorization: "Bearer token",
        cookie: "session=value",
        "x-request-id": "req_1",
      },
      nested: {
        apiKey: "key_1",
      },
    });
  });

  expect(payload.password).toBe("[redacted]");
  expect(payload.headers).toMatchObject({
    authorization: "[redacted]",
    cookie: "[redacted]",
    "x-request-id": "req_1",
  });
  expect(payload.nested).toMatchObject({ apiKey: "[redacted]" });
});

test("request helpers read vercel id and strip query from path", () => {
  const request = new Request("https://nexus.test/api/boards?debug=true", {
    headers: { "x-vercel-id": "arn1::abc123" },
  });

  expect(requestIdFrom(request)).toBe("arn1::abc123");
  expect(pathFromRequest(request)).toBe("/api/boards");
});

test("logger adds request context to payload", () => {
  const payload = withLogContext(
    {
      method: "PATCH",
      path: "/api/cards/card_1",
      requestId: "req_1",
    },
    () => {
      setLogUserId("user_1");
      return captureLog(() => {
        logger.info("api_request", { status: 200 });
      });
    },
  );

  expect(payload).toMatchObject({
    level: "info",
    msg: "api_request",
    method: "PATCH",
    path: "/api/cards/card_1",
    requestId: "req_1",
    userId: "user_1",
    status: 200,
  });
});
