import { PortfolioClient } from "@/components/portfolio-client";
import { PageHeader } from "@/components/ui";
import { getStockScopeScreener } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Виртуальный портфель", description: "Персональный учебный портфель пользователя EInvest.", path: "/portfolio", noIndex: true });

type PortfolioSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PortfolioPage({ searchParams }: { searchParams?: PortfolioSearchParams }) {
  const screener = await getStockScopeScreener({ limit: 100, sort_by: "market_cap", sort_dir: "desc" });
  const stocks = screener.items.map((stock) => ({
    ticker: stock.ticker,
    name: stock.name,
    price: typeof stock.currentPrice === "number" && Number.isFinite(stock.currentPrice) ? stock.currentPrice : undefined,
    currency: stock.currency ?? "UZS",
    source: stock.sourceName ?? screener.coverage?.sourceName ?? "StockScope",
    asOf: stock.fetchedAt ?? screener.coverage?.generatedAt ?? undefined,
  }));
  const resolvedSearchParams = (await Promise.resolve(searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const selectedTicker = firstQueryValue(resolvedSearchParams.ticker).toUpperCase();

  return (
    <>
      <PageHeader title="Виртуальный портфель" subtitle="Локальная симуляция без реальных денег: позиции сохраняются только в этом браузере." />
      <PortfolioClient stocks={stocks} initialTicker={selectedTicker} sourceLabel={screener.coverage?.sourceName ?? "StockScope"} asOf={screener.coverage?.generatedAt ?? undefined} />
    </>
  );
}

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
