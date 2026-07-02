"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  }

  function removePosition(positionTicker: string) {
    setPositions((current) => current.filter((position) => position.ticker !== positionTicker));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
      <Panel title="Добавить актив">
        <form onSubmit={addPosition} className="grid gap-3">
          <label className="text-sm font-medium text-[var(--text)]">
            Тикер
            <select value={ticker} onChange={(event) => setTicker(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 text-[var(--text)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]">
              {stocks.map((stock) => (
                <option key={stock.ticker}>{stock.ticker}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-[var(--text)]">
            Количество
            <input value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} type="number" min="1" required className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] px-3 text-[var(--text)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]" />
          </label>
          <label className="text-sm font-medium text-[var(--text)]">
            Цена покупки
            <input value={buyPrice} onChange={(event) => setBuyPrice(Number(event.target.value))} type="number" min="0.01" step="0.01" required className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] px-3 text-[var(--text)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]" />
          </label>
          {error ? <p className="rounded-xl border border-[var(--red)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--red)]">{error}</p> : null}
          <button className="mt-1 h-11 rounded-xl bg-[var(--accent)] text-sm font-semibold text-[#04130b] shadow-sm hover:bg-[color-mix(in_srgb,var(--accent)_88%,white)] focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)]">
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
            <thead className="border-b border-[var(--line)] text-xs uppercase text-[var(--muted-2)]">
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
                <tr key={row.ticker} className="border-b border-[var(--line)]">
                  <td className="py-3 font-semibold">{row.ticker}<span className="ml-2 font-normal text-[var(--muted)]">{row.name}</span></td>
                  <td>{row.quantity}</td>
                  <td>{formatCurrency(row.buyPrice)}</td>
                  <td>{formatCurrency(row.currentPrice)}</td>
                  <td>{formatCurrency(row.value)}</td>
                  <td><ChangeBadge value={row.pnlPercent} /></td>
                  <td>
                    <button onClick={() => removePosition(row.ticker)} className="grid size-8 place-items-center rounded-xl border border-transparent text-[var(--red)] hover:border-[var(--line)] hover:bg-[var(--surface-2)]" aria-label={`Удалить ${row.ticker}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] px-4 py-8 text-center text-sm text-[var(--muted)]">
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

function Summary({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === "green" ? "text-[var(--accent)]" : tone === "red" ? "text-[var(--red)]" : "text-[var(--text)]"}`}>{value}</p>
    </div>
  );
}
