import {
  getStock as getFallbackStock,
  indexes as fallbackIndexes,
  news as fallbackNews,
  stocks as fallbackStocks,
  type LiveSourceStatus,
  type MarketIndex,
  type MarketDataSource,
  type NewsItem,
  type Stock,
} from "@/lib/data";
import { normalizeSource, normalizeSourceStatus, type BackendSource } from "@/lib/live-market";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

type BackendStock = {
  ticker: string;
  name: string;
  price: number;
  change: number;
  market_cap?: string;
  marketCap?: string;
  pe: number;
  dividend: string;
  sector?: string;
  description: string;
  source?: string;
  source_status?: string;
  sourceStatus?: LiveSourceStatus;
  as_of?: string;
  asOf?: string;
};

type BackendNewsItem = {
  id: number;
  title: string;
  source: string;
  category: "US" | "Technology" | "ETF" | "Crypto" | NewsItem["category"];
  published_at?: string;
  time?: string;
};

type BackendMarketAsset = {
  ticker: string;
  name: string;
  price: number;
  value?: string;
  change: number;
  category: "index" | "crypto" | "commodity";
  source?: string;
  source_status?: string;
  sourceStatus?: LiveSourceStatus;
  as_of?: string;
  asOf?: string;
};

const categoryLabels: Record<string, NewsItem["category"]> = {
  US: "США",
  Technology: "Технологии",
  ETF: "ETF",
  Crypto: "Крипта",
  США: "США",
  Технологии: "Технологии",
  Крипта: "Крипта",
};

async function fetchJson<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_URL}${path}`, { cache: "no-store", signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeStock(stock: BackendStock): Stock {
  const fallback = getFallbackStock(stock.ticker);

  return {
    ticker: stock.ticker,
    name: stock.name,
    price: stock.price,
    change: stock.change,
    marketCap: stock.marketCap ?? stock.market_cap ?? fallback?.marketCap ?? "N/A",
    pe: stock.pe,
    dividend: stock.dividend,
    sector: stock.sector ?? fallback?.sector ?? "N/A",
    description: stock.description || fallback?.description || "",
    source: stock.source ?? fallback?.source,
    sourceStatus: normalizeSourceStatus(stock.sourceStatus ?? stock.source_status ?? fallback?.sourceStatus),
    asOf: stock.asOf ?? stock.as_of ?? fallback?.asOf,
  };
}

function normalizeMarketAsset(asset: BackendMarketAsset): MarketIndex {
  return {
    ticker: asset.ticker,
    name: asset.name,
    value: asset.value ?? (asset.category === "index" ? asset.price.toLocaleString("en-US") : `$${asset.price.toLocaleString("en-US")}`),
    change: asset.change,
    source: asset.source,
    sourceStatus: normalizeSourceStatus(asset.sourceStatus ?? asset.source_status),
    asOf: asset.asOf ?? asset.as_of,
  };
}

function normalizeNewsItem(item: BackendNewsItem): NewsItem {
  return {
    id: item.id,
    title: item.title,
    source: item.source,
    category: categoryLabels[item.category] ?? "США",
    time: item.time ?? relativeTime(item.published_at),
  };
}

function relativeTime(value?: string) {
  if (!value) return "сейчас";

  const publishedAt = new Date(value).getTime();
  if (Number.isNaN(publishedAt)) return "сейчас";

  const minutes = Math.max(0, Math.round((Date.now() - publishedAt) / 60000));
  if (minutes < 1) return "сейчас";
  if (minutes < 60) return `${minutes} мин`;

  const hours = Math.round(minutes / 60);
  return `${hours} ч`;
}

export async function getStocks(): Promise<Stock[]> {
  const data = await fetchJson<BackendStock[]>("/stocks");
  if (!data?.length) return fallbackStocks;
  return data.map(normalizeStock);
}

export async function getMarket(): Promise<MarketIndex[]> {
  const data = await fetchJson<BackendMarketAsset[]>("/market");
  if (!data?.length) return fallbackIndexes;
  return data.map(normalizeMarketAsset);
}

export async function getSources(): Promise<MarketDataSource[]> {
  const data = await fetchJson<BackendSource[]>("/sources");
  if (!data?.length) {
    return [
      {
        id: "fallback",
        name: "Резервные демо-данные",
        status: "fallback",
        assetClasses: ["indexes", "stocks"],
        detail: "API котировок пока недоступен, показываются резервные данные.",
      },
    ];
  }

  return data.map(normalizeSource);
}

export async function getStock(ticker: string): Promise<Stock | undefined> {
  const data = await fetchJson<BackendStock>(`/stock/${encodeURIComponent(ticker)}`);
  if (data) return normalizeStock(data);
  return getFallbackStock(ticker);
}

export async function getNews(): Promise<NewsItem[]> {
  const data = await fetchJson<BackendNewsItem[]>("/news");
  if (!data?.length) return fallbackNews;
  return data.map(normalizeNewsItem);
}
