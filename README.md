# EInvest

EInvest — русскоязычная информационно-аналитическая платформа для исследования фондового рынка Узбекистана. Проект объединяет каталог эмитентов UZSE, котировки, финансовые показатели, документы, дивиденды, новости, макроэкономические данные, сравнение компаний, локальный учебный портфель, образовательные материалы и помощника на правилах.

> Проект находится на стадии MVP. EInvest не является брокером, не принимает деньги, не исполняет сделки и не предоставляет индивидуальные инвестиционные рекомендации. Часть данных может быть задержанной, демонстрационной или полученной из резервного источника — актуальный статус показывается в интерфейсе и API.

## Что уже реализовано

- исследовательский терминал по публичным компаниям Узбекистана;
- каталог и скринер эмитентов с поиском, фильтрами и сортировкой;
- детальная карточка компании с ценой, фундаментальными показателями, рисками, документами, новостями и источниками;
- сравнение нескольких компаний по ключевым метрикам;
- обзор рынка, валютных курсов, сырьевых активов и макропоказателей;
- REST API и WebSocket-поток котировок;
- виртуальный учебный портфель без реальных сделок;
- учебный чат на правилах с контекстом доступных рыночных данных (без подключения генеративной модели);
- академия инвестора на основе лекций по отраслевому анализу;
- SEO: метаданные страниц, Open Graph, sitemap, robots.txt, JSON-LD, PWA manifest и `llms.txt`;
- адаптивная навигация для десктопа и мобильных устройств;
- схема Supabase PostgreSQL с RLS-политиками для публичных и пользовательских данных.

## Страницы приложения

| URL | Страница | Возможности |
| --- | --- | --- |
| `/` | Рынок | Главный обзор: пульс рынка, индексы, крупнейшие компании, AI market brief, макроэкономика, новости и быстрый переход к исследованию эмитентов. |
| `/dashboard` | Дашборд | Совместимый маршрут, перенаправляет на главную страницу `/`. |
| `/screener` | Скринер акций | Поиск по компании, тикеру или ISIN; фильтры по минимальному ROE/ROA, максимальному P/E/P/B и количеству отчётов; сортировка по капитализации, рентабельности, мультипликаторам, дивидендам и раскрытию. |
| `/stocks/[ticker]` | Карточка компании | Идентификация эмитента, цена и изменение, рынок и валюта, капитализация, P/E, дивиденды, beta, финансовые периоды, отчётность, документы, новости, AI-резюме, risk fingerprint, источники данных и похожие компании. Например: `/stocks/A011030`. |
| `/compare?tickers=A,B,C` | Сравнение | Сопоставление до нескольких эмитентов по цене, капитализации, ROE, ROA, P/E, P/B, долговой нагрузке, маржинальности, дивидендам и полноте раскрытия. Тикеры передаются через query-параметр `tickers`. |
| `/ai` | AI-аналитика | Генеративный помощник AIMLAPI отвечает на русском языке на основе evidence pack из данных терминала, без персональных инвестиционных рекомендаций; справа отображается рыночный контекст. Можно передать стартовый вопрос через `?question=...` и тикер через `?ticker=...`. |
| `/portfolio` | Виртуальный портфель | Локальная симуляция в браузере: добавление и удаление учебных позиций, расчёт стоимости, прибыли/убытка и доходности. Позицию можно предварительно выбрать через `?ticker=...`. |
| `/profile` | Демо-профиль | Демонстрационные данные без учётной записи и серверного сохранения. Страница закрыта от поисковой индексации. |
| `/academy` | Академия инвестора | Девять уроков трёх уровней: основы акций и ETF, границы рынка, бизнес-модели, барьеры входа, конкуренция, industry overview, value chain, жизненный цикл отрасли и риск-менеджмент. Включает практические задания и финальный мини-проект. |
| неизвестный URL | 404 | Страница «Страница не найдена» со ссылкой на рынок. |

Дополнительные системные маршруты фронтенда:

- `/sitemap.xml` — динамическая карта сайта, включая страницы компаний;
- `/robots.txt` — правила индексации;
- `/manifest.webmanifest` — PWA-манифест;
- `/opengraph-image` — генерируемое изображение для социальных сетей;
- `/llms.txt` — краткое машиночитаемое описание проекта.

## Текущие ограничения MVP

- виртуальный портфель сохраняется только в `localStorage` текущего браузера и не заменяет полноценный пользовательский кабинет;
- профиль, watchlist, переключатели уведомлений и история запросов пока демонстрационные;
- `/chat` возвращает образовательный ответ через AIMLAPI на основе доступного evidence pack, а не персональную инвестиционную рекомендацию;
- при недоступности внешнего провайдера отсутствующие финансовые значения остаются пустыми, а не заменяются синтетическими числами;
- `yfinance` — best-effort источник без SLA, а публичные UZSE/StockScope-данные могут поступать с задержкой;
- CPI и годовой ВВП доступны из официальных машиночитаемых наборов SIAT; оперативный рост ВВП берётся из публикации `stat.uz`;
- заготовки Bloomberg и LSEG требуют коммерческой лицензии и не активны по умолчанию;
- Supabase-схема и RLS подготовлены, но пользовательская авторизация ещё не подключена к текущим страницам интерфейса.

## Архитектура

```text
Внешние источники данных
  ├─ StockScope / UZSE
  ├─ CBU Uzbekistan
  ├─ Finnhub
  ├─ Yahoo Finance (yfinance)
  └─ MOEX ISS
          │
          ▼
FastAPI provider adapters → TTL-кэш → REST API / WebSocket
          │                         │
          ├──────── Supabase ───────┤
          │                         ▼
          └────────────────── Next.js App Router
                                  │
                                  ▼
                         страницы EInvest / localStorage
```

### Технологии

**Frontend**

- Next.js 15 (App Router, React Server Components);
- React 19 и TypeScript;
- Tailwind CSS 4;
- Lucide React;
- динамические SEO-метаданные и JSON-LD.

**Backend**

- Python 3.12;
- FastAPI и Uvicorn;
- Pydantic;
- `yfinance`;
- REST и WebSocket;
- in-memory TTL-кэш внешних запросов.

**Данные и инфраструктура**

- Supabase PostgreSQL через HTTPS Data API;
- миграции и seed-данные Supabase;
- Vercel для frontend;
- Railway или Docker для backend.

## Структура репозитория

```text
Einvestuz/
├─ frontend/
│  ├─ app/                 # страницы, layout, SEO и системные маршруты Next.js
│  ├─ components/          # shell, UI, AI-чат, портфель, live market
│  ├─ lib/                 # API-клиент, типы, fallback-данные, SEO, портфель
│  └─ public/              # логотип и изображения
├─ backend/
│  ├─ app/
│  │  ├─ main.py           # FastAPI endpoints и модели запросов/ответов
│  │  ├─ market_data.py    # провайдеры, нормализация и кэш
│  │  ├─ database.py       # Supabase Data API
│  │  └─ providers/        # адаптеры UZSE и StockScope
│  ├─ scripts/             # импорт компаний и обновление snapshot
│  └─ requirements.txt
├─ supabase/
│  ├─ migrations/          # PostgreSQL-схема и RLS
│  └─ seed.sql
├─ data/                   # каталог источников и исследованные UZSE endpoints
├─ docs/                   # ingestion plan, discovery и конвертированные лекции
├─ Dockerfile              # production-образ backend
├─ railway.json            # деплой backend из корня
├─ vercel.json             # деплой frontend из корня
└─ package.json            # workspace-команды
```

## Быстрый запуск

### Требования

- Node.js 20+ и npm;
- Python 3.12+;
- опционально: Supabase CLI и Docker.

### 1. Установить frontend-зависимости

Из корня репозитория:

```bash
npm install
```

### 2. Установить backend-зависимости

```bash
python -m venv .venv
```

Активация в PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Активация в macOS/Linux:

```bash
source .venv/bin/activate
```

Затем:

```bash
pip install -r backend/requirements.txt
```

### 3. Настроить окружение

Минимальная локальная конфигурация работает без API-ключей, используя публичные и fallback-источники. Для полного режима создайте `backend/.env`:

```dotenv
FINNHUB_API_KEY=your_finnhub_key
CORS_ORIGINS=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AIMLAPI_KEY=your_aimlapi_key
# AIMLAPI_MODEL=openai/gpt-5.4-nano
```

Создайте `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_WS_URL` можно не указывать, если WebSocket использует тот же host, что и `NEXT_PUBLIC_API_URL`. Секрет `SUPABASE_SERVICE_ROLE_KEY` предназначен только для backend — никогда не добавляйте его в переменные `NEXT_PUBLIC_*`.

Backend загружает `.env` через `python-dotenv`: переменные можно хранить в `backend/.env`, корневом `.env` или окружении процесса.

### 4. Запустить backend

```bash
npm run backend
```

### 5. Запустить frontend

В другом терминале:

```bash
npm run dev
```

После запуска:

- приложение: <http://localhost:3000>;
- API: <http://localhost:8000>;
- Swagger UI: <http://localhost:8000/docs>;
- ReDoc: <http://localhost:8000/redoc>;
- health check: <http://localhost:8000/health>;
- проверка Supabase: <http://localhost:8000/health/database>.

## Команды

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Запустить Next.js в development-режиме. |
| `npm run build` | Собрать production frontend. |
| `npm run lint` | Запустить ESLint для frontend. |
| `npm run backend` | Запустить FastAPI с hot reload на порту `8000`. |
| `npm --prefix frontend run start` | Запустить уже собранный Next.js frontend. |

## Переменные окружения

| Переменная | Где | Обязательность | Назначение |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Frontend | Рекомендуется | Базовый URL REST API. Локальный fallback — `http://localhost:8000`; в production без значения запросы идут на текущий origin. |
| `NEXT_PUBLIC_WS_URL` | Frontend | Нет | Отдельный WebSocket origin. Если отсутствует, вычисляется из API URL. |
| `NEXT_PUBLIC_SITE_URL` | Frontend | Рекомендуется | Канонический адрес сайта для sitemap, Open Graph и JSON-LD. |
| `FINNHUB_API_KEY` | Backend | Нет | Котировки, профиль, метрики, earnings и новости глобальных компаний. |
| `CORS_ORIGINS` | Backend | Для production | Разделённый запятыми список разрешённых frontend origins. |
| `SUPABASE_URL` | Backend | Для БД | URL проекта Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Для БД | Серверный ключ Data API; запрещено передавать на клиент. |
| `AIMLAPI_KEY` | Backend | Для AI-чата | Серверный ключ AIMLAPI; не передавайте на клиент и не используйте префикс `NEXT_PUBLIC_`. |
| `AIMLAPI_MODEL` | Backend | Нет | Модель AIMLAPI для AI-чата. По умолчанию `openai/gpt-5.4-nano`. |
| `PORT` | Backend | На хостинге | Порт Uvicorn; Docker по умолчанию использует `8000`. |

## API

Все endpoints доступны в интерактивном виде через `/docs`. Основные группы:

### Состояние и метаданные

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/health` | Состояние backend и время ответа. |
| `GET` | `/health/database` | Проверка конфигурации и доступности Supabase Data API. |
| `GET` | `/homepage` | Текст и метаданные landing/главной страницы. |
| `GET` | `/sources` | Активные источники, покрытие, режим обновления и статус. |
| `GET` | `/sources/catalog` | Полный каталог активных, резервных и лицензируемых провайдеров. |

### Рынок и компании

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/dashboard-data` | Агрегат для главной: индексы, market table, акции, новости, источники, FX и macro. |
| `GET` | `/stocks` | Список поддерживаемых акций. |
| `GET` | `/stock/{ticker}` | Полная нормализованная карточка инструмента. |
| `GET` | `/quote/{ticker}` | Цена, open/high/low, previous close и источник. |
| `GET` | `/fundamentals/{ticker}` | Профиль и фундаментальные показатели. |
| `GET` | `/earnings/{ticker}` | История результатов компании. |
| `GET` | `/market` | Индексы, криптовалюты и сырьевые активы. |
| `GET` | `/dashboard/market-table` | Нормализованные строки рыночной таблицы со sparkline и branding. |
| `GET` | `/fx/rates` | Курсы USD, EUR и RUB к UZS от CBU с fallback. |
| `GET` | `/news` | Новости компаний; Finnhub или демонстрационный fallback. |
| `GET` | `/macro/summary` | Макроэкономические показатели и метаданные источников. |

### Аналитика и официальная статистика

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/analytics/macro` | Ключевая ставка, валютные курсы, инфляция и рост ВВП с датами источников. |
| `GET` | `/analytics/statistics/cpi_monthly` | Официальный месячный CPI из SIAT, включая метаданные и дату обновления. |
| `GET` | `/analytics/statistics/gdp_annual` | Официальный годовой ВВП в текущих ценах из SIAT. |
| `GET` | `/analytics/ratios/{ticker}` | Коэффициенты, рассчитанные только из доступных строк отчётности. |
| `GET` | `/analytics/technical/{ticker}` | Технические индикаторы из наблюдаемой истории цен. |
| `GET` | `/analytics/ohlcv/{ticker}` | Дневные OHLCV-свечи, агрегированные из сделок UZSE. |

### UZSE и StockScope

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/api/uzse/companies` | Нормализованные названия компаний UZSE. |
| `GET` | `/api/uzse/indices` | Снимки индексов UZSE. |
| `GET` | `/api/uzse/quotes` | Снимки котировок UZSE. |
| `GET` | `/api/uzse/index-history/{name}` | История выбранного индекса. |
| `GET` | `/api/uzse/listings` | Листинг ценных бумаг. |
| `GET` | `/api/uzse/trades` | Результаты торгов. |
| `GET` | `/api/stockscope/listings` | Каталог листингов из локального StockScope snapshot. |
| `GET` | `/api/stockscope/listings/{ticker}/details` | Детальные данные конкретного эмитента. |
| `GET` | `/api/stockscope/details` | Пакет детальных данных по эмитентам. |
| `GET` | `/api/stockscope/coverage` | Статистика покрытия каталога, отчётов и дивидендов. |
| `GET` | `/api/stockscope/screener` | Серверный поиск, фильтрация, сортировка и пагинация скринера. |

Основные query-параметры скринера: `q`, `min_roe`, `min_roa`, `max_pe`, `max_pb`, `min_reports`, `sort_by`, `sort_dir`, `limit`, `offset`.

### Live quotes

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `GET` | `/quotes/live?symbols=AAPL,SBER,IMOEX` | Одноразовый снимок котировок с валютой и статусом источника. |
| `WS` | `/ws/quotes?symbols=AAPL,SBER&interval=15` | Периодический поток нормализованных котировок. |

### Пользовательские и образовательные функции

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| `POST` | `/newsletter` | Валидировать email; возвращает `501`, пока постоянное хранилище не подключено. |
| `POST` | `/chat` | Получить образовательный генеративный ответ AIMLAPI на основе доступного evidence pack. |
| `GET` | `/academy` | Получить список учебных материалов. |

### Статусы источников

- `live` — доступен best-effort live-провайдер;
- `delayed` — публичный или официальный снимок с задержкой;
- `stale` — данные доступны, но считаются устаревшими;
- `fallback` — используется резервный источник или демонстрационный набор;
- `needs_license` — интеграция подготовлена, но нужен коммерческий контракт;
- `offline` — данные сейчас недоступны.

## Источники данных

| Источник | Покрытие | Роль в MVP |
| --- | --- | --- |
| StockScope | Компании Узбекистана | Каталог эмитентов, скринер, финансовые показатели, документы и дивиденды из snapshot. |
| UZSE | Узбекистан | Листинги, котировки, индексы, история и результаты торгов через публичные endpoints. |
| CBU Uzbekistan | Узбекистан | Официальные курсы USD, EUR и RUB. |
| Finnhub | Глобальный рынок | Котировки, профиль, метрики, earnings и новости при наличии ключа. |
| Yahoo Finance / `yfinance` | Глобальный рынок | Акции, индексы, crypto, золото и нефть; best-effort fallback. |
| MOEX ISS | Россия | Снимки инструментов Московской биржи через официальный ISS API. |
| Bloomberg / LSEG | Enterprise | Метаданные и stubs для будущих лицензируемых real-time feeds. |

Подробный инвентарь находится в `data/data_source_catalog.json`, исследованные UZSE endpoints — в `data/uzse_endpoints.json`, план ingestion — в `docs/data-ingestion-plan.md`.

## Supabase

Миграция создаёт:

- справочник источников и компаний;
- котировки и финансовые периоды;
- дивиденды и документы компаний;
- рыночные новости и связи новостей с эмитентами;
- макропоказатели и IPO-события;
- профили, портфели, позиции и watchlist;
- журнал ingestion-запусков;
- индексы, триггеры `updated_at` и Row Level Security.

Публичные рыночные таблицы доступны только на чтение. Профили, портфели, позиции и watchlist ограничены `auth.uid()`.

Применение локальных миграций через Supabase CLI:

```bash
supabase start
supabase db reset
```

Импорт/обновление каталога компаний:

```bash
python backend/scripts/import_companies_to_supabase.py
```

Обновление локального StockScope snapshot:

```bash
python backend/scripts/refresh_stockscope_snapshot.py
```

## Проверка перед коммитом

```bash
npm run lint
npm run build
```

Для backend после запуска проверьте:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/health/database
curl "http://localhost:8000/api/stockscope/screener?limit=5"
```

## Деплой

### Frontend на Vercel

Можно развернуть проект из корня с включённым `vercel.json` или указать `frontend` как Root Directory.

Из корня:

```text
Install command: npm install
Build command: npm run build
Output directory: frontend/.next
```

Если Root Directory равен `frontend`:

```text
Install command: npm install
Build command: npm run build
Output directory: .next
```

В Vercel задайте `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` и при необходимости `NEXT_PUBLIC_WS_URL`.

### Backend на Railway

Есть два поддерживаемых варианта:

1. Деплой из корня через корневой `railway.json` и `Dockerfile`.
2. Деплой с Root Directory `backend` через `backend/railway.json` или `backend/Procfile`.

Команда запуска:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

После деплоя:

1. добавьте Railway URL в Vercel как `NEXT_PUBLIC_API_URL`;
2. при необходимости укажите WebSocket URL в `NEXT_PUBLIC_WS_URL`;
3. добавьте production-домен frontend в `CORS_ORIGINS` backend;
4. задайте `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AIMLAPI_KEY` и опциональные `FINNHUB_API_KEY`/`AIMLAPI_MODEL`;
5. проверьте `/health`, `/health/database` и `/docs`.

### Docker

Корневой Dockerfile собирает только backend:

```bash
docker build -t einvest-backend .
docker run --rm -p 8000:8000 --env-file backend/.env einvest-backend
```

## Лицензия и данные

Отдельный файл лицензии в репозитории пока отсутствует. Перед публичным распространением кода или коммерческим использованием необходимо определить лицензию проекта и отдельно проверить условия использования каждого внешнего поставщика данных.
