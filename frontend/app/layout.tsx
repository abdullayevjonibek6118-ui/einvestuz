import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const firaSans = Fira_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
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
      <body className={`${firaSans.variable} ${firaCode.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
