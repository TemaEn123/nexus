import { afterEach, expect, test, vi } from "vitest";
import {
  consumeVerificationToken,
  issueVerificationEmail,
  VERIFICATION_TTL_MS,
  verificationExpiry,
  verificationUrl,
} from "@/features/auth/verification";

const {
  deleteMany,
  deleteToken,
  create,
  findUnique,
  updateUser,
  sendVerificationEmail,
} = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  deleteToken: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  updateUser: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/shared/lib/db", () => ({
  prisma: {
    $transaction: (ops: unknown[]) => Promise.all(ops),
    user: { update: updateUser },
    verificationToken: {
      deleteMany,
      delete: deleteToken,
      create,
      findUnique,
    },
  },
}));

vi.mock("@/server/mail", () => ({
  sendVerificationEmail,
}));

afterEach(() => {
  deleteMany.mockReset();
  deleteToken.mockReset();
  create.mockReset();
  findUnique.mockReset();
  updateUser.mockReset();
  sendVerificationEmail.mockReset();
  vi.unstubAllEnvs();
});

test("verificationUrl points at the verify page", () => {
  expect(
    verificationUrl("https://nexus.example", "user@example.com", "abc"),
  ).toBe(
    "https://nexus.example/verify-email?email=user%40example.com&token=abc",
  );
});

test("verificationExpiry lasts one day", () => {
  const now = Date.parse("2026-09-25T12:00:00.000Z");
  expect(verificationExpiry(now).toISOString()).toBe(
    new Date(now + VERIFICATION_TTL_MS).toISOString(),
  );
});

test("issueVerificationEmail replaces the previous token and sends the new link", async () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://nexus.example");
  deleteMany.mockResolvedValue({ count: 1 });
  create.mockResolvedValue({});
  sendVerificationEmail.mockResolvedValue(undefined);

  await issueVerificationEmail("user@example.com");

  expect(deleteMany).toHaveBeenCalledWith({
    where: { identifier: "user@example.com" },
  });
  expect(create).toHaveBeenCalledAfter(deleteMany);
  const data = create.mock.calls[0]?.[0].data as {
    identifier: string;
    token: string;
    expires: Date;
  };
  expect(data.identifier).toBe("user@example.com");
  expect(data.token.length).toBeGreaterThan(20);
  expect(data.expires.getTime()).toBeGreaterThan(Date.now());
  expect(sendVerificationEmail).toHaveBeenCalledWith({
    to: "user@example.com",
    url: verificationUrl(
      "https://nexus.example",
      "user@example.com",
      data.token,
    ),
  });
});

test("consumeVerificationToken rejects an unknown token", async () => {
  findUnique.mockResolvedValue(null);

  await expect(
    consumeVerificationToken("user@example.com", "missing", 1),
  ).resolves.toBe("invalid");
  expect(updateUser).not.toHaveBeenCalled();
});

test("consumeVerificationToken deletes an expired token", async () => {
  findUnique.mockResolvedValue({
    expires: new Date(1_000),
  });
  deleteToken.mockResolvedValue({});

  await expect(
    consumeVerificationToken("user@example.com", "old", 2_000),
  ).resolves.toBe("expired");
  expect(deleteToken).toHaveBeenCalledWith({
    where: {
      identifier_token: { identifier: "user@example.com", token: "old" },
    },
  });
  expect(updateUser).not.toHaveBeenCalled();
});

test("consumeVerificationToken marks the user verified and deletes the token", async () => {
  const now = Date.parse("2026-09-25T12:00:00.000Z");
  findUnique.mockResolvedValue({ expires: new Date(now + 1000) });
  updateUser.mockResolvedValue({});
  deleteToken.mockResolvedValue({});

  await expect(
    consumeVerificationToken("user@example.com", "fresh", now),
  ).resolves.toBe("ok");
  expect(updateUser).toHaveBeenCalledWith({
    where: { email: "user@example.com" },
    data: { emailVerified: new Date(now) },
  });
  expect(deleteToken).toHaveBeenCalledWith({
    where: {
      identifier_token: { identifier: "user@example.com", token: "fresh" },
    },
  });
});
