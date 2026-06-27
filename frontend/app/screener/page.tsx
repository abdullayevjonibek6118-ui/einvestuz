import Link from "next/link";
import { ArrowRight, Filter, GitCompareArrows, RotateCcw, Search } from "lucide-react";
import { Metric, PageHeader, SourceStatusBadge } from "@/components/ui";
import { getStockScopeScreener } from "@/lib/api";

export const dynamic = "force-dynamic";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const sorts = [["market_cap","Капитализация"],["roe","ROE"],["roa","ROA"],["pe","P/E"],["pb","P/B"],["dividend_yield","Дивиденды"],["reports_count","Раскрытие"]];

export default async function ScreenerPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await Promise.resolve(searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const f = { q:first(params.q), min_roe:first(params.min_roe), min_roa:first(params.min_roa), max_pe:first(params.max_pe), max_pb:first(params.max_pb), min_reports:first(params.min_reports), sort_by:first(params.sort_by)||"market_cap", sort_dir:first(params.sort_dir)||"desc", limit:100 };
  const data = await getStockScopeScreener(f);
  const leaders = data.items.slice(0,3).map((item)=>item.ticker).join(",");
  return <>
    <PageHeader title="Скринер акций" subtitle="Отберите узбекские компании по рентабельности, оценке, дивидендам и качеству раскрытия." />
    <div className="screener-layout">
      <aside className="panel filter-panel">
        <div className="panel-header"><h2><Filter size={14}/> Фильтры</h2><Link href="/screener" aria-label="Сбросить"><RotateCcw size={14}/></Link></div>
        <form className="filter-form">
          <label><span>Компания / тикер / ISIN</span><div className="input-control"><Search size={15}/><input name="q" defaultValue={f.q} placeholder="A011030"/></div></label>
          <div className="filter-pair"><NumberField name="min_roe" label="ROE от, %" value={f.min_roe}/><NumberField name="min_roa" label="ROA от, %" value={f.min_roa}/></div>
          <div className="filter-pair"><NumberField name="max_pe" label="P/E до" value={f.max_pe}/><NumberField name="max_pb" label="P/B до" value={f.max_pb}/></div>
          <NumberField name="min_reports" label="Минимум отчётов" value={f.min_reports}/>
          <label><span>Сортировать по</span><select name="sort_by" defaultValue={f.sort_by}>{sorts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
          <label><span>Порядок</span><select name="sort_dir" defaultValue={f.sort_dir}><option value="desc">По убыванию</option><option value="asc">По возрастанию</option></select></label>
          <button className="terminal-button primary" type="submit"><Filter size={14}/> Применить</button>
        </form>
      </aside>
      <div className="screener-results">
        <section className="metric-row"><Metric label="В базе" value={String(data.coverage?.total ?? data.total)} detail="эмитентов"/><Metric label="С отчётностью" value={String(data.coverage?.withReports ?? "—")} detail="компаний"/><Metric label="С дивидендами" value={String(data.coverage?.withDividends ?? "—")} detail="компаний"/><Metric label="Найдено" value={String(data.total)} detail="по фильтрам"/></section>
        <section className="panel">
          <div className="panel-header"><div><h2>Результаты</h2><span>{data.total} компаний</span></div><div className="header-actions"><SourceStatusBadge source="StockScope" status="delayed"/><Link href={`/compare?tickers=${leaders}`} className="terminal-button"><GitCompareArrows size={14}/> Сравнить</Link></div></div>
          <div className="data-table-wrap"><table className="data-table screener-table"><thead><tr><th>Компания</th><th>Цена</th><th>Капитализация</th><th>ROE</th><th>ROA</th><th>P/E</th><th>P/B</th><th>Див.</th><th>Отчёты</th><th></th></tr></thead><tbody>{data.items.map(row=><tr key={row.ticker}><td className="company-cell"><Link href={`/stocks/${row.ticker}`}><span className="ticker">{row.ticker}</span><small>{row.name}</small></Link></td><td>{money(row.currentPrice)}</td><td>{compact(row.marketCap)}</td><td className={tone(row.roe)}>{pct(row.roe)}</td><td className={tone(row.roa)}>{pct(row.roa)}</td><td>{ratio(row.pe)}</td><td>{ratio(row.pb)}</td><td>{pct(row.dividendYield)}</td><td>{row.reportsCount}</td><td><Link className="row-arrow" href={`/stocks/${row.ticker}`}><ArrowRight size={14}/></Link></td></tr>)}</tbody></table></div>
          {!data.items.length?<div className="empty-state"><Search/><strong>Ничего не найдено</strong><span>Измените значения фильтров.</span></div>:null}
        </section>
      </div>
    </div>
  </>;
}
function NumberField({name,label,value}:{name:string;label:string;value:string}) { return <label><span>{label}</span><input name={name} defaultValue={value} inputMode="decimal"/></label>; }
function first(v:string|string[]|undefined){return Array.isArray(v)?v[0]??"":v??""} function pct(v?:number|null){return v==null?"—":`${v.toFixed(1)}%`} function ratio(v?:number|null){return v==null?"—":v.toFixed(2)} function tone(v?:number|null){return v==null?"":v>0?"positive":v<0?"negative":""} function money(v?:number|null){return v==null?"—":new Intl.NumberFormat("ru-RU",{maximumFractionDigits:0}).format(v)} function compact(v?:number|null){return v==null?"—":new Intl.NumberFormat("ru-RU",{notation:"compact",maximumFractionDigits:1}).format(v)}
