import Link from "next/link";
import { ArrowUpRight, GitCompareArrows, Search, ShieldCheck } from "lucide-react";
import { Metric, PageHeader, Panel, SourceStatusBadge } from "@/components/ui";
import { getStockScopeBatchDetails } from "@/lib/api";
import type { StockScopeDetails, StockScopeIndicatorPeriod } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const defaultTickers = ["A011030", "AGBA", "UZMK"];
const metrics = [
  ["ROE", "ROE", "%"],
  ["ROA", "ROA", "%"],
  ["NetProfitMargin", "Чистая маржа", "%"],
  ["GrossProfitMargin", "Валовая маржа", "%"],
  ["DebtToEquity", "Debt / Equity", "x"],
  ["CurrentRatio", "Current ratio", "x"],
  ["Revenue", "Выручка", ""],
  ["Earnings", "Чистая прибыль", ""],
] as const;

export default async function ComparePage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await Promise.resolve(searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const rawTickers = first(params.tickers);
  const tickers = parseTickers(rawTickers || defaultTickers.join(","));
  const data = await getStockScopeBatchDetails(tickers);
  const companies = data.items.filter((item) => item.ticker);

  return (
    <>
      <PageHeader
        title="Сравнение компаний"
        subtitle="Сопоставьте рентабельность, долговую нагрузку, отчётность и глубину рыночных данных для нескольких узбекских эмитентов."
      />

      <Panel title="Выберите до 6 тикеров" action={<SourceStatusBadge source="stockscope.uz" status="delayed" />}>
        <form className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-3 focus-within:border-[#0b63f6] focus-within:ring-4 focus-within:ring-[#0b63f6]/10">
            <Search size={16} className="text-[#64748b]" />
            <input name="tickers" defaultValue={tickers.join(", ")} placeholder="A011030, AGBA, UZMK" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
          <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b63f6] px-4 text-sm font-semibold text-white hover:bg-[#084fc7]">
            <GitCompareArrows size={16} />
            Сравнить
          </button>
          <Link href="/screener" className="inline-flex h-11 items-center justify-center rounded-xl border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc]">Открыть скринер</Link>
        </form>
      </Panel>

      {companies.length ? (
        <>
          <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => <CompanySummary key={company.ticker} company={company} />)}
          </section>

          <Panel title="Сравнение метрик" action={<span className="text-xs font-semibold text-[#64748b]">{companies.length} компаний</span>} className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-xs text-[#64748b]">
                    <th className="px-3 py-3 font-semibold">Показатель</th>
                    {companies.map((company) => <th key={company.ticker} className="px-3 py-3 text-right font-semibold text-[#0f172a]">{company.ticker}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map(([key, label, suffix]) => (
                    <tr key={key} className="border-b border-[#eef2f7] text-sm">
                      <td className="px-3 py-3 font-medium text-[#475569]">{label}</td>
                      {companies.map((company) => (
                        <td key={company.ticker} className="tabular-data px-3 py-3 text-right font-semibold text-[#0f172a]">
                          {formatMetric(latestValues(company)[key], suffix)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <ComparisonRow label="Отчёты" companies={companies} value={(company) => String(company.reports?.length ?? 0)} />
                  <ComparisonRow label="Дивиденды" companies={companies} value={(company) => String(company.dividends?.length ?? 0)} />
                  <ComparisonRow label="История цены" companies={companies} value={(company) => `${company.priceHistory?.points?.length ?? 0} точек`} />
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      ) : (
        <Panel className="mt-4">
          <div className="grid min-h-56 place-items-center text-center">
            <div>
              <GitCompareArrows className="mx-auto text-[#94a3b8]" />
              <p className="mt-3 font-semibold text-[#0f172a]">Нет данных для сравнения</p>
              <p className="mt-1 text-sm text-[#64748b]">Проверьте тикеры или выберите компании в скринере.</p>
            </div>
          </div>
        </Panel>
      )}
    </>
  );
}

function CompanySummary({ company }: { company: StockScopeDetails }) {
  const latest = latestIndicator(company.indicators);
  const values = latest?.values ?? {};
  return (
    <article className="rounded-[18px] border border-[#dbe4ef] bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#1e40af]">{company.ticker}</p>
          <h2 className="mt-1 text-lg font-semibold text-[#0f172a]">{company.ticker}</h2>
          <p className="mt-1 text-xs text-[#64748b]">{latest?.period ?? "Последний период не указан"}</p>
        </div>
        <Link href={`/stocks/${company.ticker}`} aria-label={`Открыть ${company.ticker}`} className="grid size-10 place-items-center rounded-xl border border-[#dbe4ef] text-[#1e40af] hover:bg-[#eff6ff]">
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric label="ROE" value={formatMetric(values.ROE, "%")} />
        <Metric label="ROA" value={formatMetric(values.ROA, "%")} />
        <Metric label="Отчёты" value={String(company.reports?.length ?? 0)} />
        <Metric label="Цена" value={`${company.priceHistory?.points?.length ?? 0} точек`} />
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#f0fdf4] p-3 text-xs font-medium text-[#166534]">
        <ShieldCheck size={15} />
        {company.companyType === "bank" ? "Банковская модель показателей" : "Модель показателей АО"}
      </div>
    </article>
  );
}

function ComparisonRow({ label, companies, value }: { label: string; companies: StockScopeDetails[]; value: (company: StockScopeDetails) => string }) {
  return (
    <tr className="border-b border-[#eef2f7] text-sm">
      <td className="px-3 py-3 font-medium text-[#475569]">{label}</td>
      {companies.map((company) => <td key={company.ticker} className="px-3 py-3 text-right font-semibold text-[#0f172a]">{value(company)}</td>)}
    </tr>
  );
}

function latestIndicator(indicators?: StockScopeIndicatorPeriod[]) {
  return indicators?.find((item) => item.values) ?? indicators?.[0];
}

function latestValues(company: StockScopeDetails) {
  return latestIndicator(company.indicators)?.values ?? {};
}

function formatMetric(value: number | null | undefined, suffix: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  if (Math.abs(value) >= 1_000_000) return `${new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 2 }).format(value)}${suffix}`;
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}${suffix}`;
}

function parseTickers(value: string) {
  return [...new Set(value.split(/[\s,;]+/).map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))].slice(0, 6);
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
