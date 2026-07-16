import { AIChatClient } from "@/components/ai-chat-client";
import { PageHeader, Panel } from "@/components/ui";
import { getStockScopeScreener } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "AI-анализ акций Узбекистана", description: "Задавайте вопросы об узбекских компаниях и получайте понятное объяснение показателей, рисков и доступных рыночных данных.", path: "/ai" });

export default async function AIPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await Promise.resolve(searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const question = Array.isArray(params.question) ? params.question[0] : params.question;
  const ticker = Array.isArray(params.ticker) ? params.ticker[0] : params.ticker;
  const screener = await getStockScopeScreener({ limit: 6, sort_by: "market_cap", sort_dir: "desc" });
  const suggestedTickers = screener.items.map((stock) => stock.ticker).filter(Boolean);
  const freshness = screener.coverage?.generatedAt ?? screener.items.find((stock) => stock.fetchedAt)?.fetchedAt;

  return (
    <>
      <PageHeader title="AI-аналитика" subtitle="Генеративный помощник AIMLAPI объясняет показатели, риски и рыночный контекст без персональных инвестиционных рекомендаций." />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Panel>
          <AIChatClient suggestedTickers={suggestedTickers} initialQuestion={question} initialTicker={ticker} />
        </Panel>

        <Panel title="Контекст рынка">
          <p className="mb-3 text-xs text-[#667085]">
            {screener.coverage?.sourceName ?? "StockScope"}{freshness ? ` · snapshot ${formatStamp(freshness)}` : ""}. Это входной контекст, не live-лента.
          </p>
          <div className="space-y-3">
            {screener.items.slice(0, 5).map((stock) => (
              <div key={stock.ticker} className="rounded-2xl border border-[#dde3eb] bg-white p-3">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-semibold">{stock.ticker}</p>
                  <p className="text-sm">{stock.currentPrice == null ? "—" : `${stock.currentPrice.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} UZS`}</p>
                </div>
                <p className="mt-1 text-xs text-[#667085]">P/E {stock.pe?.toFixed(2) ?? "—"} · {stock.sector ?? "сектор не указан"}</p>
              </div>
            ))}
            {!screener.items.length ? <p className="text-sm text-[var(--muted)]">StockScope screener сейчас не вернул компании.</p> : null}
          </div>
        </Panel>
      </div>
    </>
  );
}

function formatStamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
