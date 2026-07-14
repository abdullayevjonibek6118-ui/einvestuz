import Link from "next/link";
import { ArrowRight, BarChart3, Database, LineChart } from "lucide-react";
import { getDashboardData, getSources } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Макроэкономика Узбекистана",
  description: "Курсы валют, индикаторы ЦБ, официальная статистика и макрофон для рынка капитала Узбекистана.",
  path: "/macro",
});

export default async function MacroPage() {
  const [dashboard, sources] = await Promise.all([getDashboardData(), getSources()]);
  const macroSources = sources.filter((source) => /cbu|stat|siat|macro|fx|макро|цб/i.test(`${source.id} ${source.name} ${source.coverage}`));
  const usd = dashboard.fxRates.find((rate) => rate.base === "USD" || rate.pair === "USD/UZS");

  return (
    <div className="stitch-page">
      <section className="stitch-page-hero">
        <div>
          <span><BarChart3 size={17} /> MACRO DASHBOARD</span>
          <h1>Макроэкономика Узбекистана</h1>
          <p>Официальный макрофон: валютные курсы, ставки, статистика и источники, влияющие на оценку эмитентов.</p>
        </div>
        <Link href="/ai" className="stitch-button stitch-button-primary"><LineChart size={18} /> AI-анализ влияния</Link>
      </section>

      <section className="stitch-macro-grid">
        <div className="stitch-macro-card">
          <span>USD/UZS</span>
          <b>{usd ? usd.rate.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) : "—"}</b>
          <small>{usd?.source ?? "CBU"}</small>
        </div>
        {dashboard.macro.slice(0, 7).map((item) => (
          <div className="stitch-macro-card" key={item.key}>
            <span>{item.label}</span>
            <b>{item.value}</b>
            <small>{item.source ?? "официальный источник"}</small>
          </div>
        ))}
      </section>

      {!dashboard.macro.length ? <div className="stitch-empty"><Database size={18} /><b>Макроданные временно недоступны</b><span>Проверьте CBU/stat.uz provider в backend.</span></div> : null}

      <section className="stitch-panel stitch-source-panel">
        <div className="stitch-panel-head">
          <h2>Источники данных</h2>
          <Link href="/screener">Перейти к компаниям <ArrowRight size={16} /></Link>
        </div>
        <div className="stitch-source-list">
          {(macroSources.length ? macroSources : sources).slice(0, 8).map((source) => (
            <a href={source.url || "#"} target={source.url ? "_blank" : undefined} rel={source.url ? "noreferrer" : undefined} key={source.id}>
              <span><Database size={17} /></span>
              <b>{source.name}</b>
              <small>{source.coverage} · {source.status}</small>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
