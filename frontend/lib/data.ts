export type MarketIndex = {
  name: string;
  ticker: string;
  value: string;
  change: number;
  source?: string;
  sourceStatus?: LiveSourceStatus;
  asOf?: string;
};

export type Stock = {
  ticker: string;
  name: string;
  price: number;
  change: number;
  marketCap: string;
  pe: number;
  dividend: string;
  sector: string;
  description: string;
  source?: string;
  sourceStatus?: LiveSourceStatus;
  asOf?: string;
  currency?: "USD" | "UZS" | string;
  market?: string;
  isin?: string;
  listingCategory?: string;
  stockType?: string;
  openinfoId?: number | string;
  website?: string;
  insight?: StockInsight;
  riskFactors?: StockRiskFactor[];
  decisionSummary?: StockDecisionSummary;
  sourceMeta?: StockDecisionSourceMeta;
  stockscope?: StockScopeDetails;
  fundamentals?: StockFundamentals;
  earnings?: StockEarningPoint[];
  news?: NewsItem[];
  sources?: StockSourceMeta[];
};

export type StockScopeSeries = {
  name: string;
  data: Array<number | string | null> | Array<[string | number, number | null]>;
};

export type StockScopeChart = {
  title?: string;
  categories?: string[];
  series?: StockScopeSeries[];
};

export type StockScopeIndicatorPeriod = {
  period?: string;
  type?: string;
  date?: string;
  values?: Record<string, number | null>;
};

export type StockScopeFinancialRow = {
  id: string;
  label: string;
  values: Array<{ period?: string; date?: string; value?: number | null }>;
};

export type StockScopeFinancialTable = {
  periods?: Array<{ period?: string; type?: string; date?: string }>;
  rows?: StockScopeFinancialRow[];
};

export type StockScopeDetails = {
  ticker?: string;
  source?: string;
  sourceUrl?: string;
  companyType?: string;
  priceHistory?: {
    points?: Array<{ date: string; value?: number | null }>;
    lastUpdateAt?: string;
    raw?: Record<string, unknown>;
  };
  fundamentals?: {
    reports?: StockScopeReport[];
    earnings?: StockScopeFinancialTable;
    balanceSheet?: StockScopeFinancialTable;
    raw?: unknown[];
  };
  indicators?: StockScopeIndicatorPeriod[];
  tradingStats?: {
    daily?: StockScopeTradingRow[];
    monthly?: StockScopeTradingRow[];
    yearly?: StockScopeTradingRow[];
  };
  reports?: StockScopeReport[];
  dividends?: StockScopeDividend[];
  charts?: Record<string, StockScopeChart>;
};

export type StockScopeTradingRow = {
  date: string;
  price?: number | null;
  volumeUzs?: number | null;
  volumePcs?: number | null;
};

export type StockScopeReport = {
  id?: string;
  period?: string;
  type?: string;
  companyType?: string;
  companyId?: number | string;
  companyName?: string;
  date?: string;
  url?: string;
};

export type StockScopeDividend = {
  id?: number | string;
  companyId?: number | string;
  companyName?: string;
  approvedDate?: string;
  publishedDate?: string;
  scrapedAt?: string;
  commonDividend?: number | null;
  preferredDividend?: number | null;
  commonYield?: number | null;
  preferredYield?: number | null;
};

export type StockScopeScreenerRow = {
  ticker: string;
  name: string;
  isin?: string;
  openinfoId?: number | string;
  listingCategory?: string;
  sector?: string;
  market?: string;
  currency?: string;
  currentPrice?: number | null;
  marketCap?: number | null;
  volume1d?: number | null;
  volume7d?: number | null;
  volume30d?: number | null;
  change1d?: number | null;
  change7d?: number | null;
  change30d?: number | null;
  pricePointsCount: number;
  reportsCount: number;
  indicatorsCount: number;
  dividendsCount: number;
  latestPeriod?: string;
  roe?: number | null;
  roa?: number | null;
  pe?: number | null;
  pb?: number | null;
  dividendYield?: number | null;
  hasFreshReport?: boolean;
  sourceName?: string;
  sourceUrl?: string;
  fetchedAt?: string;
};

export type StockScopeScreenerResponse = {
  total: number;
  offset: number;
  limit: number;
  count: number;
  hasMore: boolean;
  sortBy: string;
  sortDir: "asc" | "desc" | string;
  coverage?: {
    total?: number | null;
    withReports?: number | null;
    withIndicators?: number | null;
    withDividends?: number | null;
    withPriceHistory?: number | null;
  };
  items: StockScopeScreenerRow[];
};

export type StockScopeBatchDetails = {
  total: number;
  offset: number;
  limit: number;
  count: number;
  hasMore: boolean;
  tickers: string[];
  items: StockScopeDetails[];
};

export type StockInsight = {
  headline?: string;
  summary?: string;
  signals?: string[];
  freshness?: {
    label?: string;
    minutes?: number;
  };
  liquidityProxy?: string;
  orientation?: string;
};

export type StockRiskFactor = {
  code?: string;
  label: string;
  severity?: "low" | "medium" | "high" | string;
  detail?: string;
};

export type StockDecisionSummary = {
  bottomLine?: string;
  whoItMightFit?: string[];
  whoItMightNotFit?: string[];
  nextStep?: string;
  timeHorizon?: string;
};

export type StockDecisionSourceMeta = {
  source?: string;
  status?: LiveSourceStatus | string;
  market?: string;
  currency?: string;
  changeBasis?: string;
  asOf?: string;
  freshnessMinutes?: number;
  freshnessBand?: string;
  freshnessRisk?: string;
  marketCap?: string;
  volumeProxy?: number;
  ticker?: string;
  name?: string;
  description?: string;
};

export type MarketTableRow = {
  ticker: string;
  name: string;
  price?: number;
  change1h?: number;
  change24h?: number;
  change7d?: number;
  marketCap: string;
  volume24h: string;
  circulatingSupply: string;
  marketCapValue?: number;
  volume24hValue?: number;
  circulatingSupplyValue?: number;
  sparkline7d: number[];
  source?: string;
  sourceStatus?: LiveSourceStatus;
  asOf?: string;
  market?: string;
  currency?: "USD" | "UZS" | string;
  sector?: string;
  isin?: string;
  listingCategory?: string;
  stockType?: string;
  openinfoId?: number | string;
  volumePeriod?: string;
};

export type LiveSourceStatus = "live" | "delayed" | "stale" | "offline" | "fallback" | "needs_license";

export type StockFundamentals = {
  marketCap?: string;
  pe?: number;
  eps?: number;
  revenueGrowth?: string;
  grossMargin?: string;
  operatingMargin?: string;
  debtToEquity?: string;
  beta?: number;
  dividendYield?: string;
  asOf?: string;
  source?: string;
  sourceStatus?: LiveSourceStatus;
};

export type StockEarningPoint = {
  period: string;
  epsActual?: number;
  epsEstimate?: number;
  revenueActual?: string;
  revenueEstimate?: string;
  surprisePercent?: number;
  asOf?: string;
  source?: string;
  sourceStatus?: LiveSourceStatus;
};

export type StockSourceMeta = {
  source: string;
  status?: LiveSourceStatus;
  asOf?: string;
  detail?: string;
  notes?: string;
  market?: string;
};

export type FxRate = {
  pair: string;
  base?: string;
  quote?: string;
  rate: number;
  change?: number;
  asOf?: string;
  source?: string;
  sourceStatus?: LiveSourceStatus;
  nominal?: number;
};

export type MacroMetric = {
  key: string;
  label: string;
  value: string;
  change?: number;
  unit?: string;
  asOf?: string;
  source?: string;
  sourceStatus?: LiveSourceStatus;
};

export type MarketDataSource = {
  id: string;
  name: string;
  status: LiveSourceStatus;
  market?: string;
  coverage?: string;
  updateMode?: string;
  url?: string;
  notes?: string;
  assetClasses?: string[];
  latencyMs?: number;
  lastUpdate?: string;
  detail?: string;
};

export type NewsItem = {
  id: number;
  title: string;
  source: string;
  category: string;
  time: string;
  url?: string;
  summary?: string;
  related?: string;
};

export const indexes: MarketIndex[] = [
  { name: "S&P 500", ticker: "SPX", value: "7 380.00", change: -0.4 },
  { name: "Nasdaq", ticker: "IXIC", value: "25 680.00", change: -0.5 },
  { name: "Dow Jones", ticker: "DJI", value: "51 690.00", change: -0.2 },
  { name: "Bitcoin", ticker: "BTC", value: "$62 200", change: -0.6 },
  { name: "Gold", ticker: "XAU", value: "$4 145", change: 0.1 },
  { name: "Oil", ticker: "WTI", value: "$73.00", change: -0.2 },
];

export const stocks: Stock[] = [
  {
    ticker: "AAPL",
    name: "Apple",
    price: 298,
    change: 0.4,
    marketCap: "$3.2T",
    pe: 33.1,
    dividend: "0.45%",
    sector: "Technology",
    description:
      "Apple designs consumer devices, software, services, and an expanding ecosystem around iPhone, Mac, iPad, wearables, and subscriptions.",
  },
  {
    ticker: "NVDA",
    name: "Nvidia",
    price: 201,
    change: -1.2,
    marketCap: "$3.5T",
    pe: 52.7,
    dividend: "0.03%",
    sector: "Semiconductors",
    description:
      "Nvidia builds GPUs, AI accelerators, networking products, and software platforms used in data centers, gaming, professional visualization, and automotive markets.",
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    price: 373,
    change: -0.6,
    marketCap: "$3.4T",
    pe: 36.8,
    dividend: "0.71%",
    sector: "Software",
    description:
      "Microsoft provides cloud infrastructure, productivity software, operating systems, business applications, gaming, and AI services.",
  },
  {
    ticker: "TSLA",
    name: "Tesla",
    price: 383,
    change: -1.4,
    marketCap: "$1.0T",
    pe: 84.2,
    dividend: "0%",
    sector: "Automotive",
    description:
      "Tesla makes electric vehicles, energy storage systems, solar products, charging infrastructure, and autonomous driving software.",
  },
  {
    ticker: "AMZN",
    name: "Amazon",
    price: 234,
    change: -0.5,
    marketCap: "$2.1T",
    pe: 42.5,
    dividend: "0%",
    sector: "E-commerce",
    description:
      "Amazon operates online retail marketplaces, logistics, advertising, subscriptions, devices, and AWS cloud infrastructure.",
  },
  {
    ticker: "META",
    name: "Meta",
    price: 563,
    change: -0.8,
    marketCap: "$1.5T",
    pe: 29.4,
    dividend: "0.32%",
    sector: "Social Platforms",
    description:
      "Meta operates Facebook, Instagram, WhatsApp, Messenger, advertising tools, AI products, and Reality Labs initiatives.",
  },
];

export const news: NewsItem[] = [
  { id: 1, title: "Nvidia expands AI server partnerships across cloud providers", source: "Market Watch", category: "Технологии", time: "12 мин" },
  { id: 2, title: "US indexes edge higher as investors watch inflation data", source: "Reuters", category: "США", time: "38 мин" },
  { id: 3, title: "Spot Bitcoin ETF inflows recover after volatile week", source: "CoinDesk", category: "Крипта", time: "1 ч" },
  { id: 4, title: "Dividend ETF demand rises among long-term investors", source: "ETF.com", category: "ETF", time: "2 ч" },
];

export type AcademyLesson = {
  level: "Beginner" | "Intermediate" | "Advanced";
  title: string;
  duration: string;
  progress: number;
  source: string;
  summary: string;
  outcomes: string[];
  practice: string;
};

export const lessons: AcademyLesson[] = [
  {
    level: "Beginner",
    title: "Акции, ETF и дивиденды: база инвестора",
    duration: "22 мин",
    progress: 72,
    source: "Литература сайта",
    summary:
      "Короткий стартовый блок о том, чем акция отличается от ETF, как инвестор получает дивиденды и почему доходность всегда связана с риском.",
    outcomes: ["Понимать роль акции как доли в бизнесе", "Отличать ETF от отдельной компании", "Связывать дивиденды с денежным потоком и устойчивостью бизнеса"],
    practice: "Выберите Apple, Microsoft или Nvidia и опишите, какой источник доходности для вас важнее: рост цены или дивиденды.",
  },
  {
    level: "Beginner",
    title: "Что такое отрасль и рынок",
    duration: "28 мин",
    progress: 38,
    source: "Lecture 1.pdf",
    summary:
      "Лекция объясняет разницу между отраслью и рынком: рынок объединяется спросом, а отрасль определяется активами, технологиями и ресурсами компаний.",
    outcomes: ["Дать определение отрасли и рынка", "Определять продуктовые и географические границы", "Понимать, зачем инвестору смотреть на отрасль до выбора акции"],
    practice: "Опишите рынок электромобилей: какие продукты взаимозаменяемы, где проходят географические границы и какие компании входят в отрасль.",
  },
  {
    level: "Beginner",
    title: "Типы отраслей и бизнес-моделей",
    duration: "24 мин",
    progress: 0,
    source: "Lecture 1.pdf",
    summary:
      "Разбор первичного, вторичного, третичного и четвертичного секторов, цикличных и нецикличных отраслей, а также B2C, B2B, B2G, C2C и C2B моделей.",
    outcomes: ["Классифицировать отрасль по сектору экономики", "Отличать цикличные отрасли от защитных", "Определять бизнес-модель компании"],
    practice: "Классифицируйте Amazon, Tesla и Meta по сектору, цикличности и бизнес-модели.",
  },
  {
    level: "Intermediate",
    title: "Барьеры входа и выхода",
    duration: "32 мин",
    progress: 15,
    source: "Lecture 2.pdf",
    summary:
      "Барьеры показывают, насколько новым игрокам сложно войти в рынок, а существующим компаниям - сохранить прибыльность и рыночную власть.",
    outcomes: ["Различать экономические, административные и стратегические барьеры", "Оценивать эффект масштаба, бренд, доступ к каналам и лицензирование", "Связывать барьеры с устойчивостью маржи"],
    practice: "Составьте список барьеров входа для полупроводниковой отрасли Nvidia и отметьте, какие из них защищают прибыль.",
  },
  {
    level: "Intermediate",
    title: "Модели рынка и конкуренция",
    duration: "30 мин",
    progress: 0,
    source: "Lecture 2.pdf",
    summary:
      "Рынки можно описывать через число игроков, доли, дифференциацию продукта, рыночную власть и барьеры: от совершенной конкуренции до монополии.",
    outcomes: ["Определять модель рынка: competition, imperfect competition, oligopoly, monopoly", "Понимать связь рыночной власти и маржинальности", "Использовать ROE, ROA, ROCE и маржи для сравнения игроков"],
    practice: "Выберите отрасль cloud infrastructure и определите, ближе она к олигополии или монополистической конкуренции.",
  },
  {
    level: "Intermediate",
    title: "Практический шаблон industry overview",
    duration: "26 мин",
    progress: 0,
    source: "Applied industry analysis part 1.pdf",
    summary:
      "Практический чеклист для первой части отраслевого анализа: обзор отрасли, вклад в GDP, CAGR, структура активов, источники финансирования, маржи и ключевые игроки.",
    outcomes: ["Собирать industry overview в формате инвест-аналитика", "Искать данные за 2-3 года", "Сравнивать компании по выручке, активам, EBITDA margin, ROE, ROA, ROCE и Debt/EBITDA"],
    practice: "Соберите мини-таблицу по трем компаниям из одной отрасли: revenue, gross margin, EBITDA margin, ROE и market share.",
  },
  {
    level: "Advanced",
    title: "Value chain и источники преимущества",
    duration: "34 мин",
    progress: 0,
    source: "03 Value chain.pdf",
    summary:
      "Value chain разбивает бизнес на primary и support activities, чтобы найти драйверы затрат, дифференциацию и синергии, создающие большую ценность для клиента.",
    outcomes: ["Строить цепочку ценности компании", "Искать cost drivers и linked activities", "Отличать бренд, масштаб, IP, network effect, loyalty и locked-up supply как источники преимущества"],
    practice: "Постройте value chain для Tesla или Amazon и отметьте, где возникает основная экономическая ценность.",
  },
  {
    level: "Advanced",
    title: "Жизненный цикл отрасли и инвестиционная активность",
    duration: "31 мин",
    progress: 0,
    source: "03 Value chain.pdf",
    summary:
      "Отрасль проходит стадии embryonic, growth, shakeout, mature и decline. На каждой стадии меняются спрос, цены, конкуренция, инвестиции и риск.",
    outcomes: ["Определять стадию жизненного цикла отрасли", "Связывать стадию с ростом спроса, ценами и прибыльностью", "Оценивать инвестиционную, инновационную и финансовую активность компаний"],
    practice: "Определите стадию жизненного цикла для AI chips, streaming или e-commerce и объясните, какие риски это создает для инвестора.",
  },
  {
    level: "Advanced",
    title: "Риск-менеджмент через отраслевой анализ",
    duration: "27 мин",
    progress: 0,
    source: "Лекции + литература сайта",
    summary:
      "Финальный блок соединяет базовый риск-менеджмент сайта с отраслевым анализом: инвестор оценивает цикличность, конкуренцию, долговую нагрузку и концентрацию портфеля.",
    outcomes: ["Видеть отраслевые риски до покупки акции", "Связывать Debt/EBITDA и EBIT/interest с финансовой устойчивостью", "Не путать сильную компанию с безопасной ценой покупки"],
    practice: "Сравните Nvidia и Apple: у какой компании выше отраслевой риск, а у какой выше риск оценки?",
  },
];

export const positions = [
  { ticker: "NVDA", quantity: 4, buyPrice: 126.3 },
  { ticker: "MSFT", quantity: 3, buyPrice: 431.1 },
  { ticker: "AAPL", quantity: 5, buyPrice: 203.7 },
];

export function getStock(ticker: string) {
  return stocks.find((stock) => stock.ticker.toLowerCase() === ticker.toLowerCase());
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}
