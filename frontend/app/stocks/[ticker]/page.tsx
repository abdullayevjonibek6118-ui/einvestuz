import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Banknote, Bot, ChartNoAxesCombined, FileText, Globe2, Newspaper, Plus, ShieldAlert, Star, TriangleAlert, type LucideIcon } from "lucide-react";
import { ChangeBadge, Metric, PageHeader, Panel, SourceStatusBadge } from "@/components/ui";
import { getDashboardData, getNews, getStock, getStockScopeScreener } from "@/lib/api";
import { type MarketTableRow, type Stock, type StockRiskFactor, type StockScopeChart, type StockScopeIndicatorPeriod, type StockSourceMeta } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const [initialStock, news, dashboardData] = await Promise.all([getStock(ticker), getNews(), getDashboardData()]);
  let stock = initialStock;
  if (!stock) {
    const screener = await getStockScopeScreener({ q: ticker, limit: 1 });
    const row = screener.items.find((item) => item.ticker.toUpperCase() === ticker.toUpperCase());
    if (row) {
      stock = {
        ticker: row.ticker,
        name: row.name,
        price: row.currentPrice ?? 0,
        change: 0,
        marketCap: row.marketCap ? `UZS ${row.marketCap.toLocaleString("ru-RU")}` : "N/A",
        pe: row.pe ?? 0,
        dividend: row.dividendYield == null ? "N/A" : `${row.dividendYield.toFixed(2)}%`,
        sector: "Uzbekistan",
        description: `${row.name} — эмитент рынка Узбекистана. Подробные данные источника временно загружаются.`,
        source: "stockscope.uz",
        sourceStatus: "delayed",
        currency: "UZS",
        market: "uzbekistan",
        isin: row.isin,
        openinfoId: row.openinfoId,
      };
    }
  }
  if (!stock) notFound();

  const fundamentals = resolveFundamentals(stock);
  const earnings = stock.earnings ?? [];
  const sources = stock.sources?.length ? stock.sources : resolveSources(stock);
  const companyNews = stock.news?.length ? stock.news : news.slice(0, 3);
  const peerRows = pickPeers(stock, dashboardData.marketTable);
  const isLocal = stock.market === "uzbekistan" || stock.currency === "UZS" || (stock.source ?? "").toLowerCase().includes("stockscope");
  const riskTone = resolveRiskTone(fundamentals, stock);
  const insight = stock.insight;
  const decision = stock.decisionSummary;
  const riskFactors = stock.riskFactors?.length ? stock.riskFactors : fallbackRiskFactors(stock, fundamentals, riskTone);
  const primaryRisk = riskFactors[0]?.detail ?? buildRiskLine(stock, fundamentals, riskTone);
  const pricingLine = insight?.headline ?? insight?.signals?.[0] ?? buildValuationLine(stock, fundamentals);
  const nextAction = decision?.nextStep ?? "Open documents, compare peers, or ask AI to stress-test the thesis.";

  return (
    <main className="space-y-4">
      <PageHeader
        title={`${stock.name} (${stock.ticker})`}
        subtitle="Decision room: identity, price, risk, sources and peer comparison stay within a few scrolls."
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Identity / price block" action={<SourceStatusBadge source={stock.source} status={stock.sourceStatus} />}>
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#dbe4ef] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">{formatMarketLabel(stock)}</span>
                {stock.market ? <span className="rounded-full border border-[#dbe4ef] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">{stock.market}</span> : null}
                {stock.listingCategory ? <span className="rounded-full border border-[#dbe4ef] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">{stock.listingCategory}</span> : null}
                {stock.stockType ? <span className="rounded-full border border-[#dbe4ef] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">{stock.stockType}</span> : null}
              </div>

              <h1 className="mt-4 text-3xl font-semibold leading-tight text-[#0f172a] sm:text-5xl">{stock.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#475569] sm:text-base">{stock.description}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Metric label="ISIN" value={stock.isin ?? "N/A"} detail={stock.openinfoId ? `OpenInfo ID ${stock.openinfoId}` : undefined} />
                <Metric label="Website" value={stock.website ?? "N/A"} detail={stock.website ? "official site" : "not provided"} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/compare?tickers=${encodeURIComponent([stock.ticker, ...peerRows.slice(0, 2).map((peer) => peer.ticker)].join(","))}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b63f6] px-4 text-sm font-semibold text-white transition hover:bg-[#084fc7]">
                  Compare company
                  <ChartNoAxesCombined size={16} />
                </Link>
                <Link href={`/ai?question=Give%20me%20a%20quick%20thesis%20on%20${encodeURIComponent(stock.ticker)}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dbe4ef] bg-white px-4 text-sm font-semibold text-[#0f172a] transition hover:border-[#c7d2fe] hover:bg-[#eef2ff] hover:text-[#1e40af]">
                  Ask AI
                  <Bot size={16} />
                </Link>
                {stock.website ? (
                  <a href={stock.website} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dbe4ef] bg-[#f8fafc] px-4 text-sm font-semibold text-[#0f172a] transition hover:border-[#bfdbfe] hover:bg-white">
                    Open website
                    <ArrowRight size={16} />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="rounded-[18px] border border-[#dbe4ef] bg-[#08111f] p-5 text-white shadow-[0_18px_55px_rgba(8,17,31,0.16)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93a4ba]">Price block</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-4xl font-semibold">{formatStockPrice(stock)}</p>
                  <p className="mt-1 text-sm text-[#c7d2e0]">
                    {stock.currency ?? "USD"} · {stock.sector}
                  </p>
                </div>
                <ChangeBadge value={stock.change} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <StatPill label="Market cap" value={fundamentals.marketCap ?? stock.marketCap} />
                <StatPill label="P/E" value={formatNumber(fundamentals.pe)} />
                <StatPill label="Dividend" value={fundamentals.dividendYield ?? stock.dividend} />
                <StatPill label="Beta" value={formatNumber(fundamentals.beta)} />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93a4ba]">Research receipt</p>
                <p className="mt-2 text-sm leading-6 text-[#e2e8f0]">
                  Open the source chain, check the risk fingerprint, then compare the stock with peers before you commit to a thesis.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="AI summary" action={<Bot size={18} className="text-[#1e40af]" />}>
          <div className="space-y-3">
            <p className="text-sm leading-6 text-[#334155]">
              {insight?.summary ?? decision?.bottomLine ?? buildAisummary(stock, riskTone)}
            </p>
            <div className="rounded-[16px] border border-[#c7d2fe] bg-[#eef2ff] p-4 text-sm leading-6 text-[#1e40af]">
              Signal: {insight?.orientation ?? buildSignal(stock)}. {decision?.timeHorizon ?? "Use this card as a quick filter, not as a final answer."}
            </div>
            <div className="space-y-2">
              <ThesisLine icon={ChartNoAxesCombined} title="What the market is pricing" text={pricingLine} />
              <ThesisLine icon={TriangleAlert} title="Risk fingerprint" text={primaryRisk} />
              <ThesisLine icon={FileText} title="Next action" text={nextAction} />
            </div>
            {decision?.whoItMightFit?.length || decision?.whoItMightNotFit?.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <DecisionList title="Fits" items={decision.whoItMightFit} />
                <DecisionList title="Doesn't fit" items={decision.whoItMightNotFit} />
              </div>
            ) : null}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <Panel title="Risk fingerprint" action={<ShieldAlert size={18} className={riskTone === "high" ? "text-[#dc2626]" : riskTone === "medium" ? "text-[#d97706]" : "text-[#16a34a]"} />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Market" value={formatMarketLabel(stock)} detail={stock.market ?? "global"} />
            <Metric label="Currency" value={stock.currency ?? "USD"} detail={isLocal ? "local market" : "cross-listed"} />
            <Metric label="Listing" value={stock.listingCategory ?? "N/A"} detail={stock.stockType ?? "instrument"} />
            <Metric label="OpenInfo" value={stock.openinfoId ? String(stock.openinfoId) : "N/A"} detail="document anchor" />
          </div>

          <div className="mt-4 rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              <ShieldAlert size={14} />
              Risk cues
            </div>
            <p className="mt-3 text-sm leading-6 text-[#475569]">{primaryRisk}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {riskFactors.slice(0, 6).map((risk) => (
                <RiskChip key={`${risk.code ?? risk.label}-${risk.severity ?? "na"}`} label={risk.label} value={(risk.severity ?? "check").toUpperCase()} />
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Compare / ask AI" action={<ChartNoAxesCombined size={18} className="text-[#1e40af]" />}>
          <div className="space-y-3">
            <p className="text-sm leading-6 text-[#334155]">
              Peer comparison stays close to the stock so the user can decide quickly, then move to the AI question layer if needed.
            </p>
            <div className="flex flex-wrap gap-2">
                {peerRows.length ? (
                  peerRows.map((peer) => (
                    <Link key={peer.ticker} href={`/stocks/${encodeURIComponent(peer.ticker)}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dbe4ef] bg-white px-3 text-sm font-semibold text-[#0f172a] transition hover:border-[#c7d2fe] hover:bg-[#eef2ff] hover:text-[#1e40af]">
                      {peer.ticker}
                      <span className="text-[11px] text-[#64748b]">{peer.market === "uzbekistan" || peer.currency === "UZS" ? "Uzbekistan" : "Global"}</span>
                    </Link>
                  ))
              ) : (
                <span className="text-sm text-[#64748b]">Peers появятся, когда market table вернет сопоставимые компании.</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link href={`/compare?tickers=${encodeURIComponent([stock.ticker, ...peerRows.slice(0, 2).map((peer) => peer.ticker)].join(","))}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b63f6] px-4 text-sm font-semibold text-white transition hover:bg-[#084fc7]">
                Compare metrics
                <ArrowRight size={16} />
              </Link>
              <Link href={`/ai?question=Stress%20test%20${encodeURIComponent(stock.ticker)}%20for%20risk%20and%20sources`} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dbe4ef] bg-white px-4 text-sm font-semibold text-[#0f172a] transition hover:border-[#c7d2fe] hover:bg-[#eef2ff] hover:text-[#1e40af]">
                Ask AI
                <Bot size={16} />
              </Link>
            </div>
          </div>
        </Panel>
      </section>

      {stock.stockscope ? (
        <section className="grid gap-4">
          <Panel title="StockScope data room" action={<SourceStatusBadge source="stockscope.uz" status="delayed" />}>
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <ChartPanel chart={stock.stockscope.charts?.price} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric label="Reports" value={`${stock.stockscope.reports?.length ?? 0}`} detail="OpenInfo / issuer filings" />
                <Metric label="Price points" value={`${stock.stockscope.priceHistory?.points?.length ?? 0}`} detail={stock.stockscope.priceHistory?.lastUpdateAt ? `updated ${formatStamp(stock.stockscope.priceHistory.lastUpdateAt)}` : "history"} />
                <Metric label="Dividends" value={`${stock.stockscope.dividends?.length ?? 0}`} detail="approved facts" />
                <Metric label="Trading rows" value={`${stock.stockscope.tradingStats?.daily?.length ?? 0}`} detail="daily volume and price" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <ChartPanel chart={stock.stockscope.charts?.earnings} />
              <ChartPanel chart={stock.stockscope.charts?.balance} />
              <ChartPanel chart={stock.stockscope.charts?.indicators} />
              <ChartPanel chart={stock.stockscope.charts?.trading_volume} />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <IndicatorGrid indicators={stock.stockscope.indicators} />
              <StockScopeTables stock={stock} />
            </div>
          </Panel>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Fundamentals" action={<Banknote size={18} className="text-[#1e40af]" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Market cap" value={fundamentals.marketCap ?? "N/A"} detail={fundamentals.asOf ? `as of ${formatStamp(fundamentals.asOf)}` : undefined} />
            <Metric label="P/E" value={formatNumber(fundamentals.pe)} />
            <Metric label="EPS" value={formatNumber(fundamentals.eps)} detail="TTM / reported" />
            <Metric label="Dividend yield" value={fundamentals.dividendYield ?? "N/A"} />
            <Metric label="Gross margin" value={fundamentals.grossMargin ?? "N/A"} />
            <Metric label="Operating margin" value={fundamentals.operatingMargin ?? "N/A"} />
            <Metric label="Debt / equity" value={fundamentals.debtToEquity ?? "N/A"} />
            <Metric label="Beta" value={formatNumber(fundamentals.beta)} />
          </div>
        </Panel>

        <Panel title="News / events" action={<Newspaper size={18} className="text-[#1e40af]" />}>
          <div className="space-y-3">
            {earnings.length ? (
              <div className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                  <ChartNoAxesCombined size={14} />
                  Earnings
                </div>
                <div className="mt-3 space-y-2">
                  {earnings.slice(0, 4).map((item) => (
                    <div key={`${item.period}-${item.asOf ?? "na"}`} className="rounded-2xl border border-white bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-[#667085]">{item.period}</p>
                          <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                            EPS {formatNumber(item.epsActual)} / {formatNumber(item.epsEstimate)}
                          </p>
                        </div>
                        {typeof item.surprisePercent === "number" ? <ChangeBadge value={item.surprisePercent} /> : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                        {item.revenueActual || item.revenueEstimate ? (
                          <span>
                            Revenue {item.revenueActual ?? "N/A"} / {item.revenueEstimate ?? "N/A"}
                          </span>
                        ) : null}
                        {item.asOf ? <span>updated {formatStamp(item.asOf)}</span> : null}
                        <SourceStatusBadge source={item.source} status={item.sourceStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              {companyNews.map((item) => (
                <Link key={item.id} href="/dashboard" className="block rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4 transition hover:border-[#c7d2fe] hover:bg-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                    {item.category} · {item.time}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold leading-6 text-[#0f172a]">{item.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Sources / documents" action={<Globe2 size={18} className="text-[#1e40af]" />}>
          <div className="space-y-2">
            {sources.length ? (
              sources.map((source) => (
                <div key={`${source.source}-${source.asOf ?? "na"}`} className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#0f172a]">{source.source}</p>
                    <SourceStatusBadge source={source.source} status={source.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#64748b]">
                    {source.market ? <span>{source.market}</span> : null}
                    {source.asOf ? <span>updated {formatStamp(source.asOf)}</span> : null}
                  </div>
                  {source.detail ? <p className="mt-2 text-sm text-[#475569]">{source.detail}</p> : null}
                  {source.notes ? <p className="mt-1 text-xs text-[#64748b]">{source.notes}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[#64748b]">Источник данных еще не описан backend-ом.</p>
            )}
          </div>
        </Panel>

        <Panel title="Compare notes" action={<Star size={18} className="text-[#1e40af]" />}>
          <div className="space-y-3">
            <p className="text-sm leading-6 text-[#334155]">
              Этот блок помогает держать сравнение рядом с тезисом, чтобы пользователь быстро уходил либо к peer pages, либо обратно в AI.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Metric label="Identity" value={stock.ticker} detail={stock.name} />
              <Metric label="User path" value="search → stock → risk" detail="then sources and compare" />
              {stock.sourceMeta?.freshnessBand ? <Metric label="Freshness" value={stock.sourceMeta.freshnessBand} detail={stock.sourceMeta.freshnessRisk} /> : null}
              {stock.sourceMeta?.changeBasis ? <Metric label="Change basis" value={stock.sourceMeta.changeBasis} detail={stock.sourceMeta.source} /> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dbe4ef] bg-white px-4 text-sm font-semibold text-[#0f172a] transition hover:border-[#c7d2fe] hover:bg-[#eef2ff] hover:text-[#1e40af]">
                Back to desk
                <ArrowRight size={16} />
              </Link>
              <Link href={`/portfolio?ticker=${encodeURIComponent(stock.ticker)}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b63f6] px-4 text-sm font-semibold text-white transition hover:bg-[#084fc7]">
                Add to portfolio
                <Plus size={16} />
              </Link>
            </div>
          </div>
        </Panel>
      </section>
    </main>
  );
}

function resolveFundamentals(stock: Stock) {
  return {
    marketCap: stock.fundamentals?.marketCap ?? stock.marketCap,
    pe: stock.fundamentals?.pe ?? stock.pe,
    eps: stock.fundamentals?.eps,
    revenueGrowth: stock.fundamentals?.revenueGrowth,
    grossMargin: stock.fundamentals?.grossMargin,
    operatingMargin: stock.fundamentals?.operatingMargin,
    debtToEquity: stock.fundamentals?.debtToEquity,
    beta: stock.fundamentals?.beta,
    dividendYield: stock.fundamentals?.dividendYield ?? stock.dividend,
    asOf: stock.fundamentals?.asOf ?? stock.asOf,
    source: stock.fundamentals?.source ?? stock.source,
    sourceStatus: stock.fundamentals?.sourceStatus ?? stock.sourceStatus,
  };
}

function resolveSources(stock: Stock) {
  if (stock.source) {
    return [
      {
        source: stock.source,
        status: stock.sourceStatus,
        asOf: stock.asOf,
        market: undefined,
        detail: undefined,
        notes: undefined,
      } satisfies StockSourceMeta,
    ];
  }

  return [];
}

function pickPeers(stock: Stock, rows: MarketTableRow[]) {
  const sectorMatches = rows.filter((row) => row.sector && stock.sector && row.sector.toLowerCase() === stock.sector.toLowerCase() && row.ticker !== stock.ticker);
  const marketMatches = rows.filter((row) => row.market && stock.market && row.market.toLowerCase() === stock.market.toLowerCase() && row.ticker !== stock.ticker);
  return (sectorMatches.length ? sectorMatches : marketMatches).slice(0, 4);
}

function resolveRiskTone(fundamentals: ReturnType<typeof resolveFundamentals>, stock: Stock) {
  if ((fundamentals.beta ?? 0) >= 1.5 || Math.abs(stock.change) >= 3) return "high";
  if ((fundamentals.beta ?? 0) >= 1 || Math.abs(stock.change) >= 1.2) return "medium";
  return "low";
}

function buildAisummary(stock: Stock, riskTone: string) {
  const toneWord = riskTone === "high" ? "more volatile" : riskTone === "medium" ? "balanced" : "defensive";
  return `${stock.name} reads as a ${toneWord} setup. Price, margin profile and source quality should be checked before a thesis becomes a trade.`;
}

function buildSignal(stock: Stock) {
  return stock.change >= 0 ? "positive momentum" : "defensive / under pressure";
}

function buildValuationLine(stock: Stock, fundamentals: ReturnType<typeof resolveFundamentals>) {
  return `${stock.ticker} trades around ${fundamentals.pe ? `P/E ${formatNumber(fundamentals.pe)}` : "a valuation placeholder"} with ${fundamentals.dividendYield ?? "no yield"} on the income side.`;
}

function buildRiskLine(stock: Stock, fundamentals: ReturnType<typeof resolveFundamentals>, riskTone: string) {
  return `${riskTone.toUpperCase()} risk profile: ${stock.market ?? "market"} / ${stock.currency ?? "currency"} / ${fundamentals.debtToEquity ?? "debt metrics pending"}.`;
}

function fallbackRiskFactors(stock: Stock, fundamentals: ReturnType<typeof resolveFundamentals>, riskTone: string): StockRiskFactor[] {
  return [
    {
      code: "liquidity",
      label: "Liquidity",
      severity: stock.change >= 0 ? "medium" : "high",
      detail: stock.change >= 0 ? "Liquidity needs a quote and volume check before sizing." : "Weak price action makes liquidity and spread checks more important.",
    },
    {
      code: "disclosure",
      label: "Disclosure",
      severity: stock.sourceStatus === "live" ? "low" : "medium",
      detail: stock.source ? `Primary source: ${stock.source}.` : "Documents and issuer disclosure should be checked before a thesis.",
    },
    {
      code: "balance-sheet",
      label: "Balance sheet",
      severity: riskTone,
      detail: `Debt / equity: ${fundamentals.debtToEquity ?? "pending"}.`,
    },
  ];
}

function seriesPointValue(point: number | string | null | [string | number, number | null]) {
  if (Array.isArray(point)) return typeof point[1] === "number" ? point[1] : null;
  if (typeof point === "number") return point;
  if (typeof point === "string") {
    const numeric = Number(point);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function formatKpiValue(key: string, value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  if (key.includes("Margin") || key === "ROE" || key === "ROA") return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
  return formatCompactValue(value);
}

function formatCompactValue(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
  if (abs >= 1_000) return `${(value / 1_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}K`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatPercentValue(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "yield n/a";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

function formatNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatStockPrice(stock: Stock) {
  if (!Number.isFinite(stock.price) || stock.price <= 0) return "N/A";
  if (stock.currency === "UZS") return `UZS ${stock.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${stock.price.toFixed(2)}`;
}

function formatStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatMarketLabel(stock: Stock) {
  return stock.market === "uzbekistan" || stock.currency === "UZS" ? "Uzbekistan" : "Global";
}

function ThesisLine({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
      <Icon className="mt-0.5 shrink-0 text-[#1e40af]" size={18} />
      <div>
        <p className="font-semibold text-[#0f172a]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#475569]">{text}</p>
      </div>
    </div>
  );
}

function DecisionList({ title, items }: { title: string; items?: string[] }) {
  return (
    <div className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">{title}</p>
      {items?.length ? (
        <ul className="mt-2 space-y-1 text-sm leading-6 text-[#475569]">
          {items.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#64748b]">No clear match yet.</p>
      )}
    </div>
  );
}

function ChartPanel({ chart }: { chart?: StockScopeChart }) {
  const series = chart?.series?.filter((item) => item.data?.length) ?? [];
  if (!series.length) {
    return (
      <div className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
        <p className="text-sm font-semibold text-[#0f172a]">{chart?.title ?? "Chart"}</p>
        <p className="mt-3 text-sm text-[#64748b]">No chart points yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[#dbe4ef] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#0f172a]">{chart?.title ?? "Chart"}</p>
        <div className="flex flex-wrap gap-2">
          {series.slice(0, 3).map((item) => (
            <span key={item.name} className="rounded-full bg-[#eef2ff] px-2 py-1 text-[11px] font-semibold text-[#1e40af]">{item.name}</span>
          ))}
        </div>
      </div>
      <MiniSeriesChart series={series.slice(0, 3)} />
    </div>
  );
}

function MiniSeriesChart({ series }: { series: NonNullable<StockScopeChart["series"]> }) {
  const width = 620;
  const height = 180;
  const padding = 16;
  const colors = ["#0b63f6", "#16a34a", "#d97706"];
  const numericSeries = series.map((item) => ({
    name: item.name,
    values: item.data.map(seriesPointValue).filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
  }));
  const allValues = numericSeries.flatMap((item) => item.values);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const spread = max - min || 1;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-48 w-full overflow-visible">
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#e2e8f0" />
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#e2e8f0" />
      {numericSeries.map((item, seriesIndex) => {
        const step = (width - padding * 2) / Math.max(1, item.values.length - 1);
        const points = item.values
          .map((value, index) => {
            const x = padding + index * step;
            const y = height - padding - ((value - min) / spread) * (height - padding * 2);
            return `${x},${y}`;
          })
          .join(" ");
        return <polyline key={item.name} points={points} fill="none" stroke={colors[seriesIndex % colors.length]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </svg>
  );
}

function IndicatorGrid({ indicators }: { indicators?: StockScopeIndicatorPeriod[] }) {
  const latest = indicators?.[0];
  const values = latest?.values ?? {};
  const keys = ["ROE", "ROA", "GrossProfitMargin", "NetProfitMargin", "DebtToEquity", "CurrentRatio", "WorkingCapital", "Earnings"];

  return (
    <div className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
      <p className="text-sm font-semibold text-[#0f172a]">Performance indicators</p>
      <p className="mt-1 text-xs text-[#64748b]">{latest?.period ?? "Latest period"} · ROE, ROA and StockScope ratios</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {keys.map((key) => (
          <MetricChip key={key} label={key} value={formatKpiValue(key, values[key])} />
        ))}
      </div>
    </div>
  );
}

function StockScopeTables({ stock }: { stock: Stock }) {
  const earningsRows = stock.stockscope?.fundamentals?.earnings?.rows ?? [];
  const balanceRows = stock.stockscope?.fundamentals?.balanceSheet?.rows ?? [];
  const dividends = stock.stockscope?.dividends ?? [];
  const reports = stock.stockscope?.reports ?? [];

  return (
    <div className="grid gap-3">
      <MiniFinancialTable title="Earnings rows" rows={earningsRows.slice(0, 10)} />
      <MiniFinancialTable title="Balance sheet rows" rows={balanceRows.slice(0, 10)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FactsList title="Reports" items={reports.slice(0, 5).map((item) => `${item.period ?? item.type ?? "Report"} · ${item.date ? formatStamp(item.date) : "date n/a"}`)} />
        <FactsList title="Dividends" items={dividends.slice(0, 5).map((item) => `${formatCompactValue(item.commonDividend)} UZS · ${formatPercentValue(item.commonYield)}`)} />
      </div>
    </div>
  );
}

function MiniFinancialTable({ title, rows }: { title: string; rows: Array<{ id: string; label: string; values: Array<{ period?: string; value?: number | null }> }> }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#dbe4ef] bg-white">
      <div className="border-b border-[#e2e8f0] px-4 py-3 text-sm font-semibold text-[#0f172a]">{title}</div>
      <div className="max-h-72 overflow-auto">
        <table className="min-w-full text-sm">
          <tbody>
            {rows.map((row) => {
              const latest = row.values?.[0];
              return (
                <tr key={`${title}-${row.id}`} className="border-b border-[#f1f5f9] last:border-0">
                  <td className="px-4 py-2 text-xs font-semibold text-[#64748b]">{row.id}</td>
                  <td className="px-3 py-2 text-[#0f172a]">{row.label}</td>
                  <td className="tabular-data px-4 py-2 text-right font-semibold text-[#0f172a]">{formatCompactValue(latest?.value)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FactsList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[16px] border border-[#dbe4ef] bg-white p-4">
      <p className="text-sm font-semibold text-[#0f172a]">{title}</p>
      <div className="mt-2 space-y-1">
        {items.length ? items.map((item) => <p key={item} className="text-sm text-[#475569]">{item}</p>) : <p className="text-sm text-[#64748b]">No data yet.</p>}
      </div>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dbe4ef] bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <p className="tabular-data mt-1 text-sm font-semibold text-[#0f172a]">{value}</p>
    </div>
  );
}

function RiskChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dbe4ef] bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <p className="tabular-data mt-1 text-sm font-semibold text-[#0f172a]">{value}</p>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#93a4ba]">{label}</p>
      <p className="tabular-data mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
