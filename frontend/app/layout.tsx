import type { Metadata } from "next";
import { Fira_Code, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
const firaCode = Fira_Code({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "EInvest — аналитика фондового рынка Узбекистана", template: "%s | EInvest" },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "EInvest" }],
  creator: "EInvest",
  publisher: "EInvest",
  category: "finance",
  keywords: ["акции Узбекистана", "UZSE", "фондовый рынок Узбекистана", "финансовая отчётность", "ROE", "ROA", "P/E", "дивиденды", "инвестиционная аналитика"],
  alternates: { canonical: "/", languages: { "ru-UZ": "/", "x-default": "/" } },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", locale: "ru_RU", url: "/", siteName: SITE_NAME, title: "EInvest — аналитика фондового рынка Узбекистана", description: DEFAULT_DESCRIPTION, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "EInvest — рынок Узбекистана в цифрах" }] },
  twitter: { card: "summary_large_image", title: "EInvest — рынок Узбекистана", description: DEFAULT_DESCRIPTION, images: ["/opengraph-image"] },
  manifest: "/manifest.webmanifest",
  formatDetection: { email: false, address: false, telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${ibmPlexSans.variable} ${firaCode.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema).replace(/</g, "\\u003c") }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "EInvest", url: SITE_URL, description: "Независимая информационно-аналитическая платформа о публичных компаниях и рынке капитала Узбекистана." },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "EInvest", inLanguage: "ru", publisher: { "@id": `${SITE_URL}/#organization` }, potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/stocks/{search_term_string}`, "query-input": "required name=search_term_string" } },
    { "@type": "Dataset", "@id": `${SITE_URL}/#uzbekistan-market-dataset`, name: "Показатели публичных компаний Узбекистана", description: DEFAULT_DESCRIPTION, url: `${SITE_URL}/screener`, inLanguage: "ru", creator: { "@id": `${SITE_URL}/#organization` }, isAccessibleForFree: true, keywords: ["UZSE", "акции Узбекистана", "финансовые показатели", "дивиденды", "отчётность"] },
  ],
};
