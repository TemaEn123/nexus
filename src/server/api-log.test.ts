import { afterEach, expect, test, vi } from "vitest";
import { withApiLog } from "@/server/api-log";
import { setLogUserId } from "@/server/logger";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.restoreAllMocks();
});

function readLoggedPayload() {
  const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  return {
    consoleSpy,
    payload() {
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      return JSON.parse(String(consoleSpy.mock.calls[0][0])) as Record<
        string,
        unknown
      >;
    },
  };
}

test("withApiLog writes access log with request context", async () => {
  const { payload } = readLoggedPayload();
  const POST = withApiLog(async function POST() {
    setLogUserId("user_1");
    return Response.json({ data: { ok: true } }, { status: 201 });
  });

  const response = await POST(
    new Request("https://nexus.test/api/boards?debug=true", {
      method: "POST",
      headers: { "x-vercel-id": "arn1::abc123" },
    }),
    undefined,
  );

  expect(response.status).toBe(201);
  const log = payload();
  expect(log).toMatchObject({
    level: "info",
    msg: "api_request",
    method: "POST",
    path: "/api/boards",
    requestId: "arn1::abc123",
    userId: "user_1",
    status: 201,
  });
  expect(typeof log.durationMs).toBe("number");
});
