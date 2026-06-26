import Link from "next/link";
import { Activity, Bot, Globe2, Newspaper, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { LiveMarketStatus } from "@/components/live-market-status";
import { ChangeBadge, Metric, PageHeader, Panel, SourceStatusBadge } from "@/components/ui";
import { getDashboardData } from "@/lib/api";
import { type MarketTableRow } from "@/lib/data";

type DashboardSearchParams = Promise<Record<string, string | string[] | undefined>>;
type MarketSortKey = "marketCap" | "volume24h" | "price" | "change1h" | "change24h" | "change7d" | "name";
type MarketFilter = "all" | "uzse" | "global";
type DisplayCurrency = "USD" | "UZS";

type CurrencyContext = {
  currency: DisplayCurrency;
  usdUzsRate: number;
};

const sortOptions: Array<{ key: MarketSortKey; label: string }> = [
  { key: "marketCap", label: "Market cap" },
  { key: "volume24h", label: "Volume" },
  { key: "price", label: "Price" },
  { key: "change1h", label: "1h %" },
  { key: "change24h", label: "24h %" },
  { key: "change7d", label: "7d %" },
  { key: "name", label: "Name" },
];

const marketOptions: Array<{ key: MarketFilter; label: string }> = [
  { key: "all", label: "Все рынки" },
  { key: "uzse", label: "UZSE" },
  { key: "global", label: "Глобальные" },
];

const currencyOptions: Array<{ key: DisplayCurrency; label: string }> = [
  { key: "USD", label: "USD" },
  { key: "UZS", label: "UZS" },
];

export default async function DashboardPage({ searchParams }: { searchParams?: DashboardSearchParams }) {
  const { indexes, stocks, marketTable, news, sources, fxRates, macro } = await getDashboardData();
  const resolvedSearchParams = (await Promise.resolve(searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const query = firstQueryValue(resolvedSearchParams.q).trim();
  const sort = normalizeSort(firstQueryValue(resolvedSearchParams.sort));
  const market = normalizeMarketFilter(firstQueryValue(resolvedSearchParams.market));
  const currency = normalizeCurrency(firstQueryValue(resolvedSearchParams.currency));
  const currencyContext = { currency, usdUzsRate: resolveUsdUzsRate(fxRates) };
  const filteredRows = applyMarketFilters(marketTable, query, market);
  const sortedRows = sortMarketRows(filteredRows, sort, currencyContext);
  const activeSourceCount = sources.filter((source) => source.status === "live" || source.status === "delayed").length;
  const dashboardSymbols = [...indexes.map((index) => index.ticker), ...stocks.map((stock) => stock.ticker)];

  return (
    <>
      <PageHeader title="Главная" subtitle="Мировые рынки, новости и AI-идеи дня для инвесторов из Узбекистана." />

      <LiveMarketStatus sources={sources} symbols={dashboardSymbols} />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Metric label="Охват рынка" value={`${indexes.length} активов`} detail="Индексы, криптовалюты и сырье" />
        <Metric label="Список наблюдения" value={`${stocks.length} компаний`} detail="Компании США и MOEX для MVP" />
        <Metric label="Источники данных" value={`${activeSourceCount}/${sources.length} активны`} detail="REST-котировки и live polling" />
      </div>

      <Panel title="Рынок" action={<span className="tabular-data rounded-xl border border-[#dbe4ef] bg-white px-2.5 py-1 text-xs font-semibold text-[#475569]">{sortedRows.length.toLocaleString("ru-RU")} строк</span>}>
        <MarketToolbar query={query} sort={sort} market={market} currency={currency} total={marketTable.length} visible={sortedRows.length} usdUzsRate={currencyContext.usdUzsRate} />
        {sortedRows.length ? (
          <>
            <MarketDesktopTable rows={sortedRows} currencyContext={currencyContext} />
            <MarketMobileCards rows={sortedRows} currencyContext={currencyContext} />
          </>
        ) : (
          <EmptyMarketState query={query} />
        )}
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="FX" action={<Globe2 size={18} className="text-[#1e40af]" />}>
          <CompactMarketList
            emptyLabel="FX-данные пока не пришли из backend."
            items={fxRates.map((rate) => ({
              key: rate.pair,
              title: rate.pair,
              value: rate.rate.toLocaleString("en-US", { maximumFractionDigits: 4 }),
              detail: rate.asOf ? `обновлено ${formatTime(rate.asOf)}` : rate.base && rate.quote ? `${rate.base} / ${rate.quote}` : undefined,
              change: rate.change,
              source: rate.source,
              status: rate.sourceStatus,
            }))}
          />
        </Panel>

        <Panel title="Macro" action={<Activity size={18} className="text-[#1e40af]" />}>
          <div className="grid gap-2 md:grid-cols-2">
            {macro.length ? (
              macro.map((item) => (
                <div key={item.key} className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#64748b]">{item.label}</p>
                      <p className="tabular-data mt-1 text-lg font-semibold text-[#0f172a]">{item.value}</p>
                    </div>
                    {typeof item.change === "number" ? <ChangeBadge value={item.change} /> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {item.unit ? <span className="rounded-lg border border-[#dbe4ef] bg-white px-2 py-1 text-[11px] font-semibold text-[#475569]">{item.unit}</span> : null}
                    <SourceStatusBadge source={item.source} status={item.sourceStatus} />
                  </div>
                  {item.asOf ? <p className="mt-2 text-[11px] text-[#64748b]">обновлено {formatTime(item.asOf)}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[#64748b]">Macro-метрики появятся, когда backend начнет отдавать блок `macro`.</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {indexes.map((index) => (
          <Panel key={index.ticker}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="tabular-data text-xs font-semibold text-[#1e40af]">{index.ticker}</p>
                <h2 className="mt-1 text-sm font-semibold text-[#0f172a]">{index.name}</h2>
                <p className="tabular-data mt-3 text-2xl font-semibold text-[#0f172a]">{index.value}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <ChangeBadge value={index.change} />
                <SourceStatusBadge source={index.source} status={index.sourceStatus} />
              </div>
            </div>
            {index.asOf ? <p className="tabular-data mt-3 text-xs text-[#64748b]">обновлено {new Date(index.asOf).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</p> : null}
            <div className="mt-4 h-1.5 rounded-full bg-[#e2e8f0]">
              <div className={`h-1.5 rounded-full ${index.change >= 0 ? "bg-[#16a34a]" : "bg-[#dc2626]"}`} style={{ width: `${Math.min(92, Math.max(16, Math.abs(index.change) * 28))}%` }} />
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="AI идеи дня" action={<Bot size={18} className="text-[#1e40af]" />} className="mt-4">
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[#334155]">
            AI видит устойчивый интерес к полупроводникам и облачной инфраструктуре, но оценки лидеров остаются высокими.
          </p>
          <div className="rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-3 text-sm leading-6 text-[#1e40af]">
            Фокус: сравнить рост выручки Nvidia и Microsoft с текущими P/E, не забывая про риск коррекции AI-сектора.
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-xs font-medium text-[#166534]">
            <ShieldCheck size={15} />
            Сценарий предназначен для обучения и виртуального портфеля.
          </div>
        </div>
      </Panel>

      <Panel title="Новости" action={<Newspaper size={18} className="text-[#667085]" />} className="mt-4">
        <div className="grid gap-3 md:grid-cols-2">
          {news.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#dbe4ef] bg-[#f8fafc] p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#64748b]">
                <span>{item.category}</span>
                <span>{item.source}</span>
                <span>{item.time}</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
            </article>
          ))}
        </div>
      </Panel>
    </>
  );
}

function MarketToolbar({
  query,
  sort,
  market,
  currency,
  total,
  visible,
  usdUzsRate,
}: {
  query: string;
  sort: MarketSortKey;
  market: MarketFilter;
  currency: DisplayCurrency;
  total: number;
  visible: number;
  usdUzsRate: number;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-[#e2e8f0] pb-4 lg:flex-row lg:items-end lg:justify-between">
      <form className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1.7fr)_150px_130px_150px_auto] lg:items-end" method="get">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-normal text-[#667085]">Поиск</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={16} />
            <input
              name="q"
              defaultValue={query}
              placeholder="UZSE, HMKB, AAPL, Nvidia..."
              className="h-11 w-full rounded-2xl border border-[#dbe4ef] bg-white pl-9 pr-3 text-sm text-[#0f172a] shadow-inner outline-none transition placeholder:text-[#94a3b8] focus:border-[#3861fb] focus:ring-4 focus:ring-[#dbe4ff]"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-normal text-[#667085]">Рынок</span>
          <div className="relative">
            <select
              name="market"
              defaultValue={market}
              className="h-11 w-full appearance-none rounded-2xl border border-[#dbe4ef] bg-white px-3 pr-9 text-sm text-[#0f172a] shadow-inner outline-none transition focus:border-[#3861fb] focus:ring-4 focus:ring-[#dbe4ff]"
            >
              {marketOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <Globe2 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={15} />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-normal text-[#667085]">Валюта</span>
          <div className="relative">
            <select
              name="currency"
              defaultValue={currency}
              className="h-11 w-full appearance-none rounded-2xl border border-[#dbe4ef] bg-white px-3 pr-9 text-sm text-[#0f172a] shadow-inner outline-none transition focus:border-[#3861fb] focus:ring-4 focus:ring-[#dbe4ff]"
            >
              {currencyOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <Globe2 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={15} />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-normal text-[#667085]">Сортировка</span>
          <div className="relative">
            <select
              name="sort"
              defaultValue={sort}
              className="h-11 w-full appearance-none rounded-2xl border border-[#dbe4ef] bg-white px-3 pr-9 text-sm text-[#0f172a] shadow-inner outline-none transition focus:border-[#3861fb] focus:ring-4 focus:ring-[#dbe4ff]"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={15} />
          </div>
        </label>

        <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#3861fb] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(56,97,251,0.22)] transition hover:bg-[#2f54df]">
          <Search size={16} />
          Применить
        </button>
      </form>

      <div className="flex items-center gap-2 text-xs font-medium text-[#64748b]">
        <span className="rounded-lg border border-[#dbe4ef] bg-[#f8fafc] px-2 py-1">{visible.toLocaleString("ru-RU")} / {total.toLocaleString("ru-RU")}</span>
        <span className="hidden rounded-lg border border-[#dbe4ef] bg-[#f8fafc] px-2 py-1 md:inline">USD/UZS {usdUzsRate.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-2xl border border-[#dbe4ef] bg-white px-3 text-sm font-semibold text-[#0f172a] transition hover:border-[#bfdbfe] hover:bg-[#f8fafc]"
        >
          Сбросить
        </Link>
      </div>
    </div>
  );
}

function MarketDesktopTable({ rows, currencyContext }: { rows: MarketTableRow[]; currencyContext: CurrencyContext }) {
  return (
    <div className="hidden md:block">
      <div className="max-h-[720px] overflow-auto rounded-3xl border border-[#dbe4ef] bg-white shadow-inner">
        <table className="min-w-[1180px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-[#f8fafc]/95 backdrop-blur">
            <tr className="text-[11px] uppercase tracking-normal text-[#64748b]">
              <th scope="col" className="w-12 whitespace-nowrap border-b border-[#e2e8f0] px-3 py-3 text-left">#</th>
              <th scope="col" className="whitespace-nowrap border-b border-[#e2e8f0] px-3 py-3 text-left">Logo</th>
              <th scope="col" className="whitespace-nowrap border-b border-[#e2e8f0] px-3 py-3 text-left">Name / Ticker</th>
              <th scope="col" className="whitespace-nowrap border-b border-[#e2e8f0] px-3 py-3 text-right">Price ({currencyContext.currency})</th>
              <th scope="col" className="whitespace-nowrap border-b border-[#e2e8f0] px-3 py-3 text-right">1h %</th>
              <th scope="col" className="whitespace-nowrap border-b border-[#e2e8f0] px-3 py-3 text-right">24h %</th>
              <th scope="col" className="whitespace-nowrap border-b border-[#e2e8f0] px-3 py-3 text-right">7d %</th>
              <th scope="col" className="whitespace-nowrap border-b border-[#e2e8f0] px-3 py-3 text-right">Market Cap</th>
              <th scope="col" className="whitespace-nowrap border-b border-[#e2e8f0] px-3 py-3 text-right">Volume (24h)</th>
              <th scope="col" className="whitespace-nowrap border-b border-[#e2e8f0] px-3 py-3 text-right">Circulating Supply</th>
              <th scope="col" className="whitespace-nowrap border-b border-[#e2e8f0] px-3 py-3 text-right">7d Price%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.ticker} className="group border-b border-[#e2e8f0] transition last:border-b-0 hover:bg-[#f8fafc] hover:shadow-[inset_3px_0_0_#3861fb]">
                <td className="px-3 py-3 text-sm text-[#64748b]">{index + 1}</td>
                <td className="px-3 py-3">
                  <LogoMark ticker={row.ticker} name={row.name} />
                </td>
                <td className="px-3 py-3">
                  <Link href={`/stocks/${encodeURIComponent(row.ticker)}`} className="block max-w-[260px]">
                    <p className="truncate text-sm font-semibold text-[#0f172a]">{row.name}</p>
                    <p className="tabular-data mt-1 text-xs font-semibold text-[#1e40af]">{row.ticker}</p>
                    <div className="mt-1">
                      <SourceStatusBadge source={row.source} status={row.sourceStatus} />
                    </div>
                  </Link>
                </td>
                <td className="tabular-data px-3 py-3 text-right text-sm font-semibold text-[#0f172a]">{formatPrice(row, currencyContext)}</td>
                <td className="px-3 py-3 text-right">
                  <ChangeBadge value={row.change1h} />
                </td>
                <td className="px-3 py-3 text-right">
                  <ChangeBadge value={row.change24h} />
                </td>
                <td className="px-3 py-3 text-right">
                  <ChangeBadge value={row.change7d} />
                </td>
                <td className="tabular-data px-3 py-3 text-right text-sm font-semibold text-[#0f172a]">{formatMarketMoney(row, row.marketCap, row.marketCapValue, currencyContext)}</td>
                <td className="tabular-data px-3 py-3 text-right text-sm font-semibold text-[#0f172a]">{formatMarketMoney(row, row.volume24h, row.volume24hValue, currencyContext)}</td>
                <td className="tabular-data px-3 py-3 text-right text-sm font-semibold text-[#0f172a]">{row.circulatingSupply}</td>
                <td className="px-3 py-3 text-right">
                  <Sparkline values={row.sparkline7d} positive={row.change7d >= 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarketMobileCards({ rows, currencyContext }: { rows: MarketTableRow[]; currencyContext: CurrencyContext }) {
  return (
    <div className="grid gap-2 md:hidden">
      {rows.map((row, index) => (
        <Link key={row.ticker} href={`/stocks/${encodeURIComponent(row.ticker)}`} className="block rounded-2xl border border-[#dbe4ef] bg-[#f8fafc] p-3 transition hover:border-[#bfdbfe] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3861fb]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-[#64748b]">#{index + 1}</p>
              <div className="mt-2 flex items-start gap-3">
                <LogoMark ticker={row.ticker} name={row.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0f172a]">{row.name}</p>
                  <p className="tabular-data mt-1 text-xs font-semibold text-[#1e40af]">{row.ticker}</p>
                  <div className="mt-1">
                    <SourceStatusBadge source={row.source} status={row.sourceStatus} />
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="tabular-data text-sm font-semibold text-[#0f172a]">{formatPrice(row, currencyContext)}</p>
              <div className="mt-2 flex justify-end">
                <Sparkline values={row.sparkline7d} positive={row.change7d >= 0} />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <MetricChip label="1h %" value={row.change1h} />
            <MetricChip label="24h %" value={row.change24h} />
            <MetricChip label="7d %" value={row.change7d} />
            <MetricChip label="Market Cap" value={formatMarketMoney(row, row.marketCap, row.marketCapValue, currencyContext)} />
            <MetricChip label="Volume (24h)" value={formatMarketMoney(row, row.volume24h, row.volume24hValue, currencyContext)} />
            <MetricChip label="Circulating Supply" value={row.circulatingSupply} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: number | string }) {
  const isNumber = typeof value === "number";
  return (
    <div className="rounded-xl border border-[#dbe4ef] bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-normal text-[#64748b]">{label}</p>
      {isNumber ? (
        <p className={`tabular-data mt-1 text-sm font-semibold ${Math.abs(value) < 0.005 ? "text-[#475569]" : value > 0 ? "text-[#15803d]" : "text-[#b91c1c]"}`}>{formatPercent(value)}</p>
      ) : (
        <p className="tabular-data mt-1 truncate text-sm font-semibold text-[#0f172a]">{value}</p>
      )}
    </div>
  );
}

function EmptyMarketState({ query }: { query: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#dbe4ef] bg-[#f8fafc] px-4 py-10 text-center text-sm text-[#64748b]">
      {query ? `Ничего не найдено по запросу "${query}".` : "Таблица пока пуста."}
    </div>
  );
}

function CompactMarketList({
  items,
  emptyLabel,
}: {
  items: Array<{
    key: string;
    title: string;
    value: string;
    detail?: string;
    change?: number;
    source?: string;
    status?: "live" | "delayed" | "stale" | "offline" | "fallback" | "needs_license";
  }>;
  emptyLabel: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-[#64748b]">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.key} className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#64748b]">{item.title}</p>
              <p className="tabular-data mt-1 text-lg font-semibold text-[#0f172a]">{item.value}</p>
            </div>
            {typeof item.change === "number" ? <ChangeBadge value={item.change} /> : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.detail ? <span className="text-[11px] text-[#64748b]">{item.detail}</span> : null}
            <SourceStatusBadge source={item.source} status={item.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LogoMark({ ticker, name }: { ticker: string; name: string }) {
  const label = logoLabel(ticker, name);
  const palette = logoPalette(ticker);

  return (
    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${palette}`}>
      {label}
    </div>
  );
}

function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  const path = sparklinePath(values);
  if (!path) {
    return <span className="text-xs text-[#94a3b8]">—</span>;
  }

  const flat = values.every((value) => Math.abs(value - values[0]) < 0.0001);
  const stroke = flat ? "#64748b" : positive ? "#16a34a" : "#dc2626";
  const fill = flat ? "rgba(100,116,139,0.10)" : positive ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)";

  return (
    <svg viewBox="0 0 100 28" className="h-7 w-24" role="img" aria-label={positive ? "Positive seven day trend" : "Negative seven day trend"}>
      <path d={`${path.line} L 100 26 L 0 26 Z`} fill={fill} />
      <path d={path.line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function sparklinePath(values: number[]) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const step = 100 / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * step;
    const y = 24 - ((value - min) / spread) * 18;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return { line: points.join(" ") };
}

function logoLabel(ticker: string, name: string) {
  const compact = ticker.replace(/[^A-Za-z0-9]/g, "");
  if (compact.length >= 2) return compact.slice(0, 2).toUpperCase();
  if (name.trim()) return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return ticker.slice(0, 2).toUpperCase();
}

function logoPalette(ticker: string) {
  const palette = [
    "bg-[#eff6ff] border-[#bfdbfe] text-[#1d4ed8]",
    "bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]",
    "bg-[#fff7ed] border-[#fed7aa] text-[#9a3412]",
    "bg-[#f5f3ff] border-[#ddd6fe] text-[#6d28d9]",
    "bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]",
  ];

  const index = ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length;
  return palette[index];
}

function applyMarketFilters(rows: MarketTableRow[], query: string, market: MarketFilter) {
  const needle = query.toLowerCase();
  return rows.filter((row) => {
    const matchesMarket = market === "all" || (market === "uzse" ? isUzseRow(row) : !isUzseRow(row));
    const matchesQuery = !needle || [row.ticker, row.name, row.source].some((value) => typeof value === "string" && value.toLowerCase().includes(needle));
    return matchesMarket && matchesQuery;
  });
}

function sortMarketRows(rows: MarketTableRow[], sort: MarketSortKey, currencyContext: CurrencyContext) {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "en", { sensitivity: "base" });

    const aValue = marketSortValue(a, sort, currencyContext);
    const bValue = marketSortValue(b, sort, currencyContext);
    if (bValue !== aValue) return bValue - aValue;
    return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  });
  return sorted;
}

function marketSortValue(row: MarketTableRow, sort: MarketSortKey, currencyContext: CurrencyContext) {
  switch (sort) {
    case "marketCap":
      return comparableMoneyValue(row, row.marketCap, row.marketCapValue, currencyContext);
    case "volume24h":
      return comparableMoneyValue(row, row.volume24h, row.volume24hValue, currencyContext);
    case "price":
      return comparableMoneyValue(row, undefined, row.price, currencyContext);
    case "change1h":
      return finiteNumber(row.change1h);
    case "change24h":
      return finiteNumber(row.change24h);
    case "change7d":
      return finiteNumber(row.change7d);
    default:
      return finiteNumber(row.price);
  }
}

function parseCompactNumber(value: string) {
  const cleaned = value.replace(/,/g, "").trim();
  const match = cleaned.match(/(-?\d+(?:\.\d+)?)\s*([KMBTQ])?/i);
  if (!match) return finiteNumber(Number(cleaned.replace(/[^\d.-]/g, "")));

  const amount = Number(match[1]);
  const suffix = match[2]?.toUpperCase();
  const multiplierMap: Record<string, number> = {
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12,
    Q: 1e15,
  };
  return finiteNumber(amount * (suffix ? multiplierMap[suffix] ?? 1 : 1));
}

function comparableMoneyValue(row: MarketTableRow, display: string | undefined, rawValue: number | undefined, currencyContext: CurrencyContext) {
  const value = finiteNumber(rawValue ?? (display ? parseCompactNumber(display) : undefined));
  return convertAmount(value, rowCurrency(row), "USD", currencyContext.usdUzsRate);
}

function normalizeSort(value?: string): MarketSortKey {
  if (!value) return "marketCap";
  return sortOptions.some((option) => option.key === value) ? (value as MarketSortKey) : "marketCap";
}

function normalizeMarketFilter(value?: string): MarketFilter {
  return marketOptions.some((option) => option.key === value) ? (value as MarketFilter) : "all";
}

function normalizeCurrency(value?: string): DisplayCurrency {
  return value === "UZS" ? "UZS" : "USD";
}

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatPrice(row: MarketTableRow, currencyContext: CurrencyContext) {
  const value = row.price;
  if (!Number.isFinite(value) || value <= 0) return "N/A";
  const converted = convertAmount(value, rowCurrency(row), currencyContext.currency, currencyContext.usdUzsRate);
  return formatCurrencyAmount(converted, currencyContext.currency, "price");
}

function formatMarketMoney(row: MarketTableRow, display: string, rawValue: number | undefined, currencyContext: CurrencyContext) {
  if (display === "N/A") return "N/A";
  const value = finiteNumber(rawValue ?? parseCompactNumber(display));
  if (value <= 0) return "N/A";
  const converted = convertAmount(value, rowCurrency(row), currencyContext.currency, currencyContext.usdUzsRate);
  return formatCurrencyAmount(converted, currencyContext.currency, "compact");
}

function rowCurrency(row: MarketTableRow): DisplayCurrency {
  return isUzseRow(row) ? "UZS" : "USD";
}

function isUzseRow(row: MarketTableRow) {
  return (row.source?.toLowerCase() ?? "").includes("uzse");
}

function convertAmount(value: number, from: DisplayCurrency, to: DisplayCurrency, usdUzsRate: number) {
  if (!Number.isFinite(value) || value <= 0 || from === to) return value;
  return from === "USD" ? value * usdUzsRate : value / usdUzsRate;
}

function formatCurrencyAmount(value: number, currency: DisplayCurrency, mode: "price" | "compact") {
  if (!Number.isFinite(value) || value <= 0) return "N/A";
  const prefix = currency === "USD" ? "$" : "UZS ";
  if (mode === "price") {
    if (currency === "UZS") return `${prefix}${value.toLocaleString("en-US", { maximumFractionDigits: value >= 1 ? 2 : 4 })}`;
    return `${prefix}${value >= 1 ? value.toFixed(2) : value.toFixed(4)}`;
  }

  const abs = Math.abs(value);
  const suffixes: Array<[number, string]> = [
    [1e15, "Q"],
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [threshold, suffix] of suffixes) {
    if (abs >= threshold) return `${prefix}${(value / threshold).toFixed(abs >= 100 * threshold ? 0 : 2)}${suffix}`;
  }
  return `${prefix}${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function resolveUsdUzsRate(fxRates: Array<{ pair: string; rate: number; base?: string; quote?: string }>) {
  const usdRate = fxRates.find((rate) => rate.pair === "USD/UZS" || (rate.base === "USD" && rate.quote === "UZS"));
  return usdRate?.rate && Number.isFinite(usdRate.rate) ? usdRate.rate : 12000;
}

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function finiteNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}
