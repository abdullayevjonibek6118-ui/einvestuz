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
  fundamentals?: StockFundamentals;
  earnings?: StockEarningPoint[];
  news?: NewsItem[];
  sources?: StockSourceMeta[];
};

export type MarketTableRow = {
  ticker: string;
  name: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
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
  category: "США" | "Технологии" | "ETF" | "Крипта";
  time: string;
};

export const indexes: MarketIndex[] = [
  { name: "S&P 500", ticker: "SPX", value: "6 112.34", change: 0.42 },
  { name: "Nasdaq", ticker: "IXIC", value: "19 841.20", change: 0.77 },
  { name: "Dow Jones", ticker: "DJI", value: "43 226.11", change: -0.18 },
  { name: "Bitcoin", ticker: "BTC", value: "$103 420", change: 1.64 },
  { name: "Gold", ticker: "XAU", value: "$3 318", change: -0.31 },
  { name: "Oil", ticker: "WTI", value: "$71.90", change: 0.25 },
];

export const stocks: Stock[] = [
  {
    ticker: "AAPL",
    name: "Apple",
    price: 214.32,
    change: 0.84,
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
    price: 142.67,
    change: 2.18,
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
    price: 467.81,
    change: 0.51,
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
    price: 331.45,
    change: -1.34,
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
    price: 196.88,
    change: -0.29,
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
    price: 612.24,
    change: 1.12,
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
