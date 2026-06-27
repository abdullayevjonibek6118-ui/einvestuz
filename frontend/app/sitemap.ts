import type { MetadataRoute } from "next";
import { getStockScopeScreener } from "@/lib/api";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/screener`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/ai`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/academy`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
  const pages = await Promise.all([
    getStockScopeScreener({ limit: 100, offset: 0, sort_by: "reports_count", sort_dir: "desc" }),
    getStockScopeScreener({ limit: 100, offset: 100, sort_by: "reports_count", sort_dir: "desc" }),
  ]);
  const tickers = [...new Set(pages.flatMap((page) => page.items.map((item) => item.ticker)))];
  const stocks: MetadataRoute.Sitemap = tickers.map((ticker) => ({ url: `${SITE_URL}/stocks/${encodeURIComponent(ticker)}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 }));
  return [...staticPages, ...stocks];
}
