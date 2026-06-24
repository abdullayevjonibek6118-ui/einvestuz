import { AIChatClient } from "@/components/ai-chat-client";
import { PageHeader, Panel } from "@/components/ui";
import { getStocks } from "@/lib/api";

export default async function AIPage() {
  const stocks = await getStocks();

  return (
    <>
      <PageHeader title="AI Чат" subtitle="Инвестиционный помощник с контекстом цен, новостей и фундаментальных показателей." />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Panel>
          <AIChatClient />
        </Panel>

        <Panel title="Контекст">
          <div className="space-y-3">
            {stocks.slice(0, 5).map((stock) => (
              <div key={stock.ticker} className="rounded-2xl border border-[#dde3eb] p-3">
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
