import Link from "next/link";
import { ArrowRight, Filter, GitCompareArrows, RotateCcw, Search } from "lucide-react";
import { Metric, PageHeader, SourceStatusBadge } from "@/components/ui";
import { getStockScopeScreener } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({ title: "Скринер акций Узбекистана", description: "Фильтр компаний Узбекистана по листингу, сектору, капитализации, мультипликаторам, дивидендам, объёму торгов, динамике цены и свежей отчётности.", path: "/screener" });

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const sorts = [
  ["market_cap", "Капитализация"],
  ["volume_30d", "Объём 30D"],
  ["change_1d", "Изменение 1D"],
  ["change_7d", "Изменение 7D"],
  ["change_30d", "Изменение 30D"],
  ["roe", "ROE"],
  ["pe", "P/E"],
  ["pb", "P/B"],
  ["dividend_yield", "Дивиденды"],
  ["reports_count", "Раскрытие"],
];

const listingCategories = ["Premium", "Standard", "Bond", "Transit"];

export default async function ScreenerPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await Promise.resolve(searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const f = {
    q: first(params.q),
    listing_category: first(params.listing_category),
    sector: first(params.sector),
    min_market_cap: first(params.min_market_cap),
    max_market_cap: first(params.max_market_cap),
    max_pe: first(params.max_pe),
    max_pb: first(params.max_pb),
    min_roe: first(params.min_roe),
    min_dividend_yield: first(params.min_dividend_yield),
    min_volume: first(params.min_volume),
    min_change_1d: first(params.min_change_1d),
    min_change_7d: first(params.min_change_7d),
    min_change_30d: first(params.min_change_30d),
    fresh_reports: first(params.fresh_reports),
    min_reports: first(params.min_reports),
    sort_by: first(params.sort_by) || "market_cap",
    sort_dir: first(params.sort_dir) || "desc",
    limit: 100,
  };
  const data = await getStockScopeScreener(f);
  const leaders = data.items.slice(0, 3).map((item) => item.ticker).join(",");

  return (
    <>
      <PageHeader title="Скринер акций" subtitle="Отберите узбекские компании по листингу, сектору, ликвидности, оценке, дивидендам и качеству раскрытия." />
      <div className="screener-layout">
        <aside className="panel filter-panel">
          <div className="panel-header">
            <h2><Filter size={14} /> Фильтры</h2>
            <Link href="/screener" aria-label="Сбросить"><RotateCcw size={14} /></Link>
          </div>
          <form className="filter-form">
            <label><span>Компания / тикер / ISIN</span><div className="input-control"><Search size={15} /><input name="q" defaultValue={f.q} placeholder="A011030" /></div></label>
            <label>
              <span>Категория листинга</span>
              <select name="listing_category" defaultValue={f.listing_category}>
                <option value="">Любая</option>
                {listingCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label><span>Сектор</span><input name="sector" defaultValue={f.sector} placeholder="Банк, промышленность..." /></label>
            <div className="filter-pair"><NumberField name="min_market_cap" label="Market cap от" value={f.min_market_cap} /><NumberField name="max_market_cap" label="Market cap до" value={f.max_market_cap} /></div>
            <div className="filter-pair"><NumberField name="max_pe" label="P/E до" value={f.max_pe} /><NumberField name="max_pb" label="P/B до" value={f.max_pb} /></div>
            <div className="filter-pair"><NumberField name="min_roe" label="ROE от, %" value={f.min_roe} /><NumberField name="min_dividend_yield" label="Див. доходность от, %" value={f.min_dividend_yield} /></div>
            <NumberField name="min_volume" label="Объём торгов от" value={f.min_volume} />
            <div className="filter-pair"><NumberField name="min_change_1d" label="1D от, %" value={f.min_change_1d} /><NumberField name="min_change_7d" label="7D от, %" value={f.min_change_7d} /></div>
            <NumberField name="min_change_30d" label="30D от, %" value={f.min_change_30d} />
            <label>
              <span>Свежая отчётность</span>
              <select name="fresh_reports" defaultValue={f.fresh_reports}>
                <option value="">Не важно</option>
                <option value="true">Есть</option>
              </select>
            </label>
            <NumberField name="min_reports" label="Минимум отчётов" value={f.min_reports} />
            <label><span>Сортировать по</span><select name="sort_by" defaultValue={f.sort_by}>{sorts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label><span>Порядок</span><select name="sort_dir" defaultValue={f.sort_dir}><option value="desc">По убыванию</option><option value="asc">По возрастанию</option></select></label>
            <button className="terminal-button primary" type="submit"><Filter size={14} /> Применить</button>
          </form>
        </aside>
        <div className="screener-results">
          <section className="metric-row">
            <Metric label="В базе" value={String(data.coverage?.total ?? data.total)} detail="эмитентов" />
            <Metric label="С отчётностью" value={String(data.coverage?.withReports ?? "—")} detail="openinfo / disclosure" />
            <Metric label="С дивидендами" value={String(data.coverage?.withDividends ?? "—")} detail="компаний" />
            <Metric label="Найдено" value={String(data.total)} detail="по фильтрам" />
          </section>
          <section className="panel">
            <div className="panel-header">
              <div><h2>Результаты</h2><span>{data.total} компаний · объёмы и 1D/7D/30D появятся после UZSE ingestion</span></div>
              <div className="header-actions"><SourceStatusBadge source="UZSE / OpenInfo / StockScope" status="delayed" /><Link href={`/compare?tickers=${leaders}`} className="terminal-button"><GitCompareArrows size={14} /> Сравнить</Link></div>
            </div>
            <div className="data-table-wrap">
              <table className="data-table screener-table">
                <thead><tr><th>Компания</th><th>Листинг</th><th>Сектор</th><th>Цена</th><th>Market cap</th><th>P/E</th><th>P/B</th><th>ROE</th><th>Див.</th><th>Объём</th><th>1D</th><th>7D</th><th>30D</th><th>Отчёт</th><th></th></tr></thead>
                <tbody>{data.items.map((row) => (
                  <tr key={row.ticker}>
                    <td className="company-cell"><Link href={`/stocks/${row.ticker}`}><span className="ticker">{row.ticker}</span><small>{row.name}</small></Link></td>
                    <td>{row.listingCategory ?? "—"}</td>
                    <td>{row.sector ?? "—"}</td>
                    <td>{money(row.currentPrice)}</td>
                    <td>{compact(row.marketCap)}</td>
                    <td>{ratio(row.pe)}</td>
                    <td>{ratio(row.pb)}</td>
                    <td className={tone(row.roe)}>{pct(row.roe)}</td>
                    <td>{pct(row.dividendYield)}</td>
                    <td>{compact(row.volume30d ?? row.volume7d ?? row.volume1d)}</td>
                    <td className={tone(row.change1d)}>{pct(row.change1d)}</td>
                    <td className={tone(row.change7d)}>{pct(row.change7d)}</td>
                    <td className={tone(row.change30d)}>{pct(row.change30d)}</td>
                    <td>{(row.hasFreshReport ?? row.reportsCount > 0) ? row.latestPeriod ?? "есть" : "—"}</td>
                    <td><Link className="row-arrow" href={`/stocks/${row.ticker}`}><ArrowRight size={14} /></Link></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {!data.items.length ? <div className="empty-state"><Search /><strong>Ничего не найдено</strong><span>Измените значения фильтров.</span></div> : null}
          </section>
        </div>
      </div>
    </>
  );
}

function NumberField({ name, label, value }: { name: string; label: string; value: string }) { return <label><span>{label}</span><input name={name} defaultValue={value} inputMode="decimal" /></label>; }
function first(v: string | string[] | undefined) { return Array.isArray(v) ? v[0] ?? "" : v ?? ""; }
function pct(v?: number | null) { return v == null ? "—" : `${v.toFixed(1)}%`; }
function ratio(v?: number | null) { return v == null ? "—" : v.toFixed(2); }
function tone(v?: number | null) { return v == null ? "" : v > 0 ? "positive" : v < 0 ? "negative" : ""; }
function money(v?: number | null) { return v == null ? "—" : `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(v)} UZS`; }
function compact(v?: number | null) { return v == null ? "—" : new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(v); }
