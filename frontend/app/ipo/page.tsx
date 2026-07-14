import Link from "next/link";
import { ArrowRight, Bell, CircleAlert, Landmark } from "lucide-react";
import { getIpoSummary } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "IPO и новые листинги",
  description: "Радар IPO, новых листингов и эмитентов с ограниченным раскрытием на рынке Узбекистана.",
  path: "/ipo",
});

export default async function IpoPage() {
  const data = await getIpoSummary();

  return (
    <div className="stitch-page">
      <section className="stitch-page-hero">
        <div>
          <span><Landmark size={17} /> IPO RADAR</span>
          <h1>IPO и новые листинги</h1>
          <p>Отслеживайте эмитентов с признаками IPO/listing watch: категория листинга, капитализация, объём и полнота раскрытия.</p>
        </div>
        <Link href="/screener?min_reports=0" className="stitch-button stitch-button-primary"><Bell size={18} /> Настроить watchlist</Link>
      </section>

      <section className="stitch-metrics">
        <Metric label="Кандидатов" value={String(data.total || "—")} />
        <Metric label="В выдаче" value={String(data.items.length || "—")} />
        <Metric label="Источник" value={data.source} />
        <Metric label="Статус" value={data.status} />
      </section>

      <section className="stitch-panel">
        <div className="stitch-panel-head">
          <h2>Радар листингов</h2>
          <Link href="/screener">Открыть скринер <ArrowRight size={16} /></Link>
        </div>
        <div className="stitch-table-wrap">
          <table className="stitch-table">
            <thead><tr><th>Компания</th><th>Категория</th><th>Сектор</th><th>Market cap</th><th>Объём 30D</th><th>Раскрытие</th><th></th></tr></thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.ticker}>
                  <td><Link className="stitch-company" href={`/stocks/${item.ticker}`}><span>{item.ticker.slice(0, 1)}</span><b>{item.name}</b></Link></td>
                  <td>{item.listingCategory ?? "—"}</td>
                  <td>{item.sector ?? "—"}</td>
                  <td>{formatCompact(item.marketCap)}</td>
                  <td>{formatCompact(item.volume30d)}</td>
                  <td>{item.reportsCount ? `${item.reportsCount} отч.` : "нет отчётов"}</td>
                  <td><Link className="row-arrow" href={`/stocks/${item.ticker}`} aria-label={`Открыть ${item.ticker}`}><ArrowRight size={14} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.items.length ? <div className="stitch-empty"><CircleAlert size={18} /><b>IPO-кандидаты не найдены</b><span>Backend не обнаружил IPO/listing-сигналы в текущем покрытии StockScope.</span></div> : null}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="stitch-metric-card"><span>{label}</span><div><b>{value}</b></div></div>;
}
function formatCompact(value?: number | null) { return value == null ? "—" : new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
