# Einvestuz MVP

MVP investment analytics platform for Uzbekistan users. It does not accept deposits and does not execute real trades.

## Structure

- `frontend` - Next.js 15, Tailwind CSS, app pages from the PRD.
- `backend` - FastAPI API with Finnhub-backed market data where available, CBU Uzbekistan FX, macro placeholders, fallback news, portfolio, chat, and academy endpoints.

## Run

```bash
npm install
npm run dev
```

Backend:

```bash
pip install -r backend/requirements.txt
npm run backend
```

Frontend: http://localhost:3000
Backend docs: http://localhost:8000/docs

Optional backend environment variables:

```bash
FINNHUB_API_KEY=your_finnhub_key_here
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain
```

The backend loads `.env` via `python-dotenv`, so local variables can live in `backend/.env`, the repository root `.env`, or the shell environment used to start Uvicorn.

## Deploy

### Frontend: Vercel

Deploy from the repository root with the included `vercel.json`, or set the Vercel project root to `frontend`. The root config builds the workspace frontend and points Vercel at `frontend/.next`.

Set this environment variable in Vercel:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-backend-url
NEXT_PUBLIC_WS_URL=wss://your-railway-backend-url
```

`NEXT_PUBLIC_WS_URL` is optional when the WebSocket endpoint uses the same host as `NEXT_PUBLIC_API_URL`; set it explicitly when REST and WebSocket traffic use different hosts.

Build settings when using the repository root:

```bash
Install command: npm install
Build command: npm run build
Output: frontend/.next
```

Build settings when using `frontend` as the Vercel root:

```bash
Install command: npm install
Build command: npm run build
Output: .next
```

### Backend: Railway

Backend production target is Railway. Do not use Vercel as the long-term backend host; the existing Vercel backend deployment is only a temporary fallback until the Railway project is linked and deployed.

Deploy the `backend` directory as the Railway service root. Railway can use `backend/railway.json` or `backend/Procfile`.

Start command:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

After backend deployment, copy the public Railway URL into Vercel as `NEXT_PUBLIC_API_URL`. Add the deployed frontend origin to backend `CORS_ORIGINS`; custom production domains are not allowed automatically.

## Backend market data

Market data uses a provider architecture:

```text
provider adapters -> in-memory TTL cache -> FastAPI REST/WebSocket -> Next.js dashboard

## Supabase database

The production database is Supabase PostgreSQL. Schema changes live in `supabase/migrations/` and are applied with the Supabase CLI. The backend uses the HTTPS Data API so Railway does not require a direct PostgreSQL connection.

Required Railway variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (backend only; never expose it to the frontend)

`GET /health/database` verifies the production Data API connection. Public market tables have read-only RLS policies; portfolios, positions, profiles, and watchlists are restricted to `auth.uid()`.

Refresh the company catalog with:

```powershell
python backend/scripts/import_companies_to_supabase.py
```
```

Data-source inventory and ingestion notes live in:

- `data/data_source_catalog.json`
- `docs/data-ingestion-plan.md`

Active MVP providers:

- `finnhub` for quotes, profile, metrics, earnings, and company news when `FINNHUB_API_KEY` is present.
- `cbu-uz` for USD/EUR/RUB FX snapshots from the official CBU JSON archive.
- `yfinance` for US equities, indexes, crypto, gold, and oil. This is a no-key prototype source and should be treated as best-effort.
- `moex-iss` for Moscow Exchange snapshots through the official MOEX ISS HTTP API.

Enterprise providers prepared as metadata/stubs:

- `uzse-bloomberg` for UZSE through Bloomberg Data License / B-PIPE. Requires a commercial agreement.
- `bloomberg-bpipe` for global licensed real-time feeds. Requires a commercial agreement.
- `lseg` for global licensed real-time feeds. Requires a commercial agreement.

Endpoints:

- `GET /health` returns backend health status.
- `GET /homepage` returns landing-page copy and metadata.
- `GET /sources` returns provider metadata, status, coverage, update mode, notes, and URLs.
- `GET /sources/catalog` returns the active providers plus licensed/source placeholders.
- `GET /stocks` returns stock objects with `ticker`, `name`, `price`, `change`, `market_cap`, `pe`, `dividend`, `sector`, `description`, `source`, `source_status`, `as_of`.
- `GET /stock/{ticker}` returns one stock object with the same fields. US and selected MOEX tickers are supported in the MVP universe.
- `GET /quote/{ticker}` returns a richer quote snapshot with open, high, low, previous_close, and source metadata.
- `GET /fundamentals/{ticker}` returns Finnhub-backed profile and metric data with fallback metadata.
- `GET /earnings/{ticker}` returns earnings history with source metadata and fallback placeholders.
- `GET /market` returns indices, crypto, and commodities with `ticker`, `name`, `price`, `value`, `change`, `category`, `source`, `source_status`, `is_realtime`, `delay_seconds`, `as_of`.
- `GET /dashboard/market-table` returns dashboard market rows with `rank`, `branding.logo_url`, `branding.monogram`, `branding.monogram_color`, `name`, `ticker`, `price`, `change_1h`, `change_24h`, `change_7d`, `market_cap`, `volume_24h`, `circulating_supply`, `sparkline_7d`, `source`, `status`, and `as_of`.
- `GET /dashboard-data` includes `market_table` alongside `market`, `stocks`, `news`, `sources`, `fx_rates`, and `macro`.
- `GET /fx/rates` returns USD, EUR, and RUB from the CBU JSON archive with fallback data if needed.
- `GET /api/uzse/companies` returns normalized UZSE company names.
- `GET /api/uzse/indices` returns UZSE index snapshots.
- `GET /api/uzse/quotes` returns UZSE quote snapshots.
- `GET /api/uzse/index-history/{name}` returns UZSE index history.
- `GET /api/uzse/listings` returns parsed UZSE listings.
- `GET /api/uzse/trades` returns parsed UZSE trade results.
- `GET /quotes/live?symbols=AAPL,SBER,IMOEX` returns quote snapshots with source status and currency.
- `WS /ws/quotes?symbols=AAPL,SBER&interval=15` streams quote snapshots over WebSocket.
- `GET /news` returns Finnhub company news where available and falls back to demo items if needed.
- `GET /macro/summary` returns source metadata and macro placeholders for `data.egov.uz` and `stat.uz` until direct machine-readable endpoints are confirmed.
- `POST /portfolio/add` adds a virtual portfolio position.
- `POST /portfolio/remove` removes a virtual portfolio position.
- `POST /newsletter` validates and stores a newsletter email in memory.
- `POST /chat` returns an educational chat response for the MVP universe.
- `GET /academy` returns academy lessons.

Status values:

- `live` - best-effort live quote source in the MVP.
- `delayed` - official/public snapshot source, not low-latency exchange feed.
- `fallback` - backup parser/provider.
- `needs_license` - authoritative real-time provider is configured as a stub and requires a contract.
- `offline` - quote unavailable.
