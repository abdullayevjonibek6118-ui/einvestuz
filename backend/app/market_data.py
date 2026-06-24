from __future__ import annotations

from abc import ABC, abstractmethod
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta, timezone
import json
import os
import re
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
    change_percent: float | None = None
    open: float | None = None
    high: float | None = None
    low: float | None = None
    previous_close: float | None = None
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


@dataclass
class Fundamentals:
    ticker: str
    name: str
    exchange: str
    currency: str
    industry: str = ""
    market_cap: str = "N/A"
    pe: float = 0.0
    dividend_yield: float = 0.0
    description: str = ""
    profile: dict[str, Any] | None = None
    metrics: dict[str, Any] | None = None
    source: str = "unavailable"
    provider: str = "unavailable"
    status: SourceStatus = "offline"
    as_of: datetime | None = None


@dataclass
class EarningsPoint:
    period: str
    year: int | None
    quarter: int | None
    actual: float | None
    estimate: float | None
    surprise: float | None
    surprise_percent: float | None
    source: str = "unavailable"
    provider: str = "unavailable"
    status: SourceStatus = "offline"
    as_of: datetime | None = None


@dataclass
class FxRate:
    ccy: str
    rate: float
    diff: float
    date: date | None
    nominal: float = 1.0
    name: str = ""
    source: str = "cbu-uz"
    provider: str = "cbu-uz"
    status: SourceStatus = "delayed"
    as_of: datetime | None = None


@dataclass
class MacroSummary:
    status: SourceStatus
    summary: str
    sources: list[dict[str, Any]]
    indicators: list[dict[str, Any]]
    fallback_reason: str | None = None
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
        id="finnhub",
        name="Finnhub REST API",
        market="США / глобальные рынки",
        coverage="Quote, profile2, metrics, earnings и company-news для публичных тикеров",
        update_mode="REST API с ключом FINNHUB_API_KEY",
        status="live" if os.getenv("FINNHUB_API_KEY") else "offline",
        url="https://finnhub.io/docs/api",
        notes="Используется как основной источник для quote/stocks/news/fundamentals/earnings. Ключ читается только из FINNHUB_API_KEY.",
    ),
    DataSource(
        id="cbu-uz",
        name="CBU Uzbekistan FX archive",
        market="Узбекистан",
        coverage="USD, EUR, RUB и архив курсов Центрального банка Узбекистана",
        update_mode="Публичный JSON-архив, best-effort",
        status="delayed",
        url="https://cbu.uz/en/arkhiv-kursov-valyut/json/",
        notes="Официальные курсы CBU без ключа. Используется для FX-таблицы и валютных карточек.",
    ),
    DataSource(
        id="data-egov-uz",
        name="data.egov.uz",
        market="Узбекистан",
        coverage="Макроэкономические и госданные, где доступен машинный доступ",
        update_mode="Публичный портал; прямое API discovery не подтверждено",
        status="fallback",
        url="https://data.egov.uz/",
        notes="Пока служит metadata placeholder для макро-панели до подтверждения машинного endpoint.",
    ),
    DataSource(
        id="stat-uz",
        name="stat.uz",
        market="Узбекистан",
        coverage="Официальная статистика и макроэкономические ряды",
        update_mode="Публичный портал; прямое API discovery не подтверждено",
        status="fallback",
        url="https://stat.uz/",
        notes="Пока служит metadata placeholder для макро-панели до подтверждения машинного endpoint.",
    ),
    DataSource(
        id="yfinance",
        name="Yahoo Finance Chart",
        market="США / глобальные рынки",
        coverage="Акции США, индексы, криптовалюты и сырьевые активы MVP",
        update_mode="Публичные HTTP-котировки с задержкой, best-effort",
        status="delayed",
        url="https://query1.finance.yahoo.com/v8/finance/chart/AAPL",
        notes="Рабочий источник без API-ключа для MVP. Не является лицензированной биржевой лентой.",
    ),
    DataSource(
        id="moex-iss",
        name="MOEX ISS",
        market="Россия",
        coverage="Акции, индексы и справочные данные Московской биржи",
        update_mode="Официальные публичные HTTP-снимки с задержкой",
        status="delayed",
        url="https://iss.moex.com/iss/reference/",
        notes="Официальный web API MOEX. Для real-time/low-latency production нужна лицензия MOEX FAST/ASTS/Plaza.",
    ),
]

LICENSED_SOURCE_CANDIDATES: list[DataSource] = [
    DataSource(
        id="uzse-bloomberg",
        name="UZSE via Bloomberg Data License / B-PIPE",
        market="Узбекистан",
        coverage="Акции и облигации Республиканской фондовой биржи Тошкент",
        update_mode="Лицензируемая real-time лента",
        status="needs_license",
        url="https://uzse.uz/",
        notes="В MVP не подключено: нужен коммерческий договор с поставщиком данных.",
    ),
    DataSource(
        id="lseg",
        name="LSEG Real-Time",
        market="Глобальные рынки",
        coverage="Глобальные биржевые и OTC real-time данные",
        update_mode="Лицензируемая real-time лента",
        status="needs_license",
        url="https://www.lseg.com/en/data-analytics/market-data/data-feeds",
        notes="Кандидат для production после покупки лицензии.",
    ),
    DataSource(
        id="bloomberg-bpipe",
        name="Bloomberg B-PIPE",
        market="Глобальные рынки",
        coverage="Нормализованные глобальные real-time данные",
        update_mode="Лицензируемая real-time лента",
        status="needs_license",
        url="https://professional.bloomberg.com/products/data/enterprise-catalog/real-time-data-feed/",
        notes="Кандидат для production после покупки лицензии.",
    ),
]


STOCK_UNIVERSE: dict[str, SymbolSpec] = {
    "AAPL": SymbolSpec("AAPL", "AAPL", "Apple", "finnhub", description="Потребительская электроника, сервисы, программное обеспечение и экосистема устройств."),
    "NVDA": SymbolSpec("NVDA", "NVDA", "Nvidia", "finnhub", description="AI-ускорители, GPU, сетевые решения и ПО для дата-центров."),
    "MSFT": SymbolSpec("MSFT", "MSFT", "Microsoft", "finnhub", description="Облачная инфраструктура, офисное ПО, операционные системы, игры и AI-сервисы."),
    "TSLA": SymbolSpec("TSLA", "TSLA", "Tesla", "finnhub", description="Электромобили, энергетические системы, зарядная инфраструктура и автономное вождение."),
    "AMZN": SymbolSpec("AMZN", "AMZN", "Amazon", "finnhub", description="E-commerce, логистика, реклама, подписки и облачная платформа AWS."),
    "META": SymbolSpec("META", "META", "Meta", "finnhub", description="Социальные платформы, реклама, мессенджеры, AI-продукты и Reality Labs."),
    "SBER": SymbolSpec("SBER", "SBER", "Сбербанк", "moex-iss", exchange="MOEX", currency="RUB", description="Российская банковская и финансовая группа."),
    "GAZP": SymbolSpec("GAZP", "GAZP", "Газпром", "moex-iss", exchange="MOEX", currency="RUB", description="Российская газовая и энергетическая компания."),
    "LKOH": SymbolSpec("LKOH", "LKOH", "Лукойл", "moex-iss", exchange="MOEX", currency="RUB", description="Российская нефтегазовая компания."),
}

MARKET_UNIVERSE: dict[str, SymbolSpec] = {
    "SPX": SymbolSpec("SPX", "^GSPC", "S&P 500", "yfinance", "index"),
    "IXIC": SymbolSpec("IXIC", "^IXIC", "Nasdaq Composite", "yfinance", "index"),
    "DJI": SymbolSpec("DJI", "^DJI", "Dow Jones Industrial Average", "yfinance", "index"),
    "IMOEX": SymbolSpec("IMOEX", "IMOEX", "Индекс МосБиржи", "moex-iss", "index", "MOEX", "RUB"),
    "BTC": SymbolSpec("BTC", "BTC-USD", "Bitcoin", "yfinance", "crypto"),
    "ETH": SymbolSpec("ETH", "ETH-USD", "Ethereum", "yfinance", "crypto"),
    "XAU": SymbolSpec("XAU", "GC=F", "Gold Futures", "yfinance", "commodity"),
    "WTI": SymbolSpec("WTI", "CL=F", "WTI Crude Oil Futures", "yfinance", "commodity"),
}

QUOTE_UNIVERSE = {**STOCK_UNIVERSE, **MARKET_UNIVERSE}
_QUOTE_CACHE = TTLCache(ttl_seconds=20)
_DETAIL_CACHE = TTLCache(ttl_seconds=300)

FALLBACK_QUOTES: dict[str, tuple[float, float]] = {
    "AAPL": (298.0, 0.4),
    "NVDA": (201.0, -1.2),
    "MSFT": (373.0, -0.6),
    "TSLA": (383.0, -1.4),
    "AMZN": (234.0, -0.5),
    "META": (563.0, -0.8),
    "SBER": (307.0, 0.1),
    "GAZP": (102.0, 0.1),
    "LKOH": (4270.0, 0.2),
    "SPX": (7380.0, -0.4),
    "IXIC": (25680.0, -0.5),
    "DJI": (51690.0, -0.2),
    "IMOEX": (2318.0, 0.1),
    "BTC": (62200.0, -0.6),
    "ETH": (1655.0, -0.7),
    "XAU": (4145.0, 0.1),
    "WTI": (73.0, -0.2),
}

FALLBACK_NEWS = [
    ("Technology", "Nvidia расширяет партнерства по AI-серверам с облачными провайдерами", "Market Watch"),
    ("US", "Индексы США растут на фоне ожидания новых данных по инфляции", "Reuters"),
    ("Crypto", "Притоки в спотовые Bitcoin ETF восстановились после волатильной недели", "CoinDesk"),
    ("ETF", "Спрос на дивидендные ETF растет среди долгосрочных инвесторов", "ETF.com"),
]


def get_sources() -> list[dict[str, str]]:
    return [asdict(source) for source in SOURCES]


def get_source_catalog() -> list[dict[str, str]]:
    return [asdict(source) for source in [*SOURCES, *LICENSED_SOURCE_CANDIDATES]]


def get_stocks() -> list[Quote]:
    return _get_quotes_parallel(list(STOCK_UNIVERSE.values()))


def get_stock(ticker: str) -> Quote | None:
    spec = STOCK_UNIVERSE.get(ticker.upper())
    if spec is None:
        return None
    return _get_quote(spec)


def get_quote_snapshot(ticker: str) -> Quote | None:
    spec = QUOTE_UNIVERSE.get(ticker.upper())
    if spec is None:
        spec = SymbolSpec(ticker.upper(), ticker.upper(), ticker.upper(), "unknown")
    return _get_quote(spec)


def get_market() -> list[Quote]:
    return _get_quotes_parallel(list(MARKET_UNIVERSE.values()))


def get_dashboard_market_table() -> list[dict[str, Any]]:
    specs = list(STOCK_UNIVERSE.values())
    if not specs:
        return []

    rows: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=min(8, len(specs))) as executor:
        futures = {executor.submit(_build_dashboard_market_row, spec): spec.ticker for spec in specs}
        for future in as_completed(futures):
            ticker = futures[future]
            try:
                rows.append(future.result())
            except Exception:
                spec = STOCK_UNIVERSE.get(ticker) or SymbolSpec(ticker, ticker, ticker, "unknown")
                rows.append(_fallback_dashboard_market_row(spec))

    rows.sort(key=lambda row: (-float(row.get("_market_cap_sort") or 0.0), str(row.get("name") or ""), str(row.get("ticker") or "")))
    for index, row in enumerate(rows, start=1):
        row["rank"] = index
        row.pop("_market_cap_sort", None)
    return rows


def get_quotes(symbols: list[str]) -> list[Quote]:
    specs: list[SymbolSpec] = []
    for symbol in symbols:
        ticker = symbol.upper()
        spec = QUOTE_UNIVERSE.get(ticker)
        if spec is None:
            specs.append(SymbolSpec(ticker, ticker, ticker, "unknown"))
        else:
            specs.append(spec)
    return _get_quotes_parallel(specs)


def get_fundamentals(ticker: str) -> Fundamentals:
    ticker = ticker.upper()
    cached = _DETAIL_CACHE.get(f"fundamentals:{ticker}")
    if cached is not None:
        return cached

    payload = _finnhub_bundle(ticker, include_earnings=False)
    fundamentals = _build_fundamentals(ticker, payload)
    _DETAIL_CACHE.set(f"fundamentals:{ticker}", fundamentals)
    return fundamentals


def get_earnings(ticker: str) -> list[EarningsPoint]:
    ticker = ticker.upper()
    cached = _DETAIL_CACHE.get(f"earnings:{ticker}")
    if cached is not None:
        return cached

    payload = _finnhub_bundle(ticker, include_earnings=True)
    earnings = _build_earnings(ticker, payload)
    _DETAIL_CACHE.set(f"earnings:{ticker}", earnings)
    return earnings


def get_fx_rates() -> list[FxRate]:
    cached = _DETAIL_CACHE.get("fx:rates")
    if cached is not None:
        return cached

    payload = _fetch_json("https://cbu.uz/en/arkhiv-kursov-valyut/json/", timeout=8)
    rates: list[FxRate] = []
    if isinstance(payload, list):
        wanted = {"USD", "EUR", "RUB"}
        for item in payload:
            ccy = str(item.get("Ccy") or "").upper()
            if ccy not in wanted:
                continue
            rates.append(
                FxRate(
                    ccy=ccy,
                    rate=_coerce_float(item.get("Rate")) or 0.0,
                    diff=_coerce_float(item.get("Diff")) or 0.0,
                    date=_parse_cbu_date(item.get("Date")),
                    nominal=_coerce_float(item.get("Nominal")) or 1.0,
                    name=str(item.get("CcyNm_EN") or item.get("CcyNm_RU") or ccy),
                    source="cbu-uz",
                    provider="cbu-uz",
                    status="delayed",
                    as_of=datetime.now(timezone.utc),
                )
            )
    if not rates:
        rates = _fallback_fx_rates()
    _DETAIL_CACHE.set("fx:rates", rates)
    return rates


def get_macro_summary() -> MacroSummary:
    cached = _DETAIL_CACHE.get("macro:summary")
    if cached is not None:
        return cached

    source_catalog = [
        {"id": source.id, "name": source.name, "status": source.status, "url": source.url, "notes": source.notes}
        for source in [
            _source_by_id("finnhub"),
            _source_by_id("cbu-uz"),
            _source_by_id("data-egov-uz"),
            _source_by_id("stat-uz"),
        ]
        if source is not None
    ]
    summary = MacroSummary(
        status="fallback",
        summary="Макро-панель работает в режиме заглушек: публичные порталы data.egov.uz и stat.uz доступны как metadata placeholders, а машинный endpoint пока не подтвержден.",
        sources=source_catalog,
        indicators=[
            {
                "name": "FX reference",
                "value": {"USD": "CBU JSON", "EUR": "CBU JSON", "RUB": "CBU JSON"},
                "source": "cbu-uz",
                "status": "delayed",
            },
            {
                "name": "Inflation",
                "value": None,
                "source": "stat.uz",
                "status": "fallback",
                "note": "Требуется подтвержденный machine-readable endpoint.",
            },
            {
                "name": "GDP / macro tables",
                "value": None,
                "source": "data.egov.uz",
                "status": "fallback",
                "note": "Требуется подтвержденный machine-readable endpoint.",
            },
        ],
        fallback_reason="Direct API discovery unavailable for macro portals; using source metadata and placeholders.",
        as_of=datetime.now(timezone.utc),
    )
    _DETAIL_CACHE.set("macro:summary", summary)
    return summary


def get_news(symbol: str | None = None, category: str | None = None) -> list[dict[str, Any]]:
    if symbol:
        items = _company_news(symbol)
        if items:
            return items
        now = datetime.now(timezone.utc)
        fallback_category = _category_for_symbol(symbol)
        return [
            {
                "id": hash((symbol, "fallback")) & 0x7FFFFFFF,
                "title": f"Finnhub news unavailable for {symbol}",
                "source": "Einvestuz fallback",
                "category": fallback_category,
                "published_at": now,
                "url": "",
                "summary": "Company news is temporarily unavailable, so the backend is showing a placeholder item.",
                "related": symbol,
                "source_status": "fallback",
            }
        ]

    symbols = ["AAPL", "NVDA", "MSFT", "TSLA"]
    items: list[dict[str, Any]] = []
    for ticker in symbols:
        items.extend(_company_news(ticker, limit=3))
    if items:
        if category is None:
            return _dedupe_news(items)
        filtered = [item for item in _dedupe_news(items) if str(item.get("category", "")).lower() == category.lower()]
        return filtered
    return [
        {
            "id": index + 1,
            "title": title,
            "source": source,
            "category": category_name,
            "published_at": datetime.now(timezone.utc),
            "url": "",
            "summary": "",
            "related": "",
            "source_status": "fallback",
        }
        for index, (category_name, title, source) in enumerate(FALLBACK_NEWS)
        if category is None or category_name.lower() == category.lower()
    ]


def _get_quotes_parallel(specs: list[SymbolSpec]) -> list[Quote]:
    if not specs:
        return []

    results: dict[int, Quote] = {}
    with ThreadPoolExecutor(max_workers=min(10, len(specs))) as executor:
        futures = {executor.submit(_get_quote, spec): index for index, spec in enumerate(specs)}
        for future in as_completed(futures):
            index = futures[future]
            spec = specs[index]
            try:
                results[index] = future.result()
            except Exception:
                results[index] = _empty_quote(spec)
    return [results[index] for index in range(len(specs))]


def _get_quote(spec: SymbolSpec) -> Quote:
    cache_key = f"quote:{spec.provider}:{spec.provider_symbol}"
    cached = _QUOTE_CACHE.get(cache_key)
    if cached is not None:
        return cached

    provider = PROVIDERS.get(spec.provider) or PROVIDERS["yfinance"]
    quote_value = provider.get_quote(spec)
    if quote_value is None and provider.id == "finnhub":
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
            change_percent=round(_percent_change(price, previous_close), 2),
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
        name=str(meta.get("longName") or meta.get("shortName") or spec.name),
        price=round(price, 2),
        change=round(_percent_change(price, previous_close), 2),
        change_percent=round(_percent_change(price, previous_close), 2),
        open=_coerce_float(meta.get("regularMarketOpen")),
        high=_coerce_float(meta.get("regularMarketDayHigh")),
        low=_coerce_float(meta.get("regularMarketDayLow")),
        previous_close=previous_close,
        description=spec.description,
        category=spec.category,
        exchange=spec.exchange,
        currency=spec.currency,
        source="yahoo-chart",
        provider=spec.provider,
        status="delayed",
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
    if payload is None and spec.category != "index":
        url = (
            "https://iss.moex.com/iss/engines/stock/markets/shares/securities/"
            f"{spec.provider_symbol}.json?iss.meta=off&iss.only=marketdata,securities"
            "&marketdata.columns=SECID,BOARDID,LAST,LCURRENTPRICE,LASTCHANGEPRCNT,LASTTOPREVPRICE,SYSTIME"
            "&securities.columns=SECID,BOARDID,SHORTNAME,PREVPRICE"
        )
        payload = _fetch_json(url, timeout=8)
    if payload is None:
        return None

    marketdata = _iss_rows(payload.get("marketdata", {}))
    securities = _iss_rows(payload.get("securities", {}))
    row = _prefer_board_row(marketdata)
    security = _prefer_board_row(securities)
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
        change_percent=round(change or 0.0, 2),
        open=_coerce_float(row.get("OPEN") or row.get("OPENPRICE")),
        high=_coerce_float(row.get("HIGH") or row.get("HIGHPRICE")),
        low=_coerce_float(row.get("LOW") or row.get("LOWPRICE")),
        previous_close=_coerce_float(security.get("PREVPRICE")),
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


def _quote_from_finnhub(spec: SymbolSpec) -> Quote | None:
    payload = _finnhub_bundle(spec.provider_symbol, include_earnings=False)
    quote_data = payload.get("quote")
    profile = payload.get("profile") or {}
    metrics = payload.get("metrics") or {}
    if not isinstance(quote_data, dict):
        return None

    price = _coerce_float(quote_data.get("c"))
    if price is None:
        return None

    change = _coerce_float(quote_data.get("dp"))
    if change is None:
        previous_close = _coerce_float(quote_data.get("pc"))
        change = _percent_change(price, previous_close)

    market_cap = _coerce_float(profile.get("marketCapitalization"))
    dividend_yield = _coerce_float(
        metrics.get("metric", {}).get("dividendYieldIndicatedAnnual") if isinstance(metrics, dict) else None
    )
    pe_ratio = _coerce_float(
        metrics.get("metric", {}).get("peNormalizedAnnual") if isinstance(metrics, dict) else None
    )

    return Quote(
        ticker=spec.ticker,
        name=str(profile.get("name") or spec.name),
        price=round(price, 2),
        change=round(change or 0.0, 2),
        change_percent=round(change or 0.0, 2),
        open=_coerce_float(quote_data.get("o")),
        high=_coerce_float(quote_data.get("h")),
        low=_coerce_float(quote_data.get("l")),
        previous_close=_coerce_float(quote_data.get("pc")),
        market_cap=_format_large_number((market_cap * 1_000_000) if market_cap else None, spec.currency),
        pe=round(pe_ratio or 0.0, 2),
        dividend=f"{(dividend_yield or 0.0):.2f}%",
        description=spec.description,
        category=spec.category,
        exchange=str(profile.get("exchange") or spec.exchange),
        currency=str(profile.get("currency") or spec.currency),
        source="finnhub",
        provider="finnhub",
        status="live",
        is_realtime=True,
        delay_seconds=0,
        as_of=datetime.now(timezone.utc),
    )


def _finnhub_bundle(symbol: str, include_earnings: bool = False) -> dict[str, Any]:
    symbol = symbol.upper()
    cache_key = f"finnhub:{symbol}:{'earnings' if include_earnings else 'bundle'}"
    cached = _DETAIL_CACHE.get(cache_key)
    if cached is not None:
        return cached

    api_key = os.getenv("FINNHUB_API_KEY", "").strip()
    if not api_key:
        bundle = {
            "quote": None,
            "profile": {},
            "metrics": {},
            "earnings": [],
            "status": "offline",
            "source": "finnhub",
        }
        _DETAIL_CACHE.set(cache_key, bundle)
        return bundle

    tasks: dict[str, Any] = {}
    with ThreadPoolExecutor(max_workers=4) as executor:
        tasks["quote"] = executor.submit(_finnhub_get_json, "/quote", {"symbol": symbol})
        tasks["profile"] = executor.submit(_finnhub_get_json, "/stock/profile2", {"symbol": symbol})
        tasks["metrics"] = executor.submit(_finnhub_get_json, "/stock/metric", {"symbol": symbol, "metric": "all"})
        if include_earnings:
            tasks["earnings"] = executor.submit(_finnhub_get_json, "/stock/earnings", {"symbol": symbol})

    bundle = {
        "quote": tasks["quote"].result() if tasks.get("quote") else None,
        "profile": tasks["profile"].result() if tasks.get("profile") else {},
        "metrics": tasks["metrics"].result() if tasks.get("metrics") else {},
        "earnings": tasks["earnings"].result() if tasks.get("earnings") else [],
        "status": "live",
        "source": "finnhub",
    }
    _DETAIL_CACHE.set(cache_key, bundle)
    return bundle


def _build_fundamentals(ticker: str, bundle: dict[str, Any]) -> Fundamentals:
    profile = bundle.get("profile") or {}
    metrics = bundle.get("metrics") or {}
    metric_values = metrics.get("metric", {}) if isinstance(metrics, dict) else {}
    market_cap = _coerce_float(profile.get("marketCapitalization"))
    pe = _coerce_float(metric_values.get("peNormalizedAnnual") or metric_values.get("peBasicExclExtraTTM"))
    dividend_yield = _coerce_float(metric_values.get("dividendYieldIndicatedAnnual"))
    return Fundamentals(
        ticker=ticker,
        name=str(profile.get("name") or ticker),
        exchange=str(profile.get("exchange") or "US"),
        currency=str(profile.get("currency") or "USD"),
        industry=str(profile.get("finnhubIndustry") or ""),
        market_cap=_format_large_number((market_cap * 1_000_000) if market_cap else None, str(profile.get("currency") or "USD")),
        pe=round(pe or 0.0, 2),
        dividend_yield=round(dividend_yield or 0.0, 2),
        description=str(profile.get("weburl") or ""),
        profile=profile,
        metrics=metric_values,
        source="finnhub",
        provider="finnhub",
        status="live" if bundle.get("status") == "live" else "offline",
        as_of=datetime.now(timezone.utc),
    )


def _build_earnings(ticker: str, bundle: dict[str, Any]) -> list[EarningsPoint]:
    raw_earnings = bundle.get("earnings") or []
    if not isinstance(raw_earnings, list):
        return []

    points: list[EarningsPoint] = []
    for row in raw_earnings[:12]:
        if not isinstance(row, dict):
            continue
        period = str(row.get("period") or row.get("quarter") or "")
        actual = _coerce_float(row.get("actual"))
        estimate = _coerce_float(row.get("estimate"))
        surprise = _coerce_float(row.get("surprise"))
        surprise_percent = _coerce_float(row.get("surprisePercent"))
        year = _coerce_int(row.get("year"))
        quarter = _coerce_int(row.get("quarter"))
        points.append(
            EarningsPoint(
                period=period,
                year=year,
                quarter=quarter,
                actual=actual,
                estimate=estimate,
                surprise=surprise,
                surprise_percent=surprise_percent,
                source="finnhub",
                provider="finnhub",
                status="live" if bundle.get("status") == "live" else "offline",
                as_of=datetime.now(timezone.utc),
            )
        )
    return points


def _company_news(symbol: str, limit: int = 10) -> list[dict[str, Any]]:
    symbol = symbol.upper()
    api_key = os.getenv("FINNHUB_API_KEY", "").strip()
    if not api_key:
        return []

    today = datetime.now(timezone.utc).date()
    one_month_ago = today - timedelta(days=30)
    payload = _finnhub_get_json(
        "/company-news",
        {
            "symbol": symbol,
            "from": one_month_ago.isoformat(),
            "to": today.isoformat(),
        },
    )
    if not isinstance(payload, list):
        return []

    items: list[dict[str, Any]] = []
    category = _category_for_symbol(symbol)
    for index, row in enumerate(payload[:limit], start=1):
        if not isinstance(row, dict):
            continue
        published_at = datetime.fromtimestamp(int(row.get("datetime") or 0), tz=timezone.utc)
        items.append(
            {
                "id": hash((symbol, row.get("headline"), row.get("datetime"))) & 0x7FFFFFFF,
                "title": str(row.get("headline") or row.get("summary") or symbol),
                "source": str(row.get("source") or "Finnhub"),
                "category": category,
                "published_at": published_at,
                "url": str(row.get("url") or ""),
                "summary": str(row.get("summary") or ""),
                "related": str(row.get("related") or symbol),
                "source_status": "live",
            }
        )
    return items


def _dedupe_news(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple[str, str]] = set()
    result: list[dict[str, Any]] = []
    for item in sorted(items, key=lambda item: item.get("published_at"), reverse=True):
        key = (str(item.get("title") or ""), str(item.get("source") or ""))
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def _fallback_fx_rates() -> list[FxRate]:
    now = datetime.now(timezone.utc)
    return [
        FxRate(ccy="USD", rate=12017.04, diff=26.78, date=now.date(), name="US Dollar", source="cbu-uz", provider="cbu-uz", status="fallback", as_of=now),
        FxRate(ccy="EUR", rate=13712.64, diff=-25.8, date=now.date(), name="Euro", source="cbu-uz", provider="cbu-uz", status="fallback", as_of=now),
        FxRate(ccy="RUB", rate=160.63, diff=-1.6, date=now.date(), name="Russian Ruble", source="cbu-uz", provider="cbu-uz", status="fallback", as_of=now),
    ]


def _finnhub_get_json(path: str, params: dict[str, Any]) -> Any | None:
    api_key = os.getenv("FINNHUB_API_KEY", "").strip()
    if not api_key:
        return None
    query = urlencode({**params, "token": api_key})
    return _fetch_json(f"https://finnhub.io/api/v1{path}?{query}", timeout=8)


def _parse_cbu_date(raw_date: Any) -> date | None:
    if not raw_date:
        return None
    try:
        return datetime.strptime(str(raw_date), "%d.%m.%Y").date()
    except ValueError:
        return None


def _coerce_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _source_by_id(source_id: str) -> DataSource | None:
    for source in [*SOURCES, *LICENSED_SOURCE_CANDIDATES]:
        if source.id == source_id:
            return source
    return None


def _category_for_symbol(symbol: str) -> str:
    if symbol in {"BTC", "ETH"}:
        return "Crypto"
    if symbol in {"AAPL", "NVDA", "MSFT", "TSLA", "AMZN", "META"}:
        return "Technology"
    if symbol in {"SBER", "GAZP", "LKOH"}:
        return "US"
    return "ETF"


PROVIDERS: dict[str, MarketDataProvider] = {
    "finnhub": FunctionProvider("finnhub", _quote_from_finnhub),
    "yfinance": FunctionProvider("yfinance", _quote_from_yahoo_chart),
    "moex-iss": FunctionProvider("moex-iss", _quote_from_moex),
    "uzse-bloomberg": LicensedProviderStub("uzse-bloomberg"),
    "lseg": LicensedProviderStub("lseg"),
    "bloomberg-bpipe": LicensedProviderStub("bloomberg-bpipe"),
}


def _fetch_json(url: str, timeout: int) -> dict[str, Any] | None:
    request = Request(url, headers={"User-Agent": "Einvestuz/0.1"})
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


def _prefer_board_row(rows: list[dict[str, Any]]) -> dict[str, Any]:
    if not rows:
        return {}
    return next((row for row in rows if row.get("BOARDID") == "TQBR"), rows[0])


def _empty_quote(spec: SymbolSpec) -> Quote:
    fallback = FALLBACK_QUOTES.get(spec.ticker)
    if fallback is not None:
        price, change = fallback
        return Quote(
            ticker=spec.ticker,
            name=spec.name,
            price=price,
            change=change,
            change_percent=change,
            description=spec.description,
            category=spec.category,
            exchange=spec.exchange,
            currency=spec.currency,
            source="fallback-snapshot",
            provider=spec.provider,
            status="fallback",
            is_realtime=False,
            as_of=datetime.now(timezone.utc),
        )

    return Quote(
        ticker=spec.ticker,
        name=spec.name,
        price=0.0,
        change=0.0,
        change_percent=0.0,
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


def _build_dashboard_market_row(spec: SymbolSpec) -> dict[str, Any]:
    quote = _get_quote(spec)
    bundle = _finnhub_bundle(spec.provider_symbol, include_earnings=False) if spec.provider == "finnhub" else {}
    history = _quote_history(spec)
    market_cap_value = _market_cap_value(quote, bundle)
    change_1h, change_24h, change_7d = _market_table_changes(quote, history)
    sparkline = _sparkline_7d(history, quote.price, change_7d)
    volume_24h = _format_quantity_number(_quote_volume(history, bundle, quote))
    circulating_supply_value = _circulating_supply_value(spec, quote, bundle, market_cap_value)
    as_of = _latest_datetime(
        quote.as_of,
        history.get("as_of"),
        bundle.get("as_of") if isinstance(bundle, dict) else None,
    )

    return {
        "rank": 0,
        "branding": {
            "logo_url": _branding_logo_url(spec, bundle),
            "monogram": _monogram_for_name(quote.name or spec.name),
            "monogram_color": _monogram_color(spec.ticker),
        },
        "name": quote.name or spec.name,
        "ticker": quote.ticker,
        "price": quote.price,
        "change_1h": round(change_1h, 2),
        "change_24h": round(change_24h, 2),
        "change_7d": round(change_7d, 2),
        "market_cap": quote.market_cap,
        "volume_24h": volume_24h,
        "circulating_supply": circulating_supply_value,
        "sparkline_7d": sparkline,
        "source": quote.source or "fallback",
        "status": quote.status,
        "as_of": as_of or datetime.now(timezone.utc),
        "_market_cap_sort": market_cap_value or 0.0,
    }


def _fallback_dashboard_market_row(spec: SymbolSpec) -> dict[str, Any]:
    quote = _empty_quote(spec)
    return {
        "rank": 0,
        "branding": {
            "logo_url": None,
            "monogram": _monogram_for_name(spec.name or spec.ticker),
            "monogram_color": _monogram_color(spec.ticker),
        },
        "name": quote.name or spec.name,
        "ticker": quote.ticker,
        "price": quote.price,
        "change_1h": round(quote.change or 0.0, 2),
        "change_24h": round(quote.change or 0.0, 2),
        "change_7d": round(quote.change or 0.0, 2),
        "market_cap": quote.market_cap,
        "volume_24h": "N/A",
        "circulating_supply": "N/A",
        "sparkline_7d": _synthetic_sparkline(quote.price, quote.change or 0.0),
        "source": quote.source,
        "status": quote.status,
        "as_of": quote.as_of or datetime.now(timezone.utc),
        "_market_cap_sort": 0.0,
    }


def _quote_history(spec: SymbolSpec) -> dict[str, Any]:
    if spec.provider == "moex-iss" or spec.exchange == "MOEX":
        return {}

    try:
        import yfinance as yf
    except ImportError:
        return {}

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            ticker = yf.Ticker(spec.provider_symbol)
            hourly = ticker.history(period="2d", interval="1h", auto_adjust=False)
            daily = ticker.history(period="8d", interval="1d", auto_adjust=False)

        hourly_closes = _history_closes(hourly)
        daily_closes = _history_closes(daily)
        volume = _history_volume(daily)
        as_of = datetime.now(timezone.utc)
        return {
            "hourly_closes": hourly_closes,
            "daily_closes": daily_closes,
            "volume": volume,
            "as_of": as_of,
        }
    except Exception:
        return {}


def _history_closes(frame: Any) -> list[float]:
    try:
        if frame is None or frame.empty:
            return []
        values = frame["Close"].dropna().tolist()
        return [float(value) for value in values if value is not None]
    except Exception:
        return []


def _history_volume(frame: Any) -> float | None:
    try:
        if frame is None or frame.empty or "Volume" not in frame:
            return None
        values = frame["Volume"].dropna().tolist()
        if not values:
            return None
        return _coerce_float(values[-1])
    except Exception:
        return None


def _market_table_changes(quote: Quote, history: dict[str, Any]) -> tuple[float, float, float]:
    hourly_closes = history.get("hourly_closes") or []
    daily_closes = history.get("daily_closes") or []

    change_1h = _change_from_series(hourly_closes, quote.change)
    change_24h = _change_from_series(daily_closes, quote.change)
    change_7d = _change_from_series(daily_closes, quote.change, lookback=7)
    return change_1h, change_24h, change_7d


def _change_from_series(values: list[float], fallback: float, lookback: int = 1) -> float:
    if len(values) <= lookback:
        return fallback
    current = values[-1]
    previous = values[-(lookback + 1)]
    return _percent_change(current, previous)


def _sparkline_7d(history: dict[str, Any], price: float, fallback_change: float) -> list[float]:
    daily_closes = history.get("daily_closes") or []
    if daily_closes:
        values = daily_closes[-7:]
        if len(values) == 1:
            values = [values[0]] * 7
        elif len(values) < 7:
            values = [values[0]] * (7 - len(values)) + values
        return [round(float(value), 2) for value in values[-7:]]
    return [round(value, 2) for value in _synthetic_sparkline(price, fallback_change)]


def _synthetic_sparkline(price: float, change_percent: float, points: int = 7) -> list[float]:
    if points <= 1:
        return [round(price, 2)]
    start = price / (1 + (change_percent / 100)) if change_percent not in (0, -100) else price
    if not start or not start == start:
        start = price
    step = (price - start) / max(points - 1, 1)
    return [max(0.0, start + (step * index)) for index in range(points)]


def _quote_volume(history: dict[str, Any], bundle: dict[str, Any], quote: Quote) -> float | None:
    volume = history.get("volume")
    if volume is not None:
        return _coerce_float(volume)

    profile = bundle.get("profile") if isinstance(bundle, dict) else None
    if isinstance(profile, dict):
        for key in ("volume", "shareVolume", "averageVolume", "avgVolume", "regularMarketVolume"):
            value = _coerce_float(profile.get(key))
            if value is not None:
                return value
    return None


def _circulating_supply_value(spec: SymbolSpec, quote: Quote, bundle: dict[str, Any], market_cap_value: float | None) -> str:
    profile = bundle.get("profile") if isinstance(bundle, dict) else None
    shares_outstanding = None
    if isinstance(profile, dict):
        shares_outstanding = _coerce_float(profile.get("shareOutstanding") or profile.get("sharesOutstanding"))
    if shares_outstanding is None and market_cap_value and quote.price > 0:
        shares_outstanding = market_cap_value / quote.price
    if shares_outstanding is None:
        return "N/A"
    return _format_quantity_number(shares_outstanding)


def _market_cap_value(quote: Quote, bundle: dict[str, Any]) -> float | None:
    parsed = _parse_compact_number(quote.market_cap)
    if parsed is not None:
        return parsed
    profile = bundle.get("profile") if isinstance(bundle, dict) else None
    if isinstance(profile, dict):
        market_cap = _coerce_float(profile.get("marketCapitalization"))
        if market_cap is not None:
            return market_cap * 1_000_000
    return None


def _parse_compact_number(value: str | None) -> float | None:
    if not value:
        return None
    normalized = value.replace(",", "").replace(" ", "").strip()
    if normalized.upper() == "N/A":
        return None
    match = re.search(r"(-?\d+(?:\.\d+)?)([TMB])?$", normalized, re.IGNORECASE)
    if not match:
        return None
    number = float(match.group(1))
    suffix = (match.group(2) or "").upper()
    multiplier = {"T": 1_000_000_000_000, "B": 1_000_000_000, "M": 1_000_000}.get(suffix, 1.0)
    return number * multiplier


def _branding_logo_url(spec: SymbolSpec, bundle: dict[str, Any]) -> str | None:
    profile = bundle.get("profile") if isinstance(bundle, dict) else None
    if isinstance(profile, dict):
        for key in ("logo", "image"):
            value = profile.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return None


def _monogram_for_name(name: str) -> str:
    parts = [part for part in re.split(r"[^0-9A-Za-zА-Яа-я]+", name) if part]
    if not parts:
        return "?"
    monogram = "".join(part[0] for part in parts[:2]).upper()
    if monogram:
        return monogram[:3]
    return name[:2].upper() or "?"


def _monogram_color(ticker: str) -> str:
    palette = ["#1d4ed8", "#0f766e", "#7c3aed", "#b91c1c", "#d97706", "#2563eb", "#15803d", "#db2777"]
    index = abs(hash(ticker.upper())) % len(palette)
    return palette[index]


def _format_quantity_number(value: float | None) -> str:
    if value is None or value <= 0:
        return "N/A"
    units = [(1_000_000_000_000, "T"), (1_000_000_000, "B"), (1_000_000, "M")]
    for divisor, suffix in units:
        if value >= divisor:
            return f"{value / divisor:.1f}{suffix}"
    return f"{value:,.0f}"


def _latest_datetime(*values: Any) -> datetime | None:
    candidates: list[datetime] = []
    for value in values:
        if isinstance(value, datetime):
            candidates.append(value)
    if not candidates:
        return None
    return max(candidates)


def _format_large_number(value: float | None, currency: str) -> str:
    if value is None or value <= 0:
        return "N/A"
    prefix = "$" if currency == "USD" else f"{currency} "
    units = [(1_000_000_000_000, "T"), (1_000_000_000, "B"), (1_000_000, "M")]
    for divisor, suffix in units:
        if value >= divisor:
            return f"{prefix}{value / divisor:.1f}{suffix}"
    return f"{prefix}{value:,.0f}"
