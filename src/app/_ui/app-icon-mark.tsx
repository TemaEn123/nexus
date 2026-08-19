type AppIconMarkProps = {
  fontSize: number;
};

/** Буква N на zinc-950. Inline styles — ограничение `next/og` ImageResponse. */
export function AppIconMark({ fontSize }: AppIconMarkProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
        color: "white",
        fontSize,
        fontWeight: 600,
      }}
    >
      N
    </div>
  );
}
