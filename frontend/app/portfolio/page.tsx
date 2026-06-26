import { PortfolioClient } from "@/components/portfolio-client";
import { PageHeader } from "@/components/ui";
import { getStocks } from "@/lib/api";

type PortfolioSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PortfolioPage({ searchParams }: { searchParams?: PortfolioSearchParams }) {
  const stocks = await getStocks();
  const resolvedSearchParams = (await Promise.resolve(searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const selectedTicker = firstQueryValue(resolvedSearchParams.ticker).toUpperCase();

  return (
    <>
      <PageHeader title="Виртуальный портфель" subtitle="Добавляйте акции без реальных денег и отслеживайте доходность." />
      <PortfolioClient stocks={stocks} initialTicker={selectedTicker} />
    </>
  );
}

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
