import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#080b10" }}><div style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)", border: "3px solid #27d17f" }}><div style={{ width: 12, height: 12, background: "#27d17f" }} /></div></div>, size);
}
