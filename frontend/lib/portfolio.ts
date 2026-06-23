import { positions, stocks, type Stock } from "@/lib/data";

export function portfolioRows(marketStocks: Stock[] = stocks) {
  return positions.map((position) => {
    const stock = marketStocks.find((item) => item.ticker.toLowerCase() === position.ticker.toLowerCase());
    const currentPrice = stock?.price ?? position.buyPrice;
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
    pnlPercent: ((value - cost) / cost) * 100,
  };
}
