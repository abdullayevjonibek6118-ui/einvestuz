import { PortfolioClient } from "@/components/portfolio-client";
import { PageHeader } from "@/components/ui";
import { getStocks } from "@/lib/api";

export default async function PortfolioPage() {
  const stocks = await getStocks();

  return (
    <>
      <PageHeader title="Виртуальный портфель" subtitle="Добавляйте акции без реальных денег и отслеживайте доходность." />
      <PortfolioClient stocks={stocks} />
    </>
  );
}
