import Link from "next/link";
import { Bell, History, Star } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { getStocks } from "@/lib/api";

export default async function ProfilePage() {
  const stocks = await getStocks();
  const watchlist = stocks.slice(0, 4);

  return (
    <>
      <PageHeader title="Профиль" subtitle="Watchlist, настройки уведомлений и история AI-запросов." />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Watchlist" action={<Star size={18} className="text-[#d97706]" fill="currentColor" />}>
          <div className="space-y-3">
            {watchlist.map((stock) => (
              <Link key={stock.ticker} href={`/stocks/${stock.ticker}`} className="flex items-center justify-between rounded-md border border-[#dde3eb] p-3 hover:bg-[#fbfcfe]">
                <div>
                  <p className="text-sm font-semibold">{stock.ticker}</p>
                  <p className="text-xs text-[#667085]">{stock.name}</p>
                </div>
                <p className="text-sm font-semibold">${stock.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Настройки">
          <div className="space-y-3">
            <Toggle title="Изменение цены" subtitle="Уведомлять при движении watchlist более чем на 3%." checked />
            <Toggle title="Важные новости" subtitle="События по компаниям из избранного." checked />
            <Toggle title="Еженедельная сводка" subtitle="Портфель, уроки и главные рынки." />
          </div>
        </Panel>
      </div>

      <Panel title="История запросов" action={<History size={18} className="text-[#667085]" />} className="mt-4">
        <div className="space-y-2 text-sm">
          {["Стоит ли покупать Nvidia?", "Объясни ETF простыми словами", "Какие риски у Tesla?"].map((item) => (
            <div key={item} className="rounded-md border border-[#dde3eb] p-3">{item}</div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function Toggle({ title, subtitle, checked = false }: { title: string; subtitle: string; checked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[#dde3eb] p-3">
      <span className="flex gap-3">
        <Bell size={18} className="mt-0.5 text-[#2563eb]" />
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-1 block text-xs text-[#667085]">{subtitle}</span>
        </span>
      </span>
      <input type="checkbox" defaultChecked={checked} className="size-5 accent-[#2563eb]" />
    </label>
  );
}
