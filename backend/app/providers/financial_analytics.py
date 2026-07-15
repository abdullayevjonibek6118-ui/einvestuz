"""Financial analytics providers for Uzbekistan market.

Provides:
- CBU macro data (policy rate, inflation)
- Technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands)
- Financial ratios from StockScope data (EV/EBITDA, ROCE, payout ratio, etc.)
"""

from __future__ import annotations

import json
import math
import re
import ssl
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Any
from urllib.request import Request, urlopen

import certifi


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_SSL_CTX = ssl.create_default_context()
_SSL_CTX.load_verify_locations(certifi.where())


def _fetch_json(url: str, timeout: int = 15) -> Any:
    req = Request(url, headers={"User-Agent": "EInvestuz/0.2"})
    with urlopen(req, timeout=timeout, context=_SSL_CTX) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _safe_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value) if math.isfinite(value) else None
    if isinstance(value, str):
        cleaned = value.replace(" ", "").replace(",", ".").replace("%", "")
        try:
            v = float(cleaned)
            return v if math.isfinite(v) else None
        except ValueError:
            return None
    return None


# ---------------------------------------------------------------------------
# 1. CBU Macro Data Provider
# ---------------------------------------------------------------------------

@dataclass
class MacroIndicator:
    name: str
    value: float | None
    unit: str
    source: str
    as_of: str
    status: str = "live"


class CBUMacroProvider:
    """Fetches macro-economic indicators from Central Bank of Uzbekistan."""

    BASE_URL = "https://cbu.uz"

    def get_exchange_rates(self) -> list[dict[str, Any]]:
        """Get current CBU exchange rates (all currencies)."""
        try:
            data = _fetch_json(f"{self.BASE_URL}/en/arkhiv-kursov-valyut/json/")
            return [
                {
                    "ccy": item.get("Ccy"),
                    "rate": _safe_float(item.get("Rate")),
                    "diff": _safe_float(item.get("Diff")),
                    "nominal": _safe_float(item.get("Nominal")),
                    "name_ru": item.get("CcyNm_RU"),
                    "name_en": item.get("CcyNm_EN"),
                    "date": item.get("Date"),
                }
                for item in data
                if item.get("Ccy") in {"USD", "EUR", "RUB", "GBP", "CNY", "KZT", "TRY"}
            ]
        except Exception:
            return []

    def get_key_rate(self) -> MacroIndicator | None:
        """Key rate scraping is intentionally disabled until a stable endpoint is available."""
        return None

    def get_macro_summary(self) -> list[MacroIndicator]:
        """Aggregate key macro indicators for Uzbekistan."""
        rates = self.get_exchange_rates()
        key_rate = self.get_key_rate()

        indicators: list[MacroIndicator] = []

        if key_rate:
            indicators.append(key_rate)

        # Extract main FX rates
        main_ccies = {"USD": "Доллар США", "EUR": "Евро", "RUB": "Российский рубль", "CNY": "Юань"}
        for rate in rates:
            ccy = rate.get("ccy")
            if ccy in main_ccies and rate.get("rate") is not None:
                indicators.append(MacroIndicator(
                    name=f"Курс {main_ccies[ccy]}",
                    value=rate["rate"],
                    unit="UZS",
                    source="cbu.uz",
                    as_of=str(rate.get("date") or datetime.now(timezone.utc).date().isoformat()),
                    status="delayed",
                ))

        return indicators


# ---------------------------------------------------------------------------
# 2. Technical Indicators
# ---------------------------------------------------------------------------

@dataclass
class TechnicalIndicators:
    sma_20: float | None = None
    sma_50: float | None = None
    sma_200: float | None = None
    ema_12: float | None = None
    ema_26: float | None = None
    macd: float | None = None
    macd_signal: float | None = None
    macd_histogram: float | None = None
    rsi_14: float | None = None
    bb_upper: float | None = None
    bb_middle: float | None = None
    bb_lower: float | None = None
    atr_14: float | None = None
    obv: float | None = None
    vwap: float | None = None


def compute_sma(prices: list[float], period: int) -> float | None:
    if len(prices) < period:
        return None
    return sum(prices[-period:]) / period


def compute_ema(prices: list[float], period: int) -> float | None:
    if len(prices) < period:
        return None
    multiplier = 2 / (period + 1)
    ema = sum(prices[:period]) / period
    for price in prices[period:]:
        ema = (price - ema) * multiplier + ema
    return ema


def compute_rsi(prices: list[float], period: int = 14) -> float | None:
    if len(prices) < period + 1:
        return None
    deltas = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for i in range(period, len(deltas)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def compute_macd(prices: list[float]) -> tuple[float | None, float | None, float | None]:
    ema12 = compute_ema(prices, 12)
    ema26 = compute_ema(prices, 26)
    if ema12 is None or ema26 is None:
        return None, None, None
    macd_line = ema12 - ema26
    # Signal line needs MACD series — approximate with current value
    return macd_line, None, None


def compute_bollinger_bands(prices: list[float], period: int = 20) -> tuple[float | None, float | None, float | None]:
    if len(prices) < period:
        return None, None, None
    recent = prices[-period:]
    middle = sum(recent) / period
    variance = sum((p - middle) ** 2 for p in recent) / period
    std_dev = variance ** 0.5
    return middle + 2 * std_dev, middle, middle - 2 * std_dev


def compute_atr(highs: list[float], lows: list[float], closes: list[float], period: int = 14) -> float | None:
    if len(highs) < period + 1:
        return None
    true_ranges = []
    for i in range(1, len(highs)):
        tr = max(
            highs[i] - lows[i],
            abs(highs[i] - closes[i - 1]),
            abs(lows[i] - closes[i - 1]),
        )
        true_ranges.append(tr)
    if len(true_ranges) < period:
        return None
    atr = sum(true_ranges[:period]) / period
    for tr in true_ranges[period:]:
        atr = (atr * (period - 1) + tr) / period
    return atr


def compute_obv(closes: list[float], volumes: list[float]) -> float | None:
    if len(closes) < 2:
        return None
    obv = 0.0
    for i in range(1, len(closes)):
        if closes[i] > closes[i - 1]:
            obv += volumes[i]
        elif closes[i] < closes[i - 1]:
            obv -= volumes[i]
    return obv


def compute_vwap(prices: list[float], volumes: list[float]) -> float | None:
    if not prices or not volumes or len(prices) != len(volumes):
        return None
    total_volume = sum(volumes)
    if total_volume == 0:
        return None
    return sum(p * v for p, v in zip(prices, volumes)) / total_volume


def compute_technical_indicators(
    closes: list[float],
    highs: list[float] | None = None,
    lows: list[float] | None = None,
    volumes: list[float] | None = None,
) -> TechnicalIndicators:
    """Compute all technical indicators from price data."""
    return TechnicalIndicators(
        sma_20=compute_sma(closes, 20),
        sma_50=compute_sma(closes, 50),
        sma_200=compute_sma(closes, 200),
        ema_12=compute_ema(closes, 12),
        ema_26=compute_ema(closes, 26),
        macd=compute_macd(closes)[0],
        rsi_14=compute_rsi(closes, 14),
        bb_upper=compute_bollinger_bands(closes)[0],
        bb_middle=compute_bollinger_bands(closes)[1],
        bb_lower=compute_bollinger_bands(closes)[2],
        atr_14=compute_atr(highs or closes, lows or closes, closes) if highs and lows else None,
        obv=compute_obv(closes, volumes or [1.0] * len(closes)) if volumes else None,
        vwap=compute_vwap(closes, volumes) if volumes else None,
    )


# ---------------------------------------------------------------------------
# 3. Financial Ratios from StockScope Data
# ---------------------------------------------------------------------------

@dataclass
class FinancialRatios:
    # Liquidity
    current_ratio: float | None = None
    quick_ratio: float | None = None
    # Leverage
    debt_to_equity: float | None = None
    debt_to_assets: float | None = None
    interest_coverage: float | None = None
    # Profitability
    roe: float | None = None
    roa: float | None = None
    roce: float | None = None
    gross_margin: float | None = None
    operating_margin: float | None = None
    net_margin: float | None = None
    # Valuation
    pe: float | None = None
    pb: float | None = None
    ps: float | None = None
    ev_ebitda: float | None = None
    # Dividend
    dividend_yield: float | None = None
    payout_ratio: float | None = None
    # Per share
    eps: float | None = None
    book_value_per_share: float | None = None
    # Cash flow (estimated)
    fcf_yield: float | None = None


def compute_financial_ratios(stockscope_data: dict[str, Any]) -> FinancialRatios:
    """Compute financial ratios from StockScope screener/detail data."""
    def _num(key: str) -> float | None:
        val = stockscope_data.get(key)
        return _safe_float(val)

    def _coalesce(*values: float | None) -> float | None:
        return next((value for value in values if value is not None), None)

    listing = stockscope_data.get("listing") if isinstance(stockscope_data.get("listing"), dict) else {}

    pe = _num("pe")
    pb = _num("pb")
    roe = _num("roe")
    roa = _num("roa")
    dividend_yield = _coalesce(_num("dividendYield"), _num("dividend_yield"))

    # Extract from indicators if available
    indicators = stockscope_data.get("indicators", [])
    indicator_map: dict[str, float] = {}
    stockscope_period_values = False
    if isinstance(indicators, list):
        for ind in indicators:
            if isinstance(ind, dict):
                values = ind.get("values") if isinstance(ind.get("values"), dict) else None
                if values is not None:
                    stockscope_period_values = True
                    for key, raw_value in values.items():
                        val = _safe_float(raw_value)
                        if val is not None and key not in indicator_map:
                            indicator_map[str(key)] = val
                    continue
                key = ind.get("key") or ind.get("name", "")
                val = _safe_float(ind.get("value"))
                if val is not None:
                    indicator_map[str(key)] = val

    # Try to extract revenue, earnings, equity, debt from indicators
    def _first(*keys: str) -> float | None:
        return next((indicator_map[key] for key in keys if key in indicator_map), None)

    pe = _coalesce(pe, _first("PE"))
    pb = _coalesce(pb, _first("PB"))
    roe = _coalesce(roe, _first("ROE"))
    roa = _coalesce(roa, _first("ROA"))
    dividend_yield = _coalesce(dividend_yield, _first("DividendYield"))

    revenue = _first("revenue", "totalRevenue", "Revenue")
    net_income = _first("netIncome", "earnings", "Earnings")
    total_equity = _first("totalEquity", "equity", "Equity")
    prior_equity = _first("priorTotalEquity", "priorEquity")
    total_debt = _first("totalDebt", "debt", "totalLiabilities", "Debt")
    total_assets = _first("totalAssets", "assets", "Assets")
    prior_assets = _first("priorTotalAssets", "priorAssets")
    current_assets = _first("currentAssets", "CurrentAssets")
    current_liabilities = _first("currentLiabilities", "CurrentLiabilities")
    ebitda = indicator_map.get("ebitda")
    interest_expense = _first("interestExpense", "InterestExpense")
    operating_income = _coalesce(_first("operatingIncome"), _first("ebit"), _first("OperatingIncome"))
    shares = _coalesce(_safe_float(stockscope_data.get("noOfShares")), _safe_float(listing.get("noOfShares")))
    market_cap = _coalesce(_safe_float(stockscope_data.get("marketCap")), _safe_float(stockscope_data.get("market_cap")), _safe_float(listing.get("marketCap")), _first("MarketCap"))
    if market_cap is None:
        price = _coalesce(_safe_float(stockscope_data.get("currentPrice")), _safe_float(listing.get("currentPrice")))
        market_cap = price * shares if price is not None and shares is not None else None
    financial_scale = 1000.0 if stockscope_period_values else 1.0
    revenue_for_valuation = revenue * financial_scale if revenue is not None else None
    net_income_for_valuation = net_income * financial_scale if net_income is not None else None
    equity_for_valuation = total_equity * financial_scale if total_equity is not None else None

    # Compute ratios
    current_ratio = (current_assets / current_liabilities) if current_assets is not None and current_liabilities and current_liabilities > 0 else None
    quick_ratio = None  # Inventory data is unavailable; do not invent a value.
    debt_to_equity = _coalesce(_first("DebtToEquity"), (total_debt / total_equity) if total_debt is not None and total_equity and total_equity > 0 else None)
    debt_to_assets = (total_debt / total_assets) if total_debt is not None and total_assets and total_assets > 0 else None
    interest_coverage = (operating_income / interest_expense) if operating_income is not None and interest_expense and interest_expense > 0 else None

    average_equity = (total_equity + prior_equity) / 2 if total_equity is not None and prior_equity is not None else total_equity
    average_assets = (total_assets + prior_assets) / 2 if total_assets is not None and prior_assets is not None else total_assets
    roe = roe if roe is not None else ((net_income / average_equity) * 100 if net_income is not None and average_equity and average_equity > 0 else None)
    roa = roa if roa is not None else ((net_income / average_assets) * 100 if net_income is not None and average_assets and average_assets > 0 else None)

    gross_margin = _first("grossMargin", "grossProfitMargin", "GrossProfitMargin")
    operating_margin = _coalesce(_first("OperatingProfitMargin"), (operating_income / revenue * 100) if operating_income is not None and revenue and revenue > 0 else None)
    net_margin = _coalesce(_first("NetProfitMargin"), (net_income / revenue * 100) if net_income is not None and revenue and revenue > 0 else None)

    ps = (market_cap / revenue_for_valuation) if market_cap and revenue_for_valuation and revenue_for_valuation > 0 else None
    pe = pe if pe is not None else ((market_cap / net_income_for_valuation) if market_cap and net_income_for_valuation and net_income_for_valuation > 0 else None)
    pb = pb if pb is not None else ((market_cap / equity_for_valuation) if market_cap and equity_for_valuation and equity_for_valuation > 0 else None)
    ev_ebitda = None  # Cash is unavailable, therefore net debt cannot be computed reliably.

    eps = (net_income_for_valuation / shares) if net_income_for_valuation is not None and shares and shares > 0 else None
    book_value_per_share = (equity_for_valuation / shares) if equity_for_valuation is not None and shares and shares > 0 else None

    payout_ratio = None  # Requires actual dividends paid and attributable earnings.

    fcf_yield = None  # Needs free cash flow data

    return FinancialRatios(
        current_ratio=current_ratio,
        quick_ratio=quick_ratio,
        debt_to_equity=debt_to_equity,
        debt_to_assets=debt_to_assets,
        interest_coverage=interest_coverage,
        roe=roe,
        roa=roa,
        roce=None,  # Needs capital employed data
        gross_margin=gross_margin,
        operating_margin=operating_margin,
        net_margin=net_margin,
        pe=pe,
        pb=pb,
        ps=ps,
        ev_ebitda=ev_ebitda,
        dividend_yield=dividend_yield,
        payout_ratio=payout_ratio,
        eps=eps,
        book_value_per_share=book_value_per_share,
        fcf_yield=fcf_yield,
    )


# ---------------------------------------------------------------------------
# 4. UZSE OHLCV Aggregator
# ---------------------------------------------------------------------------

@dataclass
class OHLCVBar:
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    turnover: float | None = None


def aggregate_daily_ohlcv(trades: list[dict[str, Any]], ticker: str) -> list[OHLCVBar]:
    """Aggregate UZSE trade results into daily OHLCV bars for a specific ticker."""
    ticker_upper = ticker.upper()
    daily: dict[str, dict[str, Any]] = {}

    for trade in trades:
        if str(trade.get("ticker", "")).upper() != ticker_upper:
            continue

        trade_date = trade.get("trade_date") or trade.get("date", "")
        if not trade_date:
            continue

        price = _safe_float(trade.get("price"))
        volume = _safe_float(trade.get("volume")) or 0
        turnover = _safe_float(trade.get("turnover"))

        if price is None or price <= 0:
            continue

        if trade_date not in daily:
            daily[trade_date] = {
                "open": price,
                "high": price,
                "low": price,
                "close": price,
                "volume": volume,
                "turnover": turnover or 0,
            }
        else:
            bar = daily[trade_date]
            bar["high"] = max(bar["high"], price)
            bar["low"] = min(bar["low"], price)
            bar["close"] = price
            bar["volume"] += volume
            if turnover:
                bar["turnover"] = (bar["turnover"] or 0) + turnover

    return [
        OHLCVBar(
            date=d,
            open=bar["open"],
            high=bar["high"],
            low=bar["low"],
            close=bar["close"],
            volume=bar["volume"],
            turnover=bar["turnover"],
        )
        for d, bar in sorted(daily.items())
    ]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_macro_indicators() -> list[MacroIndicator]:
    return CBUMacroProvider().get_macro_summary()


def get_technical_indicators(
    closes: list[float],
    highs: list[float] | None = None,
    lows: list[float] | None = None,
    volumes: list[float] | None = None,
) -> TechnicalIndicators:
    return compute_technical_indicators(closes, highs, lows, volumes)


def get_financial_ratios(stockscope_data: dict[str, Any]) -> FinancialRatios:
    return compute_financial_ratios(stockscope_data)
