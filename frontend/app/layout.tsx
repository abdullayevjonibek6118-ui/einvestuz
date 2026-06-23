import type { Metadata } from "next";
import { Bodoni_Moda, Fira_Code, Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});
const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
});
const firaCode = Fira_Code({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Einvestuz",
  description: "Market analytics, virtual portfolios, and AI education for Uzbekistan investors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${bodoni.variable} ${firaCode.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
