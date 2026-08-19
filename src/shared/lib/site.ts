export const SITE_NAME = "Nexus";
export const SITE_DESCRIPTION = "Kanban board";

export function getSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  try {
    return new URL(new URL(raw).origin);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_APP_URL must be an absolute URL (got ${JSON.stringify(raw)})`,
    );
  }
}
