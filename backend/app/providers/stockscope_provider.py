from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import urljoin
from urllib.request import Request, urlopen


STOCKSCOPE_BASE_URL = "https://stockscope.uz"
STOCKSCOPE_SCREENER_PATH = "/ru/screener"

EARNINGS_LABELS = {
    "010": "Revenue",
    "020": "Cost of revenue",
    "030": "Gross profit",
    "040": "Operating expenses",
    "050": "Costs to sell",
    "060": "Administrative expenses",
    "070": "Other operating expenses",
    "080": "Expenses excluded from tax base",
    "090": "Other income",
    "100": "Operating income",
    "110": "Earnings from financial activities",
    "120": "Dividend income",
    "130": "Interest income",
    "140": "Income from long-term lease",
    "150": "FX income",
    "160": "Other financial income",
    "170": "Financial expenses",
    "180": "Interest expenses",
    "190": "Long-term lease interest expenses",
    "200": "FX loss",
    "210": "Other financial expenses",
    "220": "Income from general operations",
    "230": "Extraordinary profit/loss",
    "240": "EBT",
    "250": "Income tax",
    "260": "Other profit taxes",
    "270": "Net profit",
}

BALANCE_LABELS = {
    "130": "Long-term assets",
    "390": "Current assets",
    "400": "Total assets",
    "410": "Authorized capital",
    "450": "Retained earnings",
    "480": "Total equity",
    "490": "Long-term liabilities",
    "570": "Long-term bank loans",
    "580": "Long-term borrowings",
    "600": "Current liabilities",
    "730": "Short-term bank loans",
    "740": "Short-term borrowings",
    "750": "Current long-term debt",
    "770": "Total liabilities",
    "780": "Total liabilities and equity",
}

BANK_EARNINGS_LABELS = {
    "246": "Revenue",
    "276": "Gross profit",
    "292": "Net profit",
}

BANK_BALANCE_LABELS = {
    "208": "Total assets",
    "221": "Debt",
    "233": "Total equity",
}


@dataclass
class _CacheEntry:
    expires_at: float
    value: Any


class StockScopeProvider:
    """Reads StockScope's public Nuxt screener payload."""

    def __init__(self, base_url: str = STOCKSCOPE_BASE_URL) -> None:
        self.base_url = base_url.rstrip("/")
        self._cache: dict[str, _CacheEntry] = {}

    def get_listings(self) -> list[dict[str, Any]]:
        return self._cached("listings", 3600, self._fetch_listings)

    def get_listing_details(self, ticker: str) -> dict[str, Any]:
        normalized = str(ticker or "").strip().upper()
        if not normalized:
            return {}
        return self._cached(f"details:{normalized}", 3600, lambda: self._fetch_listing_details(normalized))

    def get_sectors(self) -> dict[str, str]:
        return self._cached("sectors", 86400, self._fetch_sectors)

    def get_web_config(self) -> dict[str, Any]:
        return self._cached("web_config", 86400, self._fetch_web_config)

    def _cached(self, key: str, ttl_seconds: int, loader: Any) -> Any:
        now = time.time()
        cached = self._cache.get(key)
        if cached and cached.expires_at > now:
            return cached.value
        try:
            value = loader()
        except Exception:
            if cached:
                return cached.value
            return {} if key in {"sectors", "web_config"} else []
        self._cache[key] = _CacheEntry(now + ttl_seconds, value)
        return value

    def _fetch_listings(self) -> list[dict[str, Any]]:
        html = self._request_text(STOCKSCOPE_SCREENER_PATH)
        payload = self._extract_nuxt_payload(html)
        if not payload:
            return []
        data_index = payload[1]["data"]
        listings_index = payload[data_index]["listings"]
        listings = self._resolve_payload_index(payload, listings_index)
        if not isinstance(listings, list):
            return []
        sectors = self.get_sectors()
        normalized: list[dict[str, Any]] = []
        for item in listings:
            if not isinstance(item, dict):
                continue
            ticker = str(item.get("ticker") or "").strip().upper()
            if ticker:
                item["ticker"] = ticker
                item["sector"] = sectors.get(ticker, "")
                normalized.append(item)
        return normalized

    def _fetch_listing_details(self, ticker: str) -> dict[str, Any]:
        html = self._request_text(f"/ru/listings/{ticker}/general")
        payload = self._extract_nuxt_payload(html)
        if not payload:
            return {}

        root = self._resolve_payload_index(payload, 1)
        data = root.get("data") if isinstance(root, dict) else None
        if not isinstance(data, dict):
            return {}

        listings = data.get("listings") if isinstance(data.get("listings"), list) else []
        listing = next((item for item in listings if str(item.get("ticker") or "").upper() == ticker), {})
        detail = next((value for key, value in data.items() if key != "listings" and isinstance(value, dict)), {})
        price_history = detail.get("pricehistory_raw") if isinstance(detail, dict) else {}
        fundamentals = detail.get("fundamentals") if isinstance(detail, dict) else []
        dividend_facts = detail.get("dividendFacts") if isinstance(detail, dict) else []

        if not isinstance(price_history, dict):
            price_history = {}
        if not isinstance(fundamentals, list):
            fundamentals = []
        if not isinstance(dividend_facts, list):
            dividend_facts = []

        company_type = str((fundamentals[0] if fundamentals else {}).get("companyType") or "jsc")
        reports = self._normalize_reports(fundamentals)
        earnings_table = self._financial_table(fundamentals, "earnings", company_type)
        balance_table = self._financial_table(fundamentals, "balancesheet", company_type)
        indicators = self._performance_indicators(fundamentals, company_type)
        trading_stats = self._trading_stats(price_history)
        price_points = self._price_points(price_history)
        dividends = self._normalize_dividends(dividend_facts)
        charts = self._charts(fundamentals, price_history, indicators, trading_stats, company_type)

        return {
            "ticker": ticker,
            "listing": listing,
            "source": "stockscope.uz",
            "source_url": f"{self.base_url}/ru/listings/{ticker}/general",
            "company_type": company_type,
            "price_history": {
                "points": price_points,
                "raw": price_history,
                "last_update_at": self._timestamp_to_iso(price_history.get("lastUpdateAt") or price_history.get("lastUpateAt")),
            },
            "fundamentals": {
                "reports": reports,
                "earnings": earnings_table,
                "balance_sheet": balance_table,
                "raw": fundamentals,
            },
            "indicators": indicators,
            "trading_stats": trading_stats,
            "reports": reports,
            "dividends": dividends,
            "charts": charts,
        }

    def _extract_nuxt_payload(self, html: str) -> list[Any]:
        match = re.search(r'<script type="application/json" id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
        if not match:
            return []
        return json.loads(match.group(1))

    def _normalize_reports(self, fundamentals: list[dict[str, Any]]) -> list[dict[str, Any]]:
        reports = []
        for item in fundamentals:
            if not isinstance(item, dict):
                continue
            reports.append(
                {
                    "id": item.get("id") or item.get("docId") or item.get("period"),
                    "period": item.get("period"),
                    "type": item.get("type"),
                    "company_type": item.get("companyType"),
                    "company_id": item.get("companyId"),
                    "company_name": item.get("companyName"),
                    "date": self._timestamp_to_iso(item.get("date")),
                    "url": item.get("url"),
                }
            )
        return sorted(reports, key=lambda row: str(row.get("date") or ""), reverse=True)

    def _financial_table(self, fundamentals: list[dict[str, Any]], section: str, company_type: str) -> dict[str, Any]:
        rows = []
        labels = self._labels_for(section, company_type)
        periods = [
            {
                "period": item.get("period"),
                "type": item.get("type"),
                "date": self._timestamp_to_iso(item.get("date")),
            }
            for item in fundamentals
            if isinstance(item, dict)
        ]
        keys = sorted(
            {
                str(key)
                for item in fundamentals
                if isinstance(item, dict) and isinstance(item.get(section), dict)
                for key in item[section].keys()
            }
        )
        for key in keys:
            values = []
            for item in fundamentals:
                if not isinstance(item, dict):
                    continue
                values.append(
                    {
                        "period": item.get("period"),
                        "date": self._timestamp_to_iso(item.get("date")),
                        "value": self._number((item.get(section) or {}).get(key)),
                    }
                )
            rows.append({"id": key, "label": labels.get(key, key), "values": values})
        return {"periods": periods, "rows": rows}

    def _performance_indicators(self, fundamentals: list[dict[str, Any]], company_type: str) -> list[dict[str, Any]]:
        indicators = []
        for item in fundamentals:
            if not isinstance(item, dict):
                continue
            earnings = item.get("earnings") if isinstance(item.get("earnings"), dict) else {}
            balance = item.get("balancesheet") if isinstance(item.get("balancesheet"), dict) else {}
            if company_type == "bank":
                net_profit = self._number(earnings.get("292"))
                revenue = self._number(earnings.get("246"))
                gross_profit = self._number(earnings.get("276"))
                assets = self._number(balance.get("208"))
                equity = self._number(balance.get("233"))
                debt = self._number(balance.get("221"))
                payload = {
                    "ROA": self._ratio(net_profit, assets, 100),
                    "ROE": self._ratio(net_profit, equity, 100),
                    "DebtToEquity": self._ratio(debt, equity),
                    "GrossProfitMargin": self._ratio(gross_profit, revenue, 100),
                    "NetProfitMargin": self._ratio(net_profit, revenue, 100),
                    "Earnings": net_profit,
                    "Revenue": revenue,
                    "Assets": assets,
                    "Equity": equity,
                    "Debt": debt,
                }
            else:
                net_profit = self._number(earnings.get("270"))
                revenue = self._number(earnings.get("010"))
                gross_profit = self._number(earnings.get("030"))
                operating_income = self._number(earnings.get("100"))
                assets = self._number(balance.get("400"))
                equity = self._number(balance.get("480"))
                liabilities = self._number(balance.get("770"))
                current_assets = self._number(balance.get("390"))
                current_liabilities = self._number(balance.get("600"))
                interest_debt = sum(
                    self._number(balance.get(key)) or 0
                    for key in ["570", "580", "730", "740", "750"]
                )
                payload = {
                    "ROA": self._ratio(net_profit, assets, 100),
                    "ROE": self._ratio(net_profit, equity, 100),
                    "DebtToEquity": self._ratio(liabilities, equity),
                    "DebtToEbit": self._ratio(interest_debt, operating_income),
                    "CurrentRatio": self._ratio(current_assets, current_liabilities),
                    "WorkingCapital": (current_assets or 0) - (current_liabilities or 0),
                    "GrossProfitMargin": self._ratio(gross_profit, revenue, 100),
                    "NetProfitMargin": self._ratio(net_profit, revenue, 100),
                    "Earnings": net_profit,
                    "Revenue": revenue,
                    "Assets": assets,
                    "Equity": equity,
                    "Debt": liabilities,
                }
            indicators.append(
                {
                    "period": item.get("period"),
                    "type": item.get("type"),
                    "date": self._timestamp_to_iso(item.get("date")),
                    "values": payload,
                }
            )
        return sorted(indicators, key=lambda row: str(row.get("date") or ""), reverse=True)

    def _trading_stats(self, price_history: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
        prices = price_history.get("history") if isinstance(price_history.get("history"), dict) else {}
        volume_uzs = price_history.get("historicVolumeUZS") if isinstance(price_history.get("historicVolumeUZS"), dict) else {}
        volume_pcs = price_history.get("historicVolumePcs") if isinstance(price_history.get("historicVolumePcs"), dict) else {}
        daily = [
            {
                "date": date,
                "price": self._number(price),
                "volume_uzs": self._number(volume_uzs.get(date)),
                "volume_pcs": self._number(volume_pcs.get(date)),
            }
            for date, price in prices.items()
        ]
        daily = sorted(daily, key=lambda row: row["date"], reverse=True)
        return {
            "daily": daily,
            "monthly": self._aggregate_trading(daily, 7),
            "yearly": self._aggregate_trading(daily, 4),
        }

    def _price_points(self, price_history: dict[str, Any]) -> list[dict[str, Any]]:
        prices = price_history.get("history") if isinstance(price_history.get("history"), dict) else {}
        return sorted(
            [{"date": date, "value": self._number(value)} for date, value in prices.items()],
            key=lambda row: row["date"],
        )

    def _normalize_dividends(self, dividend_facts: list[dict[str, Any]]) -> list[dict[str, Any]]:
        dividends = []
        for item in dividend_facts:
            if not isinstance(item, dict):
                continue
            dividends.append(
                {
                    "id": item.get("id"),
                    "company_id": item.get("companyId"),
                    "company_name": item.get("companyName"),
                    "approved_date": self._timestamp_to_iso(item.get("approvedDate")),
                    "published_date": self._timestamp_to_iso(item.get("pubDate")),
                    "scraped_at": self._timestamp_to_iso(item.get("scrapedAt")),
                    "common_dividend": self._number(item.get("commonDividend")),
                    "preferred_dividend": self._number(item.get("preferredDividend")),
                    "common_yield": self._number(item.get("commonYield")),
                    "preferred_yield": self._number(item.get("preferredYiedl")),
                    "raw": item,
                }
            )
        return sorted(dividends, key=lambda row: str(row.get("published_date") or ""), reverse=True)

    def _charts(
        self,
        fundamentals: list[dict[str, Any]],
        price_history: dict[str, Any],
        indicators: list[dict[str, Any]],
        trading_stats: dict[str, list[dict[str, Any]]],
        company_type: str,
    ) -> dict[str, Any]:
        annual = sorted(
            [item for item in fundamentals if isinstance(item, dict) and item.get("type") == "annual"],
            key=lambda item: str(item.get("period") or ""),
        )[-6:]
        labels = [str(item.get("period") or "") for item in annual]
        earnings_key = "292" if company_type == "bank" else "270"
        revenue_key = "246" if company_type == "bank" else "010"
        equity_key = "233" if company_type == "bank" else "480"
        debt_key = "221" if company_type == "bank" else "770"
        return {
            "price": {
                "title": "Price history",
                "series": [{"name": "Price", "data": [[point["date"], point["value"]] for point in self._price_points(price_history)]}],
            },
            "earnings": {
                "title": "Revenue and net profit",
                "categories": labels,
                "series": [
                    {"name": "Revenue", "data": [self._number((item.get("earnings") or {}).get(revenue_key)) for item in annual]},
                    {"name": "Net profit", "data": [self._number((item.get("earnings") or {}).get(earnings_key)) for item in annual]},
                ],
            },
            "balance": {
                "title": "Equity and debt",
                "categories": labels,
                "series": [
                    {"name": "Equity", "data": [self._number((item.get("balancesheet") or {}).get(equity_key)) for item in annual]},
                    {"name": "Debt", "data": [self._number((item.get("balancesheet") or {}).get(debt_key)) for item in annual]},
                ],
            },
            "indicators": {
                "title": "ROE / ROA / margins",
                "categories": [str(item.get("period") or "") for item in indicators if item.get("type") == "annual"][:6],
                "series": [
                    {"name": key, "data": [((item.get("values") or {}).get(key) or 0) for item in indicators if item.get("type") == "annual"][:6]}
                    for key in ["ROE", "ROA", "GrossProfitMargin", "NetProfitMargin"]
                ],
            },
            "trading_volume": {
                "title": "Trading volume",
                "series": [
                    {"name": "Volume UZS monthly", "data": [[item["date"], item["volume_uzs"]] for item in trading_stats.get("monthly", [])]},
                    {"name": "Volume Pcs monthly", "data": [[item["date"], item["volume_pcs"]] for item in trading_stats.get("monthly", [])]},
                ],
            },
        }

    def _labels_for(self, section: str, company_type: str) -> dict[str, str]:
        if section == "earnings":
            return BANK_EARNINGS_LABELS if company_type == "bank" else EARNINGS_LABELS
        return BANK_BALANCE_LABELS if company_type == "bank" else BALANCE_LABELS

    def _aggregate_trading(self, rows: list[dict[str, Any]], key_length: int) -> list[dict[str, Any]]:
        grouped: dict[str, dict[str, Any]] = {}
        for row in sorted(rows, key=lambda item: item["date"]):
            key = row["date"][:key_length]
            bucket = grouped.setdefault(key, {"date": key, "price": 0, "volume_uzs": 0, "volume_pcs": 0})
            bucket["price"] = row.get("price") or bucket["price"]
            bucket["volume_uzs"] += row.get("volume_uzs") or 0
            bucket["volume_pcs"] += row.get("volume_pcs") or 0
        return sorted(grouped.values(), key=lambda row: row["date"], reverse=True)

    def _timestamp_to_iso(self, value: Any) -> str | None:
        if isinstance(value, dict) and isinstance(value.get("seconds"), (int, float)):
            return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(value["seconds"]))
        return None

    def _number(self, value: Any) -> float | None:
        if isinstance(value, bool):
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            try:
                return float(value.replace(" ", "").replace(",", "."))
            except ValueError:
                return None
        return None

    def _ratio(self, numerator: float | None, denominator: float | None, multiplier: float = 1.0) -> float | None:
        if numerator is None or denominator in (None, 0):
            return None
        return round((numerator / denominator) * multiplier, 4)

    def _fetch_sectors(self) -> dict[str, str]:
        html = self._request_text(STOCKSCOPE_SCREENER_PATH)
        scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html)
        links = re.findall(r'<link[^>]+href=["\']([^"\']+)["\']', html)
        for src in [*scripts, *links]:
            if "screener." not in src or not src.endswith(".js"):
                continue
            bundle = self._request_text(src)
            match = re.search(r"const ue=(\[.*?\]),me=\{sectors:ue\}", bundle, re.S)
            if not match:
                continue
            jsonish = re.sub(r"([{,])([a-zA-Z_][a-zA-Z0-9_]*):", r'\1"\2":', match.group(1))
            rows = json.loads(jsonish)
            return {
                str(row.get("ticker") or "").strip().upper(): str(row.get("sector") or "").strip()
                for row in rows
                if row.get("ticker")
            }
        return {}

    def _fetch_web_config(self) -> dict[str, Any]:
        html = self._request_text(STOCKSCOPE_SCREENER_PATH)
        match = re.search(r"vuefire:\{config:(\{.*?\}),appCheck:", html, re.S)
        if not match:
            return {}
        jsonish = re.sub(r"([{,])([a-zA-Z_][a-zA-Z0-9_]*):", r'\1"\2":', match.group(1))
        return json.loads(jsonish)

    def _resolve_payload_index(self, payload: list[Any], index: int, stack: set[int] | None = None) -> Any:
        if not isinstance(index, int) or index < 0 or index >= len(payload):
            return index
        value = payload[index]
        if not isinstance(value, (dict, list)):
            return value
        stack = stack or set()
        if index in stack:
            return None
        return self._resolve_payload_value(payload, value, stack | {index})

    def _resolve_payload_value(self, payload: list[Any], value: Any, stack: set[int]) -> Any:
        if isinstance(value, int):
            return self._resolve_payload_index(payload, value, stack)
        if isinstance(value, list):
            if len(value) == 2 and value[0] in {"Reactive", "ShallowReactive", "Ref", "EmptyShallowRef", "EmptyRef"}:
                return self._resolve_payload_index(payload, value[1], stack)
            if len(value) == 2 and value[0] == "FirebaseTimestamp":
                timestamp = self._resolve_payload_value(payload, value[1], stack)
                return timestamp if isinstance(timestamp, dict) else None
            if len(value) == 1 and value[0] == "Set":
                return []
            return [self._resolve_payload_value(payload, item, stack) for item in value]
        if isinstance(value, dict):
            return {key: self._resolve_payload_value(payload, item, stack) for key, item in value.items()}
        return value

    def _request_text(self, path_or_url: str) -> str:
        url = path_or_url if path_or_url.startswith("http") else urljoin(self.base_url, path_or_url)
        request = Request(
            url,
            headers={
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 (compatible; EinvestuzBot/0.1; +https://einvestuz.com)",
            },
        )
        with urlopen(request, timeout=30) as response:
            return response.read().decode("utf-8", "replace")
