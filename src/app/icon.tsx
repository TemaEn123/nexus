import { ImageResponse } from "next/og";
import { AppIconMark } from "./_ui/app-icon-mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon. Шаблонный `favicon.ico` (логотип Next) заменён генерацией. */
export default function Icon() {
  return new ImageResponse(<AppIconMark fontSize={20} />, { ...size });
}
