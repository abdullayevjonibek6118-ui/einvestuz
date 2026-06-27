import { ImageResponse } from "next/og";

export const alt = "EInvest — аналитика фондового рынка Узбекистана";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px", color: "#f2f5f8", background: "#080b10", fontFamily: "Arial, sans-serif" }}><div style={{ display: "flex", alignItems: "center", gap: 20 }}><div style={{ width: 46, height: 46, display: "flex", transform: "rotate(45deg)", border: "2px solid #27d17f", alignItems: "center", justifyContent: "center" }}><div style={{ width: 16, height: 16, background: "#27d17f" }} /></div><div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>EINVEST</div></div><div style={{ display: "flex", flexDirection: "column", gap: 20 }}><div style={{ display: "flex", color: "#27d17f", fontSize: 22 }}>UZBEKISTAN MARKET INTELLIGENCE</div><div style={{ display: "flex", maxWidth: 980, fontSize: 62, lineHeight: 1.08, fontWeight: 700 }}>Рынок Узбекистана в цифрах и документах</div><div style={{ display: "flex", color: "#919baa", fontSize: 25 }}>Отчётность · мультипликаторы · дивиденды · AI-анализ</div></div></div>, size);
}
