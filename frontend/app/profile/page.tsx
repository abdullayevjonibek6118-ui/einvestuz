import Link from "next/link";
import { Bell, History, Star } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { getStocks } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Профиль пользователя", description: "Персональные настройки, избранные компании и уведомления EInvest.", path: "/profile", noIndex: true });

export default async function ProfilePage() {
  const stocks = await getStocks();
  const watchlist = stocks.slice(0, 4);

  return (
    <>
      <PageHeader title="Демо-профиль" subtitle="Предпросмотр будущего кабинета: watchlist, уведомления и история пока не сохраняются." />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Watchlist" action={<Star size={18} className="text-[#d97706]" fill="currentColor" />}>
          <div className="space-y-3">
            {watchlist.map((stock) => (
              <Link key={stock.ticker} href={`/stocks/${stock.ticker}`} className="group flex items-center justify-between gap-3 rounded-2xl border border-[#dbe4ef] bg-[#f8fafc] p-3 transition hover:border-[#bfdbfe] hover:bg-white hover:shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] text-xs font-bold text-[#1d4ed8]">{stock.ticker.slice(0, 2)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a]">{stock.ticker}</p>
                    <p className="truncate text-xs text-[#64748b]">{stock.name}</p>
                  </div>
                </div>
                <p className="tabular-data text-sm font-semibold text-[#0f172a]">${stock.price.toFixed(2)}</p>
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

        <Panel title="Примеры запросов" action={<History size={18} className="text-[#667085]" />} className="mt-4">
        <div className="space-y-2 text-sm">
          {["Стоит ли покупать Nvidia?", "Объясни ETF простыми словами", "Какие риски у Tesla?"].map((item) => (
            <div key={item} className="rounded-2xl border border-[#dbe4ef] bg-[#f8fafc] p-3 text-[#334155]">{item}</div>
          ))}
        </div>
      </Panel>
    </>
  );
}

function Toggle({ title, subtitle, checked = false }: { title: string; subtitle: string; checked?: boolean }) {
  return (
    <label className="group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#dbe4ef] bg-[#f8fafc] p-3 transition hover:border-[#bfdbfe] hover:bg-white">
      <span className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]">
          <Bell size={18} />
        </span>
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-1 block text-xs text-[#667085]">{subtitle}</span>
        </span>
      </span>
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-[#cbd5e1] bg-white p-1 transition has-[:checked]:border-[#3861fb] has-[:checked]:bg-[#3861fb] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#93c5fd]">
        <input type="checkbox" defaultChecked={checked} disabled className="peer sr-only" />
        <span className="size-5 rounded-full bg-[#cbd5e1] shadow-sm transition peer-checked:translate-x-5 peer-checked:bg-white" />
      </span>
    </label>
  );
}
