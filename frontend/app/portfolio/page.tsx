import { PortfolioClient } from "@/components/portfolio-client";
import { PageHeader } from "@/components/ui";
import { getStocks } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Виртуальный портфель", description: "Персональный учебный портфель пользователя EInvest.", path: "/portfolio", noIndex: true });

type PortfolioSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PortfolioPage({ searchParams }: { searchParams?: PortfolioSearchParams }) {
  const stocks = await getStocks();
  const resolvedSearchParams = (await Promise.resolve(searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const selectedTicker = firstQueryValue(resolvedSearchParams.ticker).toUpperCase();

  return (
    <>
      <PageHeader title="Виртуальный портфель" subtitle="Локальная симуляция без реальных денег: позиции сохраняются только в этом браузере." />
      <PortfolioClient stocks={stocks} initialTicker={selectedTicker} />
    </>
  );
}

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
