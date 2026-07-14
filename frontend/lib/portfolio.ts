import type { Stock } from "@/lib/data";

export type PortfolioPosition = {
  ticker: string;
  quantity: number;
  buyPrice: number;
};

export function portfolioRows(positions: PortfolioPosition[] = [], marketStocks: Stock[] = []) {
  return positions.map((position) => {
    const stock = marketStocks.find((item) => item.ticker.toLowerCase() === position.ticker.toLowerCase());
    const currentPrice = stock?.price ?? 0;
    const value = currentPrice * position.quantity;
    const cost = position.buyPrice * position.quantity;
    return {
      ...position,
      name: stock?.name ?? position.ticker,
      currentPrice,
      value,
      pnl: value - cost,
      pnlPercent: ((value - cost) / cost) * 100,
    };
  });
}

export function portfolioSummary(rows = portfolioRows()) {
  const value = rows.reduce((sum, row) => sum + row.value, 0);
  const cost = rows.reduce((sum, row) => sum + row.buyPrice * row.quantity, 0);
  return {
    value,
    pnl: value - cost,
    pnlPercent: cost > 0 ? ((value - cost) / cost) * 100 : 0,
  };
}
