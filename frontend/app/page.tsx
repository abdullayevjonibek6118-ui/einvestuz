import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  ChevronRight,
  CircleAlert,
  Database,
  Landmark,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { getDashboardData, getStockScopeScreener } from "@/lib/api";
import type { StockScopeScreenerRow } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Аналитика фондового рынка Узбекистана", description: "Котировки, финансовые показатели, отчётность, дивиденды и новости публичных компаний Узбекистана в едином инвестиционном терминале.", path: "/" });

export default async function MarketOverview() {
  const [dashboard, screener] = await Promise.all([
    getDashboardData(),
    getStockScopeScreener({ limit: 10, sort_by: "market_cap", sort_dir: "desc" }),
  ]);
  const rows: StockScopeScreenerRow[] = screener.items;
  const indexItems = dashboard.indexes.slice(0, 5);
  const uci = indexItems.find((item) => item.ticker.toLowerCase().includes("uci") || item.name.toLowerCase().includes("uci")) ?? indexItems[0];
  const topTurnover = sortedBy(rows, (row) => row.volume30d ?? row.volume7d ?? row.volume1d).slice(0, 5);
  const topGrowth = sortedBy(rows, (row) => row.change1d).slice(0, 5);
  const topDecline = sortedBy(rows, (row) => row.change1d, "asc").slice(0, 5);
  const latestReports = [...rows].sort((a, b) => String(b.latestPeriod ?? "").localeCompare(String(a.latestPeriod ?? ""))).slice(0, 5);
  const latestTrades = rows.filter((row) => row.currentPrice != null).slice(0, 5);
  const marketIsLive = indexItems.length > 0 && indexItems.every((item) => item.sourceStatus === "live");

  return (
    <div className="market-overview">
      <section className="home-hero enter" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">EINVEST UZBEKISTAN MARKETS</p>
          <h1 id="home-title">Инвестиционный терминал для рынка Узбекистана</h1>
          <p className="hero-lede">Проверяйте эмитентов, ликвидность, отчётность и рыночные сигналы в одном рабочем пространстве с AI-помощником для учебного анализа.</p>
          <div className="hero-actions" aria-label="Основные действия">
            <Link href="/screener" className="terminal-button primary">Открыть скринер <ArrowRight size={15} /></Link>
            <Link href="/ai" className="terminal-button">Спросить AI <Bot size={15} /></Link>
          </div>
          <div className="hero-proof" aria-label="Ключевые возможности">
            <span><Activity size={15} /> UZSE и индексы</span>
            <span><ShieldCheck size={15} /> отчётность OpenInfo</span>
            <span><Landmark size={15} /> макро ЦБ / Stat.uz</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Визуальный концепт InvestAI">
          <Image src="/images/einvestuz-hero.png" alt="InvestAI mobile interface for Uzbekistan markets" fill priority sizes="(max-width: 900px) 100vw, 48vw" />
          <div className="hero-signal-card">
            <span><Sparkles size={13} /> AI brief</span>
            <strong>Ликвидность важнее красивого мультипликатора</strong>
            <em>Проверяйте объём торгов перед оценкой идеи.</em>
          </div>
        </div>
      </section>

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
            <div className="pulse-item"><span>Компаний в базе</span><b>{(screener.coverage?.total ?? screener.total) || "—"}</b><em>UZSE</em></div>
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

      <div className="insight-grid">
        <section className="panel">
          <div className="panel-header"><h2>UCI / индекс рынка</h2><span className="badge">UZSE</span></div>
          {uci ? (
            <div className="pulse-item">
              <span>{uci.name}</span>
              <b>{uci.value}</b>
              <em className={uci.change >= 0 ? "positive" : "negative"}>{uci.change >= 0 ? "+" : ""}{uci.change.toFixed(2)}%</em>
            </div>
          ) : <EmptyInline text="Индекс рынка временно недоступен" />}
        </section>
        <MarketMiniList title="Топ по обороту" rows={topTurnover} metric={(row) => formatCompact(row.volume30d ?? row.volume7d ?? row.volume1d)} note="объём UZSE" />
        <MarketMiniList title="Топ роста" rows={topGrowth} metric={(row) => formatPercent(row.change1d)} note="изменение 1D" />
        <MarketMiniList title="Топ падения" rows={topDecline} metric={(row) => formatPercent(row.change1d)} note="изменение 1D" />
      </div>

      <div className="insight-grid">
        <MarketMiniList title="Новые листинги" rows={latestReports} metric={(row) => row.listingCategory ?? row.latestPeriod ?? "—"} note="категория / свежий период" />
        <MarketMiniList title="Последние сделки" rows={latestTrades} metric={(row) => formatMoney(row.currentPrice)} note="последняя цена" />
        <MarketMiniList title="Последние отчёты компаний" rows={latestReports} metric={(row) => row.latestPeriod ?? `${row.reportsCount} отч.`} note="OpenInfo / disclosure" />
        <section className="panel">
          <div className="panel-header"><h2>AI market brief</h2><Bot size={16} /></div>
          <p className="text-sm leading-6 text-[#475569]">Рынок нужно читать через три слоя: UZSE показывает цену и оборот, OpenInfo подтверждает прибыль и капитал, CBU/stat.uz задают макрофон. Если объёма нет, даже сильные мультипликаторы стоит считать предварительным сигналом.</p>
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
        {!rows.length ? <div className="empty-state"><Search /><strong>Данные скринера недоступны</strong><span>Проверьте backend API и источники StockScope / UZSE.</span></div> : null}
      </section>

      <div className="insight-grid wide-grid">
        <section className="panel">
          <div className="panel-header"><h2>Экономика Узбекистана</h2><span className="badge"><Database size={11} /> CBU / STAT.UZ</span></div>
          <div className="macro-grid">
            {dashboard.macro.length ? dashboard.macro.slice(0, 4).map((item) => <div key={item.label}><span>{item.label}</span><b>{item.value}</b><small>{item.source ?? "официальные данные"}</small></div>) : <EmptyInline text="Макроданные временно недоступны" />}
          </div>
        </section>
        <section className="panel news-panel">
          <div className="panel-header"><h2>События рынка</h2><Link href="/ai">AI-сводка</Link></div>
          <div>{dashboard.news.length ? dashboard.news.slice(0, 4).map((item) => <article key={item.id}><span>{item.source} · {item.time}</span><h3>{item.title}</h3><p><CircleAlert size={13} /> AI оценит влияние на связанные компании</p></article>) : <div className="empty-state"><CircleAlert /><strong>Новостей нет</strong><span>Источник новостей сейчас не вернул актуальные публикации.</span></div>}</div>
        </section>
      </div>
    </div>
  );
}

function formatMoney(value?: number | null) { return value == null ? "—" : `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} UZS`; }
function formatCompact(value?: number | null) { return value == null ? "—" : new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
function formatPercent(value?: number | null) { return value == null ? "—" : `${value.toFixed(1)}%`; }
function formatRatio(value?: number | null) { return value == null ? "—" : value.toFixed(2); }
function tone(value?: number | null) { return value == null ? "" : value > 0 ? "positive" : value < 0 ? "negative" : ""; }
function EmptyInline({ text }: { text: string }) { return <div className="pulse-item"><span>{text}</span><b>—</b><em>OFFLINE</em></div>; }
function sortedBy<T>(items: T[], pick: (item: T) => number | null | undefined, direction: "asc" | "desc" = "desc") {
  return [...items].sort((a, b) => {
    const av = pick(a);
    const bv = pick(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return direction === "asc" ? av - bv : bv - av;
  });
}
function MarketMiniList({ title, rows, metric, note }: { title: string; rows: StockScopeScreenerRow[]; metric: (row: StockScopeScreenerRow) => string; note: string }) {
  return (
    <section className="panel">
      <div className="panel-header"><h2>{title}</h2><span>{note}</span></div>
      <div className="mini-list">
        {rows.length ? rows.map((row) => (
          <Link key={`${title}-${row.ticker}`} href={`/stocks/${row.ticker}`} className="mini-list-item">
            <span><strong>{row.ticker}</strong><small>{row.name}</small></span>
            <b className={tone(row.change1d ?? row.roe)}>{metric(row)}</b>
          </Link>
        )) : <div className="empty-state"><strong>Нет данных</strong><span>Источник пока не вернул строки для этого блока.</span></div>}
      </div>
    </section>
  );
}
