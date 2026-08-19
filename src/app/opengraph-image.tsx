import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/shared/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** OG 1200×630. Twitter возьмёт этот файл при `summary_large_image`. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
        color: "white",
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 600 }}>{SITE_NAME}</div>
      <div style={{ marginTop: 16, fontSize: 32, color: "#a1a1aa" }}>
        {SITE_DESCRIPTION}
      </div>
    </div>,
    { ...size },
  );
}
