from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.database import supabase  # noqa: E402


def main() -> None:
    snapshot_path = ROOT / "app" / "data" / "stockscope_screener.json"
    payload = json.loads(snapshot_path.read_text(encoding="utf-8"))
    items = payload.get("items", payload) if isinstance(payload, dict) else payload
    rows = []
    for item in items:
        ticker = str(item.get("ticker") or "").strip().upper()
        if not ticker:
            continue
        rows.append(
            {
                "ticker": ticker,
                "name": item.get("name") or ticker,
                "isin": item.get("isin"),
                "market": "uzbekistan",
                "exchange": "UZSE",
                "currency": "UZS",
                "openinfo_id": item.get("openinfo_id"),
                "source_id": "stockscope",
                "metadata": {
                    "current_price": item.get("current_price"),
                    "market_cap": item.get("market_cap"),
                    "reports_count": item.get("reports_count", 0),
                    "indicators_count": item.get("indicators_count", 0),
                    "dividends_count": item.get("dividends_count", 0),
                    "latest_period": item.get("latest_period"),
                    "roe": item.get("roe"),
                    "roa": item.get("roa"),
                    "pe": item.get("pe"),
                    "pb": item.get("pb"),
                    "dividend_yield": item.get("dividend_yield"),
                },
            }
        )
    for offset in range(0, len(rows), 100):
        supabase.upsert("companies", rows[offset : offset + 100], on_conflict="ticker")
    print(f"Imported {len(rows)} companies into Supabase")


if __name__ == "__main__":
    main()
