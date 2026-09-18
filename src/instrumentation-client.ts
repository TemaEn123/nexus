import * as Sentry from "@sentry/nextjs";
import { getSentryDsn } from "@/shared/lib/sentry-dsn";

/**
 * Браузер. Replay / Feedback нет (GlitchTip и план М5.1).
 * tracesSampleRate 0 — free ~1000 events/мес, не жрём квоту транзакциями.
 */
const dsn = getSentryDsn();

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    environment: process.env.NODE_ENV,
  });
}
