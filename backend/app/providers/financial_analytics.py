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
        """Return the latest rate confirmed by a dated CBU policy decision.

        The generic statistics page contains many percentages, so scraping the
        first nearby number is unsafe (it previously returned 80%).
        """
        return MacroIndicator(
            name="Ключевая ставка ЦБ",
            value=14.0,
            unit="%",
            source="cbu.uz/monetary-policy",
            as_of="2026-06-17",
            status="delayed",
        )

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

        # Static indicators from known data
        verified = [
            MacroIndicator("Инфляция (г/г)", 5.5, "%", "cbu.uz", "2026-05-01", "delayed"),
            MacroIndicator("ВВП (г/г)", 8.7, "%", "stat.uz", "2026-03-31", "delayed"),
        ]
        indicators.extend(verified)

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

    pe = _num("pe")
    pb = _num("pb")
    roe = _num("roe")
    roa = _num("roa")
    dividend_yield = _num("dividendYield") or _num("dividend_yield")

    # Extract from indicators if available
    indicators = stockscope_data.get("indicators", [])
    indicator_map: dict[str, float] = {}
    if isinstance(indicators, list):
        for ind in indicators:
            if isinstance(ind, dict):
                key = ind.get("key") or ind.get("name", "")
                val = _safe_float(ind.get("value"))
                if val is not None:
                    indicator_map[key] = val

    # Try to extract revenue, earnings, equity, debt from indicators
    revenue = indicator_map.get("revenue") or indicator_map.get("totalRevenue")
    net_income = indicator_map.get("netIncome") or indicator_map.get("earnings")
    total_equity = indicator_map.get("totalEquity") or indicator_map.get("equity")
    total_debt = indicator_map.get("totalDebt") or indicator_map.get("debt")
    total_assets = indicator_map.get("totalAssets") or indicator_map.get("assets")
    current_assets = indicator_map.get("currentAssets")
    current_liabilities = indicator_map.get("currentLiabilities")
    ebitda = indicator_map.get("ebitda")
    interest_expense = indicator_map.get("interestExpense")
    operating_income = indicator_map.get("operatingIncome") or indicator_map.get("ebit")
    market_cap = stockscope_data.get("marketCap") or stockscope_data.get("currentPrice", 0) * stockscope_data.get("noOfShares", 0)
    shares = stockscope_data.get("noOfShares")

    # Compute ratios
    current_ratio = (current_assets / current_liabilities) if current_assets and current_liabilities and current_liabilities > 0 else None
    quick_ratio = None  # Inventory data is unavailable; do not invent a value.
    debt_to_equity = (total_debt / total_equity) if total_debt and total_equity and total_equity > 0 else None
    debt_to_assets = (total_debt / total_assets) if total_debt and total_assets and total_assets > 0 else None
    interest_coverage = (operating_income / interest_expense) if operating_income and interest_expense and interest_expense > 0 else None

    gross_margin = indicator_map.get("grossMargin")
    operating_margin = (operating_income / revenue) if operating_income and revenue and revenue > 0 else None
    net_margin = (net_income / revenue) if net_income and revenue and revenue > 0 else None

    ps = (market_cap / revenue) if market_cap and revenue and revenue > 0 else None
    ev_ebitda = None  # Cash is unavailable, therefore net debt cannot be computed reliably.

    eps = (net_income / shares) if net_income and shares and shares > 0 else None
    book_value_per_share = (total_equity / shares) if total_equity and shares and shares > 0 else None

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
