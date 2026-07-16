import Link from "next/link";
import { ArrowRight, GitCompareArrows, Search, Sparkles } from "lucide-react";
import { SourceStatusBadge } from "@/components/ui";
import { getStockScopeBatchDetails, getStockScopeScreener } from "@/lib/api";
import type { StockScopeDetails, StockScopeIndicatorPeriod } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Сравнение публичных компаний Узбекистана",
  description: "Сравните ROE, ROA, маржинальность, долговую нагрузку, отчётность и дивиденды узбекских эмитентов.",
  path: "/compare",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const rows = [
  ["ROE", "ROE", "%"],
  ["ROA", "ROA", "%"],
  ["NetProfitMargin", "Чистая маржа", "%"],
  ["GrossProfitMargin", "Валовая маржа", "%"],
  ["DebtToEquity", "Долг / капитал", "x"],
  ["CurrentRatio", "Текущая ликвидность", "x"],
  ["Revenue", "Выручка", ""],
  ["Earnings", "Чистая прибыль", ""],
] as const;

export default async function ComparePage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await Promise.resolve(searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const requestedTickers = [...new Set(first(params.tickers).split(/[,\s]+/).map((value) => value.trim().toUpperCase()).filter(Boolean))].slice(0, 6);
  const defaultTickers = requestedTickers.length
    ? requestedTickers
    : (await getStockScopeScreener({ limit: 3, sort_by: "market_cap", sort_dir: "desc" })).items.map((item) => item.ticker).filter(Boolean).slice(0, 3);
  const data = await getStockScopeBatchDetails(defaultTickers);
  const companies = data.items.filter((item) => item.ticker);
  const freshness = companies.find((company) => company.fetchedAt)?.fetchedAt;

  return (
    <div className="stitch-page">
      <section className="stitch-page-hero">
        <div>
          <span><GitCompareArrows size={18} aria-hidden="true" /> EINVEST COMPARE</span>
          <h1>Сравнение компаний</h1>
          <p>
            Сопоставьте качество бизнеса, оценку, раскрытие и дивидендную историю нескольких эмитентов на одной шкале.
          </p>
        </div>
        <Link className="stitch-button stitch-button-secondary" href="/screener">
          Выбрать в каталоге <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <section className="stitch-compare-command">
        <form>
          <label className="stitch-search-field">
            <Search size={18} aria-hidden="true" />
            <input name="tickers" defaultValue={defaultTickers.join(", ")} aria-label="Тикеры для сравнения" placeholder="SQBN, UZMT, HMKB" />
          </label>
          <button className="stitch-button stitch-button-primary" type="submit">
            <GitCompareArrows size={17} aria-hidden="true" /> Сравнить
          </button>
          <Link href="/industries" className="stitch-button stitch-button-secondary">
            По отраслям
          </Link>
        </form>
      </section>

      {companies.length ? (
        <>
          <section className="stitch-compare-grid">
            {companies.map((company) => <CompanyCard key={company.ticker} company={company} />)}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Матрица показателей</h2>
                <span>{companies.length} компаний · StockScope snapshot{freshness ? ` ${formatStamp(freshness)}` : ""}</span>
              </div>
              <SourceStatusBadge source="StockScope" status="delayed" />
            </div>
            <div className="data-table-wrap">
              <table className="data-table compare-table">
                <thead>
                  <tr>
                    <th>Показатель</th>
                    {companies.map((company) => <th key={company.ticker}>{company.ticker}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([key, label, suffix]) => (
                    <tr key={key}>
                      <td>{label}</td>
                      {companies.map((company) => <td key={company.ticker}>{formatValue(indicatorValues(company)[key], suffix)}</td>)}
                    </tr>
                  ))}
                  <ExtraRow label="Отчёты" companies={companies} value={(company) => String(company.reports?.length ?? 0)} />
                  <ExtraRow label="Дивиденды" companies={companies} value={(company) => String(company.dividends?.length ?? 0)} />
                  <ExtraRow label="Точек цены" companies={companies} value={(company) => String(company.priceHistory?.points?.length ?? 0)} />
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="stitch-empty">
          <GitCompareArrows size={26} aria-hidden="true" />
          <b>Нет данных для сравнения</b>
          <span>Проверьте тикеры или выберите компании из каталога.</span>
        </div>
      )}
    </div>
  );
}

function CompanyCard({ company }: { company: StockScopeDetails }) {
  const values = indicatorValues(company);
  const period = latest(company.indicators)?.period ?? "последний доступный период";
  return (
    <article className="stitch-compare-card">
      <div className="stitch-compare-card-top">
        <span><Sparkles size={14} aria-hidden="true" /> {company.ticker}</span>
        <Link href={`/stocks/${company.ticker}`} aria-label={`Открыть ${company.ticker}`}>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <h2>{company.ticker}</h2>
      <p>{period}</p>
      <dl>
        <div>
          <dt>ROE</dt>
          <dd className={Number(values.ROE) > 0 ? "positive" : ""}>{formatValue(values.ROE, "%")}</dd>
        </div>
        <div>
          <dt>ROA</dt>
          <dd className={Number(values.ROA) > 0 ? "positive" : ""}>{formatValue(values.ROA, "%")}</dd>
        </div>
        <div>
          <dt>Отчёты</dt>
          <dd>{company.reports?.length ?? 0}</dd>
        </div>
      </dl>
      <Link className="stitch-card-link" href={`/stocks/${company.ticker}`}>
        Карточка компании <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </article>
  );
}

function ExtraRow({ label, companies, value }: { label: string; companies: StockScopeDetails[]; value: (company: StockScopeDetails) => string }) {
  return <tr><td>{label}</td>{companies.map((company) => <td key={company.ticker}>{value(company)}</td>)}</tr>;
}

function latest(items?: StockScopeIndicatorPeriod[]) {
  return items?.find((item) => item.values) ?? items?.[0];
}

function indicatorValues(company: StockScopeDetails) {
  return latest(company.indicators)?.values ?? {};
}

function formatValue(value: number | null | undefined, suffix: string) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}${suffix}`
    : "—";
}

function formatStamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
