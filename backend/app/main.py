import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .market_data import DataSource as MarketDataSource
from .market_data import STOCK_UNIVERSE
from .market_data import get_quotes as fetch_live_quotes
from .market_data import get_market as fetch_market
from .market_data import get_source_catalog as fetch_source_catalog
from .market_data import get_sources as fetch_sources
from .market_data import get_stock as fetch_stock
from .market_data import get_stocks as fetch_stocks

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


class NewsItem(BaseModel):
    id: int
    title: str
    source: str
    category: Literal["US", "Technology", "ETF", "Crypto"]
    published_at: datetime


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
    with ThreadPoolExecutor(max_workers=3) as executor:
        market_future = executor.submit(fetch_market)
        stocks_future = executor.submit(fetch_stocks)
        sources_future = executor.submit(fetch_sources)

        market_assets = [_market_response(asset).model_dump(mode="json") for asset in market_future.result()]
        stocks = [_stock_response(stock).model_dump(mode="json") for stock in stocks_future.result()]
        sources = [_source_response(source).model_dump(mode="json") for source in sources_future.result()]
    return {
        "market": market_assets,
        "stocks": stocks,
        "news": [item.model_dump(mode="json") for item in NEWS],
        "sources": sources,
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


@app.get("/market", response_model=list[MarketAsset])
def market() -> list[MarketAsset]:
    return [_market_response(asset) for asset in fetch_market()]


@app.get("/sources", response_model=list[DataSource])
def sources() -> list[DataSource]:
    return [_source_response(source) for source in fetch_sources()]


@app.get("/sources/catalog", response_model=list[DataSource])
def source_catalog() -> list[DataSource]:
    return [_source_response(source) for source in fetch_source_catalog()]


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
def list_news(category: str | None = None) -> list[NewsItem]:
    if category is None:
        return NEWS
    return [item for item in NEWS if item.category.lower() == category.lower()]


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
