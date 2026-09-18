import * as Sentry from "@sentry/nextjs";
import { getSentryDsn } from "@/shared/lib/sentry-dsn";

const dsn = getSentryDsn();

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    environment: process.env.NODE_ENV,
  });
}
