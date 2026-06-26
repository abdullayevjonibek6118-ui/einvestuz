import Link from "next/link";
import { ArrowUpRight, BarChart3, FileSearch, Filter, GitCompareArrows, Search } from "lucide-react";
import { Metric, PageHeader, Panel, SourceStatusBadge } from "@/components/ui";
import { getStockScopeScreener } from "@/lib/api";
import type { StockScopeScreenerRow } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const sortOptions = [
  ["reports_count", "Отчётность"],
  ["roe", "ROE"],
  ["roa", "ROA"],
  ["pe", "P/E"],
  ["pb", "P/B"],
  ["dividend_yield", "Дивиденды"],
  ["price_points_count", "История цены"],
] as const;

export default async function ScreenerPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await Promise.resolve(searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const filters = {
    q: first(params.q),
    min_roe: first(params.min_roe),
    min_roa: first(params.min_roa),
    max_pe: first(params.max_pe),
    max_pb: first(params.max_pb),
    min_reports: first(params.min_reports),
    sort_by: first(params.sort_by) || "reports_count",
    sort_dir: first(params.sort_dir) || "desc",
    limit: 100,
  };
  const data = await getStockScopeScreener(filters);
  const compareTickers = data.items.slice(0, 3).map((row) => row.ticker).join(",");

  return (
    <>
      <PageHeader
        title="Скринер рынка Узбекистана"
        subtitle="Отберите компании UZSE по рентабельности, оценке и качеству раскрытия, затем откройте карточку или сравните лидеров."
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Компании" value={String(data.coverage?.total ?? data.total)} detail="каталог StockScope Uzbekistan" />
        <Metric label="С отчётностью" value={String(data.coverage?.withReports ?? "N/A")} detail="доступны периоды и документы" />
        <Metric label="С показателями" value={String(data.coverage?.withIndicators ?? "N/A")} detail="ROE, ROA, margins, debt" />
        <Metric label="Результат" value={String(data.total)} detail="после выбранных фильтров" />
      </section>

      <Panel
        title="Фильтры"
        action={
          <Link href={`/compare?tickers=${compareTickers}`} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#0b63f6] px-3 text-xs font-semibold text-white hover:bg-[#084fc7]">
            <GitCompareArrows size={15} />
            Сравнить лидеров
          </Link>
        }
      >
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="xl:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-[#475569]">Компания, тикер или ISIN</span>
            <span className="flex h-11 items-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-3 focus-within:border-[#0b63f6] focus-within:ring-4 focus-within:ring-[#0b63f6]/10">
              <Search size={16} className="text-[#64748b]" />
              <input name="q" defaultValue={filters.q} placeholder="AGBA, Uzmetkombinat..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </span>
          </label>
          <NumberFilter name="min_roe" label="ROE не ниже, %" value={filters.min_roe} />
          <NumberFilter name="min_roa" label="ROA не ниже, %" value={filters.min_roa} />
          <NumberFilter name="max_pe" label="P/E не выше" value={filters.max_pe} />
          <NumberFilter name="max_pb" label="P/B не выше" value={filters.max_pb} />
          <NumberFilter name="min_reports" label="Минимум отчётов" value={filters.min_reports} />
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-[#475569]">Сортировка</span>
            <select name="sort_by" defaultValue={filters.sort_by} className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3 text-sm outline-none focus:border-[#0b63f6]">
              {sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-[#475569]">Порядок</span>
            <select name="sort_dir" defaultValue={filters.sort_dir} className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3 text-sm outline-none focus:border-[#0b63f6]">
              <option value="desc">По убыванию</option>
              <option value="asc">По возрастанию</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b63f6] px-4 text-sm font-semibold text-white hover:bg-[#084fc7]">
              <Filter size={16} />
              Применить
            </button>
            <Link href="/screener" aria-label="Сбросить фильтры" title="Сбросить фильтры" className="grid size-11 place-items-center rounded-xl border border-[#cbd5e1] bg-white text-[#475569] hover:bg-[#f8fafc]">
              <FileSearch size={17} />
            </Link>
          </div>
        </form>
      </Panel>

      <Panel title="Компании" action={<SourceStatusBadge source="stockscope.uz" status="delayed" />} className="mt-4">
        {data.items.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[940px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-[11px] font-semibold uppercase text-[#64748b]">
                    <th className="px-3 py-3">Компания</th>
                    <th className="px-3 py-3">Период</th>
                    <th className="px-3 py-3 text-right">Цена</th>
                    <th className="px-3 py-3 text-right">Капитализация</th>
                    <th className="px-3 py-3 text-right">ROE</th>
                    <th className="px-3 py-3 text-right">ROA</th>
                    <th className="px-3 py-3 text-right">P/E</th>
                    <th className="px-3 py-3 text-right">P/B</th>
                    <th className="px-3 py-3 text-right">Отчёты</th>
                    <th className="px-3 py-3 text-right">Данные</th>
                  </tr>
                </thead>
                <tbody>{data.items.map((row) => <ScreenerTableRow key={row.ticker} row={row} />)}</tbody>
              </table>
            </div>
            <div className="grid gap-3 lg:hidden">
              {data.items.map((row) => <ScreenerCard key={row.ticker} row={row} />)}
            </div>
          </>
        ) : (
          <div className="grid min-h-48 place-items-center text-center">
            <div>
              <BarChart3 className="mx-auto text-[#94a3b8]" />
              <p className="mt-3 font-semibold text-[#0f172a]">Компании не найдены</p>
              <p className="mt-1 text-sm text-[#64748b]">Ослабьте фильтры или попробуйте другой тикер.</p>
            </div>
          </div>
        )}
      </Panel>
    </>
  );
}

function ScreenerTableRow({ row }: { row: StockScopeScreenerRow }) {
  return (
    <tr className="border-b border-[#eef2f7] text-sm transition hover:bg-[#f8fafc]">
      <td className="px-3 py-3">
        <Link href={`/stocks/${row.ticker}`} className="group flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0ff] text-xs font-bold text-[#1e40af]">{row.ticker.slice(0, 2)}</span>
          <span>
            <span className="block font-semibold text-[#0f172a] group-hover:text-[#0b63f6]">{row.name}</span>
            <span className="text-xs text-[#64748b]">{row.ticker}{row.isin ? ` · ${row.isin}` : ""}</span>
          </span>
        </Link>
      </td>
      <td className="px-3 py-3 text-[#475569]">{row.latestPeriod ?? "N/A"}</td>
      <td className="tabular-data px-3 py-3 text-right font-semibold text-[#0f172a]">{formatMoney(row.currentPrice)}</td>
      <td className="tabular-data px-3 py-3 text-right font-semibold text-[#0f172a]">{formatMoney(row.marketCap, true)}</td>
      <MetricCell value={row.roe} suffix="%" />
      <MetricCell value={row.roa} suffix="%" />
      <MetricCell value={row.pe} />
      <MetricCell value={row.pb} />
      <td className="px-3 py-3 text-right font-semibold text-[#0f172a]">{row.reportsCount}</td>
      <td className="px-3 py-3 text-right">
        <Link href={`/stocks/${row.ticker}`} aria-label={`Открыть ${row.ticker}`} className="inline-grid size-9 place-items-center rounded-xl border border-[#dbe4ef] text-[#1e40af] hover:border-[#93c5fd] hover:bg-[#eff6ff]">
          <ArrowUpRight size={16} />
        </Link>
      </td>
    </tr>
  );
}

function ScreenerCard({ row }: { row: StockScopeScreenerRow }) {
  return (
    <Link href={`/stocks/${row.ticker}`} className="rounded-[16px] border border-[#dbe4ef] bg-white p-4 transition hover:border-[#93c5fd]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#1e40af]">{row.ticker}</p>
          <h2 className="mt-1 font-semibold text-[#0f172a]">{row.name}</h2>
          <p className="mt-1 text-xs text-[#64748b]">{row.latestPeriod ?? "Период не указан"} · {row.reportsCount} отчётов</p>
        </div>
        <ArrowUpRight size={17} className="text-[#64748b]" />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        <TinyMetric label="ROE" value={formatMetric(row.roe, "%")} />
        <TinyMetric label="ROA" value={formatMetric(row.roa, "%")} />
        <TinyMetric label="P/E" value={formatMetric(row.pe)} />
        <TinyMetric label="P/B" value={formatMetric(row.pb)} />
      </div>
    </Link>
  );
}

function NumberFilter({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold text-[#475569]">{label}</span>
      <input name={name} defaultValue={value} inputMode="decimal" className="h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3 text-sm outline-none focus:border-[#0b63f6] focus:ring-4 focus:ring-[#0b63f6]/10" />
    </label>
  );
}

function MetricCell({ value, suffix = "" }: { value?: number | null; suffix?: string }) {
  return <td className="tabular-data px-3 py-3 text-right font-semibold text-[#0f172a]">{formatMetric(value, suffix)}</td>;
}

function TinyMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#f8fafc] p-2 text-center"><p className="text-[10px] font-semibold text-[#64748b]">{label}</p><p className="mt-1 text-xs font-bold text-[#0f172a]">{value}</p></div>;
}

function formatMetric(value?: number | null, suffix = "") {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}${suffix}` : "N/A";
}

function formatMoney(value?: number | null, compact = false) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("ru-RU", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 2 : 0,
  }).format(value);
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
