import Link from "next/link";
import { ArrowRight, Building2, Factory, LineChart, Search } from "lucide-react";
import { getIndustriesSummary } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Отрасли рынка капитала Узбекистана",
  description: "Секторная карта эмитентов Узбекистана: капитализация, отчётность, ROE и лидеры отраслей.",
  path: "/industries",
});

export default async function IndustriesPage() {
  const industries = await getIndustriesSummary();
  const largest = industries[0];

  return (
    <div className="stitch-page">
      <section className="stitch-page-hero">
        <div>
          <span><Factory size={17} /> INDUSTRY MAP</span>
          <h1>Отрасли</h1>
          <p>Секторная карта рынка Узбекистана: где сосредоточена капитализация, раскрытие и финансовые показатели.</p>
        </div>
        <Link href="/screener" className="stitch-button stitch-button-primary"><Search size={18} /> Фильтровать компании</Link>
      </section>

      <section className="stitch-metrics">
        <Metric label="Отраслей" value={String(industries.length || "—")} />
        <Metric label="Эмитентов" value={String(sum(industries.map((item) => item.issuers)) || "—")} />
        <Metric label="Капитализация" value={formatCompact(sum(industries.map((item) => item.marketCap)))} />
        <Metric label="Крупнейшая отрасль" value={largest?.name ?? "—"} />
      </section>

      <section className="stitch-industry-summary-grid">
        {industries.map((industry) => (
          <article className="stitch-industry-summary-card" key={industry.slug}>
            <div className="stitch-card-icon"><Building2 size={22} /></div>
            <div>
              <h2>{industry.name}</h2>
              <p>{industry.issuers} эмитентов · {industry.withReports} с отчётностью</p>
            </div>
            <dl>
              <div><dt>Market cap</dt><dd>{formatCompact(industry.marketCap)}</dd></div>
              <div><dt>ROE ср.</dt><dd className={tone(industry.averageRoe)}>{formatPercent(industry.averageRoe)}</dd></div>
              <div><dt>30D</dt><dd className={tone(industry.averageChange30d)}>{formatPercent(industry.averageChange30d)}</dd></div>
            </dl>
            <div className="stitch-leader-stack">
              {industry.leaders.slice(0, 3).map((leader) => (
                <Link href={`/stocks/${leader.ticker}`} key={leader.ticker}>
                  <span>{leader.ticker}</span>
                  <b>{formatCompact(leader.marketCap)}</b>
                </Link>
              ))}
            </div>
            <Link className="stitch-card-link" href={`/screener?sector=${encodeURIComponent(industry.name)}`}>
              Открыть сектор <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>

      {!industries.length ? <div className="stitch-empty"><LineChart size={18} /><b>Секторы не найдены</b><span>StockScope provider не вернул секторную классификацию.</span></div> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="stitch-metric-card"><span>{label}</span><div><b>{value}</b></div></div>;
}
function sum(values: Array<number | null | undefined>) {
  const numeric = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return numeric.length ? numeric.reduce((total, value) => total + value, 0) : undefined;
}
function formatCompact(value?: number | null) { return value == null ? "—" : new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
function formatPercent(value?: number | null) { return value == null ? "—" : `${value.toFixed(1)}%`; }
function tone(value?: number | null) { return value == null ? "" : value > 0 ? "positive" : value < 0 ? "negative" : ""; }
