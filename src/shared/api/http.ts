/**
 * Клиентский разбор REST-контракта `{ data }` / `{ error: { code, message } }`.
 * `src/server/api-response.ts` — `server-only`, сюда его не импортируем.
 */

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorFields(body: unknown): { code: string; message: string } {
  const error = isRecord(body) ? body.error : undefined;
  const code =
    isRecord(error) && typeof error.code === "string" ? error.code : "internal";
  const message =
    isRecord(error) && typeof error.message === "string"
      ? error.message
      : "Request failed";

  return { code, message };
}

async function parseJson<T>(response: Response): Promise<T> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiClientError(
      response.status,
      "internal",
      "Invalid JSON response",
    );
  }

  if (!response.ok) {
    const { code, message } = errorFields(body);
    throw new ApiClientError(response.status, code, message);
  }

  if (!isRecord(body) || !("data" in body)) {
    throw new ApiClientError(response.status, "internal", "Invalid response");
  }

  return body.data as T;
}

export async function getJson<T>(url: string) {
  return parseJson<T>(await fetch(url));
}

export async function postJson<T>(url: string, body: unknown) {
  return parseJson<T>(
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function patchJson<T>(url: string, body: unknown) {
  return parseJson<T>(
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function deleteJson<T>(url: string) {
  return parseJson<T>(await fetch(url, { method: "DELETE" }));
}
