import { Trash2 } from "lucide-react";
import { ChangeBadge, PageHeader, Panel } from "@/components/ui";
import { getStocks } from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import { portfolioRows, portfolioSummary } from "@/lib/portfolio";

export default async function PortfolioPage() {
  const stocks = await getStocks();
  const rows = portfolioRows(stocks);
  const summary = portfolioSummary(rows);

  return (
    <>
      <PageHeader title="Виртуальный портфель" subtitle="Добавляйте акции без реальных денег и отслеживайте доходность." />

      <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <Panel title="Добавить актив">
          <form className="grid gap-3">
            <label className="text-sm font-medium">
              Тикер
              <select className="mt-1 h-10 w-full rounded-md border border-[#dde3eb] bg-white px-3">
                {stocks.map((stock) => (
                  <option key={stock.ticker}>{stock.ticker}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Количество
              <input defaultValue="1" type="number" min="1" className="mt-1 h-10 w-full rounded-md border border-[#dde3eb] px-3" />
            </label>
            <label className="text-sm font-medium">
              Цена покупки
              <input defaultValue="100" type="number" min="0" className="mt-1 h-10 w-full rounded-md border border-[#dde3eb] px-3" />
            </label>
            <button className="mt-1 h-10 rounded-md bg-[#2563eb] text-sm font-semibold text-white hover:bg-[#1d4ed8]">Добавить</button>
          </form>
        </Panel>

        <Panel title="Позиции">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Summary label="Стоимость" value={formatCurrency(summary.value)} />
            <Summary label="Доходность" value={formatCurrency(summary.pnl)} tone={summary.pnl >= 0 ? "green" : "red"} />
            <Summary label="%" value={`${summary.pnlPercent.toFixed(2)}%`} tone={summary.pnl >= 0 ? "green" : "red"} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-[#dde3eb] text-xs uppercase text-[#667085]">
                <tr>
                  <th className="py-2">Актив</th>
                  <th>Кол-во</th>
                  <th>Покупка</th>
                  <th>Текущая</th>
                  <th>Стоимость</th>
                  <th>P/L</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.ticker} className="border-b border-[#eef2f6]">
                    <td className="py-3 font-semibold">{row.ticker}<span className="ml-2 font-normal text-[#667085]">{row.name}</span></td>
                    <td>{row.quantity}</td>
                    <td>{formatCurrency(row.buyPrice)}</td>
                    <td>{formatCurrency(row.currentPrice)}</td>
                    <td>{formatCurrency(row.value)}</td>
                    <td><ChangeBadge value={row.pnlPercent} /></td>
                    <td><button className="grid size-8 place-items-center rounded-md hover:bg-[#f1f4f8]" aria-label="Удалить"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" }) {
  return (
    <div className="rounded-md border border-[#dde3eb] bg-[#fbfcfe] p-3">
      <p className="text-xs text-[#667085]">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === "green" ? "text-[#0f9f6e]" : tone === "red" ? "text-[#dc2626]" : ""}`}>{value}</p>
    </div>
  );
}
