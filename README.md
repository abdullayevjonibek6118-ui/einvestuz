# Einvestuz MVP

MVP investment analytics platform for Uzbekistan users. It does not accept deposits and does not execute real trades.

## Structure

- `frontend` - Next.js 15, Tailwind CSS, app pages from the PRD.
- `backend` - FastAPI API with live no-key market data, demo/fallback news, portfolio, chat, and academy endpoints.

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

## Deploy

### Frontend: Vercel

Deploy the `frontend` directory as the Vercel project root.

Set this environment variable in Vercel:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-backend-url
```

Build settings:

```bash
Install command: npm install
Build command: npm run build
Output: .next
```

### Backend: Railway

Deploy the `backend` directory as the Railway service root. Railway can use `backend/railway.json` or `backend/Procfile`.

Start command:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

After backend deployment, copy the public Railway URL into Vercel as `NEXT_PUBLIC_API_URL`.

## Backend market data

Market data uses a provider architecture:

```text
provider adapters -> in-memory TTL cache -> FastAPI REST/WebSocket -> Next.js dashboard
```

Active MVP providers:

- `yfinance` for US equities, indexes, crypto, gold, and oil. This is a no-key prototype source and should be treated as best-effort.
- `moex-iss` for Moscow Exchange snapshots through the official MOEX ISS HTTP API.

Enterprise providers prepared as metadata/stubs:

- `uzse-bloomberg` for UZSE through Bloomberg Data License / B-PIPE. Requires a commercial agreement.
- `bloomberg-bpipe` for global licensed real-time feeds. Requires a commercial agreement.
- `lseg` for global licensed real-time feeds. Requires a commercial agreement.

Endpoints:

- `GET /sources` returns provider metadata, status, coverage, update mode, notes, and URLs.
- `GET /stocks` returns stock objects with `ticker`, `name`, `price`, `change`, `market_cap`, `pe`, `dividend`, `description`, `source`, `source_status`, `as_of`.
- `GET /stock/{ticker}` returns one stock object with the same fields. US and selected MOEX tickers are supported in the MVP universe.
- `GET /market` returns indices, crypto, and commodities with `ticker`, `name`, `price`, `value`, `change`, `category`, `source`, `source_status`, `is_realtime`, `delay_seconds`, `as_of`.
- `GET /quotes/live?symbols=AAPL,SBER,IMOEX` returns quote snapshots with source status and currency.
- `WS /ws/quotes?symbols=AAPL,SBER&interval=15` streams quote snapshots over WebSocket.
- `GET /news` remains usable with demo/fallback news items.

Status values:

- `live` - best-effort live quote source in the MVP.
- `delayed` - official/public snapshot source, not low-latency exchange feed.
- `fallback` - backup parser/provider.
- `needs_license` - authoritative real-time provider is configured as a stub and requires a contract.
- `offline` - quote unavailable.
