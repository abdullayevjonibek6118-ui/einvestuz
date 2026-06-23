import type { LiveSourceStatus, MarketDataSource } from "@/lib/data";

export type LiveQuote = {
  ticker: string;
  price: number;
  change?: number;
  currency?: string;
  source?: string;
  sourceStatus?: LiveSourceStatus;
  asOf?: string;
};

type BackendLiveQuote = LiveQuote & {
  symbol?: string;
  source_status?: string;
  status?: string;
  as_of?: string;
  timestamp?: string;
};

export type BackendSource = {
  id?: string;
  name?: string;
  provider?: string;
  status?: string;
  market?: string;
  coverage?: string;
  update_mode?: string;
  updateMode?: string;
  url?: string;
  notes?: string;
  asset_classes?: string[];
  assetClasses?: string[];
  latency_ms?: number;
  latencyMs?: number;
  last_update?: string;
  lastUpdate?: string;
  detail?: string;
};

export type BackendQuoteMessage =
  | BackendLiveQuote
  | { quote: BackendLiveQuote }
  | { quotes: BackendLiveQuote[] }
  | { data: BackendLiveQuote | BackendLiveQuote[] }
  | BackendLiveQuote[];

const sourceStatusSet = new Set<LiveSourceStatus>(["live", "delayed", "stale", "offline", "fallback", "needs_license"]);

export function normalizeSourceStatus(value?: string): LiveSourceStatus {
  const normalized = value?.toLowerCase();
  if (normalized && sourceStatusSet.has(normalized as LiveSourceStatus)) return normalized as LiveSourceStatus;
  if (normalized === "available") return "delayed";
  if (normalized === "unavailable") return "offline";
  return "fallback";
}

export function normalizeSource(source: BackendSource): MarketDataSource {
  const name = source.name ?? source.provider ?? source.id ?? "Рыночные данные";

  return {
    id: source.id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    status: normalizeSourceStatus(source.status),
    market: source.market,
    coverage: source.coverage,
    updateMode: source.updateMode ?? source.update_mode,
    url: source.url,
    notes: source.notes,
    assetClasses: source.assetClasses ?? source.asset_classes,
    latencyMs: source.latencyMs ?? source.latency_ms,
    lastUpdate: source.lastUpdate ?? source.last_update,
    detail: source.detail,
  };
}

export function getWebSocketUrl(path = "/ws/quotes") {
  const explicit = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "");
  if (explicit) return `${explicit}${path}`;

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  return `${apiUrl.replace(/^http/, "ws")}${path}`;
}

export function getApiUrl(path = "") {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  return `${apiUrl}${path}`;
}

export function normalizeQuoteMessages(message: BackendQuoteMessage): LiveQuote[] {
  if (Array.isArray(message)) return message.map(normalizeQuote).filter(Boolean) as LiveQuote[];
  if (hasKey(message, "quotes") && Array.isArray(message.quotes)) return message.quotes.map(normalizeQuote).filter(Boolean) as LiveQuote[];
  if (hasKey(message, "quote")) {
    const quote = normalizeQuote(message.quote);
    return quote ? [quote] : [];
  }
  if (hasKey(message, "data")) {
    const data = message.data;
    if (Array.isArray(data)) return data.map(normalizeQuote).filter(Boolean) as LiveQuote[];
    const quote = normalizeQuote(data);
    return quote ? [quote] : [];
  }

  const quote = normalizeQuote(message as BackendLiveQuote);
  return quote ? [quote] : [];
}

function hasKey<Key extends PropertyKey>(value: object, key: Key): value is object & Record<Key, unknown> {
  return key in value;
}

function normalizeQuote(value: BackendLiveQuote | null | undefined): LiveQuote | null {
  if (!value) return null;
  const ticker = (value.ticker ?? value.symbol)?.toUpperCase();
  if (!ticker || typeof value.price !== "number") return null;

  return {
    ticker,
    price: value.price,
    change: value.change,
    currency: value.currency,
    source: value.source,
    sourceStatus: normalizeSourceStatus(value.sourceStatus ?? value.source_status ?? value.status),
    asOf: value.asOf ?? value.as_of ?? value.timestamp,
  };
}
