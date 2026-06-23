import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, Plus, Star } from "lucide-react";
import { ChangeBadge, Metric, PageHeader, Panel } from "@/components/ui";
import { getNews, getStock, getStocks } from "@/lib/api";

export async function generateStaticParams() {
  const stocks = await getStocks();
  return stocks.map((stock) => ({ ticker: stock.ticker }));
}

export default async function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const [stock, news] = await Promise.all([getStock(ticker), getNews()]);
  if (!stock) notFound();

  return (
    <>
      <PageHeader title={`${stock.name} (${stock.ticker})`} subtitle={stock.description} />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-[#667085]">{stock.sector}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-3xl font-semibold">${stock.price.toFixed(2)}</span>
                <ChangeBadge value={stock.change} />
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/profile" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#bfd0e3] bg-white px-3 text-sm font-semibold text-[#0f172a] hover:border-[#0b63f6] hover:bg-[#eff6ff]">
                <Star size={16} /> Watchlist
              </Link>
              <Link href={`/portfolio?ticker=${encodeURIComponent(stock.ticker)}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0b63f6] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#084fc7]">
                <Plus size={16} /> В портфель
              </Link>
            </div>
          </div>
          <div className="mt-5 h-[360px] overflow-hidden rounded-md border border-[#dde3eb] bg-[#0f172a]">
            <iframe
              title={`${stock.ticker} TradingView chart`}
              src={`https://s.tradingview.com/widgetembed/?symbol=NASDAQ:${stock.ticker}&interval=D&theme=dark&style=1&hideideas=1`}
              className="h-full w-full"
            />
          </div>
        </Panel>

        <Panel title="Показатели">
          <div className="grid gap-3">
            <Metric label="Капитализация" value={stock.marketCap} />
            <Metric label="P/E" value={stock.pe.toString()} />
            <Metric label="Дивиденды" value={stock.dividend} />
            <Metric label="Сектор" value={stock.sector} />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="AI-анализ" action={<Bot size={18} className="text-[#0b63f6]" />}>
          <div className="space-y-3 text-sm text-[#344054]">
            <p>{stock.name} остается качественной компанией, но решение зависит от горизонта, оценки и доли актива в портфеле.</p>
            <p><span className="font-semibold text-[#111827]">Плюсы:</span> сильный бренд, масштаб, денежный поток и лидерство в своем сегменте.</p>
            <p><span className="font-semibold text-[#111827]">Риски:</span> высокая оценка, конкуренция, цикличность спроса и регуляторное давление.</p>
            <p className="rounded-md bg-[#fff7ed] p-3 text-[#9a3412]">Не является инвестиционной рекомендацией.</p>
          </div>
        </Panel>

        <Panel title="Новости компании">
          <div className="space-y-3">
            {news.slice(0, 3).map((item) => (
              <Link key={item.id} href="/dashboard" className="block rounded-md border border-[#dde3eb] p-3 hover:bg-[#fbfcfe]">
                <p className="text-xs text-[#667085]">{item.category} · {item.time}</p>
                <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
