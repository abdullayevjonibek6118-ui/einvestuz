import Link from "next/link";
import { ArrowRight, Bot, ChevronRight, CircleAlert, Database, Search, TrendingUp } from "lucide-react";
import { getDashboardData, getStockScopeScreener } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Аналитика фондового рынка Узбекистана", description: "Котировки, финансовые показатели, отчётность, дивиденды и новости публичных компаний Узбекистана в едином инвестиционном терминале.", path: "/" });

export default async function MarketOverview() {
  const [dashboard, screener] = await Promise.all([
    getDashboardData(),
    getStockScopeScreener({ limit: 10, sort_by: "market_cap", sort_dir: "desc" }),
  ]);
  const rows = screener.items.length ? screener.items : fallbackRows;
  const indexItems = dashboard.indexes.slice(0, 5);
  const marketIsLive = indexItems.length > 0 && indexItems.every((item) => item.sourceStatus === "live");

  return (
    <div className="market-overview">
      <div className="page-heading enter">
        <div>
          <p className="eyebrow">UZBEKISTAN MARKET INTELLIGENCE</p>
          <h1>Понять рынок. Проверить компанию. Принять решение.</h1>
          <p>Финансовая отчётность, торговая статистика и AI-анализ узбекских компаний в одном исследовательском терминале.</p>
        </div>
        <span className="as-of">Данные обновляются</span>
      </div>

      <section className="command-bar enter enter-delay" aria-label="Поиск по рынку">
        <Search size={20} />
        <div><strong>Найдите компанию или задайте вопрос</strong><span>Например: A011030, Kapitalbank или «покажи компании с ROE выше 15%»</span></div>
        <Link href="/screener" className="terminal-button primary">Исследовать рынок <ArrowRight size={15} /></Link>
      </section>

      <div className="overview-grid">
        <section className="panel market-pulse">
          <div className="panel-header"><h2>Пульс рынка</h2><span className={marketIsLive ? "badge live" : "badge"}><i /> {marketIsLive ? "LIVE DATA" : "DELAYED DATA"}</span></div>
          <div className="pulse-grid">
            {indexItems.length ? indexItems.map((item) => (
              <div className="pulse-item" key={item.ticker}>
                <span>{item.name}</span><b>{item.value}</b><em className={item.change >= 0 ? "positive" : "negative"}>{item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%</em>
              </div>
            )) : <EmptyInline text="Индексы временно недоступны" />}
            <div className="pulse-item"><span>Компаний в базе</span><b>{screener.coverage?.total ?? screener.total ?? 166}</b><em>UZSE</em></div>
          </div>
        </section>

        <section className="panel ai-brief">
          <div className="panel-header"><h2>AI market brief</h2><Bot size={16} /></div>
          <div className="panel-body">
            <span className="brief-signal"><TrendingUp size={13} /> ОБРАЗОВАТЕЛЬНЫЙ ОБЗОР</span>
            <h2>Проверяйте ликвидность каждого выпуска</h2>
            <p>Перед покупкой проверяйте глубину торгов, динамику прибыли и качество раскрытия. Высокая доходность без объёма может быть трудна для реализации.</p>
            <Link href="/ai">Открыть полный разбор <ChevronRight size={14} /></Link>
          </div>
        </section>
      </div>

      <section className="panel market-table-panel">
        <div className="panel-header">
          <div><h2>Рынок акций Узбекистана</h2><span>{screener.total} инструментов · фундаментальные показатели</span></div>
          <Link href="/screener">Все акции <ArrowRight size={14} /></Link>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>#</th><th>Компания</th><th>Цена</th><th>Капитализация</th><th>ROE</th><th>ROA</th><th>P/E</th><th>P/B</th><th>Див.</th><th>Профиль</th></tr></thead>
            <tbody>{rows.map((row, index) => (
              <tr key={row.ticker}>
                <td>{index + 1}</td>
                <td className="company-cell"><Link href={`/stocks/${row.ticker}`}><span className="ticker">{row.ticker}</span><small>{row.name}</small></Link></td>
                <td>{formatMoney(row.currentPrice)}</td><td>{formatCompact(row.marketCap)}</td>
                <td className={tone(row.roe)}>{formatPercent(row.roe)}</td><td className={tone(row.roa)}>{formatPercent(row.roa)}</td>
                <td>{formatRatio(row.pe)}</td><td>{formatRatio(row.pb)}</td><td>{formatPercent(row.dividendYield)}</td>
                <td><Link href={`/stocks/${row.ticker}`} className="row-arrow" aria-label={`Открыть ${row.ticker}`}><ArrowRight size={15} /></Link></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <div className="insight-grid">
        <section className="panel">
          <div className="panel-header"><h2>Экономика Узбекистана</h2><span className="badge"><Database size={11} /> CBU / STAT.UZ</span></div>
          <div className="macro-grid">
            {(dashboard.macro.length ? dashboard.macro.slice(0, 4) : fallbackMacro).map((item) => <div key={item.label}><span>{item.label}</span><b>{item.value}</b><small>{item.source ?? "официальные данные"}</small></div>)}
          </div>
        </section>
        <section className="panel news-panel">
          <div className="panel-header"><h2>События рынка</h2><Link href="/ai">AI-сводка</Link></div>
          <div>{dashboard.news.slice(0, 4).map((item) => <article key={item.id}><span>{item.source} · {item.time}</span><h3>{item.title}</h3><p><CircleAlert size={13} /> AI оценит влияние на связанные компании</p></article>)}</div>
        </section>
      </div>
    </div>
  );
}

const fallbackMacro = [
  { label: "Ставка ЦБ", value: "14,0%", source: "ЦБ Узбекистана" },
  { label: "Инфляция", value: "8,7%", source: "Stat.uz" },
  { label: "ВВП", value: "+6,5%", source: "Stat.uz" },
  { label: "Резервы", value: "$41,2B", source: "ЦБ Узбекистана" },
];
const fallbackRows = [
  { ticker: "A011030", name: "O'zlitineftgaz aksiyadorlik jamiyati", currentPrice: 242500, marketCap: 47312962500, roe: 9.371, roa: 2.8195, pe: 7.9192, pb: 0.7421, dividendYield: 6.1856, reportsCount: 37, indicatorsCount: 37, dividendsCount: 11, pricePointsCount: 813 },
];
function formatMoney(value?: number | null) { return value == null ? "—" : `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} UZS`; }
function formatCompact(value?: number | null) { return value == null ? "—" : new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
function formatPercent(value?: number | null) { return value == null ? "—" : `${value.toFixed(1)}%`; }
function formatRatio(value?: number | null) { return value == null ? "—" : value.toFixed(2); }
function tone(value?: number | null) { return value == null ? "" : value > 0 ? "positive" : value < 0 ? "negative" : ""; }
function EmptyInline({ text }: { text: string }) { return <div className="pulse-item"><span>{text}</span><b>—</b><em>OFFLINE</em></div>; }
