/**
 * DSN GlitchTip (протокол Sentry). Пусто — SDK не шлёт (dev, CI, Docker).
 * `NEXT_PUBLIC_` попадает в бандль — так у DSN и задумано. Token карт сюда не класть.
 */
export function getSentryDsn(): string | undefined {
  const dsn =
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
    process.env.SENTRY_DSN?.trim();
  return dsn || undefined;
}
