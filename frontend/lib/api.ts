import {
  getStock as getFallbackStock,
  indexes as fallbackIndexes,
  news as fallbackNews,
  stocks as fallbackStocks,
  type FxRate,
  type LiveSourceStatus,
  type MarketIndex,
  type MarketDataSource,
  type MacroMetric,
  type NewsItem,
  type MarketTableRow,
  type StockEarningPoint,
  type StockFundamentals,
  type StockSourceMeta,
  type Stock,
} from "@/lib/data";
import { normalizeSource, normalizeSourceStatus, type BackendSource } from "@/lib/live-market";

function normalizeApiUrl(value?: string) {
  return (value ?? "http://localhost:8000").replace(/^\uFEFF/, "").trim().replace(/\/$/, "");
}

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

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
  fundamentals?: BackendStockFundamentals;
  fundamentals_data?: BackendStockFundamentals;
  earnings?: BackendEarningPoint[];
  earnings_data?: BackendEarningPoint[];
  news?: BackendNewsItem[];
  sources?: BackendStockSourceMeta[];
  source_meta?: BackendStockSourceMeta[];
  sourceMeta?: BackendStockSourceMeta[];
};

type BackendNewsItem = {
  id: number;
  title: string;
  source: string;
  category: "US" | "Technology" | "ETF" | "Crypto" | NewsItem["category"];
  published_at?: string;
  time?: string;
};

type BackendStockFundamentals = {
  market_cap?: string;
  marketCap?: string;
  pe?: number;
  dividend_yield?: number | string;
  eps?: number;
  metrics?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  revenue_growth?: string;
  revenueGrowth?: string;
  gross_margin?: string;
  grossMargin?: string;
  operating_margin?: string;
  operatingMargin?: string;
  debt_to_equity?: string;
  debtToEquity?: string;
  beta?: number;
  dividendYield?: string;
  as_of?: string;
  asOf?: string;
  source?: string;
  source_status?: string;
  sourceStatus?: LiveSourceStatus;
};

type BackendEarningPoint = {
  period: string;
  actual?: number;
  estimate?: number;
  surprise?: number;
  eps_actual?: number;
  epsActual?: number;
  eps_estimate?: number;
  epsEstimate?: number;
  revenue_actual?: string;
  revenueActual?: string;
  revenue_estimate?: string;
  revenueEstimate?: string;
  surprise_percent?: number;
  surprisePercent?: number;
  as_of?: string;
  asOf?: string;
  source?: string;
  source_status?: string;
  sourceStatus?: LiveSourceStatus;
};

type BackendStockSourceMeta = {
  source?: string;
  status?: string;
  as_of?: string;
  asOf?: string;
  detail?: string;
  notes?: string;
  market?: string;
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

type BackendFxRate = {
  ccy?: string;
  pair?: string;
  base?: string;
  quote?: string;
  rate?: number;
  value?: number;
  diff?: number;
  change?: number;
  date?: string;
  as_of?: string;
  asOf?: string;
  source?: string;
  source_status?: string;
  sourceStatus?: LiveSourceStatus;
};

type BackendMacroMetric = {
  id?: string;
  key?: string;
  label?: string;
  name?: string;
  value?: unknown;
  change?: number;
  unit?: string;
  as_of?: string;
  asOf?: string;
  source?: string;
  source_status?: string;
  sourceStatus?: LiveSourceStatus;
};

type BackendMacroSummary = {
  status?: string;
  summary?: string;
  indicators?: BackendMacroMetric[];
  as_of?: string;
  asOf?: string;
};

type BackendFundamentalsResponse = BackendStockFundamentals & {
  ticker?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  industry?: string;
  source?: string;
  provider?: string;
  status?: string;
  as_of?: string;
};

type BackendEarningsResponse = {
  ticker?: string;
  source?: string;
  provider?: string;
  status?: string;
  as_of?: string;
  items?: BackendEarningPoint[];
};

type BackendDashboardData = {
  market?: BackendMarketAsset[];
  stocks?: BackendStock[];
  marketTable?: BackendMarketTableRow[];
  market_table?: BackendMarketTableRow[];
  news?: BackendNewsItem[];
  sources?: BackendSource[];
  fx_rates?: BackendFxRate[];
  fxRates?: BackendFxRate[];
  macro?: BackendMacroMetric[] | BackendMacroSummary;
};

type BackendMarketTableRow = Record<string, unknown> & {
  ticker?: string;
  symbol?: string;
  name?: string;
  price?: number | string;
  last?: number | string;
  lastPrice?: number | string;
  change1h?: number | string;
  change_1h?: number | string;
  change24h?: number | string;
  change_24h?: number | string;
  change7d?: number | string;
  change_7d?: number | string;
  marketCap?: number | string;
  market_cap?: number | string;
  marketCapValue?: number | string;
  market_cap_value?: number | string;
  volume24h?: number | string;
  volume_24h?: number | string;
  volume24hValue?: number | string;
  volume_24h_value?: number | string;
  circulatingSupply?: number | string;
  circulating_supply?: number | string;
  circulatingSupplyValue?: number | string;
  circulating_supply_value?: number | string;
  sparkline7d?: number[] | string;
  sparkline?: number[] | string;
  sparkline_7d?: number[] | string;
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
  const timeout = setTimeout(() => controller.abort(), 15000);

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
  const fundamentals = normalizeFundamentals(stock, fallback);
  const earnings = normalizeEarnings(stock.earnings ?? stock.earnings_data);
  const news = stock.news?.length ? stock.news.map(normalizeNewsItem) : undefined;
  const sources = normalizeStockSources(stock);

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
    fundamentals,
    earnings,
    news,
    sources,
  };
}

function normalizeFundamentals(stock: BackendStock, fallback?: Stock): StockFundamentals | undefined {
  const source = stock.fundamentals ?? stock.fundamentals_data;
  const resolved = source || stock.market_cap || stock.marketCap || stock.pe || stock.dividend || stock.sector ? source ?? {} : undefined;
  const metrics = resolved?.metrics ?? {};

  if (!resolved && !fallback) return undefined;

  return {
    marketCap: resolved?.marketCap ?? resolved?.market_cap ?? stock.marketCap ?? stock.market_cap ?? fallback?.marketCap,
    pe: resolved?.pe ?? numberMetric(metrics, "peNormalizedAnnual", "peBasicExclExtraTTM") ?? stock.pe ?? fallback?.pe,
    eps: resolved?.eps ?? numberMetric(metrics, "epsExclExtraItemsTTM", "epsTTM", "epsInclExtraItemsTTM"),
    revenueGrowth: resolved?.revenueGrowth ?? resolved?.revenue_growth,
    grossMargin: resolved?.grossMargin ?? resolved?.gross_margin ?? percentMetric(metrics, "grossMarginTTM", "grossMarginAnnual"),
    operatingMargin: resolved?.operatingMargin ?? resolved?.operating_margin ?? percentMetric(metrics, "operatingMarginTTM", "operatingMarginAnnual"),
    debtToEquity: resolved?.debtToEquity ?? resolved?.debt_to_equity ?? stringMetric(metrics, "totalDebt/totalEquityAnnual", "totalDebt/totalEquityQuarterly"),
    beta: resolved?.beta ?? numberMetric(metrics, "beta"),
    dividendYield: resolved?.dividendYield ?? stringifyOptional(resolved?.dividend_yield) ?? percentMetric(metrics, "dividendYieldIndicatedAnnual") ?? stock.dividend,
    asOf: resolved?.asOf ?? resolved?.as_of ?? stock.asOf ?? stock.as_of,
    source: resolved?.source ?? stock.source,
    sourceStatus: normalizeSourceStatus(resolved?.sourceStatus ?? resolved?.source_status ?? stock.sourceStatus ?? stock.source_status ?? (resolved as BackendFundamentalsResponse | undefined)?.status),
  };
}

function normalizeEarnings(earnings?: BackendEarningPoint[]): StockEarningPoint[] | undefined {
  if (!earnings?.length) return undefined;

  return earnings.map((point) => ({
    period: point.period,
    epsActual: point.epsActual ?? point.eps_actual ?? point.actual,
    epsEstimate: point.epsEstimate ?? point.eps_estimate ?? point.estimate,
    revenueActual: point.revenueActual ?? point.revenue_actual,
    revenueEstimate: point.revenueEstimate ?? point.revenue_estimate,
    surprisePercent: point.surprisePercent ?? point.surprise_percent,
    asOf: point.asOf ?? point.as_of,
    source: point.source,
    sourceStatus: normalizeSourceStatus(point.sourceStatus ?? point.source_status),
  }));
}

function normalizeStockSources(stock: BackendStock): StockSourceMeta[] | undefined {
  const sources = stock.sources ?? stock.source_meta ?? stock.sourceMeta;
  if (!sources?.length) return undefined;

  return sources.map((source) => ({
    source: source.source ?? "Источник",
    status: normalizeSourceStatus(source.status ?? stock.sourceStatus ?? stock.source_status),
    asOf: source.asOf ?? source.as_of ?? stock.asOf ?? stock.as_of,
    detail: source.detail,
    notes: source.notes,
    market: source.market,
  }));
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

function normalizeMarketTableRow(row: BackendMarketTableRow): MarketTableRow {
  const ticker = stringValue(row.ticker ?? row.symbol) ?? "UNKNOWN";
  const price = numberValue(row.price ?? row.lastPrice ?? row.last, 0) ?? 0;
  const change1h = numberValue(row.change1h ?? row.change_1h, estimateShortChange(price, ticker, 1)) ?? 0;
  const change24h = numberValue(row.change24h ?? row.change_24h, estimateMediumChange(price, ticker)) ?? 0;
  const change7d = numberValue(row.change7d ?? row.change_7d, estimateLongChange(price, ticker)) ?? 0;
  const marketCapValue = numberValue(row.marketCapValue ?? row.market_cap_value ?? row.marketCap ?? row.market_cap, undefined);
  const volume24hValue = numberValue(row.volume24hValue ?? row.volume_24h_value ?? row.volume24h ?? row.volume_24h, undefined);
  const circulatingSupplyValue = numberValue(
    row.circulatingSupplyValue ?? row.circulating_supply_value ?? row.circulatingSupply ?? row.circulating_supply,
    undefined,
  );
  const sparkline7d = normalizeSparkline(row.sparkline7d ?? row.sparkline_7d ?? row.sparkline, change7d, ticker);

  return {
    ticker,
    name: stringValue(row.name) ?? ticker,
    price,
    change1h,
    change24h,
    change7d,
    marketCap: stringifyMoney(row.marketCap ?? row.market_cap, marketCapValue, price * 1000000000),
    volume24h: stringifyMoney(row.volume24h ?? row.volume_24h, volume24hValue, price * 1000000),
    circulatingSupply: stringifySupply(row.circulatingSupply ?? row.circulating_supply, circulatingSupplyValue, marketCapValue, price),
    marketCapValue,
    volume24hValue,
    circulatingSupplyValue,
    sparkline7d,
    source: stringValue(row.source),
    sourceStatus: normalizeSourceStatus(row.sourceStatus ?? row.source_status),
    asOf: stringValue(row.asOf ?? row.as_of),
  };
}

function stringValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return value.toString();
  return undefined;
}

function numberValue(value: unknown, fallback?: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;

    const compact = parseCompactMoney(value);
    if (typeof compact === "number" && Number.isFinite(compact)) return compact;

    const cleaned = Number(value.replace(/[^0-9.+-]/g, ""));
    if (Number.isFinite(cleaned)) return cleaned;
  }
  return fallback;
}

function estimateShortChange(price: number, ticker: string, divisor: number) {
  return roundTo(seedVariance(ticker, divisor) * Math.max(0.12, price * 0.0006), 2);
}

function estimateMediumChange(price: number, ticker: string) {
  return roundTo(seedVariance(ticker, 2) * Math.max(0.35, price * 0.0022), 2);
}

function estimateLongChange(price: number, ticker: string) {
  return roundTo(seedVariance(ticker, 3) * Math.max(0.8, price * 0.0065), 2);
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

function normalizeFxRate(rate: BackendFxRate): FxRate {
  const base = rate.base ?? rate.ccy;
  const quote = rate.quote ?? (rate.ccy ? "UZS" : undefined);
  const pair = rate.pair ?? [base, quote].filter(Boolean).join("/");

  return {
    pair: pair || "FX",
    base,
    quote,
    rate: rate.rate ?? rate.value ?? 0,
    change: rate.change ?? rate.diff,
    asOf: rate.asOf ?? rate.as_of ?? rate.date,
    source: rate.source,
    sourceStatus: normalizeSourceStatus(rate.sourceStatus ?? rate.source_status),
  };
}

function normalizeMacroMetric(metric: BackendMacroMetric): MacroMetric {
  const label = metric.label ?? metric.name ?? metric.key ?? metric.id ?? "Macro";
  const stringValue =
    typeof metric.value === "number"
      ? metric.value.toLocaleString("en-US")
      : typeof metric.value === "string"
        ? metric.value
        : metric.value && typeof metric.value === "object"
          ? Object.entries(metric.value as Record<string, unknown>)
              .map(([key, value]) => `${key}: ${String(value)}`)
              .join(" · ")
          : "N/A";

  return {
    key: metric.key ?? metric.id ?? label,
    label,
    value: stringValue,
    change: metric.change,
    unit: metric.unit,
    asOf: metric.asOf ?? metric.as_of,
    source: metric.source,
    sourceStatus: normalizeSourceStatus(metric.sourceStatus ?? metric.source_status),
  };
}

function normalizeMacroBlock(macro?: BackendMacroMetric[] | BackendMacroSummary): MacroMetric[] {
  if (!macro) return [];
  if (Array.isArray(macro)) return macro.map(normalizeMacroMetric);

  const inheritedAsOf = macro.asOf ?? macro.as_of;
  return (macro.indicators ?? []).map((indicator) =>
    normalizeMacroMetric({
      ...indicator,
      asOf: indicator.asOf ?? indicator.as_of ?? inheritedAsOf,
      sourceStatus: normalizeSourceStatus(indicator.sourceStatus ?? indicator.source_status ?? macro.status),
    }),
  );
}

function buildFallbackMarketTable(stocks: Stock[]): MarketTableRow[] {
  return stocks.map((stock, index) => {
    const change24h = stock.change;
    const change1h = roundTo((change24h / 3) + seedVariance(stock.ticker, 1) * 0.35, 2);
    const change7d = roundTo(change24h * 2.6 + seedVariance(stock.ticker, 2) * 1.25, 2);
    const marketCapValue = parseCompactMoney(stock.marketCap) ?? stock.price * (1000000000 / Math.max(1, 18 + index * 4));
    const volume24hValue = marketCapValue * (0.015 + Math.abs(seedVariance(stock.ticker, 3)) * 0.006);
    const circulatingSupplyValue = marketCapValue / Math.max(stock.price, 0.01);

    return {
      ticker: stock.ticker,
      name: stock.name,
      price: stock.price,
      change1h,
      change24h,
      change7d,
      marketCap: stock.marketCap,
      volume24h: formatCompactMoney(volume24hValue),
      circulatingSupply: formatCompactSupply(circulatingSupplyValue),
      marketCapValue,
      volume24hValue,
      circulatingSupplyValue,
      sparkline7d: buildSparkline(change7d, stock.ticker),
      source: stock.source,
      sourceStatus: stock.sourceStatus,
      asOf: stock.asOf,
    };
  });
}

function numberMetric(metrics: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = metrics[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function stringMetric(metrics: Record<string, unknown>, ...keys: string[]) {
  const value = numberMetric(metrics, ...keys);
  return typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : undefined;
}

function percentMetric(metrics: Record<string, unknown>, ...keys: string[]) {
  const value = numberMetric(metrics, ...keys);
  return typeof value === "number" ? `${value.toFixed(2)}%` : undefined;
}

function stringifyOptional(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return `${value.toFixed(2)}%`;
  if (typeof value === "string" && value.trim()) return value;
  return undefined;
}

function fetchMarketTableSource(source?: BackendDashboardData) {
  if (source?.marketTable?.length) return source.marketTable;
  if (source?.market_table?.length) return source.market_table;
  return null;
}

async function resolveMarketTableRows(data?: BackendDashboardData) {
  const inPayload = fetchMarketTableSource(data);
  if (inPayload?.length) return inPayload.map(normalizeMarketTableRow);

  const remote = await fetchJson<BackendMarketTableRow[] | { marketTable?: BackendMarketTableRow[]; rows?: BackendMarketTableRow[] }>("/dashboard/market-table");
  const rows = Array.isArray(remote) ? remote : remote?.marketTable ?? remote?.rows;
  if (rows?.length) return rows.map(normalizeMarketTableRow);

  const fallbackStocksWithMeta = data?.stocks?.length ? data.stocks.map(normalizeStock) : fallbackStocks;
  return buildFallbackMarketTable(fallbackStocksWithMeta);
}

function normalizeSparkline(raw: number[] | string | undefined, change7d: number, ticker: string) {
  if (Array.isArray(raw) && raw.length >= 2) {
    const numeric = raw
      .map((point) => (typeof point === "number" && Number.isFinite(point) ? point : Number(point)))
      .filter((point) => Number.isFinite(point));
    if (numeric.length >= 2) return normalizeSeries(numeric);
  }

  if (typeof raw === "string" && raw.trim()) {
    const numeric = raw
      .split(/[\s,|;]+/)
      .map((point) => Number(point))
      .filter((point) => Number.isFinite(point));
    if (numeric.length >= 2) return normalizeSeries(numeric);
  }

  return buildSparkline(change7d, ticker);
}

function buildSparkline(change7d: number, ticker: string) {
  const seed = ticker
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const direction = change7d === 0 ? 0.15 : Math.sign(change7d) * Math.min(0.65, Math.abs(change7d) / 16);
  let value = 100 + seedVariance(ticker, 9) * 6;
  const points = [value];

  for (let index = 1; index < 7; index += 1) {
    const wobble = Math.sin((seed + index * 11) / 5) * 0.8 + Math.cos((seed + index * 7) / 6) * 0.6;
    value = Math.max(20, value * (1 + direction * 0.08 + wobble * 0.01));
    points.push(value);
  }

  return normalizeSeries(points);
}

function normalizeSeries(series: number[]) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) {
    return series.map(() => 50);
  }

  return series.map((point) => ((point - min) / (max - min)) * 100);
}

function parseCompactMoney(value: string | number | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;

  const cleaned = value.replace(/[^0-9.,KMBTQkmbtq-]/g, "").trim();
  if (!cleaned) return undefined;

  const match = cleaned.match(/^(-?\d+(?:[.,]\d+)?)([KMBTQkmbtq]?)$/);
  if (!match) return Number(cleaned.replace(",", "."));

  const amount = Number(match[1].replace(",", "."));
  if (!Number.isFinite(amount)) return undefined;

  const multiplierMap: Record<string, number> = {
    k: 1e3,
    m: 1e6,
    b: 1e9,
    t: 1e12,
    q: 1e15,
  };
  const multiplier = multiplierMap[match[2].toLowerCase()] ?? 1;
  return amount * multiplier;
}

function stringifyMoney(display: unknown, fallbackValue: number | undefined, priceFallback?: number) {
  if (typeof display === "string" && display.trim()) return display;
  if (typeof display === "number" && Number.isFinite(display)) return formatCompactMoney(display);
  if (typeof fallbackValue === "number" && Number.isFinite(fallbackValue)) return formatCompactMoney(fallbackValue);
  if (typeof priceFallback === "number" && Number.isFinite(priceFallback)) return formatCompactMoney(priceFallback);
  return "N/A";
}

function stringifySupply(display: unknown, fallbackValue: number | undefined, marketCapValue?: number, price?: number) {
  if (typeof display === "string" && display.trim()) return display;
  if (typeof display === "number" && Number.isFinite(display)) return formatCompactSupply(display);
  if (typeof fallbackValue === "number" && Number.isFinite(fallbackValue)) return formatCompactSupply(fallbackValue);
  if (typeof price === "number" && price > 0) return formatCompactSupply((marketCapValue ?? price * 1000000000) / price);
  return "N/A";
}

function formatCompactMoney(value: number) {
  const abs = Math.abs(value);
  const suffixes: Array<[number, string]> = [
    [1e15, "Q"],
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];

  for (const [threshold, suffix] of suffixes) {
    if (abs >= threshold) return `$${(value / threshold).toFixed(abs >= 100 * threshold ? 0 : 1)}${suffix}`;
  }

  return `$${value.toFixed(2)}`;
}

function formatCompactSupply(value: number) {
  const abs = Math.abs(value);
  const suffixes: Array<[number, string]> = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];

  for (const [threshold, suffix] of suffixes) {
    if (abs >= threshold) return `${(value / threshold).toFixed(abs >= 100 * threshold ? 0 : 1)}${suffix}`;
  }

  return value.toFixed(2);
}

function seedVariance(seedText: string, offset: number) {
  const seed = seedText.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + offset * 17;
  return ((seed % 23) - 11) / 11;
}

function roundTo(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export async function getStocks(): Promise<Stock[]> {
  const dashboardData = await fetchJson<BackendDashboardData>("/dashboard-data");
  if (dashboardData?.stocks?.length) return dashboardData.stocks.map(normalizeStock);

  const data = await fetchJson<BackendStock[]>("/stocks");
  if (!data?.length) return fallbackStocks;
  return data.map(normalizeStock);
}

export async function getDashboardData(): Promise<{
  indexes: MarketIndex[];
  stocks: Stock[];
  marketTable: MarketTableRow[];
  news: NewsItem[];
  sources: MarketDataSource[];
  fxRates: FxRate[];
  macro: MacroMetric[];
}> {
  const data = await fetchJson<BackendDashboardData>("/dashboard-data");
  if (!data) {
    const fallbackStocksWithMeta = fallbackStocks;
    return {
      indexes: fallbackIndexes,
      stocks: fallbackStocksWithMeta,
      marketTable: buildFallbackMarketTable(fallbackStocksWithMeta),
      news: fallbackNews,
      sources: [
        {
          id: "fallback",
          name: "Резервные демо-данные",
          status: "fallback",
          assetClasses: ["indexes", "stocks"],
          detail: "API котировок пока недоступен, показываются резервные данные.",
        },
      ],
      fxRates: [],
      macro: [],
    };
  }

  return {
    indexes: data.market?.length ? data.market.map(normalizeMarketAsset) : fallbackIndexes,
    stocks: data.stocks?.length ? data.stocks.map(normalizeStock) : fallbackStocks,
    marketTable: await resolveMarketTableRows(data),
    news: data.news?.length ? data.news.map(normalizeNewsItem) : fallbackNews,
    sources: data.sources?.length ? data.sources.map(normalizeSource) : [],
    fxRates: ((data.fxRates?.length ? data.fxRates : data.fx_rates) ?? []).map(normalizeFxRate),
    macro: normalizeMacroBlock(data.macro),
  };
}

export async function getMarket(): Promise<MarketIndex[]> {
  const dashboardData = await fetchJson<BackendDashboardData>("/dashboard-data");
  if (dashboardData?.market?.length) return dashboardData.market.map(normalizeMarketAsset);

  const data = await fetchJson<BackendMarketAsset[]>("/market");
  if (!data?.length) return fallbackIndexes;
  return data.map(normalizeMarketAsset);
}

export async function getSources(): Promise<MarketDataSource[]> {
  const dashboardData = await fetchJson<BackendDashboardData>("/dashboard-data");
  if (dashboardData?.sources?.length) return dashboardData.sources.map(normalizeSource);

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
  const encodedTicker = encodeURIComponent(ticker);
  const [data, fundamentals, earnings, news] = await Promise.all([
    fetchJson<BackendStock>(`/stock/${encodedTicker}`),
    fetchJson<BackendFundamentalsResponse>(`/fundamentals/${encodedTicker}`),
    fetchJson<BackendEarningsResponse>(`/earnings/${encodedTicker}`),
    fetchJson<BackendNewsItem[]>(`/news?symbol=${encodedTicker}`),
  ]);

  if (data) {
    return normalizeStock({
      ...data,
      fundamentals: fundamentals ?? data.fundamentals,
      earnings: earnings?.items ?? data.earnings,
      news: news?.length ? news : data.news,
      source_meta: [
        {
          source: fundamentals?.source ?? data.source,
          status: fundamentals?.status ?? data.source_status,
          as_of: fundamentals?.as_of ?? data.as_of,
          detail: fundamentals?.name || data.name,
          market: fundamentals?.exchange,
          notes: fundamentals?.provider ? `provider: ${fundamentals.provider}` : undefined,
        },
      ],
    });
  }
  return getFallbackStock(ticker);
}

export async function getNews(): Promise<NewsItem[]> {
  const dashboardData = await fetchJson<BackendDashboardData>("/dashboard-data");
  if (dashboardData?.news?.length) return dashboardData.news.map(normalizeNewsItem);

  const data = await fetchJson<BackendNewsItem[]>("/news");
  if (!data?.length) return fallbackNews;
  return data.map(normalizeNewsItem);
}
