from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
import time
from typing import Any, Literal
import warnings
from urllib.parse import quote
from urllib.parse import urlencode
from urllib.request import Request, urlopen


AssetCategory = Literal["index", "crypto", "commodity"]


@dataclass(frozen=True)
class SymbolSpec:
    ticker: str
    yahoo_symbol: str
    name: str
    category: AssetCategory | Literal["stock"] = "stock"
    description: str = ""


@dataclass
class Quote:
    ticker: str
    name: str
    price: float
    change: float
    market_cap: str = "N/A"
    pe: float = 0.0
    dividend: str = "0%"
    description: str = ""
    category: AssetCategory | Literal["stock"] = "stock"
    source: str = "fallback"
    as_of: datetime | None = None


STOCK_UNIVERSE: dict[str, SymbolSpec] = {
    "AAPL": SymbolSpec("AAPL", "AAPL", "Apple", description="Consumer devices, services, and software ecosystem."),
    "NVDA": SymbolSpec("NVDA", "NVDA", "Nvidia", description="AI accelerators, GPUs, networking, and data-center software."),
    "MSFT": SymbolSpec("MSFT", "MSFT", "Microsoft", description="Cloud, productivity software, operating systems, gaming, and AI services."),
    "TSLA": SymbolSpec("TSLA", "TSLA", "Tesla", description="Electric vehicles, energy systems, charging, and autonomy software."),
    "AMZN": SymbolSpec("AMZN", "AMZN", "Amazon", description="E-commerce, logistics, advertising, subscriptions, and AWS."),
    "META": SymbolSpec("META", "META", "Meta", description="Social platforms, advertising, messaging, AI, and Reality Labs."),
}

MARKET_UNIVERSE: dict[str, SymbolSpec] = {
    "SPX": SymbolSpec("SPX", "^GSPC", "S&P 500", "index"),
    "IXIC": SymbolSpec("IXIC", "^IXIC", "Nasdaq Composite", "index"),
    "DJI": SymbolSpec("DJI", "^DJI", "Dow Jones Industrial Average", "index"),
    "BTC": SymbolSpec("BTC", "BTC-USD", "Bitcoin", "crypto"),
    "ETH": SymbolSpec("ETH", "ETH-USD", "Ethereum", "crypto"),
    "XAU": SymbolSpec("XAU", "GC=F", "Gold Futures", "commodity"),
    "WTI": SymbolSpec("WTI", "CL=F", "WTI Crude Oil Futures", "commodity"),
}


class TTLCache:
    def __init__(self, ttl_seconds: int) -> None:
        self.ttl_seconds = ttl_seconds
        self._values: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        cached = self._values.get(key)
        if cached is None:
            return None
        expires_at, value = cached
        if expires_at < time.time():
            self._values.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._values[key] = (time.time() + self.ttl_seconds, value)


_QUOTE_CACHE = TTLCache(ttl_seconds=60)


def get_stocks() -> list[Quote]:
    return [_get_quote(spec) for spec in STOCK_UNIVERSE.values()]


def get_stock(ticker: str) -> Quote | None:
    spec = STOCK_UNIVERSE.get(ticker.upper())
    if spec is None:
        return None
    return _get_quote(spec)


def get_market() -> list[Quote]:
    return [_get_quote(spec) for spec in MARKET_UNIVERSE.values()]


def _get_quote(spec: SymbolSpec) -> Quote:
    cache_key = f"quote:{spec.yahoo_symbol}"
    cached = _QUOTE_CACHE.get(cache_key)
    if cached is not None:
        return cached

    quote = _quote_from_yfinance(spec)
    if quote is None:
        quote = _quote_from_yahoo_chart(spec)
    if quote is None:
        quote = _quote_from_yahoo_quote(spec)
    if quote is None:
        quote = _empty_quote(spec)

    _QUOTE_CACHE.set(cache_key, quote)
    return quote


def _quote_from_yfinance(spec: SymbolSpec) -> Quote | None:
    try:
        import yfinance as yf
    except ImportError:
        return None

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            ticker = yf.Ticker(spec.yahoo_symbol)
            fast_info = ticker.fast_info
            price = _first_mapping_number(
                fast_info,
                "lastPrice",
                "last_price",
                "regularMarketPrice",
                "previousClose",
                "previous_close",
            )
            previous_close = _first_mapping_number(
                fast_info,
                "previousClose",
                "previous_close",
                "regularMarketPreviousClose",
                "regular_market_previous_close",
            )
            market_cap = _first_mapping_number(fast_info, "marketCap", "market_cap")

            if price is None:
                history = ticker.history(period="5d", interval="1d", auto_adjust=False)
                if history.empty:
                    return None
                close_values = [float(value) for value in history["Close"].dropna().tolist()]
                if not close_values:
                    return None
                price = close_values[-1]
                if previous_close is None and len(close_values) > 1:
                    previous_close = close_values[-2]

        return Quote(
            ticker=spec.ticker,
            name=spec.name,
            price=round(price, 2),
            change=round(_percent_change(price, previous_close), 2),
            market_cap=_format_large_number(market_cap),
            pe=0.0,
            dividend="0%",
            description=spec.description,
            category=spec.category,
            source="yfinance",
            as_of=datetime.now(timezone.utc),
        )
    except Exception:
        return None


def _quote_from_yfinance_info(spec: SymbolSpec) -> Quote | None:
    try:
        import yfinance as yf
    except ImportError:
        return None

    try:
        ticker = yf.Ticker(spec.yahoo_symbol)
        info = ticker.info or {}
        price = _first_number(
            info,
            "regularMarketPrice",
            "currentPrice",
            "postMarketPrice",
            "previousClose",
        )
        previous_close = _first_number(info, "regularMarketPreviousClose", "previousClose")

        if price is None:
            history = ticker.history(period="5d", interval="1d", auto_adjust=False)
            if history.empty:
                return None
            close_values = [float(value) for value in history["Close"].dropna().tolist()]
            if not close_values:
                return None
            price = close_values[-1]
            if previous_close is None and len(close_values) > 1:
                previous_close = close_values[-2]

        change = _percent_change(price, previous_close)
        quote = Quote(
            ticker=spec.ticker,
            name=str(info.get("shortName") or info.get("longName") or spec.name),
            price=round(price, 2),
            change=round(change, 2),
            market_cap=_format_large_number(_first_number(info, "marketCap")),
            pe=round(_first_number(info, "trailingPE", "forwardPE") or 0.0, 2),
            dividend=_format_percent(_first_number(info, "dividendYield")),
            description=str(info.get("longBusinessSummary") or spec.description),
            category=spec.category,
            source="yfinance",
            as_of=datetime.now(timezone.utc),
        )
        return quote
    except Exception:
        return None


def _quote_from_yahoo_chart(spec: SymbolSpec) -> Quote | None:
    symbol = quote(spec.yahoo_symbol, safe="")
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=5d&interval=1d"
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})

    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return None

    result = payload.get("chart", {}).get("result", [])
    if not result:
        return None

    item = result[0]
    meta = item.get("meta", {})
    price = _coerce_float(meta.get("regularMarketPrice"))
    closes = [
        value
        for value in item.get("indicators", {}).get("quote", [{}])[0].get("close", [])
        if _coerce_float(value) is not None
    ]
    if price is None and closes:
        price = _coerce_float(closes[-1])
    if price is None:
        return None

    previous_close = _coerce_float(meta.get("chartPreviousClose") or meta.get("previousClose"))
    if previous_close is None and len(closes) > 1:
        previous_close = _coerce_float(closes[-2])

    return Quote(
        ticker=spec.ticker,
        name=spec.name,
        price=round(price, 2),
        change=round(_percent_change(price, previous_close), 2),
        description=spec.description,
        category=spec.category,
        source="yahoo_chart",
        as_of=datetime.now(timezone.utc),
    )


def _quote_from_yahoo_quote(spec: SymbolSpec) -> Quote | None:
    fields = ",".join(
        [
            "regularMarketPrice",
            "regularMarketPreviousClose",
            "regularMarketChangePercent",
            "marketCap",
            "trailingPE",
            "dividendYield",
            "shortName",
            "longName",
        ]
    )
    query = urlencode({"symbols": spec.yahoo_symbol, "fields": fields})
    url = f"https://query1.finance.yahoo.com/v7/finance/quote?{query}"
    request = Request(url, headers={"User-Agent": "Einvestuz/0.1"})

    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return None

    result = payload.get("quoteResponse", {}).get("result", [])
    if not result:
        return None

    item = result[0]
    price = _coerce_float(item.get("regularMarketPrice"))
    if price is None:
        return None

    change = _coerce_float(item.get("regularMarketChangePercent"))
    if change is None:
        change = _percent_change(price, _coerce_float(item.get("regularMarketPreviousClose")))

    return Quote(
        ticker=spec.ticker,
        name=str(item.get("shortName") or item.get("longName") or spec.name),
        price=round(price, 2),
        change=round(change, 2),
        market_cap=_format_large_number(_coerce_float(item.get("marketCap"))),
        pe=round(_coerce_float(item.get("trailingPE")) or 0.0, 2),
        dividend=_format_percent(_coerce_float(item.get("dividendYield"))),
        description=spec.description,
        category=spec.category,
        source="yahoo",
        as_of=datetime.now(timezone.utc),
    )


def _empty_quote(spec: SymbolSpec) -> Quote:
    return Quote(
        ticker=spec.ticker,
        name=spec.name,
        price=0.0,
        change=0.0,
        description=spec.description,
        category=spec.category,
        source="unavailable",
        as_of=datetime.now(timezone.utc),
    )


def _first_number(source: dict[str, Any], *keys: str) -> float | None:
    for key in keys:
        value = _coerce_float(source.get(key))
        if value is not None:
            return value
    return None


def _first_mapping_number(source: Any, *keys: str) -> float | None:
    for key in keys:
        try:
            value = source.get(key)
        except Exception:
            value = None
        number = _coerce_float(value)
        if number is not None:
            return number
    return None


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _percent_change(price: float, previous_close: float | None) -> float:
    if previous_close in (None, 0):
        return 0.0
    return ((price - previous_close) / previous_close) * 100


def _format_percent(value: float | None) -> str:
    if value is None:
        return "0%"
    return f"{value:.2f}%"


def _format_large_number(value: float | None) -> str:
    if value is None or value <= 0:
        return "N/A"
    units = [(1_000_000_000_000, "T"), (1_000_000_000, "B"), (1_000_000, "M")]
    for divisor, suffix in units:
        if value >= divisor:
            return f"${value / divisor:.1f}{suffix}"
    return f"${value:,.0f}"
