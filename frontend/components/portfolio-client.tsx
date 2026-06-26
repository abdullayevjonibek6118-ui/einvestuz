"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { ChangeBadge, Panel } from "@/components/ui";
import { formatCurrency, type Stock } from "@/lib/data";
import { getApiUrl } from "@/lib/live-market";

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

const STORAGE_KEY = "einvestuz-portfolio";

export function PortfolioClient({ stocks, initialTicker }: { stocks: Stock[]; initialTicker?: string }) {
  const fallbackTicker = resolveTicker(stocks, initialTicker) ?? stocks[0]?.ticker ?? "AAPL";
  const fallbackStock = stocks.find((stock) => stock.ticker.toLowerCase() === fallbackTicker.toLowerCase());
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [loaded, setLoaded] = useState(false);
  const [ticker, setTicker] = useState(fallbackTicker);
  const [quantity, setQuantity] = useState(1);
  const [buyPrice, setBuyPrice] = useState(safePositive(fallbackStock?.price) ?? 100);
  const [error, setError] = useState("");

  useEffect(() => {
    setPositions(loadPositions());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [loaded, positions]);

  useEffect(() => {
    const selectedStock = stocks.find((stock) => stock.ticker.toLowerCase() === ticker.toLowerCase());
    const price = safePositive(selectedStock?.price);
    if (price) setBuyPrice(price);
  }, [stocks, ticker]);

  const rows = useMemo(
    () =>
      positions.map((position) => {
        const stock = stocks.find((item) => item.ticker.toLowerCase() === position.ticker.toLowerCase());
        const currentPrice = safePositive(stock?.price) ?? safePositive(position.buyPrice) ?? 0;
        const value = currentPrice * position.quantity;
        const cost = position.buyPrice * position.quantity;

        return {
          ...position,
          name: stock?.name ?? position.ticker,
          currentPrice,
          value,
          pnl: value - cost,
          pnlPercent: safePercent(value - cost, cost),
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
      pnlPercent: safePercent(value - cost, cost),
    };
  }, [rows]);

  function addPosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!normalizedTicker || quantity <= 0 || buyPrice <= 0 || !Number.isFinite(quantity) || !Number.isFinite(buyPrice)) {
      setError("Введите тикер, количество и цену покупки больше нуля.");
      return;
    }
    setError("");

    setPositions((current) => {
      const existing = current.find((position) => position.ticker.toLowerCase() === normalizedTicker.toLowerCase());
      if (!existing) return [...current, { ticker: normalizedTicker, quantity, buyPrice }];

      return current.map((position) =>
        position.ticker.toLowerCase() === normalizedTicker.toLowerCase()
          ? {
              ...position,
              ticker: normalizedTicker,
              quantity: position.quantity + quantity,
              buyPrice: (position.buyPrice * position.quantity + buyPrice * quantity) / (position.quantity + quantity),
            }
          : position,
      );
    });
    void syncPortfolioAdd(normalizedTicker, quantity, buyPrice);
  }

  function removePosition(positionTicker: string) {
    setPositions((current) => current.filter((position) => position.ticker !== positionTicker));
    void syncPortfolioRemove(positionTicker);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
      <Panel title="Добавить актив">
        <form onSubmit={addPosition} className="grid gap-3">
          <label className="text-sm font-medium text-[#0f172a]">
            Тикер
            <select value={ticker} onChange={(event) => setTicker(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#bfd0e3] bg-white px-3 focus:border-[#0b63f6] focus:ring-2 focus:ring-[#bfdbfe]">
              {stocks.map((stock) => (
                <option key={stock.ticker}>{stock.ticker}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-[#0f172a]">
            Количество
            <input value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} type="number" min="1" required className="mt-1 h-10 w-full rounded-xl border border-[#bfd0e3] px-3 focus:border-[#0b63f6] focus:ring-2 focus:ring-[#bfdbfe]" />
          </label>
          <label className="text-sm font-medium text-[#0f172a]">
            Цена покупки
            <input value={buyPrice} onChange={(event) => setBuyPrice(Number(event.target.value))} type="number" min="0.01" step="0.01" required className="mt-1 h-10 w-full rounded-xl border border-[#bfd0e3] px-3 focus:border-[#0b63f6] focus:ring-2 focus:ring-[#bfdbfe]" />
          </label>
          {error ? <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-medium text-[#b91c1c]">{error}</p> : null}
          <button className="mt-1 h-11 rounded-xl bg-[#0b63f6] text-sm font-semibold text-white shadow-sm hover:bg-[#084fc7] focus-visible:ring-2 focus-visible:ring-[#93c5fd]">
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
        {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-[#dbe4ef] text-xs uppercase text-[#475569]">
              <tr>
                <th scope="col" className="py-2">Актив</th>
                <th scope="col">Кол-во</th>
                <th scope="col">Покупка</th>
                <th scope="col">Текущая</th>
                <th scope="col">Стоимость</th>
                <th scope="col">P/L</th>
                <th scope="col"><span className="sr-only">Действия</span></th>
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
                    <button onClick={() => removePosition(row.ticker)} className="grid size-8 place-items-center rounded-xl border border-transparent text-[#b91c1c] hover:border-[#fecaca] hover:bg-[#fef2f2]" aria-label={`Удалить ${row.ticker}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-8 text-center text-sm text-[#64748b]">
            Портфель пуст. Добавьте первый актив через форму слева.
          </div>
        )}
      </Panel>
    </div>
  );
}

function loadPositions() {
  if (typeof window === "undefined") return initialPositions;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Position[] | null;
    if (!Array.isArray(parsed)) return initialPositions;
    const sanitized = parsed
      .map((position) => ({
        ticker: String(position.ticker ?? "").trim().toUpperCase(),
        quantity: Number(position.quantity),
        buyPrice: Number(position.buyPrice),
      }))
      .filter((position) => position.ticker && safePositive(position.quantity) && safePositive(position.buyPrice));
    return sanitized.length ? sanitized : initialPositions;
  } catch {
    return initialPositions;
  }
}

function resolveTicker(stocks: Stock[], ticker?: string) {
  if (!ticker) return undefined;
  return stocks.find((stock) => stock.ticker.toLowerCase() === ticker.toLowerCase())?.ticker;
}

function safePositive(value?: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function safePercent(delta: number, base: number) {
  if (!Number.isFinite(delta) || !Number.isFinite(base) || base <= 0) return 0;
  return (delta / base) * 100;
}

async function syncPortfolioAdd(ticker: string, quantity: number, buyPrice: number) {
  try {
    await fetch(getApiUrl("/portfolio/add"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "demo-user", ticker, quantity, buy_price: buyPrice }),
    });
  } catch {
    // LocalStorage remains the source of truth for the MVP client.
  }
}

async function syncPortfolioRemove(ticker: string) {
  try {
    await fetch(getApiUrl("/portfolio/remove"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "demo-user", ticker }),
    });
  } catch {
    // LocalStorage remains the source of truth for the MVP client.
  }
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" }) {
  return (
    <div className="rounded-2xl border border-[#dbe4ef] bg-[#f8fafc] p-3">
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === "green" ? "text-[#15803d]" : tone === "red" ? "text-[#dc2626]" : "text-[#0f172a]"}`}>{value}</p>
    </div>
  );
}
