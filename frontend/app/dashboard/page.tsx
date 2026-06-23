import Link from "next/link";
import { Bot, Gauge, Newspaper, ShieldCheck } from "lucide-react";
import { LiveMarketStatus } from "@/components/live-market-status";
import { ChangeBadge, PageHeader, Panel, SourceStatusBadge } from "@/components/ui";
import { getMarket, getNews, getSources, getStocks } from "@/lib/api";
import { type Stock } from "@/lib/data";

export default async function DashboardPage() {
  const [indexes, stocks, news, sources] = await Promise.all([getMarket(), getStocks(), getNews(), getSources()]);
  const gainers = [...stocks].sort((a, b) => b.change - a.change).slice(0, 3);
  const losers = [...stocks].sort((a, b) => a.change - b.change).slice(0, 3);
  const activeSourceCount = sources.filter((source) => source.status === "live" || source.status === "delayed").length;
  const dashboardSymbols = [...indexes.map((index) => index.ticker), ...stocks.map((stock) => stock.ticker)];

  return (
    <>
      <PageHeader title="Главная" subtitle="Мировые рынки, новости и AI-идеи дня для инвесторов из Узбекистана." />

      <LiveMarketStatus sources={sources} symbols={dashboardSymbols} />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <StatusMetric label="Охват рынка" value={`${indexes.length} активов`} detail="Индексы, криптовалюты и сырье" />
        <StatusMetric label="Список наблюдения" value={`${stocks.length} компаний`} detail="Компании США и MOEX для MVP" />
        <StatusMetric label="Источники данных" value={`${activeSourceCount}/${sources.length} активны`} detail="REST-котировки и live polling" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {indexes.map((index) => (
          <Panel key={index.ticker}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="tabular-data text-xs font-semibold text-[#1e40af]">{index.ticker}</p>
                <h2 className="mt-1 text-sm font-semibold text-[#0f172a]">{index.name}</h2>
                <p className="tabular-data mt-3 text-2xl font-semibold text-[#0f172a]">{index.value}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <ChangeBadge value={index.change} />
                <SourceStatusBadge source={index.source} status={index.sourceStatus} />
              </div>
            </div>
            {index.asOf ? <p className="tabular-data mt-3 text-xs text-[#64748b]">обновлено {new Date(index.asOf).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</p> : null}
            <div className="mt-4 h-1.5 rounded-full bg-[#e2e8f0]">
              <div className={`h-1.5 rounded-full ${index.change >= 0 ? "bg-[#16a34a]" : "bg-[#dc2626]"}`} style={{ width: `${Math.min(92, Math.max(16, Math.abs(index.change) * 28))}%` }} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Топ акций">
          <div className="grid gap-6 md:grid-cols-2">
            <StockList title="Растут" stocks={gainers} />
            <StockList title="Падают" stocks={losers} />
          </div>
        </Panel>

        <Panel title="AI идеи дня" action={<Bot size={18} className="text-[#1e40af]" />}>
          <div className="space-y-3">
            <p className="text-sm leading-6 text-[#334155]">
              AI видит устойчивый интерес к полупроводникам и облачной инфраструктуре, но оценки лидеров остаются высокими.
            </p>
            <div className="rounded-md border border-[#bfdbfe] bg-[#eff6ff] p-3 text-sm leading-6 text-[#1e40af]">
              Фокус: сравнить рост выручки Nvidia и Microsoft с текущими P/E, не забывая про риск коррекции AI-сектора.
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-xs font-medium text-[#166534]">
              <ShieldCheck size={15} />
              Сценарий предназначен для обучения и виртуального портфеля.
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Новости" action={<Newspaper size={18} className="text-[#667085]" />} className="mt-4">
        <div className="grid gap-3 md:grid-cols-2">
          {news.map((item) => (
            <article key={item.id} className="rounded-md border border-[#dbe4ef] bg-[#f8fafc] p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#64748b]">
                <span>{item.category}</span>
                <span>{item.source}</span>
                <span>{item.time}</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
            </article>
          ))}
        </div>
      </Panel>
    </>
  );
}

function StockList({ title, stocks }: { title: string; stocks: Stock[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase text-[#667085]">{title}</h3>
      <div className="space-y-2">
        {stocks.map((stock) => (
          <Link key={stock.ticker} href={`/stocks/${stock.ticker}`} className="flex cursor-pointer items-center justify-between rounded-md border border-[#dbe4ef] bg-[#f8fafc] p-3 hover:border-[#bfdbfe] hover:bg-white hover:shadow-sm">
            <div>
              <p className="tabular-data text-sm font-semibold text-[#0f172a]">{stock.ticker}</p>
              <p className="text-xs text-[#64748b]">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="tabular-data text-sm font-semibold text-[#0f172a]">${stock.price.toFixed(2)}</p>
              <div className="mt-1 flex flex-col items-end gap-1">
                <ChangeBadge value={stock.change} />
                <SourceStatusBadge source={stock.source} status={stock.sourceStatus} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-[#dbe4ef] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#64748b]">
        <Gauge size={15} className="text-[#f59e0b]" />
        {label}
      </div>
      <p className="tabular-data mt-2 text-xl font-semibold text-[#0f172a]">{value}</p>
      <p className="mt-1 text-xs text-[#64748b]">{detail}</p>
    </div>
  );
}
