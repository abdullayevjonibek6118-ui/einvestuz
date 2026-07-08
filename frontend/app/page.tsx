import Link from "next/link";
import { ArrowRight, Bot, ChevronRight, CircleAlert, Database, Search, TrendingUp } from "lucide-react";
import { getDashboardData, getStockScopeScreener } from "@/lib/api";
import type { StockScopeScreenerRow } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Аналитика фондового рынка Узбекистана", description: "Котировки, финансовые показатели, отчётность, дивиденды и новости публичных компаний Узбекистана в едином инвестиционном терминале.", path: "/" });

export default async function MarketOverview() {
  const [dashboard, screener] = await Promise.all([
    getDashboardData(),
    getStockScopeScreener({ limit: 10, sort_by: "market_cap", sort_dir: "desc" }),
  ]);
  const rows: StockScopeScreenerRow[] = screener.items.length ? screener.items : fallbackRows;
  const indexItems = dashboard.indexes.slice(0, 5);
  const uci = indexItems.find((item) => item.ticker.toLowerCase().includes("uci") || item.name.toLowerCase().includes("uci")) ?? indexItems[0];
  const topTurnover = sortedBy(rows, (row) => row.volume30d ?? row.volume7d ?? row.volume1d ?? row.marketCap).slice(0, 5);
  const topGrowth = sortedBy(rows, (row) => row.change1d ?? row.roe).slice(0, 5);
  const topDecline = sortedBy(rows, (row) => row.change1d ?? row.roe, "asc").slice(0, 5);
  const latestReports = [...rows].sort((a, b) => String(b.latestPeriod ?? "").localeCompare(String(a.latestPeriod ?? ""))).slice(0, 5);
  const latestTrades = rows.filter((row) => row.currentPrice != null).slice(0, 5);
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
        <MarketMiniList title="Топ по обороту" rows={topTurnover} metric={(row) => formatCompact(row.volume30d ?? row.volume7d ?? row.volume1d ?? row.marketCap)} note="объём UZSE / fallback market cap" />
        <MarketMiniList title="Топ роста" rows={topGrowth} metric={(row) => formatPercent(row.change1d ?? row.roe)} note="1D / fallback ROE" />
        <MarketMiniList title="Топ падения" rows={topDecline} metric={(row) => formatPercent(row.change1d ?? row.roe)} note="1D / fallback ROE" />
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
  { label: "Инфляция", value: "5,5%", source: "ЦБ Узбекистана" },
  { label: "ВВП", value: "+8,7%", source: "Stat.uz" },
  { label: "Резервы", value: "$41,2B", source: "ЦБ Узбекистана" },
];
const fallbackRows: StockScopeScreenerRow[] = [
  { ticker: "A011030", name: "O'zlitineftgaz aksiyadorlik jamiyati", currentPrice: 242500, marketCap: 47312962500, roe: 9.371, roa: 2.8195, pe: 7.9192, pb: 0.7421, dividendYield: 6.1856, reportsCount: 37, indicatorsCount: 37, dividendsCount: 11, pricePointsCount: 813 },
];
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
      <div className="space-y-2">
        {rows.map((row) => (
          <Link key={`${title}-${row.ticker}`} href={`/stocks/${row.ticker}`} className="flex items-center justify-between gap-3 rounded-[14px] border border-[#dbe4ef] bg-[#f8fafc] p-3 text-sm transition hover:bg-white">
            <span><strong className="text-[#0f172a]">{row.ticker}</strong><small className="block text-[#64748b]">{row.name}</small></span>
            <b className={tone(row.change1d ?? row.roe)}>{metric(row)}</b>
          </Link>
        ))}
      </div>
    </section>
  );
}
