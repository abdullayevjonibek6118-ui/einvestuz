"use client";

import { FormEvent, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { ChangeBadge, Panel } from "@/components/ui";
import { formatCurrency, type Stock } from "@/lib/data";

type Position = {
  ticker: string;
  quantity: number;
  buyPrice: number;
};

const initialPositions: Position[] = [
  { ticker: "NVDA", quantity: 4, buyPrice: 126.3 },
  { ticker: "MSFT", quantity: 3, buyPrice: 431.1 },
  { ticker: "AAPL", quantity: 5, buyPrice: 203.7 },
];

export function PortfolioClient({ stocks }: { stocks: Stock[] }) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [ticker, setTicker] = useState(stocks[0]?.ticker ?? "AAPL");
  const [quantity, setQuantity] = useState(1);
  const [buyPrice, setBuyPrice] = useState(stocks[0]?.price ?? 100);

  const rows = useMemo(
    () =>
      positions.map((position) => {
        const stock = stocks.find((item) => item.ticker.toLowerCase() === position.ticker.toLowerCase());
        const currentPrice = stock?.price ?? position.buyPrice;
        const value = currentPrice * position.quantity;
        const cost = position.buyPrice * position.quantity;

        return {
          ...position,
          name: stock?.name ?? position.ticker,
          currentPrice,
          value,
          pnl: value - cost,
          pnlPercent: cost ? ((value - cost) / cost) * 100 : 0,
        };
      }),
    [positions, stocks],
  );

  const summary = useMemo(() => {
    const value = rows.reduce((sum, row) => sum + row.value, 0);
    const cost = rows.reduce((sum, row) => sum + row.buyPrice * row.quantity, 0);
    return {
      value,
      pnl: value - cost,
      pnlPercent: cost ? ((value - cost) / cost) * 100 : 0,
    };
  }, [rows]);

  function addPosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (quantity <= 0 || buyPrice <= 0) return;

    setPositions((current) => {
      const existing = current.find((position) => position.ticker === ticker);
      if (!existing) return [...current, { ticker, quantity, buyPrice }];

      return current.map((position) =>
        position.ticker === ticker
          ? {
              ...position,
              quantity: position.quantity + quantity,
              buyPrice: (position.buyPrice * position.quantity + buyPrice * quantity) / (position.quantity + quantity),
            }
          : position,
      );
    });
  }

  function removePosition(positionTicker: string) {
    setPositions((current) => current.filter((position) => position.ticker !== positionTicker));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
      <Panel title="Добавить актив">
        <form onSubmit={addPosition} className="grid gap-3">
          <label className="text-sm font-medium text-[#0f172a]">
            Тикер
            <select value={ticker} onChange={(event) => setTicker(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-[#bfd0e3] bg-white px-3 focus:border-[#0b63f6] focus:ring-2 focus:ring-[#bfdbfe]">
              {stocks.map((stock) => (
                <option key={stock.ticker}>{stock.ticker}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-[#0f172a]">
            Количество
            <input value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} type="number" min="1" className="mt-1 h-10 w-full rounded-md border border-[#bfd0e3] px-3 focus:border-[#0b63f6] focus:ring-2 focus:ring-[#bfdbfe]" />
          </label>
          <label className="text-sm font-medium text-[#0f172a]">
            Цена покупки
            <input value={buyPrice} onChange={(event) => setBuyPrice(Number(event.target.value))} type="number" min="0.01" step="0.01" className="mt-1 h-10 w-full rounded-md border border-[#bfd0e3] px-3 focus:border-[#0b63f6] focus:ring-2 focus:ring-[#bfdbfe]" />
          </label>
          <button className="mt-1 h-11 rounded-md bg-[#0b63f6] text-sm font-semibold text-white shadow-sm hover:bg-[#084fc7] focus-visible:ring-2 focus-visible:ring-[#93c5fd]">
            Добавить в портфель
          </button>
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
            <thead className="border-b border-[#dbe4ef] text-xs uppercase text-[#475569]">
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
                  <td className="py-3 font-semibold">{row.ticker}<span className="ml-2 font-normal text-[#64748b]">{row.name}</span></td>
                  <td>{row.quantity}</td>
                  <td>{formatCurrency(row.buyPrice)}</td>
                  <td>{formatCurrency(row.currentPrice)}</td>
                  <td>{formatCurrency(row.value)}</td>
                  <td><ChangeBadge value={row.pnlPercent} /></td>
                  <td>
                    <button onClick={() => removePosition(row.ticker)} className="grid size-8 place-items-center rounded-md border border-transparent text-[#b91c1c] hover:border-[#fecaca] hover:bg-[#fef2f2]" aria-label={`Удалить ${row.ticker}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" }) {
  return (
    <div className="rounded-md border border-[#dbe4ef] bg-[#f8fafc] p-3">
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === "green" ? "text-[#15803d]" : tone === "red" ? "text-[#dc2626]" : "text-[#0f172a]"}`}>{value}</p>
    </div>
  );
}
