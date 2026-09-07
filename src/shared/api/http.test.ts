import { afterEach, expect, test, vi } from "vitest";
import {
  ApiClientError,
  apiErrorFromResponse,
  getJson,
  patchJson,
} from "@/shared/api/http";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("getJson returns the data envelope", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(jsonResponse(200, { data: { id: "1" } })),
  );

  await expect(getJson<{ id: string }>("/api/boards/1")).resolves.toEqual({
    id: "1",
  });
});

test("getJson throws ApiClientError from the error envelope", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      jsonResponse(409, {
        error: { code: "conflict", message: "This slot is taken. Try again." },
      }),
    ),
  );

  try {
    await getJson("/api/cards/1");
    expect.unreachable();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      status: 409,
      code: "conflict",
      message: "This slot is taken. Try again.",
    });
  }
});

test("patchJson sends JSON and rejects a body without data", async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    patchJson("/api/cards/1", { position: 0 }),
  ).rejects.toMatchObject({
    name: "ApiClientError",
    status: 200,
    code: "internal",
    message: "Invalid response",
  });
  expect(fetchMock).toHaveBeenCalledWith("/api/cards/1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ position: 0 }),
  });
});

test("apiErrorFromResponse falls back when the body is not JSON", async () => {
  const error = await apiErrorFromResponse(
    new Response("nope", { status: 500 }),
  );

  expect(error).toMatchObject({
    status: 500,
    code: "internal",
    message: "Invalid JSON response",
  });
});
