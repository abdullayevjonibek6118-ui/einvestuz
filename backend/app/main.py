import asyncio
import os
import re
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Literal

_EXECUTOR = ThreadPoolExecutor(max_workers=7)

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
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
from .providers.stockscope_provider import StockScopeProvider
from .providers.uzse_provider import UzseProvider
from .database import supabase

load_dotenv()

app = FastAPI(
    title="Einvestuz API",
    version="0.1.0",
    description="MVP API for market data, company analysis, virtual portfolios, chat, and academy lessons.",
)

DEFAULT_CORS_ORIGINS = "http://localhost:3000,https://einvestuz.com,https://www.einvestuz.com"
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
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
    currency: str = "USD"
    market: str | None = None
    isin: str | None = None
    listing_category: str | None = None
    stock_type: str | None = None
    openinfo_id: int | str | None = None
    website: str | None = None
    insight: dict[str, Any] | None = None
    risk_factors: list[dict[str, Any]] = Field(default_factory=list)
    decision_summary: dict[str, Any] | None = None
    source_meta: dict[str, Any] | None = None
    stockscope: dict[str, Any] | None = None


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
    market: str | None = None
    currency: str = "USD"
    sector: str | None = None
    isin: str | None = None
    listing_category: str | None = None
    stock_type: str | None = None
    openinfo_id: int | str | None = None
    market_cap_value: float | None = None
    volume_24h_value: float | None = None
    circulating_supply_value: float | None = None
    volume_period: str | None = None


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


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    user_id: str = Field(default="demo-user")
    message: str = Field(min_length=2, max_length=2000)
    history: list[ChatHistoryMessage] = Field(default_factory=list, max_length=12)


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

POSITIONS_LOCK = threading.Lock()
NEWSLETTER_LOCK = threading.Lock()

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
STOCKSCOPE_PROVIDER = StockScopeProvider()

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
def health() -> dict[str, str | bool]:
    database = supabase.health()
    return {
        "status": "ok" if database.connected else "degraded",
        "database": "connected" if database.connected else "unavailable",
        "database_configured": database.configured,
    }


@app.get("/health/database")
def database_health() -> dict[str, str | bool]:
    database = supabase.health()
    return {
        "configured": database.configured,
        "connected": database.connected,
        "detail": database.detail,
    }


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
    market_future = _EXECUTOR.submit(fetch_market)
    stocks_future = _EXECUTOR.submit(fetch_stocks)
    sources_future = _EXECUTOR.submit(fetch_sources)
    fx_future = _EXECUTOR.submit(fetch_fx_rates)
    macro_future = _EXECUTOR.submit(fetch_macro_summary)
    news_future = _EXECUTOR.submit(fetch_news)
    market_table_future = _EXECUTOR.submit(fetch_market_table)

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
    stockscope = _stockscope_listing_for_ticker(ticker)
    if stockscope is not None:
        return _stockscope_stock_response(stockscope)
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


@app.get("/api/stockscope/listings")
def stockscope_listings() -> list[dict[str, Any]]:
    return STOCKSCOPE_PROVIDER.get_listings()


@app.get("/api/stockscope/listings/{ticker}/details")
def stockscope_listing_details(ticker: str) -> dict[str, Any]:
    details = STOCKSCOPE_PROVIDER.get_listing_details(ticker)
    if not details:
        raise HTTPException(status_code=404, detail="StockScope listing details not found")
    return details


@app.get("/api/stockscope/details")
def stockscope_details_batch(
    tickers: str | None = Query(default=None, description="Comma-separated tickers. If omitted, uses the StockScope catalog."),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=200),
    full: bool = Query(default=False, description="Include raw Nuxt payload fragments. Default false keeps response lighter."),
    max_workers: int = Query(default=4, ge=1, le=8),
) -> dict[str, Any]:
    parsed_tickers = _parse_symbols(tickers) if tickers else None
    return STOCKSCOPE_PROVIDER.get_listing_details_batch(
        parsed_tickers,
        offset=offset,
        limit=limit,
        max_workers=max_workers,
        include_raw=full,
    )


@app.get("/api/stockscope/coverage")
def stockscope_coverage() -> dict[str, Any]:
    return STOCKSCOPE_PROVIDER.get_listing_details_coverage()


@app.get("/api/stockscope/screener")
def stockscope_screener(
    q: str | None = Query(default=None, description="Search by ticker, company name, or ISIN."),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    min_roe: float | None = Query(default=None),
    min_roa: float | None = Query(default=None),
    max_pe: float | None = Query(default=None),
    max_pb: float | None = Query(default=None),
    min_reports: int | None = Query(default=None, ge=0),
    min_indicators: int | None = Query(default=None, ge=0),
    sort_by: str = Query(default="reports_count"),
    sort_dir: Literal["asc", "desc"] = Query(default="desc"),
) -> dict[str, Any]:
    return STOCKSCOPE_PROVIDER.screen_listings(
        q=q,
        offset=offset,
        limit=limit,
        min_roe=min_roe,
        min_roa=min_roa,
        max_pe=max_pe,
        max_pb=max_pb,
        min_reports=min_reports,
        min_indicators=min_indicators,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


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
    with POSITIONS_LOCK:
        for position in POSITIONS:
            if position.user_id == payload.user_id and position.ticker.lower() == payload.ticker.lower():
                total_quantity = position.quantity + payload.quantity
                position.buy_price = (
                    (position.buy_price * position.quantity + payload.buy_price * payload.quantity) / total_quantity
                )
                position.quantity = total_quantity
                position.ticker = payload.ticker.upper()
                return position
        next_id = max((position.id for position in POSITIONS), default=0) + 1
        position = Position(id=next_id, **{**payload.model_dump(), "ticker": payload.ticker.upper()})
        POSITIONS.append(position)
        return position


@app.post("/portfolio/remove")
def remove_position(payload: RemovePosition) -> dict[str, bool]:
    with POSITIONS_LOCK:
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
    with NEWSLETTER_LOCK:
        if email not in NEWSLETTER_SUBSCRIBERS:
            NEWSLETTER_SUBSCRIBERS.append(email)
    return {"ok": True, "message": "Вы подписаны на обновления Einvestuz."}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    message = " ".join([*(item.text for item in payload.history[-6:]), payload.message]).lower()
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
    as_of = stock.as_of or datetime.now(timezone.utc)
    decision_room = _build_stock_decision_room(
        ticker=stock.ticker,
        name=stock.name,
        price=stock.price,
        change=stock.change,
        currency="USD",
        market="global",
        sector=_sector_for_ticker(stock.ticker),
        listing_category=None,
        stock_type=None,
        source=stock.source,
        source_status=stock.status,
        as_of=as_of,
        description=stock.description,
        change_is_percent=False,
    )
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
        as_of=as_of,
        currency="USD",
        market="global",
        insight=decision_room["insight"],
        risk_factors=decision_room["risk_factors"],
        decision_summary=decision_room["decision_summary"],
        source_meta=decision_room["source_meta"],
    )


def _stockscope_stock_response(item: dict[str, Any]) -> Stock:
    ticker = str(item.get("ticker") or "").upper()
    price = _coerce_numeric(item.get("currentPrice"))
    market_cap_value = _stockscope_market_cap(item)
    as_of = _stockscope_as_of(item)
    decision_room = _build_stock_decision_room(
        ticker=ticker,
        name=str(item.get("name") or item.get("uzseName") or ticker),
        price=price,
        change=_stockscope_change(item, "yesterday"),
        currency="UZS",
        market="uzbekistan",
        sector=str(item.get("sector") or "Рынок Узбекистана"),
        listing_category=str(item.get("listingCategory") or "") or None,
        stock_type=str(item.get("stockType") or "") or None,
        source="stockscope.uz",
        source_status="delayed",
        as_of=as_of,
        description=" ".join(
            [
                str(item.get("uzseName") or item.get("name") or ticker),
                "локальная акция Узбекистана из StockScope screener.",
                *(
                    [f"Категория листинга: {item.get('listingCategory')}."]
                    if item.get("listingCategory")
                    else []
                ),
                *([f"ISIN: {item.get('isin')}." ] if item.get("isin") else []),
            ]
        ),
        market_cap=_format_uzs_value(market_cap_value) if market_cap_value else "N/A",
        volume_proxy=_stockscope_volume(item),
        change_is_percent=True,
    )
    description_parts = [
        str(item.get("uzseName") or item.get("name") or ticker),
        "локальная акция Узбекистана из StockScope screener.",
    ]
    if item.get("listingCategory"):
        description_parts.append(f"Категория листинга: {item.get('listingCategory')}.")
    if item.get("isin"):
        description_parts.append(f"ISIN: {item.get('isin')}.")
    return Stock(
        ticker=ticker,
        name=str(item.get("name") or item.get("uzseName") or ticker),
        price=price,
        change=_stockscope_change(item, "yesterday"),
        market_cap=_format_uzs_value(market_cap_value) if market_cap_value else "N/A",
        pe=0.0,
        dividend="N/A",
        sector=str(item.get("sector") or "Рынок Узбекистана"),
        description=" ".join(description_parts),
        source="stockscope.uz",
        source_status="delayed",
        as_of=as_of,
        currency="UZS",
        market="uzbekistan",
        isin=str(item.get("isin") or "") or None,
        listing_category=str(item.get("listingCategory") or "") or None,
        stock_type=str(item.get("stockType") or "") or None,
        openinfo_id=item.get("openinfoId"),
        website=str(item.get("website") or "") or None,
        insight=decision_room["insight"],
        risk_factors=decision_room["risk_factors"],
        decision_summary=decision_room["decision_summary"],
        source_meta=decision_room["source_meta"],
        stockscope=STOCKSCOPE_PROVIDER.get_listing_details(ticker),
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


def _build_stock_decision_room(
    *,
    ticker: str,
    name: str,
    price: float,
    change: float,
    currency: str,
    market: str,
    sector: str | None,
    listing_category: str | None,
    stock_type: str | None,
    source: str,
    source_status: str,
    as_of: datetime,
    description: str = "",
    market_cap: str | None = None,
    volume_proxy: float | None = None,
    change_is_percent: bool = True,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    freshness_minutes = _minutes_since(as_of, now)
    freshness_band = _freshness_band(freshness_minutes)
    price_display = _format_price_display(price, currency)
    change_display = f"{change:+.2f}%" if change_is_percent else f"{change:+.2f} {currency}"
    sector_label = sector or "Сектор не указан"
    listing_label = listing_category or "Категория листинга не указана"
    type_label = stock_type or "Тип бумаги не указан"
    movement = "позитивное" if change > 0 else "негативное" if change < 0 else "нейтральное"
    freshness_note = "свежие" if freshness_band == "fresh" else "задержанные" if freshness_band == "delayed" else "устаревшие"
    freshness_risk = "low" if freshness_band == "fresh" and source_status == "live" else "medium" if freshness_band == "delayed" else "high"
    volume_note = _format_volume_proxy(volume_proxy, currency)

    insight = {
        "headline": f"{name}: {price_display} ({change_display})",
        "summary": (
            f"{sector_label}. Движение сейчас {movement}; для образовательного обзора это удобно "
            f"сверять с ликвидностью, свежестью данных и типом листинга."
        ),
        "signals": [
            f"Цена: {price_display}",
            f"Дневное изменение: {change_display}",
            f"Сектор: {sector_label}",
            f"Листинг: {listing_label}",
            f"Тип бумаги: {type_label}",
            f"Источник: {source} ({source_status})",
        ],
        "freshness": {
            "label": freshness_note,
            "minutes": round(freshness_minutes, 1),
        },
        "liquidity_proxy": volume_note,
        "orientation": "watch" if abs(change) >= 3 else "neutral",
    }

    risk_factors = [
        {
            "code": "data_freshness",
            "label": "Data freshness risk",
            "severity": freshness_risk,
            "detail": (
                f"Source is {freshness_note}; as_of={as_of.isoformat()}."
                if freshness_minutes is not None
                else f"Source freshness is not explicit for {source}."
            ),
        }
    ]
    if volume_proxy in (None, 0):
        risk_factors.append(
            {
                "code": "liquidity_proxy",
                "label": "Liquidity proxy risk",
                "severity": "medium" if market == "uzbekistan" else "low",
                "detail": "Volume proxy is unavailable, so liquidity needs extra caution.",
            }
        )
    elif volume_proxy < 100_000:
        risk_factors.append(
            {
                "code": "liquidity_proxy",
                "label": "Liquidity proxy risk",
                "severity": "medium",
                "detail": f"Estimated volume proxy is low: {volume_note}.",
            }
        )
    if abs(change) >= 5:
        risk_factors.append(
            {
                "code": "volatility",
                "label": "Volatility risk",
                "severity": "medium",
                "detail": f"Price moved {change_display} versus the previous session.",
            }
        )
    if market == "uzbekistan" and not listing_category:
        risk_factors.append(
            {
                "code": "coverage_gap",
                "label": "Coverage gap",
                "severity": "low",
                "detail": "Listing category is missing, so classification confidence is lower.",
            }
        )
    if source_status in {"fallback", "offline"}:
        risk_factors.append(
            {
                "code": "source_quality",
                "label": "Source quality risk",
                "severity": "high",
                "detail": f"Data comes from {source_status} mode; treat it as educational rather than actionable.",
            }
        )

    decision_summary = {
        "bottom_line": (
            f"{name} looks {movement} on the latest available data and is best treated as an educational watchlist item."
        ),
        "who_it_might_fit": [
            "Users comparing sector context and source freshness",
            "Longer-horizon learners who want a quick screen before deeper research",
        ],
        "who_it_might_not_fit": [
            "Intraday traders who need a real-time tape",
            "Users who need a fully verified, license-grade market feed",
        ],
        "next_step": "Open fundamentals, compare peers, and check source freshness before drawing conclusions.",
        "time_horizon": "educational / pre-research",
    }

    source_meta = {
        "source": source,
        "status": source_status,
        "market": market,
        "currency": currency,
        "change_basis": "percent" if change_is_percent else "absolute",
        "as_of": as_of.isoformat(),
        "freshness_minutes": round(freshness_minutes, 1),
        "freshness_band": freshness_band,
        "freshness_risk": freshness_risk,
        "market_cap": market_cap,
        "volume_proxy": volume_proxy,
        "ticker": ticker,
        "name": name,
        "description": description,
    }
    return {
        "insight": insight,
        "risk_factors": risk_factors,
        "decision_summary": decision_summary,
        "source_meta": source_meta,
    }


def _minutes_since(as_of: datetime, now: datetime) -> float:
    try:
        delta = now - as_of.astimezone(timezone.utc)
        return max(delta.total_seconds() / 60.0, 0.0)
    except Exception:
        return 0.0


def _freshness_band(minutes: float) -> str:
    if minutes <= 30:
        return "fresh"
    if minutes <= 24 * 60:
        return "delayed"
    return "stale"


def _format_price_display(price: float, currency: str) -> str:
    if currency == "USD":
        return f"${price:,.2f}"
    return f"{currency} {price:,.2f}"


def _format_volume_proxy(volume: float | None, currency: str) -> str:
    if volume in (None, 0):
        return "N/A"
    prefix = currency if currency != "USD" else "$"
    if volume >= 1_000_000_000:
        return f"{prefix} {volume / 1_000_000_000:.2f}B"
    if volume >= 1_000_000:
        return f"{prefix} {volume / 1_000_000:.2f}M"
    if volume >= 1_000:
        return f"{prefix} {volume / 1_000:.2f}K"
    return f"{prefix} {volume:.0f}"


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
        market=row.get("market"),
        currency=str(row.get("currency") or "USD"),
        sector=row.get("sector"),
        isin=row.get("isin"),
        listing_category=row.get("listing_category"),
        stock_type=row.get("stock_type"),
        openinfo_id=row.get("openinfo_id"),
        market_cap_value=_optional_float(row.get("market_cap_value")),
        volume_24h_value=_optional_float(row.get("volume_24h_value")),
        circulating_supply_value=_optional_float(row.get("circulating_supply_value")),
        volume_period=row.get("volume_period"),
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
    companies = UZSE_PROVIDER.get_companies()
    listings = UZSE_PROVIDER.get_listings()
    trades = UZSE_PROVIDER.get_trade_results()
    stockscope_listings = STOCKSCOPE_PROVIDER.get_listings()
    stockscope_by_ticker = {str(item.get("ticker") or "").upper(): item for item in stockscope_listings if item.get("ticker")}
    listings_by_key = {_instrument_key(item): item for item in listings if _instrument_key(item)}
    latest_trade_by_key: dict[tuple[str, str, str], dict[str, Any]] = {}
    volume_by_key: dict[tuple[str, str, str], float] = {}

    for trade in trades:
        key = _instrument_key(trade)
        if not key:
            continue
        latest_trade_by_key.setdefault(key, trade)
        volume_by_key[key] = volume_by_key.get(key, 0.0) + _coerce_numeric(trade.get("volume"))

    all_keys = {
        key
        for key in [
            *(_instrument_key(company) for company in companies),
            *listings_by_key.keys(),
            *latest_trade_by_key.keys(),
        ]
        if key
    }

    rows: list[dict[str, Any]] = []
    seen_tickers: set[str] = set()
    for key in all_keys:
        trade = latest_trade_by_key.get(key, {})
        listing = listings_by_key.get(key, {})
        company = next((item for item in companies if _instrument_key(item) == key), {})
        ticker = str(trade.get("ticker") or listing.get("ticker") or company.get("ticker") or "")
        stockscope = stockscope_by_ticker.get(ticker.upper(), {})
        price = _coerce_numeric(trade.get("price")) or _coerce_numeric(stockscope.get("currentPrice"))
        shares = _coerce_numeric(listing.get("shares_outstanding")) or _coerce_numeric(stockscope.get("noOfShares"))
        market_cap_value = _stockscope_market_cap(stockscope) or (price * shares if price and shares else 0.0)
        volume_value = volume_by_key.get(key, 0.0) or _stockscope_volume(stockscope)
        issuer = str(listing.get("issuer") or trade.get("issuer") or company.get("name") or stockscope.get("name") or ticker)
        seen_tickers.add(ticker.upper())
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
                "change_24h": _stockscope_change(stockscope, "yesterday"),
                "change_7d": _stockscope_change(stockscope, "lastWeek"),
                "market_cap": _format_uzs_value(market_cap_value) if market_cap_value else "N/A",
                "volume_24h": _format_uzs_value(volume_value) if volume_value else "N/A",
                "circulating_supply": _format_units(shares, ticker) if shares else "N/A",
                "sparkline_7d": _stockscope_sparkline(stockscope) or ([price for _ in range(7)] if price else []),
                "source": "uzse.uz + stockscope.uz" if stockscope else "uzse.uz",
                "status": "delayed",
                "as_of": datetime.now(timezone.utc),
                "market": "uzbekistan",
                "currency": "UZS",
                "sector": stockscope.get("sector"),
                "isin": stockscope.get("isin") or listing.get("isin") or company.get("isin") or trade.get("isin"),
                "listing_category": stockscope.get("listingCategory"),
                "stock_type": stockscope.get("stockType"),
                "openinfo_id": stockscope.get("openinfoId"),
                "market_cap_value": market_cap_value or None,
                "volume_24h_value": volume_value or None,
                "circulating_supply_value": shares or None,
                "volume_period": "7d" if stockscope and not volume_by_key.get(key) else "latest",
            }
        )
    for stockscope in stockscope_listings:
        ticker = str(stockscope.get("ticker") or "").upper()
        if not ticker or ticker in seen_tickers:
            continue
        price = _coerce_numeric(stockscope.get("currentPrice"))
        shares = _coerce_numeric(stockscope.get("noOfShares"))
        market_cap_value = _stockscope_market_cap(stockscope) or (price * shares if price and shares else 0.0)
        name = str(stockscope.get("name") or stockscope.get("uzseName") or ticker)
        volume_value = _stockscope_volume(stockscope)
        rows.append(
            {
                "rank": 0,
                "branding": {
                    "logo_url": None,
                    "monogram": _monogram_for_label(ticker, name),
                    "monogram_color": "#0f766e",
                },
                "name": name,
                "ticker": ticker,
                "price": price,
                "change_1h": 0.0,
                "change_24h": _stockscope_change(stockscope, "yesterday"),
                "change_7d": _stockscope_change(stockscope, "lastWeek"),
                "market_cap": _format_uzs_value(market_cap_value) if market_cap_value else "N/A",
                "volume_24h": _format_uzs_value(volume_value) if volume_value else "N/A",
                "circulating_supply": _format_units(shares, ticker) if shares else "N/A",
                "sparkline_7d": _stockscope_sparkline(stockscope),
                "source": "stockscope.uz",
                "status": "delayed",
                "as_of": datetime.now(timezone.utc),
                "market": "uzbekistan",
                "currency": "UZS",
                "sector": stockscope.get("sector"),
                "isin": stockscope.get("isin"),
                "listing_category": stockscope.get("listingCategory"),
                "stock_type": stockscope.get("stockType"),
                "openinfo_id": stockscope.get("openinfoId"),
                "market_cap_value": market_cap_value or None,
                "volume_24h_value": volume_value or None,
                "circulating_supply_value": shares or None,
                "volume_period": "7d",
            }
        )
    return rows


def _stockscope_volume(item: dict[str, Any]) -> float:
    volumes = item.get("volumes") if isinstance(item.get("volumes"), dict) else {}
    return _coerce_numeric(volumes.get("lastWeekUzs")) or _coerce_numeric(volumes.get("lastMonthUzs"))


def _stockscope_market_cap(item: dict[str, Any]) -> float:
    explicit = _coerce_numeric(item.get("marketCap"))
    if explicit:
        return explicit
    price = _coerce_numeric(item.get("currentPrice"))
    shares = _coerce_numeric(item.get("noOfShares"))
    return price * shares if price and shares else 0.0


def _stockscope_change(item: dict[str, Any], field: str) -> float:
    price = _coerce_numeric(item.get("currentPrice"))
    past_prices = item.get("pastPrices") if isinstance(item.get("pastPrices"), dict) else {}
    past = _coerce_numeric(past_prices.get(field))
    if not price or not past:
        return 0.0
    return ((price - past) / past) * 100


def _stockscope_sparkline(item: dict[str, Any]) -> list[float]:
    price = _coerce_numeric(item.get("currentPrice"))
    past_prices = item.get("pastPrices") if isinstance(item.get("pastPrices"), dict) else {}
    values = [
        _coerce_numeric(past_prices.get("lastWeek")),
        _coerce_numeric(past_prices.get("yesterday")),
        price,
    ]
    return [value for value in values if value]


def _stockscope_as_of(item: dict[str, Any]) -> datetime:
    timestamp = item.get("lastPriceUpdateAt") if isinstance(item.get("lastPriceUpdateAt"), dict) else {}
    seconds = _coerce_numeric(timestamp.get("seconds"))
    if seconds:
        return datetime.fromtimestamp(seconds, tz=timezone.utc)
    return datetime.now(timezone.utc)


def _stockscope_listing_for_ticker(ticker: str) -> dict[str, Any] | None:
    normalized = ticker.upper().strip()
    return next((item for item in STOCKSCOPE_PROVIDER.get_listings() if str(item.get("ticker") or "").upper() == normalized), None)


def _instrument_key(item: dict[str, Any]) -> tuple[str, str, str] | None:
    isin = str(item.get("isin") or "").strip().upper()
    market_id = str(item.get("market_id") or "").strip().upper()
    ticker = str(item.get("ticker") or "").strip().upper()
    if isin or ticker:
        return (isin, market_id, ticker)
    return None


def _market_table_source_priority(row: dict[str, Any]) -> int:
    source = str(row.get("source") or "").lower()
    if source.startswith("uzse.uz"):
        return 0
    if source == "stockscope.uz":
        return 1
    return 2


def _coerce_numeric(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).replace(",", "").replace(" ", ""))
    except (TypeError, ValueError):
        return 0.0


def _optional_float(value: Any) -> float | None:
    number = _coerce_numeric(value)
    return number if number else None


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
