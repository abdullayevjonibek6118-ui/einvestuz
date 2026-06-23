from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import json
import ssl
import time
import warnings
from typing import Any, Literal
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


AssetCategory = Literal["index", "crypto", "commodity", "stock"]
SourceStatus = Literal["live", "delayed", "fallback", "needs_license", "offline"]


@dataclass(frozen=True)
class DataSource:
    id: str
    name: str
    market: str
    coverage: str
    update_mode: str
    status: SourceStatus
    url: str
    notes: str


@dataclass(frozen=True)
class SymbolSpec:
    ticker: str
    provider_symbol: str
    name: str
    provider: str
    category: AssetCategory = "stock"
    exchange: str = "US"
    currency: str = "USD"
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
    category: AssetCategory = "stock"
    exchange: str = "US"
    currency: str = "USD"
    source: str = "unavailable"
    provider: str = "unavailable"
    status: SourceStatus = "offline"
    is_realtime: bool = False
    delay_seconds: int | None = None
    as_of: datetime | None = None


class MarketDataProvider(ABC):
    id: str

    @abstractmethod
    def get_quote(self, spec: SymbolSpec) -> Quote | None:
        raise NotImplementedError


class FunctionProvider(MarketDataProvider):
    def __init__(self, provider_id: str, quote_func) -> None:
        self.id = provider_id
        self._quote_func = quote_func

    def get_quote(self, spec: SymbolSpec) -> Quote | None:
        return self._quote_func(spec)


class LicensedProviderStub(MarketDataProvider):
    def __init__(self, provider_id: str) -> None:
        self.id = provider_id

    def get_quote(self, spec: SymbolSpec) -> Quote | None:
        return None


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


SOURCES: list[DataSource] = [
    DataSource(
        id="yfinance",
        name="Yahoo Finance via yfinance",
        market="Global / US",
        coverage="US equities, indexes, crypto and commodities used by MVP",
        update_mode="near-real-time public quotes, best-effort",
        status="delayed",
        url="https://pypi.org/project/yfinance/",
        notes="No-key MVP source. Not exchange-licensed; use only as fallback/prototype source.",
    ),
    DataSource(
        id="moex-iss",
        name="MOEX ISS",
        market="Russia",
        coverage="Moscow Exchange securities, marketdata, candles and reference data",
        update_mode="official public HTTP snapshots; real-time/low-latency requires MOEX FAST",
        status="delayed",
        url="https://iss.moex.com/iss/reference/",
        notes="Authoritative MOEX web API. For licensed low-latency production use MOEX FAST/ASTS/Plaza feeds.",
    ),
    DataSource(
        id="uzse-bloomberg",
        name="UZSE via Bloomberg Data License / B-PIPE",
        market="Uzbekistan",
        coverage="Republican Stock Exchange Toshkent equities and bonds",
        update_mode="licensed real-time enterprise feed",
        status="needs_license",
        url="https://uzse.uz/",
        notes="Official UZSE data is available through Bloomberg products; requires commercial agreement.",
    ),
    DataSource(
        id="lseg",
        name="LSEG Real-Time",
        market="Global",
        coverage="Global exchange and OTC real-time market data",
        update_mode="licensed real-time enterprise feed",
        status="needs_license",
        url="https://www.lseg.com/en/data-analytics/market-data/data-feeds",
        notes="Production-grade global source candidate for broad exchange coverage.",
    ),
    DataSource(
        id="bloomberg-bpipe",
        name="Bloomberg B-PIPE",
        market="Global",
        coverage="Global normalized real-time market data",
        update_mode="licensed real-time enterprise feed",
        status="needs_license",
        url="https://professional.bloomberg.com/products/data/enterprise-catalog/real-time-data-feed/",
        notes="Production-grade source for real-time global equities, indexes and cross-asset data.",
    ),
]


STOCK_UNIVERSE: dict[str, SymbolSpec] = {
    "AAPL": SymbolSpec("AAPL", "AAPL", "Apple", "yfinance", description="Consumer devices, services, and software ecosystem."),
    "NVDA": SymbolSpec("NVDA", "NVDA", "Nvidia", "yfinance", description="AI accelerators, GPUs, networking, and data-center software."),
    "MSFT": SymbolSpec("MSFT", "MSFT", "Microsoft", "yfinance", description="Cloud, productivity software, operating systems, gaming, and AI services."),
    "TSLA": SymbolSpec("TSLA", "TSLA", "Tesla", "yfinance", description="Electric vehicles, energy systems, charging, and autonomy software."),
    "AMZN": SymbolSpec("AMZN", "AMZN", "Amazon", "yfinance", description="E-commerce, logistics, advertising, subscriptions, and AWS."),
    "META": SymbolSpec("META", "META", "Meta", "yfinance", description="Social platforms, advertising, messaging, AI, and Reality Labs."),
    "SBER": SymbolSpec("SBER", "SBER", "Sberbank", "moex-iss", exchange="MOEX", currency="RUB", description="Russian banking and financial services group."),
    "GAZP": SymbolSpec("GAZP", "GAZP", "Gazprom", "moex-iss", exchange="MOEX", currency="RUB", description="Russian gas producer and energy company."),
    "LKOH": SymbolSpec("LKOH", "LKOH", "Lukoil", "moex-iss", exchange="MOEX", currency="RUB", description="Russian oil and gas company."),
}

MARKET_UNIVERSE: dict[str, SymbolSpec] = {
    "SPX": SymbolSpec("SPX", "^GSPC", "S&P 500", "yfinance", "index"),
    "IXIC": SymbolSpec("IXIC", "^IXIC", "Nasdaq Composite", "yfinance", "index"),
    "DJI": SymbolSpec("DJI", "^DJI", "Dow Jones Industrial Average", "yfinance", "index"),
    "IMOEX": SymbolSpec("IMOEX", "IMOEX", "MOEX Russia Index", "moex-iss", "index", "MOEX", "RUB"),
    "BTC": SymbolSpec("BTC", "BTC-USD", "Bitcoin", "yfinance", "crypto"),
    "ETH": SymbolSpec("ETH", "ETH-USD", "Ethereum", "yfinance", "crypto"),
    "XAU": SymbolSpec("XAU", "GC=F", "Gold Futures", "yfinance", "commodity"),
    "WTI": SymbolSpec("WTI", "CL=F", "WTI Crude Oil Futures", "yfinance", "commodity"),
}

QUOTE_UNIVERSE = {**STOCK_UNIVERSE, **MARKET_UNIVERSE}
_QUOTE_CACHE = TTLCache(ttl_seconds=20)


def get_sources() -> list[dict[str, str]]:
    return [asdict(source) for source in SOURCES]


def get_stocks() -> list[Quote]:
    return [_get_quote(spec) for spec in STOCK_UNIVERSE.values()]


def get_stock(ticker: str) -> Quote | None:
    spec = STOCK_UNIVERSE.get(ticker.upper())
    if spec is None:
        return None
    return _get_quote(spec)


def get_market() -> list[Quote]:
    return [_get_quote(spec) for spec in MARKET_UNIVERSE.values()]


def get_quotes(symbols: list[str]) -> list[Quote]:
    quotes: list[Quote] = []
    for symbol in symbols:
        ticker = symbol.upper()
        spec = QUOTE_UNIVERSE.get(ticker)
        if spec is None:
            quotes.append(_empty_quote(SymbolSpec(ticker, ticker, ticker, "unknown")))
        else:
            quotes.append(_get_quote(spec))
    return quotes


def _get_quote(spec: SymbolSpec) -> Quote:
    cache_key = f"quote:{spec.provider}:{spec.provider_symbol}"
    cached = _QUOTE_CACHE.get(cache_key)
    if cached is not None:
        return cached

    provider = PROVIDERS.get(spec.provider) or PROVIDERS["yfinance"]
    quote_value = provider.get_quote(spec)
    if quote_value is None and provider.id != "yfinance":
        quote_value = PROVIDERS["yfinance"].get_quote(spec)

    if quote_value is None:
        quote_value = _empty_quote(spec)
    _QUOTE_CACHE.set(cache_key, quote_value)
    return quote_value


def _quote_from_yfinance(spec: SymbolSpec) -> Quote | None:
    try:
        import yfinance as yf
    except ImportError:
        return None

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            ticker = yf.Ticker(spec.provider_symbol)
            fast_info = ticker.fast_info
            price = _mapping_number(fast_info, "lastPrice", "last_price", "regularMarketPrice")
            previous_close = _mapping_number(fast_info, "previousClose", "previous_close", "regularMarketPreviousClose")
            market_cap = _mapping_number(fast_info, "marketCap", "market_cap")
        if price is None:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                history = ticker.history(period="5d", interval="1d", auto_adjust=False)
            if history.empty:
                return None
            closes = [float(value) for value in history["Close"].dropna().tolist()]
            if not closes:
                return None
            price = closes[-1]
            previous_close = previous_close or (closes[-2] if len(closes) > 1 else None)

        return Quote(
            ticker=spec.ticker,
            name=spec.name,
            price=round(price, 2),
            change=round(_percent_change(price, previous_close), 2),
            market_cap=_format_large_number(market_cap, spec.currency),
            description=spec.description,
            category=spec.category,
            exchange=spec.exchange,
            currency=spec.currency,
            source="yfinance",
            provider=spec.provider,
            status="live",
            is_realtime=True,
            delay_seconds=0,
            as_of=datetime.now(timezone.utc),
        )
    except Exception:
        return None


def _quote_from_yahoo_chart(spec: SymbolSpec) -> Quote | None:
    symbol = quote(spec.provider_symbol, safe="")
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=5d&interval=1d"
    payload = _fetch_json(url, timeout=6)
    if payload is None:
        return None
    result = payload.get("chart", {}).get("result", [])
    if not result:
        return None
    item = result[0]
    meta = item.get("meta", {})
    price = _coerce_float(meta.get("regularMarketPrice"))
    previous_close = _coerce_float(meta.get("chartPreviousClose") or meta.get("previousClose"))
    if price is None:
        return None
    return Quote(
        ticker=spec.ticker,
        name=spec.name,
        price=round(price, 2),
        change=round(_percent_change(price, previous_close), 2),
        description=spec.description,
        category=spec.category,
        exchange=spec.exchange,
        currency=spec.currency,
        source="yahoo_chart",
        provider=spec.provider,
        status="fallback",
        is_realtime=False,
        delay_seconds=None,
        as_of=datetime.now(timezone.utc),
    )


def _quote_from_moex(spec: SymbolSpec) -> Quote | None:
    if spec.category == "index":
        url = (
            "https://iss.moex.com/iss/engines/stock/markets/index/securities/"
            f"{spec.provider_symbol}.json?iss.meta=off&iss.only=marketdata,securities"
            "&marketdata.columns=SECID,LASTVALUE,CURRENTVALUE,LASTCHANGEPRC,SYSTIME"
            "&securities.columns=SECID,SHORTNAME,NAME"
        )
    else:
        url = (
            "https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/"
            f"{spec.provider_symbol}.json?iss.meta=off&iss.only=marketdata,securities"
            "&marketdata.columns=SECID,LAST,LCURRENTPRICE,LASTCHANGEPRCNT,LASTTOPREVPRICE,SYSTIME"
            "&securities.columns=SECID,SHORTNAME,PREVPRICE"
        )
    payload = _fetch_json(url, timeout=8)
    if payload is None:
        return None

    marketdata = _iss_rows(payload.get("marketdata", {}))
    securities = _iss_rows(payload.get("securities", {}))
    row = marketdata[0] if marketdata else {}
    security = securities[0] if securities else {}
    price = _coerce_float(row.get("LAST") or row.get("LCURRENTPRICE") or row.get("LASTVALUE") or row.get("CURRENTVALUE"))
    if price is None:
        return None
    change = _coerce_float(row.get("LASTCHANGEPRCNT") or row.get("LASTTOPREVPRICE") or row.get("LASTCHANGEPRC"))
    if change is None:
        previous = _coerce_float(security.get("PREVPRICE"))
        change = _percent_change(price, previous)

    return Quote(
        ticker=spec.ticker,
        name=str(security.get("SHORTNAME") or security.get("NAME") or spec.name),
        price=round(price, 2),
        change=round(change or 0.0, 2),
        description=spec.description,
        category=spec.category,
        exchange=spec.exchange,
        currency=spec.currency,
        source="moex-iss",
        provider=spec.provider,
        status="delayed",
        is_realtime=False,
        delay_seconds=None,
        as_of=datetime.now(timezone.utc),
    )


PROVIDERS: dict[str, MarketDataProvider] = {
    "yfinance": FunctionProvider("yfinance", lambda spec: _quote_from_yfinance(spec) or _quote_from_yahoo_chart(spec)),
    "moex-iss": FunctionProvider("moex-iss", _quote_from_moex),
    "uzse-bloomberg": LicensedProviderStub("uzse-bloomberg"),
    "lseg": LicensedProviderStub("lseg"),
    "bloomberg-bpipe": LicensedProviderStub("bloomberg-bpipe"),
}


def _fetch_json(url: str, timeout: int) -> dict[str, Any] | None:
    request = Request(url, headers={"User-Agent": "InvestAI-Uzbekistan/0.1"})
    try:
        with urlopen(request, timeout=timeout, context=_ssl_context()) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception:
        return None


def _ssl_context() -> ssl.SSLContext:
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def _iss_rows(table: dict[str, Any]) -> list[dict[str, Any]]:
    columns = table.get("columns", [])
    data = table.get("data", [])
    return [dict(zip(columns, row)) for row in data]


def _empty_quote(spec: SymbolSpec) -> Quote:
    return Quote(
        ticker=spec.ticker,
        name=spec.name,
        price=0.0,
        change=0.0,
        description=spec.description,
        category=spec.category,
        exchange=spec.exchange,
        currency=spec.currency,
        source="unavailable",
        provider=spec.provider,
        status="offline",
        is_realtime=False,
        as_of=datetime.now(timezone.utc),
    )


def _mapping_number(source: Any, *keys: str) -> float | None:
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


def _format_large_number(value: float | None, currency: str) -> str:
    if value is None or value <= 0:
        return "N/A"
    prefix = "$" if currency == "USD" else f"{currency} "
    units = [(1_000_000_000_000, "T"), (1_000_000_000, "B"), (1_000_000, "M")]
    for divisor, suffix in units:
        if value >= divisor:
            return f"{prefix}{value / divisor:.1f}{suffix}"
    return f"{prefix}{value:,.0f}"
