import Link from "next/link";
import { Bot, Newspaper } from "lucide-react";
import { ChangeBadge, PageHeader, Panel } from "@/components/ui";
import { getMarket, getNews, getStocks } from "@/lib/api";
import { type Stock } from "@/lib/data";

export default async function DashboardPage() {
  const [indexes, stocks, news] = await Promise.all([getMarket(), getStocks(), getNews()]);
  const gainers = [...stocks].sort((a, b) => b.change - a.change).slice(0, 3);
  const losers = [...stocks].sort((a, b) => a.change - b.change).slice(0, 3);

  return (
    <>
      <PageHeader title="Главная" subtitle="Мировые рынки, новости и AI-идеи дня для инвесторов из Узбекистана." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {indexes.map((index) => (
          <Panel key={index.ticker}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[#667085]">{index.ticker}</p>
                <h2 className="mt-1 text-lg font-semibold">{index.name}</h2>
                <p className="mt-3 text-2xl font-semibold">{index.value}</p>
              </div>
              <ChangeBadge value={index.change} />
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

        <Panel title="AI идеи дня" action={<Bot size={18} className="text-[#2563eb]" />}>
          <div className="space-y-3">
            <p className="text-sm text-[#344054]">
              AI видит устойчивый интерес к полупроводникам и облачной инфраструктуре, но оценки лидеров остаются высокими.
            </p>
            <div className="rounded-md bg-[#f1f6ff] p-3 text-sm text-[#1d4ed8]">
              Фокус: сравнить рост выручки Nvidia и Microsoft с текущими P/E, не забывая про риск коррекции AI-сектора.
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Новости" action={<Newspaper size={18} className="text-[#667085]" />} className="mt-4">
        <div className="grid gap-3 md:grid-cols-2">
          {news.map((item) => (
            <article key={item.id} className="rounded-md border border-[#dde3eb] p-3">
              <div className="flex items-center gap-2 text-xs text-[#667085]">
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
          <Link key={stock.ticker} href={`/stocks/${stock.ticker}`} className="flex items-center justify-between rounded-md border border-[#dde3eb] p-3 hover:bg-[#fbfcfe]">
            <div>
              <p className="text-sm font-semibold">{stock.ticker}</p>
              <p className="text-xs text-[#667085]">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">${stock.price.toFixed(2)}</p>
              <ChangeBadge value={stock.change} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
