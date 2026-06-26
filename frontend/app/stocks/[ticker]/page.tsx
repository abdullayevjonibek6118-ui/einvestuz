import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Star } from "lucide-react";
import { ChangeBadge, Metric, PageHeader, Panel, SourceStatusBadge } from "@/components/ui";
import { getNews, getStock } from "@/lib/api";
import { type Stock, type StockSourceMeta } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const [stock, news] = await Promise.all([getStock(ticker), getNews()]);
  if (!stock) notFound();
  const fundamentals = resolveFundamentals(stock);
  const earnings = stock.earnings ?? [];
  const sources = stock.sources?.length ? stock.sources : resolveSources(stock);
  const companyNews = stock.news?.length ? stock.news : news.slice(0, 3);

  return (
    <>
      <PageHeader title={`${stock.name} (${stock.ticker})`} subtitle={stock.description} />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-[#667085]">{stock.sector}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-3xl font-semibold">${stock.price.toFixed(2)}</span>
                <ChangeBadge value={stock.change} />
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/profile" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#bfd0e3] bg-white px-3 text-sm font-semibold text-[#0f172a] transition hover:border-[#0b63f6] hover:bg-[#eff6ff]">
                <Star size={16} /> Watchlist
              </Link>
              <Link href={`/portfolio?ticker=${encodeURIComponent(stock.ticker)}`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b63f6] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084fc7]">
                <Plus size={16} /> В портфель
              </Link>
            </div>
          </div>
          <div className="mt-5 h-[360px] overflow-hidden rounded-2xl border border-[#dde3eb] bg-[#0f172a]">
            <iframe
              title={`${stock.ticker} TradingView chart`}
              src={`https://s.tradingview.com/widgetembed/?symbol=NASDAQ:${stock.ticker}&interval=D&theme=dark&style=1&hideideas=1`}
              className="h-full w-full"
            />
          </div>
        </Panel>

        <Panel title="Fundamentals" action={<SourceStatusBadge source={fundamentals.source} status={fundamentals.sourceStatus} />}>
          <div className="grid gap-3">
            <Metric label="Капитализация" value={fundamentals.marketCap ?? "N/A"} detail={fundamentals.asOf ? `as of ${formatStamp(fundamentals.asOf)}` : undefined} />
            <Metric label="P/E" value={formatNumber(fundamentals.pe)} />
            <Metric label="EPS" value={formatNumber(fundamentals.eps)} detail="TTM / reported" />
            <Metric label="Dividend yield" value={fundamentals.dividendYield ?? "N/A"} />
            <Metric label="Gross margin" value={fundamentals.grossMargin ?? "N/A"} />
            <Metric label="Operating margin" value={fundamentals.operatingMargin ?? "N/A"} />
            <Metric label="Debt / equity" value={fundamentals.debtToEquity ?? "N/A"} />
            <Metric label="Beta" value={formatNumber(fundamentals.beta)} />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Earnings">
          <div className="space-y-3">
            {earnings.length ? (
              earnings.slice(0, 4).map((item) => (
                <div key={`${item.period}-${item.asOf ?? "na"}`} className="rounded-2xl border border-[#dde3eb] bg-[#f8fafc] p-3">
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
              ))
            ) : (
              <p className="text-sm text-[#64748b]">Earnings-история еще не пришла из backend.</p>
            )}
          </div>
        </Panel>

        <Panel title="Source metadata / news">
          <div className="space-y-3">
            <div className="space-y-2">
              {sources.length ? (
                sources.map((source) => (
                  <div key={`${source.source}-${source.asOf ?? "na"}`} className="rounded-2xl border border-[#dde3eb] bg-[#f8fafc] p-3">
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

            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold uppercase text-[#667085]">Новости</p>
              <div className="space-y-2">
                {companyNews.map((item) => (
                  <Link key={item.id} href="/dashboard" className="block rounded-2xl border border-[#dde3eb] p-3 transition hover:bg-[#fbfcfe]">
                    <p className="text-xs text-[#667085]">
                      {item.category} · {item.time}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </>
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

function formatNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
