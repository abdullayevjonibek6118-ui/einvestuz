import {
  type FxRate,
  type LiveSourceStatus,
  type MarketIndex,
  type MarketDataSource,
  type MacroMetric,
  type NewsItem,
  type MarketTableRow,
  type StockDecisionSourceMeta,
  type StockDecisionSummary,
  type StockEarningPoint,
  type StockFundamentals,
  type StockInsight,
  type StockRiskFactor,
  type StockScopeBatchDetails,
  type StockScopeDetails,
  type StockScopeScreenerResponse,
  type StockScopeScreenerRow,
  type StockScopeTradingRow,
  type StockSourceMeta,
  type Stock,
} from "@/lib/data";
import { normalizeSource, normalizeSourceStatus, type BackendSource } from "@/lib/live-market";

function normalizeApiUrl(value?: string) {
  const cleaned = value?.replace(/^\uFEFF/, "").trim().replace(/\/$/, "");
  if (cleaned) return cleaned;
  return process.env.NODE_ENV === "production" ? "" : "http://localhost:8000";
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
  status?: string;
  as_of?: string;
  asOf?: string;
  currency?: string;
  market?: string;
  isin?: string;
  listing_category?: string;
  listingCategory?: string;
  stock_type?: string;
  stockType?: string;
  openinfo_id?: number | string;
  openinfoId?: number | string;
  website?: string;
  insight?: BackendStockInsight;
  risk_factors?: BackendStockRiskFactor[];
  riskFactors?: BackendStockRiskFactor[];
  decision_summary?: BackendStockDecisionSummary;
  decisionSummary?: BackendStockDecisionSummary;
  source_meta?: BackendStockSourceMeta[] | BackendStockDecisionSourceMeta;
  fundamentals?: BackendStockFundamentals;
  fundamentals_data?: BackendStockFundamentals;
  earnings?: BackendEarningPoint[];
  earnings_data?: BackendEarningPoint[];
  news?: BackendNewsItem[];
  sources?: BackendStockSourceMeta[];
  sourceMeta?: BackendStockSourceMeta[];
  stockscope?: BackendStockScopeDetails;
};

type BackendStockScopeDetails = Record<string, unknown> & {
  source_url?: string;
  sourceUrl?: string;
  company_type?: string;
  companyType?: string;
  price_history?: unknown;
  priceHistory?: unknown;
  trading_stats?: {
    daily?: BackendStockScopeTradingRow[];
    monthly?: BackendStockScopeTradingRow[];
    yearly?: BackendStockScopeTradingRow[];
  };
  tradingStats?: {
    daily?: BackendStockScopeTradingRow[];
    monthly?: BackendStockScopeTradingRow[];
    yearly?: BackendStockScopeTradingRow[];
  };
};

type BackendStockScopeTradingRow = {
  date?: string;
  price?: number | null;
  volume_uzs?: number | null;
  volumeUzs?: number | null;
  volume_pcs?: number | null;
  volumePcs?: number | null;
};

type BackendStockScopeScreenerRow = {
  ticker?: string;
  name?: string;
  isin?: string;
  openinfo_id?: number | string;
  openinfoId?: number | string;
  listing_category?: string;
  listingCategory?: string;
  sector?: string;
  market?: string;
  currency?: string;
  current_price?: number | null;
  market_cap?: number | null;
  volume_1d?: number | null;
  volume1d?: number | null;
  volume_7d?: number | null;
  volume7d?: number | null;
  volume_30d?: number | null;
  volume30d?: number | null;
  change_1d?: number | null;
  change1d?: number | null;
  change_7d?: number | null;
  change7d?: number | null;
  change_30d?: number | null;
  change30d?: number | null;
  price_points_count?: number;
  reports_count?: number;
  indicators_count?: number;
  dividends_count?: number;
  latest_period?: string;
  roe?: number | null;
  roa?: number | null;
  pe?: number | null;
  pb?: number | null;
  dividend_yield?: number | null;
  has_fresh_report?: boolean;
  hasFreshReport?: boolean;
  source_name?: string;
  sourceName?: string;
  source_url?: string;
  sourceUrl?: string;
  fetched_at?: string;
  fetchedAt?: string;
};

type BackendStockScopeScreenerResponse = {
  total?: number;
  offset?: number;
  limit?: number;
  count?: number;
  has_more?: boolean;
  sort_by?: string;
  sort_dir?: string;
  coverage?: {
    total?: number | null;
    with_reports?: number | null;
    with_indicators?: number | null;
    with_dividends?: number | null;
    with_price_history?: number | null;
  };
  items?: BackendStockScopeScreenerRow[];
};

type BackendStockScopeBatchDetails = {
  total?: number;
  offset?: number;
  limit?: number;
  count?: number;
  has_more?: boolean;
  tickers?: string[];
  items?: BackendStockScopeDetails[];
};

type BackendStockInsight = {
  headline?: string;
  summary?: string;
  signals?: string[];
  freshness?: {
    label?: string;
    minutes?: number;
  };
  liquidity_proxy?: string;
  liquidityProxy?: string;
  orientation?: string;
};

type BackendStockRiskFactor = {
  code?: string;
  label?: string;
  severity?: string;
  detail?: string;
};

type BackendStockDecisionSummary = {
  bottom_line?: string;
  bottomLine?: string;
  who_it_might_fit?: string[];
  whoItMightFit?: string[];
  who_it_might_not_fit?: string[];
  whoItMightNotFit?: string[];
  next_step?: string;
  nextStep?: string;
  time_horizon?: string;
  timeHorizon?: string;
};

type BackendStockDecisionSourceMeta = {
  source?: string;
  status?: string;
  market?: string;
  currency?: string;
  change_basis?: string;
  changeBasis?: string;
  as_of?: string;
  asOf?: string;
  freshness_minutes?: number;
  freshnessMinutes?: number;
  freshness_band?: string;
  freshnessBand?: string;
  freshness_risk?: string;
  freshnessRisk?: string;
  market_cap?: string;
  marketCap?: string;
  volume_proxy?: number;
  volumeProxy?: number;
  ticker?: string;
  name?: string;
  description?: string;
};

type BackendNewsItem = {
  id: number;
  title: string;
  source: string;
  category: "US" | "Technology" | "ETF" | "Crypto" | NewsItem["category"] | string;
  published_at?: string;
  time?: string;
  url?: string;
  summary?: string;
  related?: string;
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
  status?: string;
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
  status?: string;
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
  status?: string;
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
  status?: string;
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
  status?: string;
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
  status?: string;
  as_of?: string;
  asOf?: string;
  market?: string;
  currency?: string;
  sector?: string;
  isin?: string;
  listing_category?: string;
  listingCategory?: string;
  stock_type?: string;
  stockType?: string;
  openinfo_id?: number | string;
  openinfoId?: number | string;
  volume_period?: string;
  volumePeriod?: string;
};

const categoryLabels: Record<string, string> = {
  US: "США",
  Technology: "Технологии",
  ETF: "ETF",
  Crypto: "Крипта",
  США: "США",
  Технологии: "Технологии",
  Крипта: "Крипта",
};

async function fetchJson<T>(path: string): Promise<T | null> {
  if (!API_URL) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 }, signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeStock(stock: BackendStock): Stock {
  const fundamentals = normalizeFundamentals(stock);
  const earnings = normalizeEarnings(stock.earnings ?? stock.earnings_data);
  const news = stock.news?.length ? stock.news.map(normalizeNewsItem) : undefined;
  const sources = normalizeStockSources(stock);

  return {
    ticker: stock.ticker,
    name: stock.name,
    price: stock.price,
    change: stock.change,
    marketCap: stock.marketCap ?? stock.market_cap ?? "N/A",
    pe: stock.pe,
    dividend: stock.dividend,
    sector: stock.sector ?? "N/A",
    description: stock.description || "",
    source: stock.source,
    sourceStatus: normalizeSourceStatus(stock.sourceStatus ?? stock.source_status),
    asOf: stock.asOf ?? stock.as_of,
    currency: stock.currency ?? "USD",
    market: stock.market,
    isin: stock.isin,
    listingCategory: stock.listingCategory ?? stock.listing_category,
    stockType: stock.stockType ?? stock.stock_type,
    openinfoId: stock.openinfoId ?? stock.openinfo_id,
    website: stock.website,
    insight: normalizeStockInsight(stock.insight),
    riskFactors: normalizeStockRiskFactors(stock.riskFactors ?? stock.risk_factors),
    decisionSummary: normalizeDecisionSummary(stock.decisionSummary ?? stock.decision_summary),
    sourceMeta: normalizeDecisionSourceMeta(isDecisionSourceMeta(stock.source_meta) ? stock.source_meta : undefined),
    stockscope: normalizeStockScopeDetails(stock.stockscope),
    fundamentals,
    earnings,
    news,
    sources,
  };
}

function normalizeStockScopeDetails(source?: BackendStockScopeDetails | StockScopeDetails): StockScopeDetails | undefined {
  if (!source) return undefined;
  const raw = source as Record<string, unknown>;
  const fundamentals = isRecord(raw.fundamentals) ? raw.fundamentals : undefined;

  return {
    ticker: stringValue(raw.ticker),
    source: stringValue(raw.source),
    sourceUrl: stringValue(raw.sourceUrl ?? raw.source_url),
    companyType: stringValue(raw.companyType ?? raw.company_type),
    priceHistory: normalizeStockScopePriceHistory(raw.priceHistory ?? raw.price_history),
    fundamentals: normalizeStockScopeFundamentals(fundamentals),
    tradingStats: normalizeStockScopeTradingStats(raw.tradingStats ?? raw.trading_stats),
    reports: Array.isArray(raw.reports) ? (raw.reports as StockScopeDetails["reports"]) : undefined,
    dividends: normalizeStockScopeDividends(raw.dividends),
    indicators: Array.isArray(raw.indicators) ? (raw.indicators as StockScopeDetails["indicators"]) : undefined,
    charts: isRecord(raw.charts) ? (raw.charts as StockScopeDetails["charts"]) : undefined,
  };
}

function normalizeStockScopeFundamentals(source?: Record<string, unknown>): StockScopeDetails["fundamentals"] {
  if (!source) return undefined;
  return {
    reports: Array.isArray(source.reports) ? (source.reports as StockScopeDetails["reports"]) : undefined,
    earnings: isRecord(source.earnings) ? (source.earnings as NonNullable<StockScopeDetails["fundamentals"]>["earnings"]) : undefined,
    balanceSheet: isRecord(source.balanceSheet ?? source.balance_sheet)
      ? ((source.balanceSheet ?? source.balance_sheet) as NonNullable<StockScopeDetails["fundamentals"]>["balanceSheet"])
      : undefined,
    raw: Array.isArray(source.raw) ? source.raw : undefined,
  };
}

function normalizeStockScopePriceHistory(source: unknown): StockScopeDetails["priceHistory"] {
  if (!isRecord(source)) return undefined;
  const points = Array.isArray(source.points)
    ? source.points
        .filter(isRecord)
        .map((point) => ({
          date: stringValue(point.date) ?? "",
          value: typeof point.value === "number" ? point.value : undefined,
        }))
        .filter((point) => point.date)
    : undefined;
  return {
    points,
    raw: isRecord(source.raw) ? source.raw : undefined,
    lastUpdateAt: stringValue(source.lastUpdateAt ?? source.last_update_at),
  };
}

function normalizeStockScopeTradingStats(source: unknown) {
  if (!isRecord(source)) return undefined;
  return {
    daily: Array.isArray(source.daily) ? source.daily.map((row) => normalizeStockScopeTradingRow(row as BackendStockScopeTradingRow)) : undefined,
    monthly: Array.isArray(source.monthly) ? source.monthly.map((row) => normalizeStockScopeTradingRow(row as BackendStockScopeTradingRow)) : undefined,
    yearly: Array.isArray(source.yearly) ? source.yearly.map((row) => normalizeStockScopeTradingRow(row as BackendStockScopeTradingRow)) : undefined,
  };
}

function normalizeStockScopeTradingRow(row: BackendStockScopeTradingRow): StockScopeTradingRow {
  return {
    date: row.date ?? "",
    price: row.price,
    volumeUzs: row.volumeUzs ?? row.volume_uzs,
    volumePcs: row.volumePcs ?? row.volume_pcs,
  };
}

function normalizeStockScopeDividends(source: unknown): StockScopeDetails["dividends"] {
  if (!Array.isArray(source)) return undefined;
  return source.filter(isRecord).map((item) => ({
    id: stringValue(item.id),
    companyId: stringValue(item.companyId ?? item.company_id),
    companyName: stringValue(item.companyName ?? item.company_name),
    approvedDate: stringValue(item.approvedDate ?? item.approved_date),
    publishedDate: stringValue(item.publishedDate ?? item.published_date),
    scrapedAt: stringValue(item.scrapedAt ?? item.scraped_at),
    commonDividend: numberValue(item.commonDividend ?? item.common_dividend, undefined),
    preferredDividend: numberValue(item.preferredDividend ?? item.preferred_dividend, undefined),
    commonYield: numberValue(item.commonYield ?? item.common_yield, undefined),
    preferredYield: numberValue(item.preferredYield ?? item.preferred_yield, undefined),
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeFundamentals(stock: BackendStock): StockFundamentals | undefined {
  const source = stock.fundamentals ?? stock.fundamentals_data;
  const resolved = source || stock.market_cap || stock.marketCap || stock.pe || stock.dividend || stock.sector ? source ?? {} : undefined;
  const metrics = resolved?.metrics ?? {};

  if (!resolved) return undefined;

  return {
    marketCap: resolved?.marketCap ?? resolved?.market_cap ?? stock.marketCap ?? stock.market_cap,
    pe: resolved?.pe ?? numberMetric(metrics, "peNormalizedAnnual", "peBasicExclExtraTTM") ?? stock.pe,
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
    sourceStatus: normalizeSourceStatus(point.sourceStatus ?? point.source_status ?? point.status),
  }));
}

function normalizeStockSources(stock: BackendStock): StockSourceMeta[] | undefined {
  const decisionSource = isDecisionSourceMeta(stock.source_meta) ? normalizeDecisionSourceMeta(stock.source_meta) : undefined;
  const sources = stock.sources ?? (Array.isArray(stock.source_meta) ? stock.source_meta : undefined) ?? stock.sourceMeta;
  const normalizedSources = sources?.map((source) => ({
    source: source.source ?? "Источник",
    status: normalizeSourceStatus(source.status ?? stock.sourceStatus ?? stock.source_status),
    asOf: source.asOf ?? source.as_of ?? stock.asOf ?? stock.as_of,
    detail: source.detail,
    notes: source.notes,
    market: source.market,
  })) ?? [];

  if (decisionSource?.source && !normalizedSources.some((source) => source.source === decisionSource.source)) {
    normalizedSources.unshift({
      source: decisionSource.source,
      status: normalizeSourceStatus(decisionSource.status),
      asOf: decisionSource.asOf,
      detail: decisionSource.freshnessBand ? `Freshness: ${decisionSource.freshnessBand}` : decisionSource.description,
      notes: decisionSource.changeBasis ? `Change basis: ${decisionSource.changeBasis}` : decisionSource.freshnessRisk,
      market: decisionSource.market,
    });
  }

  return normalizedSources.length ? normalizedSources : undefined;
}

function normalizeStockInsight(source?: BackendStockInsight | StockInsight): StockInsight | undefined {
  if (!source) return undefined;
  const backendSource = source as BackendStockInsight;
  const frontendSource = source as StockInsight;

  return {
    headline: source.headline,
    summary: source.summary,
    signals: source.signals?.filter(Boolean),
    freshness: source.freshness,
    liquidityProxy: frontendSource.liquidityProxy ?? backendSource.liquidity_proxy,
    orientation: source.orientation,
  };
}

function normalizeStockRiskFactors(source?: BackendStockRiskFactor[] | StockRiskFactor[]): StockRiskFactor[] | undefined {
  const risks = source
    ?.map((risk) => ({
      code: risk.code,
      label: risk.label ?? "Risk factor",
      severity: risk.severity,
      detail: risk.detail,
    }))
    .filter((risk) => risk.label || risk.detail);

  return risks?.length ? risks : undefined;
}

function normalizeDecisionSummary(source?: BackendStockDecisionSummary | StockDecisionSummary): StockDecisionSummary | undefined {
  if (!source) return undefined;
  const backendSource = source as BackendStockDecisionSummary;
  const frontendSource = source as StockDecisionSummary;

  const bottomLine = frontendSource.bottomLine ?? backendSource.bottom_line;
  const whoItMightFit = frontendSource.whoItMightFit ?? backendSource.who_it_might_fit;
  const whoItMightNotFit = frontendSource.whoItMightNotFit ?? backendSource.who_it_might_not_fit;
  const nextStep = frontendSource.nextStep ?? backendSource.next_step;
  const timeHorizon = frontendSource.timeHorizon ?? backendSource.time_horizon;

  if (!bottomLine && !whoItMightFit?.length && !whoItMightNotFit?.length && !nextStep && !timeHorizon) return undefined;

  return {
    bottomLine,
    whoItMightFit,
    whoItMightNotFit,
    nextStep,
    timeHorizon,
  };
}

function isDecisionSourceMeta(source: unknown): source is BackendStockDecisionSourceMeta {
  return Boolean(source && !Array.isArray(source) && typeof source === "object");
}

function normalizeDecisionSourceMeta(source?: BackendStockDecisionSourceMeta | StockDecisionSourceMeta): StockDecisionSourceMeta | undefined {
  if (!source) return undefined;
  const backendSource = source as BackendStockDecisionSourceMeta;
  const frontendSource = source as StockDecisionSourceMeta;

  return {
    source: source.source,
    status: normalizeSourceStatus(source.status),
    market: source.market,
    currency: source.currency,
    changeBasis: frontendSource.changeBasis ?? backendSource.change_basis,
    asOf: frontendSource.asOf ?? backendSource.as_of,
    freshnessMinutes: frontendSource.freshnessMinutes ?? backendSource.freshness_minutes,
    freshnessBand: frontendSource.freshnessBand ?? backendSource.freshness_band,
    freshnessRisk: frontendSource.freshnessRisk ?? backendSource.freshness_risk,
    marketCap: frontendSource.marketCap ?? backendSource.market_cap,
    volumeProxy: frontendSource.volumeProxy ?? backendSource.volume_proxy,
    ticker: source.ticker,
    name: source.name,
    description: source.description,
  };
}

function normalizeMarketAsset(asset: BackendMarketAsset): MarketIndex {
  return {
    ticker: asset.ticker,
    name: asset.name,
    value: asset.value ?? (asset.category === "index" ? asset.price.toLocaleString("en-US") : `$${asset.price.toLocaleString("en-US")}`),
    change: asset.change,
    source: asset.source,
    sourceStatus: normalizeSourceStatus(asset.sourceStatus ?? asset.source_status ?? asset.status),
    asOf: asset.asOf ?? asset.as_of,
  };
}

function normalizeMarketTableRow(row: BackendMarketTableRow): MarketTableRow {
  const ticker = stringValue(row.ticker ?? row.symbol) ?? "UNKNOWN";
  const price = numberValue(row.price ?? row.lastPrice ?? row.last);
  const change1h = numberValue(row.change1h ?? row.change_1h);
  const change24h = numberValue(row.change24h ?? row.change_24h);
  const change7d = numberValue(row.change7d ?? row.change_7d);
  const marketCapValue = numberValue(row.marketCapValue ?? row.market_cap_value ?? row.marketCap ?? row.market_cap, undefined);
  const volume24hValue = numberValue(row.volume24hValue ?? row.volume_24h_value ?? row.volume24h ?? row.volume_24h, undefined);
  const circulatingSupplyValue = numberValue(
    row.circulatingSupplyValue ?? row.circulating_supply_value ?? row.circulatingSupply ?? row.circulating_supply,
    undefined,
  );
  const sparkline7d = normalizeSparkline(row.sparkline7d ?? row.sparkline_7d ?? row.sparkline);

  return {
    ticker,
    name: stringValue(row.name) ?? ticker,
    price,
    change1h,
    change24h,
    change7d,
    marketCap: stringifyMoney(row.marketCap ?? row.market_cap, marketCapValue),
    volume24h: stringifyMoney(row.volume24h ?? row.volume_24h, volume24hValue),
    circulatingSupply: stringifySupply(row.circulatingSupply ?? row.circulating_supply, circulatingSupplyValue),
    marketCapValue,
    volume24hValue,
    circulatingSupplyValue,
    sparkline7d,
    source: stringValue(row.source),
    sourceStatus: normalizeSourceStatus(stringValue(row.sourceStatus ?? row.source_status ?? row.status)),
    asOf: stringValue(row.asOf ?? row.as_of),
    market: stringValue(row.market),
    currency: stringValue(row.currency),
    sector: stringValue(row.sector),
    isin: stringValue(row.isin),
    listingCategory: stringValue(row.listingCategory ?? row.listing_category),
    stockType: stringValue(row.stockType ?? row.stock_type),
    openinfoId: stringValue(row.openinfoId ?? row.openinfo_id),
    volumePeriod: stringValue(row.volumePeriod ?? row.volume_period),
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

function normalizeNewsItem(item: BackendNewsItem): NewsItem {
  return {
    id: item.id,
    title: item.title,
    source: item.source,
    category: categoryLabels[item.category] ?? item.category ?? "США",
    time: item.time ?? relativeTime(item.published_at),
    url: item.url ?? "",
    summary: item.summary ?? "",
    related: item.related ?? "",
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
    sourceStatus: normalizeSourceStatus(rate.sourceStatus ?? rate.source_status ?? rate.status),
  };
}

function normalizeMacroMetric(metric: BackendMacroMetric): MacroMetric {
  const label = metric.label ?? metric.name ?? metric.key ?? metric.id ?? "Macro";
  const rawValue =
    typeof metric.value === "number"
      ? metric.value.toLocaleString("ru-RU", { maximumFractionDigits: 2 })
      : typeof metric.value === "string"
        ? metric.value
        : metric.value && typeof metric.value === "object"
          ? Object.entries(metric.value as Record<string, unknown>)
              .map(([key, value]) => `${key}: ${String(value)}`)
              .join(" · ")
          : "N/A";
  const stringValue = rawValue === "N/A" || !metric.unit ? rawValue : `${rawValue} ${metric.unit}`;

  return {
    key: metric.key ?? metric.id ?? label,
    label,
    value: stringValue,
    change: metric.change,
    unit: metric.unit,
    asOf: metric.asOf ?? metric.as_of,
    source: metric.source,
    sourceStatus: normalizeSourceStatus(metric.sourceStatus ?? metric.source_status ?? metric.status),
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
      sourceStatus: normalizeSourceStatus(indicator.sourceStatus ?? indicator.source_status ?? indicator.status ?? macro.status),
    }),
  );
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

function normalizeSparkline(raw: number[] | string | undefined) {
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

  return [];
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

function stringifyMoney(display: unknown, fallbackValue: number | undefined) {
  if (typeof display === "string" && display.trim()) return display;
  if (typeof display === "number" && Number.isFinite(display)) return formatCompactMoney(display);
  if (typeof fallbackValue === "number" && Number.isFinite(fallbackValue)) return formatCompactMoney(fallbackValue);
  return "N/A";
}

function stringifySupply(display: unknown, fallbackValue: number | undefined) {
  if (typeof display === "string" && display.trim()) return display;
  if (typeof display === "number" && Number.isFinite(display)) return formatCompactSupply(display);
  if (typeof fallbackValue === "number" && Number.isFinite(fallbackValue)) return formatCompactSupply(fallbackValue);
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

export async function getStocks(): Promise<Stock[]> {
  const data = await fetchJson<BackendStock[]>("/stocks");
  if (!data?.length) return [];
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
    return {
      indexes: [],
      stocks: [],
      marketTable: [],
      news: [],
      sources: [],
      fxRates: [],
      macro: [],
    };
  }

  return {
    indexes: data.market?.length ? data.market.map(normalizeMarketAsset) : [],
    stocks: data.stocks?.length ? data.stocks.map(normalizeStock) : [],
    marketTable: (fetchMarketTableSource(data) ?? []).map(normalizeMarketTableRow),
    news: data.news?.length ? data.news.map(normalizeNewsItem) : [],
    sources: data.sources?.length ? data.sources.map(normalizeSource) : [],
    fxRates: ((data.fxRates?.length ? data.fxRates : data.fx_rates) ?? []).map(normalizeFxRate),
    macro: normalizeMacroBlock(data.macro),
  };
}

export async function getMarket(): Promise<MarketIndex[]> {
  const data = await fetchJson<BackendMarketAsset[]>("/market");
  if (!data?.length) return [];
  return data.map(normalizeMarketAsset);
}

export async function getSources(): Promise<MarketDataSource[]> {
  const data = await fetchJson<BackendSource[]>("/sources");
  if (!data?.length) return [];

  return data.map(normalizeSource);
}

export async function getStock(ticker: string): Promise<Stock | undefined> {
  const encodedTicker = encodeURIComponent(ticker);
  const data = await fetchJson<BackendStock>(`/stock/${encodedTicker}`);

  if (data) {
    const isLocal = data.market === "uzbekistan" || data.currency === "UZS" || (data.source ?? "").toLowerCase().includes("stockscope");
    if (isLocal) {
      return normalizeStock({
        ...data,
        source_meta: [
          {
            source: data.source,
            status: data.source_status,
            as_of: data.as_of,
            detail: data.isin ? `${data.name} · ${data.isin}` : data.name,
            market: "Uzbekistan",
            notes: [data.listing_category ?? data.listingCategory, data.stock_type ?? data.stockType].filter(Boolean).join(" · ") || undefined,
          },
        ],
      });
    }

    const [fundamentals, earnings, news] = await Promise.all([
      fetchJson<BackendFundamentalsResponse>(`/fundamentals/${encodedTicker}`),
      fetchJson<BackendEarningsResponse>(`/earnings/${encodedTicker}`),
      fetchJson<BackendNewsItem[]>(`/news?symbol=${encodedTicker}`),
    ]);

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
  return undefined;
}

export async function getStockScopeScreener(params: Record<string, string | number | undefined> = {}): Promise<StockScopeScreenerResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && String(value).trim()) query.set(key, String(value));
  });
  const suffix = query.size ? `?${query.toString()}` : "";
  const data = await fetchJson<BackendStockScopeScreenerResponse>(`/api/stockscope/screener${suffix}`);
  const items = (data?.items ?? []).map(normalizeStockScopeScreenerRow);

  return {
    total: data?.total ?? items.length,
    offset: data?.offset ?? 0,
    limit: data?.limit ?? items.length,
    count: data?.count ?? items.length,
    hasMore: Boolean(data?.has_more),
    sortBy: data?.sort_by ?? "reports_count",
    sortDir: data?.sort_dir ?? "desc",
    coverage: data?.coverage
      ? {
          total: data.coverage.total,
          withReports: data.coverage.with_reports,
          withIndicators: data.coverage.with_indicators,
          withDividends: data.coverage.with_dividends,
          withPriceHistory: data.coverage.with_price_history,
        }
      : undefined,
    items,
  };
}

export async function getStockScopeBatchDetails(tickers: string[]): Promise<StockScopeBatchDetails> {
  const normalized = [...new Set(tickers.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))].slice(0, 6);
  if (!normalized.length) {
    return { total: 0, offset: 0, limit: 0, count: 0, hasMore: false, tickers: [], items: [] };
  }

  const data = await fetchJson<BackendStockScopeBatchDetails>(
    `/api/stockscope/details?tickers=${encodeURIComponent(normalized.join(","))}&limit=${normalized.length}`,
  );
  const items = (data?.items ?? []).map((item) => normalizeStockScopeDetails(item)).filter(Boolean) as StockScopeDetails[];
  return {
    total: data?.total ?? normalized.length,
    offset: data?.offset ?? 0,
    limit: data?.limit ?? normalized.length,
    count: data?.count ?? items.length,
    hasMore: Boolean(data?.has_more),
    tickers: data?.tickers ?? normalized,
    items,
  };
}

function normalizeStockScopeScreenerRow(row: BackendStockScopeScreenerRow): StockScopeScreenerRow {
  return {
    ticker: row.ticker ?? "UNKNOWN",
    name: row.name ?? row.ticker ?? "Unknown company",
    isin: row.isin,
    openinfoId: row.openinfoId ?? row.openinfo_id,
    listingCategory: row.listingCategory ?? row.listing_category,
    sector: row.sector,
    market: row.market,
    currency: row.currency,
    currentPrice: row.current_price,
    marketCap: row.market_cap,
    volume1d: row.volume1d ?? row.volume_1d,
    volume7d: row.volume7d ?? row.volume_7d,
    volume30d: row.volume30d ?? row.volume_30d,
    change1d: row.change1d ?? row.change_1d,
    change7d: row.change7d ?? row.change_7d,
    change30d: row.change30d ?? row.change_30d,
    pricePointsCount: row.price_points_count ?? 0,
    reportsCount: row.reports_count ?? 0,
    indicatorsCount: row.indicators_count ?? 0,
    dividendsCount: row.dividends_count ?? 0,
    latestPeriod: row.latest_period,
    roe: row.roe,
    roa: row.roa,
    pe: row.pe,
    pb: row.pb,
    dividendYield: row.dividend_yield,
    hasFreshReport: row.hasFreshReport ?? row.has_fresh_report,
    sourceName: row.sourceName ?? row.source_name,
    sourceUrl: row.sourceUrl ?? row.source_url,
    fetchedAt: row.fetchedAt ?? row.fetched_at,
  };
}

export async function getNews(): Promise<NewsItem[]> {
  const data = await fetchJson<BackendNewsItem[]>("/news");
  if (!data?.length) return [];
  return data.map(normalizeNewsItem);
}
