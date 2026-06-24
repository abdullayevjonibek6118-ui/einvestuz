import asyncio
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .market_data import DataSource as MarketDataSource
from .market_data import STOCK_UNIVERSE
from .market_data import get_earnings as fetch_earnings
from .market_data import get_fx_rates as fetch_fx_rates
from .market_data import get_fundamentals as fetch_fundamentals
from .market_data import get_macro_summary as fetch_macro_summary
from .market_data import get_dashboard_market_table as fetch_market_table
from .market_data import get_news as fetch_news
from .market_data import get_quote_snapshot as fetch_quote_snapshot
from .market_data import get_quotes as fetch_live_quotes
from .market_data import get_market as fetch_market
from .market_data import get_source_catalog as fetch_source_catalog
from .market_data import get_sources as fetch_sources
from .market_data import get_stock as fetch_stock
from .market_data import get_stocks as fetch_stocks
from .providers.uzse_provider import UzseProvider

app = FastAPI(
    title="Einvestuz API",
    version="0.1.0",
    description="MVP API for market data, company analysis, virtual portfolios, chat, and academy lessons.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Stock(BaseModel):
    ticker: str
    name: str
    price: float
    change: float
    market_cap: str
    pe: float
    dividend: str
    sector: str
    description: str
    source: str
    source_status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    as_of: datetime


class MarketAsset(BaseModel):
    ticker: str
    name: str
    price: float
    value: str
    change: float
    category: Literal["index", "crypto", "commodity"]
    source: str
    source_status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    is_realtime: bool
    delay_seconds: int | None = None
    as_of: datetime


class MarketTableBrand(BaseModel):
    logo_url: str | None = None
    monogram: str
    monogram_color: str | None = None


class MarketTableRow(BaseModel):
    rank: int
    branding: MarketTableBrand
    name: str
    ticker: str
    price: float
    change_1h: float
    change_24h: float
    change_7d: float
    market_cap: str
    volume_24h: str
    circulating_supply: str
    sparkline_7d: list[float]
    source: str
    status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    as_of: datetime


class DataSource(BaseModel):
    id: str
    name: str
    market: str
    coverage: str
    update_mode: str
    status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    notes: str
    url: str


class LiveQuote(BaseModel):
    ticker: str
    name: str
    price: float
    change: float
    category: Literal["stock", "index", "crypto", "commodity"]
    source: str
    provider: str
    status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    currency: str
    as_of: datetime


class QuoteSnapshot(BaseModel):
    ticker: str
    name: str
    price: float
    change: float
    change_percent: float | None = None
    open: float | None = None
    high: float | None = None
    low: float | None = None
    previous_close: float | None = None
    market_cap: str
    pe: float
    dividend: str
    description: str
    category: Literal["stock", "index", "crypto", "commodity"]
    exchange: str
    currency: str
    source: str
    provider: str
    status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    is_realtime: bool
    delay_seconds: int | None = None
    as_of: datetime


class FundamentalsResponse(BaseModel):
    ticker: str
    name: str
    exchange: str
    currency: str
    industry: str
    market_cap: str
    pe: float
    dividend_yield: float
    description: str
    profile: dict[str, Any]
    metrics: dict[str, Any]
    source: str
    provider: str
    status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    as_of: datetime


class EarningsPoint(BaseModel):
    period: str
    year: int | None = None
    quarter: int | None = None
    actual: float | None = None
    estimate: float | None = None
    surprise: float | None = None
    surprise_percent: float | None = None
    source: str
    provider: str
    status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    as_of: datetime


class EarningsResponse(BaseModel):
    ticker: str
    source: str
    provider: str
    status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    as_of: datetime
    items: list[EarningsPoint]


class FxRate(BaseModel):
    ccy: str
    rate: float
    diff: float
    date: str | None
    nominal: float
    name: str
    source: str
    provider: str
    status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    as_of: datetime


class MacroSource(BaseModel):
    id: str
    name: str
    status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    url: str
    notes: str


class MacroIndicator(BaseModel):
    name: str
    value: Any | None
    source: str
    status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    note: str | None = None


class MacroSummaryResponse(BaseModel):
    status: Literal["live", "delayed", "fallback", "needs_license", "offline"]
    summary: str
    sources: list[MacroSource]
    indicators: list[MacroIndicator]
    fallback_reason: str | None = None
    as_of: datetime


class NewsItem(BaseModel):
    id: int
    title: str
    source: str
    category: Literal["US", "Technology", "ETF", "Crypto"]
    published_at: datetime
    url: str = ""
    summary: str = ""
    related: str = ""
    source_status: Literal["live", "delayed", "fallback", "needs_license", "offline"] = "fallback"


class PositionCreate(BaseModel):
    user_id: str = Field(default="demo-user")
    ticker: str
    quantity: float = Field(gt=0)
    buy_price: float = Field(gt=0)


class Position(PositionCreate):
    id: int


class RemovePosition(BaseModel):
    user_id: str = Field(default="demo-user")
    ticker: str


class ChatRequest(BaseModel):
    user_id: str = Field(default="demo-user")
    message: str = Field(min_length=2, max_length=2000)


class ChatResponse(BaseModel):
    message: str
    response: str
    disclaimer: str = "Это образовательная информация, не индивидуальная инвестиционная рекомендация."


NEWS = [
    NewsItem(id=1, title="Nvidia расширяет партнерства по AI-серверам с облачными провайдерами", source="Market Watch", category="Technology", published_at=datetime.now(timezone.utc)),
    NewsItem(id=2, title="Индексы США растут на фоне ожидания новых данных по инфляции", source="Reuters", category="US", published_at=datetime.now(timezone.utc)),
    NewsItem(id=3, title="Притоки в спотовые Bitcoin ETF восстановились после волатильной недели", source="CoinDesk", category="Crypto", published_at=datetime.now(timezone.utc)),
    NewsItem(id=4, title="Спрос на дивидендные ETF растет среди долгосрочных инвесторов", source="ETF.com", category="ETF", published_at=datetime.now(timezone.utc)),
]

POSITIONS: list[Position] = [
    Position(id=1, user_id="demo-user", ticker="NVDA", quantity=4, buy_price=126.3),
    Position(id=2, user_id="demo-user", ticker="MSFT", quantity=3, buy_price=431.1),
]

ACADEMY = [
    {"level": "Beginner", "title": "Акции, ETF и дивиденды", "duration_minutes": 22, "source": "Материалы сайта"},
    {"level": "Beginner", "title": "Определение отрасли и рынка", "duration_minutes": 28, "source": "Lecture 1.pdf"},
    {"level": "Beginner", "title": "Типы отраслей и бизнес-моделей", "duration_minutes": 24, "source": "Lecture 1.pdf"},
    {"level": "Intermediate", "title": "Барьеры входа и выхода", "duration_minutes": 32, "source": "Lecture 2.pdf"},
    {"level": "Intermediate", "title": "Модели рынка и конкуренция", "duration_minutes": 30, "source": "Lecture 2.pdf"},
    {"level": "Intermediate", "title": "Шаблон отраслевого обзора", "duration_minutes": 26, "source": "Applied industry analysis part 1.pdf"},
    {"level": "Advanced", "title": "Value chain и конкурентное преимущество", "duration_minutes": 34, "source": "03 Value chain.pdf"},
    {"level": "Advanced", "title": "Жизненный цикл отрасли и инвестиционная активность", "duration_minutes": 31, "source": "03 Value chain.pdf"},
    {"level": "Advanced", "title": "Риск-менеджмент через отраслевой анализ", "duration_minutes": 27, "source": "Лекции и материалы сайта"},
]

NEWSLETTER_SUBSCRIBERS: list[str] = []
UZSE_PROVIDER = UzseProvider()

SECTOR_BY_TICKER = {
    "AAPL": "Технологии",
    "NVDA": "Полупроводники",
    "MSFT": "Программное обеспечение",
    "TSLA": "Автомобили",
    "AMZN": "E-commerce и облака",
    "META": "Социальные платформы",
    "SBER": "Финансы",
    "GAZP": "Энергетика",
    "LKOH": "Нефтегаз",
}


class NewsletterRequest(BaseModel):
    email: str = Field(min_length=5, max_length=320)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/homepage")
def homepage() -> dict:
    return {
        "brand": "Einvestuz",
        "title": "Инвестиционная аналитика для Узбекистана",
        "hero": {
            "eyebrow": "Инвестиционная аналитика для Узбекистана",
            "headline": "Учитесь инвестировать и анализировать рынки в одном приложении",
            "description": "Einvestuz помогает следить за мировыми активами, изучать компании, собирать виртуальный портфель и получать понятные AI-разборы без реальных сделок.",
            "primary_cta": {"label": "Начать анализ", "href": "/dashboard"},
            "secondary_cta": {"label": "Посмотреть академию", "href": "/academy"},
        },
        "stats": [
            {"value": "0 сум", "label": "реальных денег"},
            {"value": str(len(ACADEMY)), "label": "уроков в академии"},
            {"value": "24/7", "label": "доступ"},
        ],
        "features": [
            {"title": "Мировые рынки", "text": "S&P 500, Nasdaq, Dow Jones, Bitcoin, золото, нефть и акции крупных компаний в одном рабочем экране.", "icon": "leaderboard"},
            {"title": "AI-аналитик", "text": "Помощник объясняет компанию, плюсы, риски и фундаментальные показатели простым языком.", "icon": "psychology"},
            {"title": "Виртуальный портфель", "text": "Собирайте позиции без реальных денег и смотрите, как меняется доходность.", "icon": "account_balance_wallet"},
            {"title": "Академия инвестора", "text": "Курс по акциям, ETF, дивидендам, отраслевому анализу, value chain и риск-менеджменту.", "icon": "school"},
        ],
        "steps": ["Выберите компанию", "Проверьте показатели", "Спросите AI", "Виртуальный портфель"],
        "academy_highlights": [
            "Акции, ETF и дивиденды",
            "Барьеры входа и модели рынка",
            "Value chain и конкурентные преимущества",
            "Риск-менеджмент через отраслевой анализ",
        ],
        "security": {
            "title": "Сначала обучение и симуляция, потом реальные интеграции",
            "text": "Платформа не хранит клиентские деньги, не даёт персональных инвестиционных рекомендаций и не исполняет сделки.",
            "disclaimer": "Аналитика носит образовательный характер и не является инвестиционной рекомендацией.",
        },
        "market_status": _market_status(),
    }


@app.get("/dashboard-data")
def dashboard_data() -> dict:
    with ThreadPoolExecutor(max_workers=7) as executor:
        market_future = executor.submit(fetch_market)
        stocks_future = executor.submit(fetch_stocks)
        sources_future = executor.submit(fetch_sources)
        fx_future = executor.submit(fetch_fx_rates)
        macro_future = executor.submit(fetch_macro_summary)
        news_future = executor.submit(fetch_news)
        market_table_future = executor.submit(fetch_market_table)

        market_assets = [_market_response(asset).model_dump(mode="json") for asset in market_future.result()]
        stocks = [_stock_response(stock).model_dump(mode="json") for stock in stocks_future.result()]
        sources = [_source_response(source).model_dump(mode="json") for source in sources_future.result()]
        fx_rates = [_fx_response(rate).model_dump(mode="json") for rate in fx_future.result()]
        macro = _macro_response(macro_future.result()).model_dump(mode="json")
        news = [_news_response(item).model_dump(mode="json") for item in news_future.result()]
        market_table = [_market_table_row_response(row).model_dump(mode="json") for row in _dashboard_market_table_rows(market_table_future.result())]
    return {
        "market": market_assets,
        "stocks": stocks,
        "market_table": market_table,
        "news": news,
        "sources": sources,
        "fx_rates": fx_rates,
        "macro": macro,
        "as_of": datetime.now(timezone.utc).isoformat(),
        "market_status": _market_status(),
    }


@app.get("/stocks", response_model=list[Stock])
def list_stocks() -> list[Stock]:
    return [_stock_response(stock) for stock in fetch_stocks()]


@app.get("/stock/{ticker}", response_model=Stock)
def get_stock(ticker: str) -> Stock:
    stock = fetch_stock(ticker)
    if stock is not None:
        return _stock_response(stock)
    raise HTTPException(status_code=404, detail="Stock not found")


@app.get("/quote/{ticker}", response_model=QuoteSnapshot)
def get_quote(ticker: str) -> QuoteSnapshot:
    quote = fetch_quote_snapshot(ticker)
    if quote is not None:
        return _quote_snapshot_response(quote)
    raise HTTPException(status_code=404, detail="Quote not found")


@app.get("/fundamentals/{ticker}", response_model=FundamentalsResponse)
def fundamentals(ticker: str) -> FundamentalsResponse:
    return _fundamentals_response(fetch_fundamentals(ticker))


@app.get("/earnings/{ticker}", response_model=EarningsResponse)
def earnings(ticker: str) -> EarningsResponse:
    return _earnings_response(ticker, fetch_earnings(ticker))


@app.get("/market", response_model=list[MarketAsset])
def market() -> list[MarketAsset]:
    return [_market_response(asset) for asset in fetch_market()]


@app.get("/dashboard/market-table", response_model=list[MarketTableRow])
def dashboard_market_table() -> list[MarketTableRow]:
    return [_market_table_row_response(row) for row in _dashboard_market_table_rows(fetch_market_table())]


@app.get("/fx/rates", response_model=list[FxRate])
def fx_rates() -> list[FxRate]:
    return [_fx_response(rate) for rate in fetch_fx_rates()]


@app.get("/sources", response_model=list[DataSource])
def sources() -> list[DataSource]:
    return [_source_response(source) for source in fetch_sources()]


@app.get("/sources/catalog", response_model=list[DataSource])
def source_catalog() -> list[DataSource]:
    return [_source_response(source) for source in fetch_source_catalog()]


@app.get("/api/uzse/companies")
def uzse_companies() -> list[dict[str, Any]]:
    return UZSE_PROVIDER.get_companies()


@app.get("/api/uzse/indices")
def uzse_indices() -> list[dict[str, Any]]:
    return UZSE_PROVIDER.get_market_indices()


@app.get("/api/uzse/quotes")
def uzse_quotes() -> list[dict[str, Any]]:
    return UZSE_PROVIDER.get_quotes()


@app.get("/api/uzse/index-history/{name}")
def uzse_index_history(name: str) -> list[dict[str, Any]]:
    return UZSE_PROVIDER.get_index_history(name)


@app.get("/api/uzse/listings")
def uzse_listings() -> list[dict[str, Any]]:
    return UZSE_PROVIDER.get_listings()


@app.get("/api/uzse/trades")
def uzse_trades() -> list[dict[str, Any]]:
    return UZSE_PROVIDER.get_trade_results()


@app.get("/quotes/live", response_model=list[LiveQuote])
def live_quotes(
    symbols: str = Query(default="AAPL,NVDA,MSFT,SBER", description="Comma-separated tickers, e.g. AAPL,NVDA,SBER"),
) -> list[LiveQuote]:
    return [_live_quote_response(quote) for quote in fetch_live_quotes(_parse_symbols(symbols))]


@app.websocket("/ws/quotes")
async def quotes_websocket(websocket: WebSocket) -> None:
    await websocket.accept()
    symbols = _parse_symbols(websocket.query_params.get("symbols", "AAPL,NVDA,MSFT,SBER"))
    interval = _parse_interval(websocket.query_params.get("interval"))

    try:
        while True:
            quotes = await asyncio.to_thread(fetch_live_quotes, symbols)
            await websocket.send_json(
                {
                    "type": "quote_snapshot",
                    "symbols": symbols,
                    "quotes": [_live_quote_response(quote).model_dump(mode="json") for quote in quotes],
                    "as_of": datetime.now(timezone.utc).isoformat(),
                }
            )
            await asyncio.sleep(interval)
    except WebSocketDisconnect:
        return


@app.get("/news", response_model=list[NewsItem])
def list_news(category: str | None = None, symbol: str | None = None) -> list[NewsItem]:
    items = fetch_news(symbol=symbol, category=category)
    news_items = [_news_response(item) for item in items]
    if category is not None:
        news_items = [item for item in news_items if item.category.lower() == category.lower()]
    return news_items


@app.get("/macro/summary", response_model=MacroSummaryResponse)
def macro_summary() -> MacroSummaryResponse:
    return _macro_response(fetch_macro_summary())


@app.post("/portfolio/add", response_model=Position)
def add_position(payload: PositionCreate) -> Position:
    position = Position(id=len(POSITIONS) + 1, **payload.model_dump())
    POSITIONS.append(position)
    return position


@app.post("/portfolio/remove")
def remove_position(payload: RemovePosition) -> dict[str, bool]:
    before = len(POSITIONS)
    POSITIONS[:] = [
        position
        for position in POSITIONS
        if not (position.user_id == payload.user_id and position.ticker.lower() == payload.ticker.lower())
    ]
    return {"removed": len(POSITIONS) < before}


@app.post("/newsletter")
def newsletter(payload: NewsletterRequest) -> dict[str, bool | str]:
    email = payload.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=422, detail="Некорректный email")
    if email not in NEWSLETTER_SUBSCRIBERS:
        NEWSLETTER_SUBSCRIBERS.append(email)
    return {"ok": True, "message": "Вы подписаны на обновления Einvestuz."}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    message = payload.message.lower()
    company = next((stock for stock in STOCK_UNIVERSE.values() if stock.ticker.lower() in message or stock.name.lower() in message), None)
    if company is None:
        response = "Я могу объяснять инвестиционные термины, риск портфеля, ETF, дивиденды и компании из текущего MVP-списка."
    else:
        response = (
            f"{company.name}: {company.description} "
            "Плюсы: масштаб бизнеса, рыночная позиция и долгосрочные драйверы спроса. "
            "Риски: оценка компании, конкуренция, регулирование и волатильность рынка. "
            "Актуальную цену и показатели смотрите на странице акции или в дашборде."
        )
    return ChatResponse(message=payload.message, response=response)


@app.get("/academy")
def academy() -> list[dict[str, str | int]]:
    return ACADEMY


def _stock_response(stock) -> Stock:
    return Stock(
        ticker=stock.ticker,
        name=stock.name,
        price=stock.price,
        change=stock.change,
        market_cap=stock.market_cap,
        pe=stock.pe,
        dividend=stock.dividend,
        sector=_sector_for_ticker(stock.ticker),
        description=stock.description,
        source=stock.source,
        source_status=stock.status,
        as_of=stock.as_of or datetime.now(timezone.utc),
    )


def _quote_snapshot_response(quote) -> QuoteSnapshot:
    return QuoteSnapshot(
        ticker=quote.ticker,
        name=quote.name,
        price=quote.price,
        change=quote.change,
        change_percent=quote.change_percent,
        open=quote.open,
        high=quote.high,
        low=quote.low,
        previous_close=quote.previous_close,
        market_cap=quote.market_cap,
        pe=quote.pe,
        dividend=quote.dividend,
        description=quote.description,
        category=quote.category,
        exchange=quote.exchange,
        currency=quote.currency,
        source=quote.source,
        provider=quote.provider,
        status=quote.status,
        is_realtime=quote.is_realtime,
        delay_seconds=quote.delay_seconds,
        as_of=quote.as_of or datetime.now(timezone.utc),
    )


def _fundamentals_response(fundamentals) -> FundamentalsResponse:
    return FundamentalsResponse(
        ticker=fundamentals.ticker,
        name=fundamentals.name,
        exchange=fundamentals.exchange,
        currency=fundamentals.currency,
        industry=fundamentals.industry,
        market_cap=fundamentals.market_cap,
        pe=fundamentals.pe,
        dividend_yield=fundamentals.dividend_yield,
        description=fundamentals.description,
        profile=fundamentals.profile or {},
        metrics=fundamentals.metrics or {},
        source=fundamentals.source,
        provider=fundamentals.provider,
        status=fundamentals.status,
        as_of=fundamentals.as_of or datetime.now(timezone.utc),
    )


def _earnings_response(ticker: str, earnings: list[Any]) -> EarningsResponse:
    items = [
        EarningsPoint(
            period=item.period,
            year=item.year,
            quarter=item.quarter,
            actual=item.actual,
            estimate=item.estimate,
            surprise=item.surprise,
            surprise_percent=item.surprise_percent,
            source=item.source,
            provider=item.provider,
            status=item.status,
            as_of=item.as_of or datetime.now(timezone.utc),
        )
        for item in earnings
    ]
    status = items[0].status if items else "fallback"
    source = items[0].source if items else "finnhub"
    provider = items[0].provider if items else "finnhub"
    return EarningsResponse(
        ticker=ticker.upper(),
        source=source,
        provider=provider,
        status=status,
        as_of=items[0].as_of if items else datetime.now(timezone.utc),
        items=items,
    )


def _fx_response(rate) -> FxRate:
    return FxRate(
        ccy=rate.ccy,
        rate=rate.rate,
        diff=rate.diff,
        date=rate.date.isoformat() if rate.date else None,
        nominal=rate.nominal,
        name=rate.name,
        source=rate.source,
        provider=rate.provider,
        status=rate.status,
        as_of=rate.as_of or datetime.now(timezone.utc),
    )


def _macro_response(summary) -> MacroSummaryResponse:
    return MacroSummaryResponse(
        status=summary.status,
        summary=summary.summary,
        sources=[MacroSource(**source) for source in summary.sources],
        indicators=[MacroIndicator(**indicator) for indicator in summary.indicators],
        fallback_reason=summary.fallback_reason,
        as_of=summary.as_of or datetime.now(timezone.utc),
    )


def _news_response(item: Any) -> NewsItem:
    if isinstance(item, dict):
        raw_category = str(item.get("category") or "US")
        published_at = item.get("published_at") or item.get("datetime")
        item_id = item.get("id")
        title = item.get("title") or "Market update"
        source = item.get("source") or "Finnhub"
        url = item.get("url") or ""
        summary = item.get("summary") or ""
        related = item.get("related") or ""
        source_status = item.get("source_status") or "fallback"
    else:
        raw_category = str(getattr(item, "category", "US"))
        published_at = getattr(item, "published_at", None)
        item_id = getattr(item, "id", None)
        title = getattr(item, "title", "Market update")
        source = getattr(item, "source", "Finnhub")
        url = getattr(item, "url", "")
        summary = getattr(item, "summary", "")
        related = getattr(item, "related", "")
        source_status = getattr(item, "source_status", "fallback")

    category = _news_category(raw_category)
    if isinstance(published_at, (int, float)):
        published_at = datetime.fromtimestamp(published_at, tz=timezone.utc)
    if published_at is None:
        published_at = datetime.now(timezone.utc)
    return NewsItem(
        id=int(item_id or (hash((str(title), source, published_at.timestamp())) & 0x7FFFFFFF)),
        title=str(title),
        source=str(source),
        category=category,
        published_at=published_at,
        url=str(url),
        summary=str(summary),
        related=str(related),
        source_status=str(source_status),
    )


def _news_category(raw_category: str) -> Literal["US", "Technology", "ETF", "Crypto"]:
    normalized = raw_category.lower()
    if normalized == "technology":
        return "Technology"
    if normalized == "crypto":
        return "Crypto"
    if normalized == "etf":
        return "ETF"
    return "US"


def _market_response(asset) -> MarketAsset:
    return MarketAsset(
        ticker=asset.ticker,
        name=asset.name,
        price=asset.price,
        value=_format_market_value(asset.price, asset.category),
        change=asset.change,
        category=asset.category,
        source=asset.source,
        source_status=asset.status,
        is_realtime=asset.is_realtime,
        delay_seconds=asset.delay_seconds,
        as_of=asset.as_of or datetime.now(timezone.utc),
    )


def _source_response(source: MarketDataSource | dict) -> DataSource:
    if isinstance(source, dict):
        return DataSource(**source)
    return DataSource(
        id=source.id,
        name=source.name,
        market=source.market,
        coverage=source.coverage,
        update_mode=source.update_mode,
        status=source.status,
        notes=source.notes,
        url=source.url,
    )


def _live_quote_response(quote) -> LiveQuote:
    return LiveQuote(
        ticker=quote.ticker,
        name=quote.name,
        price=quote.price,
        change=quote.change,
        category=quote.category,
        source=quote.source,
        provider=quote.provider,
        status=quote.status,
        currency=quote.currency,
        as_of=quote.as_of or datetime.now(timezone.utc),
    )


def _parse_symbols(symbols: str) -> list[str]:
    parsed = [symbol.strip().upper() for symbol in symbols.split(",") if symbol.strip()]
    return parsed[:25] or ["AAPL", "NVDA", "MSFT", "SBER"]


def _parse_interval(raw_interval: str | None) -> float:
    try:
        interval = float(raw_interval) if raw_interval else 15.0
    except ValueError:
        interval = 15.0
    return min(max(interval, 5.0), 300.0)


def _format_market_value(price: float, category: str) -> str:
    if category in {"crypto", "commodity"}:
        return f"${price:,.2f}"
    return f"{price:,.2f}"


def _sector_for_ticker(ticker: str) -> str:
    return SECTOR_BY_TICKER.get(ticker.upper(), "Рынок")


def _market_status() -> dict[str, str | bool]:
    now = datetime.now(timezone.utc)
    is_weekday = now.weekday() < 5
    return {
        "label": "Рынок открыт" if is_weekday else "Рынок закрыт",
        "is_open": is_weekday,
        "timezone": "UTC",
        "as_of": now.isoformat(),
    }


def _market_table_row_response(row: dict[str, Any]) -> MarketTableRow:
    return MarketTableRow(
        rank=int(row.get("rank") or 0),
        branding=MarketTableBrand(**(row.get("branding") or {})),
        name=str(row.get("name") or ""),
        ticker=str(row.get("ticker") or ""),
        price=float(row.get("price") or 0.0),
        change_1h=float(row.get("change_1h") or 0.0),
        change_24h=float(row.get("change_24h") or 0.0),
        change_7d=float(row.get("change_7d") or 0.0),
        market_cap=str(row.get("market_cap") or "N/A"),
        volume_24h=str(row.get("volume_24h") or "N/A"),
        circulating_supply=str(row.get("circulating_supply") or "N/A"),
        sparkline_7d=[float(value) for value in (row.get("sparkline_7d") or [])],
        source=str(row.get("source") or "fallback"),
        status=str(row.get("status") or "fallback"),
        as_of=row.get("as_of") or datetime.now(timezone.utc),
    )


def _dashboard_market_table_rows(base_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = [*base_rows]
    try:
        rows.extend(_uzse_market_table_rows())
    except Exception:
        pass

    rows.sort(key=lambda row: (_market_table_source_priority(row), -_parse_compact_value(row.get("market_cap")), str(row.get("name") or "")))
    for index, row in enumerate(rows, start=1):
        row["rank"] = index
    return rows


def _uzse_market_table_rows() -> list[dict[str, Any]]:
    listings = UZSE_PROVIDER.get_listings()
    trades = UZSE_PROVIDER.get_trade_results()
    listings_by_ticker = {str(item.get("ticker") or ""): item for item in listings if item.get("ticker")}
    latest_trade_by_ticker: dict[str, dict[str, Any]] = {}
    volume_by_ticker: dict[str, float] = {}

    for trade in trades:
        ticker = str(trade.get("ticker") or "")
        if not ticker:
            continue
        latest_trade_by_ticker.setdefault(ticker, trade)
        volume_by_ticker[ticker] = volume_by_ticker.get(ticker, 0.0) + _coerce_numeric(trade.get("volume"))

    rows: list[dict[str, Any]] = []
    for ticker, trade in latest_trade_by_ticker.items():
        listing = listings_by_ticker.get(ticker, {})
        price = _coerce_numeric(trade.get("price"))
        shares = _coerce_numeric(listing.get("shares_outstanding"))
        market_cap_value = price * shares if price and shares else 0.0
        issuer = str(listing.get("issuer") or trade.get("issuer") or ticker)
        rows.append(
            {
                "rank": 0,
                "branding": {
                    "logo_url": None,
                    "monogram": _monogram_for_label(ticker, issuer),
                    "monogram_color": "#1d4ed8",
                },
                "name": issuer,
                "ticker": ticker,
                "price": price,
                "change_1h": 0.0,
                "change_24h": 0.0,
                "change_7d": 0.0,
                "market_cap": _format_uzs_value(market_cap_value) if market_cap_value else "N/A",
                "volume_24h": _format_uzs_value(volume_by_ticker.get(ticker, 0.0)) if volume_by_ticker.get(ticker) else "N/A",
                "circulating_supply": _format_units(shares, ticker) if shares else "N/A",
                "sparkline_7d": [price for _ in range(7)] if price else [],
                "source": "uzse.uz",
                "status": "delayed",
                "as_of": datetime.now(timezone.utc),
            }
        )
    return rows


def _market_table_source_priority(row: dict[str, Any]) -> int:
    return 0 if str(row.get("source") or "").lower() == "uzse.uz" else 1


def _coerce_numeric(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).replace(",", "").replace(" ", ""))
    except (TypeError, ValueError):
        return 0.0


def _parse_compact_value(value: Any) -> float:
    text = str(value or "").upper().replace(",", "").strip()
    number_match = re.search(r"(-?\d+(?:\.\d+)?)", text)
    if not number_match:
        return 0.0
    multiplier = 1.0
    if "T" in text:
        multiplier = 1e12
    elif "B" in text:
        multiplier = 1e9
    elif "M" in text:
        multiplier = 1e6
    elif "K" in text:
        multiplier = 1e3
    return float(number_match.group(1)) * multiplier


def _format_uzs_value(value: float) -> str:
    if value >= 1e12:
        return f"UZS {value / 1e12:.2f}T"
    if value >= 1e9:
        return f"UZS {value / 1e9:.2f}B"
    if value >= 1e6:
        return f"UZS {value / 1e6:.2f}M"
    if value >= 1e3:
        return f"UZS {value / 1e3:.2f}K"
    return f"UZS {value:.2f}"


def _format_units(value: float, ticker: str) -> str:
    if value >= 1e12:
        amount = f"{value / 1e12:.2f}T"
    elif value >= 1e9:
        amount = f"{value / 1e9:.2f}B"
    elif value >= 1e6:
        amount = f"{value / 1e6:.2f}M"
    elif value >= 1e3:
        amount = f"{value / 1e3:.2f}K"
    else:
        amount = f"{value:.0f}"
    return f"{amount} {ticker}"


def _monogram_for_label(ticker: str, name: str) -> str:
    compact = "".join(char for char in ticker if char.isalnum())
    if len(compact) >= 2:
        return compact[:2].upper()
    words = [word for word in name.split() if word]
    return "".join(word[0].upper() for word in words[:2]) or ticker[:2].upper()
