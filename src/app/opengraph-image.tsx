import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/shared/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLUMNS = [
  { title: "To Do", cards: ["launch", "links"] },
  { title: "In Progress", cards: ["review", "copy"] },
  { title: "Done", cards: ["ship"] },
] as const;

/** OG 1200×630. Twitter возьмёт этот файл при `summary_large_image`. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#09090b",
        color: "white",
        padding: "56px 64px",
      }}
    >
      <div style={{ display: "flex", fontSize: 64, fontWeight: 600 }}>
        {SITE_NAME}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 8,
          fontSize: 28,
          color: "#a1a1aa",
        }}
      >
        Kanban with suggestions
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 40, flex: 1 }}>
        {COLUMNS.map((column) => (
          <div
            key={column.title}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              background: "#18181b",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", fontSize: 22, fontWeight: 600 }}>
              {column.title}
            </div>
            {column.cards.map((card) => (
              <div
                key={card}
                style={{
                  display: "flex",
                  marginTop: 16,
                  height: 56,
                  borderRadius: 12,
                  background: "#27272a",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
