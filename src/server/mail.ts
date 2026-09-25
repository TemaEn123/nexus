import "server-only";

import nodemailer from "nodemailer";
import type { ServerEnv } from "@/server/env";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logger";

type MailConfig =
  | { mode: "log" }
  | {
      mode: "smtp";
      host: string;
      port: number;
      from: string;
      user?: string;
      password?: string;
    };

/**
 * SMTP готов, только если заданы host и from.
 * В development без них письмо не отправляем: ссылку пишет logger.
 * В production без них send падает, но процесс при старте не падает.
 */
export function mailConfig(env: ServerEnv): MailConfig {
  const host = env.SMTP_HOST;
  const from = env.EMAIL_FROM;

  if (!host || !from) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "SMTP_HOST and EMAIL_FROM are required to send mail in production",
      );
    }

    return { mode: "log" };
  }

  return {
    mode: "smtp",
    host,
    port: Number(env.SMTP_PORT ?? "587"),
    from,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
  };
}

export async function sendVerificationEmail(input: {
  to: string;
  url: string;
}) {
  const config = mailConfig(getEnv());

  if (config.mode === "log") {
    logger.info("verification_email", {
      to: input.to,
      verifyUrl: input.url,
    });
    return;
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth:
      config.user && config.password
        ? { user: config.user, pass: config.password }
        : undefined,
  });

  await transport.sendMail({
    from: config.from,
    to: input.to,
    subject: "Confirm your Nexus email",
    text: `Confirm your email:\n${input.url}`,
  });
}
