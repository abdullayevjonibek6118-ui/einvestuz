import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  Newspaper,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { TickerSearch } from "@/components/ticker-search";
import { getDashboardData } from "@/lib/api";
import { type FxRate, type MarketTableRow, type NewsItem } from "@/lib/data";

const quickSearches = ["UZMT", "AGBA", "RBQB", "HMKB", "NVDA", "AAPL"];
const aiQuestions = [
  "Что происходит с этим тикером?",
  "Какой здесь главный риск?",
  "Стоит ли сравнить с peer names?",
];

export default async function Home() {
  const { indexes, marketTable, news, fxRates, macro } = await getDashboardData();
  const usdUzs = resolveUsdUzsRate(fxRates);
  const marketRows = marketTable.length ? marketTable : [];
  const focusRow = pickFocusRow(marketRows);
  const previewRows = pickPreviewRows(marketRows);
  const snapshotItems = buildSnapshotItems(indexes, fxRates, marketRows, usdUzs);
  const topNews = normalizeNews(news);
  const macroItems = macro.length ? macro.slice(0, 4) : fallbackMacro();

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#0f172a]">
      <a href="#main-content" className="skip-link">
        Перейти к содержанию
      </a>

      <header className="surface-dark border-b border-[#182233] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-3 font-semibold">
            <span className="grid size-10 place-items-center rounded-2xl bg-[#6ea8fe] text-[#08111f]">
              <Sparkles size={18} />
            </span>
            <span>
              Einvestuz
              <span className="block text-xs font-medium text-[#93a4ba]">market entry</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 text-xs font-semibold text-[#c7d2e0] sm:flex">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Search → insight → risk → sources</span>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:bg-white/10">
              Market desk
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <section id="main-content" className="border-b border-[#dbe4ef] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="surface-band reveal rounded-[18px] border border-[#dbe4ef] p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1e40af]">Market entry</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-[#0f172a] sm:text-5xl">
                Быстрый вход в рынок Узбекистана, а потом сразу в решение по акции.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475569] sm:text-base">
                Наберите тикер, откройте карточку компании, проверьте риск и источники, затем сравните с соседями или задайте AI вопрос без длинного лендинга.
              </p>

              <div className="mt-5 max-w-2xl">
                <TickerSearch className="reveal-delay-1" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickSearches.map((item) => (
                  <Link
                    key={item}
                    href={`/stocks/${encodeURIComponent(item)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ef] bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-[#334155] transition hover:border-[#c7d2fe] hover:bg-[#eef2ff] hover:text-[#1e40af]"
                  >
                    <SearchHint>{item}</SearchHint>
                  </Link>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <StatBlock label="Market table" value={`${marketRows.length.toLocaleString("ru-RU")} rows`} detail="quotes, volume, sources" />
                <StatBlock label="USD/UZS" value={usdUzs.toLocaleString("en-US", { maximumFractionDigits: 2 })} detail="FX / conversion anchor" />
                <StatBlock label="Live view" value={indexes.length ? "on desk" : "fallback"} detail="indexes and macro ready" />
              </div>
            </div>

            <div className="reveal reveal-delay-2 rounded-[18px] border border-[#dbe4ef] bg-[#08111f] p-5 text-white shadow-[0_18px_55px_rgba(8,17,31,0.18)] sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93a4ba]">AI verdict</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#93a4ba]">Focus stock</p>
                  <h2 className="mt-1 text-2xl font-semibold">{focusRow?.name ?? "Select a ticker"}</h2>
                  <p className="mt-1 text-sm text-[#c7d2e0]">{focusRow ? `${focusRow.ticker} · ${formatMarketLabel(focusRow)}` : "Search a ticker to open the decision room."}</p>
                </div>
                {focusRow ? <ChangePill value={focusRow.change24h} /> : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93a4ba]">Price block</p>
                  <p className="mt-2 text-3xl font-semibold">{focusRow ? formatRowPrice(focusRow) : "—"}</p>
                  <p className="mt-1 text-sm text-[#c7d2e0]">{focusRow ? `24h ${formatPercent(focusRow.change24h)} · 7d ${formatPercent(focusRow.change7d)}` : "Waiting for market data."}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93a4ba]">Risk fingerprint</p>
                  <p className="mt-2 text-sm leading-6 text-[#e2e8f0]">
                    {focusRow ? buildRiskSummary(focusRow) : "Open a stock to see the risk and evidence chain."}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#1f2a40] bg-[#0f172a] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93a4ba]">Research receipt</p>
                <p className="mt-2 text-sm leading-6 text-[#e2e8f0]">
                  Identity, price, risk and sources stay on one screen. Compare only after the facts are in.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={focusRow ? `/stocks/${encodeURIComponent(focusRow.ticker)}` : "/dashboard"} className="inline-flex items-center gap-2 rounded-full bg-[#6ea8fe] px-3 py-2 text-xs font-semibold text-[#08111f] transition hover:bg-[#8db8ff]">
                    Open stock page
                    <ArrowRight size={14} />
                  </Link>
                  <Link href={focusRow ? `/ai?question=Give%20me%20a%20quick%20thesis%20on%20${encodeURIComponent(focusRow.ticker)}` : "/ai"} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10">
                    Ask AI
                    <Bot size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="ticker-tape reveal reveal-delay-3 mt-4 rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] px-4 py-3">
            <div className="ticker-track gap-3">
              {[...snapshotItems, ...snapshotItems].map((item, index) => (
                <SnapshotChip key={`${item.label}-${index}`} {...item} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dbe4ef]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Top stocks preview"
            title="Короткий просмотр рынка, без лишнего слоя"
            text="Пара кликов ведут к полной карточке актива и потом к сравнению или AI-разбору."
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {previewRows.map((row, index) => (
              <PreviewCard key={`${row.ticker}-${index}`} row={row} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#dbe4ef] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <SectionHeader eyebrow="AI question module" title="Спросите как инвестор, не как маркетинг-лента" text="Короткие вопросы должны вести в решение: buy / hold / watch / risk." />
            <div className="space-y-2">
              {aiQuestions.map((question) => (
                <Link
                  key={question}
                  href={`/ai?question=${encodeURIComponent(question)}`}
                  className="flex min-h-12 items-center justify-between rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] px-4 text-sm font-semibold text-[#0f172a] transition hover:border-[#c7d2fe] hover:bg-[#eef2ff] hover:text-[#1e40af]"
                >
                  <span>{question}</span>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-[#dbe4ef] bg-[#08111f] p-5 text-white shadow-[0_18px_55px_rgba(8,17,31,0.16)]">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#6ea8fe] text-[#08111f]">
                <Bot size={20} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93a4ba]">Insight Card</p>
                <h3 className="text-lg font-semibold">{focusRow ? `${focusRow.ticker}: short thesis` : "Quick thesis"}</h3>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <InsightLine icon={CheckCircle2} title="What matters" text={focusRow ? `${focusRow.name} is a ${formatMarketLabel(focusRow)} asset with ${formatPercent(focusRow.change24h)} in 24h move.` : "Open a stock to see the fastest useful answer."} />
              <InsightLine icon={ShieldAlert} title="Main risk" text={focusRow ? buildRiskSummary(focusRow) : "Risk is hidden until we anchor it to price, sources and sector."} />
              <InsightLine icon={FileText} title="Next step" text={focusRow ? "Open sources, compare peers, then ask AI for a tighter verdict." : "Search a ticker, then move to the decision room."} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dbe4ef]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="News impact" title="Заголовки превращаем в влияние на акции" text="Сначала факт, потом короткий вывод, потом переход в карточку компании." />
          <div className="grid gap-3 lg:grid-cols-3">
            {topNews.map((item) => (
              <article key={item.title} className="rounded-[18px] border border-[#dbe4ef] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                  <Newspaper size={14} />
                  {item.source}
                </div>
                <h3 className="mt-3 min-h-14 text-base font-semibold leading-6 text-[#0f172a]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#475569]">{item.summary}</p>
                <div className="mt-4 rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-3 text-sm font-semibold text-[#92400e]">{item.impact}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Macro overview" title="Фон рынка до выбора акции" text="Курс, индикаторы и макро-факторы должны быть видны рядом с тикером, а не где-то в отдельной глубине." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MacroCard label="USD/UZS" value={usdUzs.toLocaleString("en-US", { maximumFractionDigits: 2 })} detail="conversion anchor" />
          {macroItems.map((item) => (
            <MacroCard key={item.key} label={item.label} value={item.value} detail={item.source ?? "macro"} />
          ))}
        </div>
      </section>

      <footer className="surface-dark border-t border-[#182233] px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-semibold">Einvestuz</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c7d2e0]">
              Search first, then decide. The whole product is built to move from ticker to thesis without wasting the user’s attention.
            </p>
          </div>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#6ea8fe] px-5 text-sm font-semibold text-[#08111f] transition hover:bg-[#8db8ff]">
            Open market desk
            <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
    </main>
  );
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mb-4 max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1e40af]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold leading-tight text-[#0f172a] sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#475569] sm:text-base">{text}</p>
    </div>
  );
}

function PreviewCard({ row }: { row: MarketTableRow }) {
  return (
    <Link href={`/stocks/${encodeURIComponent(row.ticker)}`} className="group rounded-[18px] border border-[#dbe4ef] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#c7d2fe] hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">{formatMarketLabel(row)}</p>
          <h3 className="mt-1 truncate text-lg font-semibold text-[#0f172a]">{row.name}</h3>
          <p className="tabular-data mt-1 text-xs font-semibold text-[#1e40af]">{row.ticker}</p>
        </div>
        <ChangePill value={row.change24h} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <PreviewMetric label="Price" value={formatRowPrice(row)} />
        <PreviewMetric label="Market cap" value={row.marketCap} />
        <PreviewMetric label="Volume" value={row.volume24h} />
        <PreviewMetric label="7d move" value={formatPercent(row.change7d)} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-[#64748b]">{row.sector ?? "sector"} · {row.listingCategory ?? "listing"}</span>
        <ArrowRight size={16} className="text-[#94a3b8] transition group-hover:translate-x-0.5 group-hover:text-[#1e40af]" />
      </div>
    </Link>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <p className="tabular-data mt-1 truncate text-sm font-semibold text-[#0f172a]">{value}</p>
    </div>
  );
}

function SnapshotChip({ label, value, change, tone = "neutral" }: { label: string; value: string; change?: number; tone?: "neutral" | "positive" | "negative" }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-full border border-[#dbe4ef] bg-white px-4 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">{label}</p>
        <p className="tabular-data text-sm font-semibold text-[#0f172a]">{value}</p>
      </div>
      {typeof change === "number" ? <ChangePill value={change} /> : <ToneDot tone={tone} />}
    </div>
  );
}

function ToneDot({ tone }: { tone: "neutral" | "positive" | "negative" }) {
  const styles = tone === "positive" ? "bg-[#16a34a]" : tone === "negative" ? "bg-[#dc2626]" : "bg-[#64748b]";
  return <span className={`size-2 rounded-full ${styles}`} />;
}

function MacroCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[18px] border border-[#dbe4ef] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">{label}</p>
      <p className="tabular-data mt-2 text-xl font-semibold text-[#0f172a]">{value}</p>
      <p className="mt-1 text-xs text-[#64748b]">{detail}</p>
    </div>
  );
}

function StatBlock({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">{label}</p>
      <p className="tabular-data mt-2 text-xl font-semibold text-[#0f172a]">{value}</p>
      <p className="mt-1 text-xs text-[#64748b]">{detail}</p>
    </div>
  );
}

function ChangePill({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fee2e2] text-[#b91c1c]"}`}>
      {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {formatPercent(value)}
    </span>
  );
}

function SearchHint({ children }: { children: string }) {
  return <span className="tabular-data text-xs font-semibold">{children}</span>;
}

function InsightLine({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-[16px] border border-white/10 bg-white/5 p-4">
      <Icon className="mt-0.5 shrink-0 text-[#6ea8fe]" size={18} />
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#c7d2e0]">{text}</p>
      </div>
    </div>
  );
}

function normalizeNews(news: NewsItem[]) {
  const fallback = [
    { title: "UZSE market data updates are visible on the dashboard", source: "Einvestuz", summary: "The first screen already points to the market desk and stock pages.", impact: "Impact: easier entry into local market analysis." },
    { title: "USD/UZS is wired into the market snapshot strip", source: "CBU", summary: "FX now anchors the cross-asset view for price comparison.", impact: "Impact: local and global assets become easier to read." },
    { title: "OpenInfo-style receipts can sit next to company cards", source: "OpenInfo", summary: "Company pages should link facts, filings and the immediate thesis.", impact: "Impact: the source chain becomes part of the decision path." },
  ];

  if (!news.length) return fallback;
  return news.slice(0, 3).map((item) => ({
    title: item.title,
    source: item.source,
    summary: `AI pulls the key takeaway from ${item.category.toLowerCase()} news and links it back to stocks.`,
    impact: `Impact: check the relevant ${item.category.toLowerCase()} names and sector exposure.`,
  }));
}

function pickFocusRow(rows: MarketTableRow[]) {
  if (!rows.length) return undefined;
  return [...rows].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h) || compareMarketCap(b, a))[0];
}

function pickPreviewRows(rows: MarketTableRow[]) {
  return [...rows].sort((a, b) => compareMarketCap(b, a)).slice(0, 4);
}

function buildSnapshotItems(indexes: Array<{ ticker: string; value: string; change: number }>, fxRates: FxRate[], rows: MarketTableRow[], usdUzs: number) {
  const fx = fxRates.find((rate) => rate.pair === "USD/UZS" || rate.base === "USD");
  const liveCount = rows.filter((row) => row.sourceStatus === "live" || row.sourceStatus === "delayed").length;
  return [
    ...indexes.slice(0, 4).map((item) => ({
      label: item.ticker,
      value: item.value,
      change: item.change,
    })),
    {
      label: "USD/UZS",
      value: usdUzs.toLocaleString("en-US", { maximumFractionDigits: 2 }),
      change: fx?.change,
    },
    {
      label: "Live rows",
      value: `${liveCount.toLocaleString("ru-RU")} / ${rows.length.toLocaleString("ru-RU")}`,
      tone: liveCount > 0 ? ("positive" as const) : ("neutral" as const),
    },
  ];
}

function compareMarketCap(a: MarketTableRow, b: MarketTableRow) {
  return resolveComparableMoney(a.marketCapValue ?? parseCompactNumber(a.marketCap)) - resolveComparableMoney(b.marketCapValue ?? parseCompactNumber(b.marketCap));
}

function resolveComparableMoney(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function resolveUsdUzsRate(fxRates: FxRate[]) {
  const usd = fxRates.find((rate) => rate.pair === "USD/UZS" || rate.base === "USD");
  return usd?.rate && Number.isFinite(usd.rate) ? usd.rate : 12000;
}

function formatRowPrice(row: MarketTableRow) {
  if (!row.price || row.price <= 0) return "N/A";
  return isUzseRow(row) ? `UZS ${row.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${row.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function buildRiskSummary(row: MarketTableRow) {
  const direction = row.change24h >= 0 ? "momentum" : "pressure";
  const market = formatMarketLabel(row);
  const sector = row.sector ?? "sector";
  return `${row.name} shows ${direction} in ${market}. Check ${sector.toLowerCase()}, liquidity and the source chain before acting.`;
}

function formatMarketLabel(row: MarketTableRow) {
  return isUzseRow(row) ? "Uzbekistan" : "Global";
}

function isUzseRow(row: MarketTableRow) {
  return (row.source ?? "").toLowerCase().includes("uzse") || row.currency === "UZS" || row.market === "uzbekistan";
}

function parseCompactNumber(value?: string) {
  if (!value) return undefined;
  const cleaned = value.replace(/,/g, "").trim();
  const match = cleaned.match(/(-?\d+(?:\.\d+)?)\s*([KMBTQ])?/i);
  if (!match) return Number(cleaned.replace(/[^\d.-]/g, ""));

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return undefined;
  const suffix = match[2]?.toUpperCase();
  const multiplierMap: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9, T: 1e12, Q: 1e15 };
  return amount * (suffix ? multiplierMap[suffix] ?? 1 : 1);
}

function fallbackMacro() {
  return [
    { key: "inflation", label: "Inflation", value: "monitoring", source: "macro" },
    { key: "rates", label: "Central bank", value: "watchlist", source: "macro" },
    { key: "trade", label: "Trade", value: "export/import", source: "macro" },
  ];
}
