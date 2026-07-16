import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Bot,
  Building2,
  ChevronRight,
  Factory,
  Landmark,
  LineChart,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { getDashboardData, getStockScopeScreener } from "@/lib/api";
import type { NewsItem, StockScopeScreenerRow } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Платформа аналитики рынка капитала Узбекистана",
  description:
    "Профессиональные инструменты для анализа акций, облигаций, макроэкономики и публичных компаний Узбекистана.",
  path: "/",
});

const sectorIcons = [Landmark, Factory, Banknote, Building2, LineChart, TrendingUp];
const newsImages = ["/images/stitch-home/news-market.jpg", "/images/stitch-home/news-banking.jpg", "/images/stitch-home/news-macro.jpg"];

export default async function MarketOverview() {
  const [dashboard, screener] = await Promise.all([
    getDashboardData(),
    getStockScopeScreener({ limit: 12, sort_by: "market_cap", sort_dir: "desc" }),
  ]);

  const rows = screener.items;
  const indexItems = dashboard.indexes.slice(0, 5);
  const uci = indexItems.find((item) => item.ticker.toLowerCase().includes("uci") || item.name.toLowerCase().includes("uci")) ?? indexItems[0];
  const leaders = sortedBy(rows, (row) => row.marketCap).slice(0, 4);
  const totalTurnover = sum(rows, (row) => row.volume1d ?? row.volume7d ?? row.volume30d);
  const totalMarketCap = sum(rows, (row) => row.marketCap);
  const coveragePercent = coverageRatio(screener.coverage?.withReports, screener.coverage?.total ?? screener.total);
  const sectors = buildSectorCards(rows);
  const latestNews = dashboard.news.slice(0, 3);
  const latestMarketAsOf = latestStamp(indexItems.map((item) => item.asOf));
  const screenerFreshness = screener.coverage?.generatedAt ?? rows.find((row) => row.fetchedAt)?.fetchedAt;
  const marketIsLive = indexItems.length > 0 && indexItems.every((item) => item.sourceStatus === "live" && item.asOf);
  const activeIssuers = screener.coverage?.total ?? screener.total;

  return (
    <div className="stitch-home">
      <section className="stitch-hero" aria-labelledby="home-title">
        <div className="stitch-container stitch-hero-grid">
          <div className="stitch-hero-copy">
            <div className="stitch-live-pill">
              <Sparkles size={18} aria-hidden="true" />
              <span>{marketIsLive ? `LIVE по источнику · ${formatStamp(latestMarketAsOf)}` : "Данные показываются по доступным источникам"}</span>
            </div>
            <h1 id="home-title">Платформа аналитики <br /> рынка капитала Узбекистана</h1>
            <p>
              Профессиональные инструменты для анализа акций, облигаций и макроэкономических показателей.
              Принимайте взвешенные решения на основе проверяемых данных.
            </p>
            <div className="stitch-actions" aria-label="Основные действия">
              <Link className="stitch-button stitch-button-primary" href="/screener">
                Изучить рынок <TrendingUp size={19} aria-hidden="true" />
              </Link>
              <Link className="stitch-button stitch-button-secondary" href="/screener">
                Смотреть компании
              </Link>
            </div>
          </div>

          <div className="stitch-index-card" aria-label="Карточка рыночного индекса">
            <div className="stitch-index-head">
              <div>
                <h2>{uci?.name ?? "Индекс рынка"}</h2>
                <div className="stitch-index-value">
                  <span>{uci?.value ?? "—"}</span>
                  {typeof uci?.change === "number" ? <b className={tone(uci.change)}>{formatSignedPercent(uci.change)}</b> : null}
                </div>
                <small>{uci?.source ?? "источник не указан"}{uci?.asOf ? ` · ${formatStamp(uci.asOf)}` : ""}</small>
              </div>
              <div className="stitch-periods" aria-label="Период графика">
                <span>1D</span><b>1W</b><span>1M</span>
              </div>
            </div>
            <div className="stitch-chart" role="img" aria-label="Финансовый график из Stitch-макета" />
          </div>
        </div>
      </section>

      <section className="stitch-container stitch-metrics" aria-label="Ключевые показатели рынка">
        <MetricCard label={uci?.ticker || "UZSE Index"} value={uci?.value ?? "—"} change={uci?.change} />
        <MetricCard label="Оборот торгов" value={formatCompact(totalTurnover)} />
        <MetricCard label="Капитализация" value={formatCompact(totalMarketCap)} />
        <MetricCard label="Активные эмитенты" value={activeIssuers ? String(activeIssuers) : "—"} />
      </section>

      <section id="market" className="stitch-container stitch-market-grid">
        <div className="stitch-panel stitch-leaders">
          <div className="stitch-panel-head">
            <h2>Лидеры рынка</h2>
            <Link href="/screener">{screener.coverage?.sourceName ?? rows[0]?.sourceName ?? "StockScope"}{screenerFreshness ? ` · ${formatStamp(screenerFreshness)}` : ""}</Link>
          </div>
          <div className="stitch-table-wrap">
            <table className="stitch-table">
              <thead>
                <tr><th>Компания</th><th>Тикер</th><th>Цена</th><th>Изм. %</th><th>Кап.</th></tr>
              </thead>
              <tbody>
                {leaders.map((row) => (
                  <tr key={row.ticker}>
                    <td>
                      <Link href={`/stocks/${row.ticker}`} className="stitch-company">
                        <span>{row.name.charAt(0).toUpperCase()}</span>
                        <b>{row.name}</b>
                      </Link>
                    </td>
                    <td>{row.ticker}</td>
                    <td>{formatMoney(row.currentPrice)}</td>
                    <td className={tone(row.change1d)}>{formatSignedPercent(row.change1d)}</td>
                    <td>{formatCompact(row.marketCap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!leaders.length ? <EmptyBlock title="Котировки временно недоступны" text="Источник скринера не вернул компании для таблицы." /> : null}
          </div>
        </div>

        <aside className="stitch-ai-card">
          <div className="stitch-ai-badge">
            <Bot size={16} aria-hidden="true" />
            <span>AI INSIGHT</span>
          </div>
          <h2>Резюме по рынку</h2>
          <p>
            Сначала проверяйте ликвидность, свежесть отчётности и макрофон. Высокие мультипликаторы или дивидендная доходность
            без оборота могут быть предварительным сигналом, а не готовой инвестиционной идеей.
          </p>
          <div className="stitch-progress-card">
            <div>
              <span>ПОКРЫТИЕ ОТЧЁТНОСТЬЮ</span>
              <b>{coveragePercent == null ? "—" : `${coveragePercent}%`}</b>
            </div>
            <div className="stitch-progress"><i style={{ width: `${coveragePercent ?? 0}%` }} /></div>
          </div>
          <Link className="stitch-report-button" href="/ai">
            Подробный отчет <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </aside>
      </section>

      <section id="industries" className="stitch-container stitch-section">
        <h2>Отрасли</h2>
        <div className="stitch-industries">
          {sectors.map((sector, index) => {
            const Icon = sectorIcons[index % sectorIcons.length];
            return (
              <Link href={`/screener?sector=${encodeURIComponent(sector.name)}`} className="stitch-industry-card" key={sector.name}>
                <span><Icon size={24} aria-hidden="true" /></span>
                <b>{sector.name}</b>
                <small>{sector.count} эмит.</small>
              </Link>
            );
          })}
        </div>
        {!sectors.length ? <EmptyBlock title="Отрасли пока не размечены" text="Источник не вернул секторную классификацию компаний." /> : null}
      </section>

      <section id="macro" className="stitch-container stitch-section">
        <div className="stitch-section-head">
          <h2>Макроэкономика</h2>
          <Link href="/ai">AI-сводка <ChevronRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className="stitch-macro-grid">
          {dashboard.macro.slice(0, 4).map((item) => (
            <div className="stitch-macro-card" key={item.key}>
              <span>{item.label}</span>
              <b>{item.value}</b>
              <small>{item.source ?? "официальный источник"}{item.asOf ? ` · ${formatStamp(item.asOf)}` : ""}</small>
            </div>
          ))}
        </div>
        {!dashboard.macro.length ? <EmptyBlock title="Макроданные временно недоступны" text="CBU/stat.uz сейчас не вернули показатели." /> : null}
      </section>

      <section id="news" className="stitch-container stitch-section stitch-news-section">
        <div className="stitch-section-head">
          <h2>Последние новости</h2>
          <Link href="/news">Все новости <ChevronRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className="stitch-news-grid">
          {latestNews.map((item, index) => <NewsCard item={item} image={newsImages[index % newsImages.length]} key={item.id} />)}
        </div>
        {!latestNews.length ? <EmptyBlock title="Новостей нет" text="Источник новостей сейчас не вернул актуальные публикации." /> : null}
      </section>
    </div>
  );
}

function MetricCard({ label, value, change }: { label: string; value: string; change?: number }) {
  return (
    <div className="stitch-metric-card">
      <span>{label}</span>
      <div>
        <b>{value}</b>
        {typeof change === "number" ? <small className={tone(change)}>{formatSignedPercent(change)}</small> : null}
      </div>
    </div>
  );
}

function NewsCard({ item, image }: { item: NewsItem; image: string }) {
  return (
    <article className="stitch-news-card">
      <div className="stitch-news-image" style={{ backgroundImage: `url(${image})` }}>
        <span>{item.category || "Рынок"}</span>
      </div>
      <div className="stitch-news-body">
        <small>{item.time} · {item.source}</small>
        <h3>{item.title}</h3>
        {item.summary ? <p>{item.summary}</p> : null}
        <Link href={item.url || "/ai"} target={item.url ? "_blank" : undefined} rel={item.url ? "noreferrer" : undefined}>
          Читать полностью <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function EmptyBlock({ title, text }: { title: string; text: string }) {
  return <div className="stitch-empty"><Search size={18} aria-hidden="true" /><b>{title}</b><span>{text}</span></div>;
}

function buildSectorCards(rows: StockScopeScreenerRow[]) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const sector = row.sector?.trim();
    if (sector) counts.set(sector, (counts.get(sector) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));
}

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

function sum<T>(items: T[], pick: (item: T) => number | null | undefined) {
  const values = items.map(pick).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return values.length ? values.reduce((total, value) => total + value, 0) : undefined;
}

function coverageRatio(value?: number | null, total?: number | null) {
  if (!value || !total) return undefined;
  return Math.round((value / total) * 100);
}

function formatMoney(value?: number | null) {
  return value == null ? "—" : `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} UZS`;
}

function formatCompact(value?: number | null) {
  return value == null ? "—" : new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatSignedPercent(value?: number | null) {
  return value == null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function latestStamp(values: Array<string | undefined>) {
  return values.filter(Boolean).sort().at(-1);
}

function formatStamp(value?: string) {
  if (!value) return "нет времени";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function tone(value?: number | null) {
  return value == null ? "" : value > 0 ? "positive" : value < 0 ? "negative" : "";
}
