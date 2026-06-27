import type { Metadata } from "next";
import { Fira_Code, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const ibmPlexSans = IBM_Plex_Sans({
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
  title: "EInvest — рынок Узбекистана в цифрах",
  description: "Финансовая отчётность, торговая статистика и AI-анализ публичных компаний Узбекистана.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${ibmPlexSans.variable} ${firaCode.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
