import "server-only";

import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { sendVerificationEmail } from "@/server/mail";
import { prisma } from "@/shared/lib/db";
import { getSiteUrl } from "@/shared/lib/site";

/** Ссылка живёт сутки. Повторная выдача удаляет старый токен этого email. */
export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function verificationExpiry(now = Date.now()) {
  return new Date(now + VERIFICATION_TTL_MS);
}

export function verificationUrl(origin: string, email: string, token: string) {
  const url = new URL("/verify-email", origin);
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function issueVerificationEmail(email: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = verificationExpiry();

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  await sendVerificationEmail({
    to: email,
    url: verificationUrl(getSiteUrl().origin, email, token),
  });
}

export type VerificationConsumeResult = "ok" | "invalid" | "expired";

/**
 * Одноразовая ссылка. Нет строки или email не совпал — invalid.
 * Срок вышел — expired, токен удаляем. Успех ставит `emailVerified` и удаляет токен.
 */
export async function consumeVerificationToken(
  email: string,
  token: string,
  now = Date.now(),
): Promise<VerificationConsumeResult> {
  const row = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!row) {
    return "invalid";
  }

  if (row.expires.getTime() <= now) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    });
    return "expired";
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { emailVerified: new Date(now) },
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return "invalid";
    }
    throw error;
  }

  return "ok";
}
