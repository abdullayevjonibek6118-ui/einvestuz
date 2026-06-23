# InvestAI Uzbekistan MVP

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

Market quotes use `yfinance` first and fall back to Yahoo Finance's public chart endpoint, with the public quote endpoint as a last attempt. Results are cached in-process for 60 seconds to avoid repeated upstream calls.

- `GET /stocks` returns stock objects with `ticker`, `name`, `price`, `change`, `market_cap`, `pe`, `dividend`, `description`.
- `GET /stock/{ticker}` returns one stock object with the same fields.
- `GET /market` returns indices, crypto, and commodities with `ticker`, `name`, `price`, `value`, `change`, `category`, `source`, `as_of`.
- `GET /news` remains usable with demo/fallback news items.
