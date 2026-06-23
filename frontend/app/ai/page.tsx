import { Bot, Send, User } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { getStocks } from "@/lib/api";

const messages = [
  {
    role: "user",
    text: "Стоит ли покупать Nvidia?",
  },
  {
    role: "assistant",
    text: "Nvidia - лидер AI-ускорителей и дата-центров. Плюсы: сильный спрос, высокая маржинальность, экосистема CUDA. Риски: высокая оценка, конкуренция ASIC/GPU, зависимость от темпов AI-капекса. Для MVP это аналитический обзор, не инвестиционная рекомендация.",
  },
];

export default async function AIPage() {
  const stocks = await getStocks();

  return (
    <>
      <PageHeader title="AI Чат" subtitle="Инвестиционный помощник с контекстом цен, новостей и фундаментальных показателей." />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Panel>
          <div className="flex min-h-[560px] flex-col">
            <div className="flex-1 space-y-4">
              {messages.map((message, index) => {
                const assistant = message.role === "assistant";
                const Icon = assistant ? Bot : User;
                return (
                  <div key={index} className={`flex gap-3 ${assistant ? "" : "justify-end"}`}>
                    {assistant && <Avatar icon={<Icon size={17} />} />}
                    <div className={`max-w-[760px] rounded-md px-4 py-3 text-sm leading-6 ${assistant ? "bg-[#f1f6ff] text-[#1e3a8a]" : "bg-[#111827] text-white"}`}>
                      {message.text}
                    </div>
                    {!assistant && <Avatar icon={<Icon size={17} />} />}
                  </div>
                );
              })}
            </div>
            <form className="mt-5 flex gap-2 border-t border-[#dde3eb] pt-4">
              <input
                placeholder="Спросите про компанию, ETF, риск или термин..."
                className="h-11 flex-1 rounded-md border border-[#dde3eb] px-3 text-sm outline-none focus:border-[#2563eb]"
              />
              <button className="grid size-11 place-items-center rounded-md bg-[#2563eb] text-white hover:bg-[#1d4ed8]" aria-label="Отправить">
                <Send size={18} />
              </button>
            </form>
          </div>
        </Panel>

        <Panel title="Контекст">
          <div className="space-y-3">
            {stocks.slice(0, 5).map((stock) => (
              <div key={stock.ticker} className="rounded-md border border-[#dde3eb] p-3">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-semibold">{stock.ticker}</p>
                  <p className="text-sm">${stock.price.toFixed(2)}</p>
                </div>
                <p className="mt-1 text-xs text-[#667085]">P/E {stock.pe} · {stock.marketCap}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function Avatar({ icon }: { icon: React.ReactNode }) {
  return <div className="grid size-9 shrink-0 place-items-center rounded-md border border-[#dde3eb] bg-white text-[#344054]">{icon}</div>;
}
