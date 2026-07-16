from __future__ import annotations

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urljoin
from urllib.request import Request, urlopen


STOCKSCOPE_BASE_URL = "https://stockscope.uz"
STOCKSCOPE_SCREENER_PATH = "/ru/screener"
STOCKSCOPE_SNAPSHOT_PATH = Path(__file__).resolve().parents[1] / "data" / "stockscope_screener.json"

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

    def get_listing_details_batch(
        self,
        tickers: list[str] | None = None,
        *,
        offset: int = 0,
        limit: int = 25,
        max_workers: int = 4,
        include_raw: bool = False,
    ) -> dict[str, Any]:
        catalog = self.get_listings()
        catalog_tickers = [str(item.get("ticker") or "").upper() for item in catalog if item.get("ticker")]
        requested = [str(ticker or "").strip().upper() for ticker in (tickers or catalog_tickers)]
        requested = [ticker for ticker in requested if ticker]
        selected = requested[max(offset, 0) : max(offset, 0) + max(1, limit)]
        details: list[dict[str, Any]] = []

        with ThreadPoolExecutor(max_workers=max(1, min(max_workers, 8, len(selected) or 1))) as executor:
            futures = {executor.submit(self.get_listing_details, ticker): ticker for ticker in selected}
            for future in as_completed(futures):
                ticker = futures[future]
                try:
                    detail = future.result()
                except Exception as exc:
                    details.append({"ticker": ticker, "error": str(exc), "source": "stockscope.uz"})
                    continue
                if detail:
                    details.append(self._compact_detail(detail, include_raw=include_raw))
                else:
                    details.append({"ticker": ticker, "error": "not_found", "source": "stockscope.uz"})

        details_by_order = {str(item.get("ticker") or ""): item for item in details}
        ordered = [details_by_order.get(ticker, {"ticker": ticker, "error": "not_found", "source": "stockscope.uz"}) for ticker in selected]
        return {
            "total": len(requested),
            "offset": max(offset, 0),
            "limit": max(1, limit),
            "count": len(ordered),
            "has_more": max(offset, 0) + max(1, limit) < len(requested),
            "tickers": selected,
            "items": ordered,
        }

    def get_listing_details_coverage(self) -> dict[str, Any]:
        return self._cached("details_coverage", 3600, self._load_coverage_snapshot)

    def screen_listings(
        self,
        *,
        q: str | None = None,
        offset: int = 0,
        limit: int = 50,
        min_roe: float | None = None,
        min_roa: float | None = None,
        listing_category: str | None = None,
        sector: str | None = None,
        min_market_cap: float | None = None,
        max_market_cap: float | None = None,
        min_dividend_yield: float | None = None,
        min_volume: float | None = None,
        min_change_1d: float | None = None,
        min_change_7d: float | None = None,
        min_change_30d: float | None = None,
        fresh_reports: bool | None = None,
        max_pe: float | None = None,
        max_pb: float | None = None,
        min_reports: int | None = None,
        min_indicators: int | None = None,
        sort_by: str = "reports_count",
        sort_dir: str = "desc",
    ) -> dict[str, Any]:
        coverage = self.get_listing_details_coverage()
        rows = list(coverage.get("items") if isinstance(coverage, dict) else [])
        needle = str(q or "").strip().lower()

        if needle:
            rows = [
                row
                for row in rows
                if needle in str(row.get("ticker") or "").lower()
                or needle in str(row.get("name") or "").lower()
                or needle in str(row.get("isin") or "").lower()
            ]
        ratio_fields = {"roe", "roa", "pe", "pb", "dividend_yield"}
        needs_ratio_filtering = any(value is not None for value in [min_roe, min_roa, min_dividend_yield, max_pe, max_pb])
        if needs_ratio_filtering or sort_by in ratio_fields:
            rows = self._enrich_screener_rows_with_calculated_multiples(rows)
        rows = [row for row in rows if self._passes_min(row.get("roe"), min_roe)]
        rows = [row for row in rows if self._passes_min(row.get("roa"), min_roa)]
        rows = [row for row in rows if self._passes_equal_text(row.get("listing_category") or row.get("listingCategory"), listing_category)]
        rows = [row for row in rows if self._passes_equal_text(row.get("sector"), sector)]
        rows = [row for row in rows if self._passes_min(row.get("market_cap"), min_market_cap)]
        rows = [row for row in rows if self._passes_max(row.get("market_cap"), max_market_cap)]
        rows = [row for row in rows if self._passes_min(row.get("dividend_yield"), min_dividend_yield)]
        rows = [
            row
            for row in rows
            if self._passes_min(row.get("volume_30d") or row.get("volume_7d") or row.get("volume_1d"), min_volume)
        ]
        rows = [row for row in rows if self._passes_min(row.get("change_1d"), min_change_1d)]
        rows = [row for row in rows if self._passes_min(row.get("change_7d"), min_change_7d)]
        rows = [row for row in rows if self._passes_min(row.get("change_30d"), min_change_30d)]
        if fresh_reports is not None:
            rows = [row for row in rows if self._passes_fresh_report(row, fresh_reports)]
        rows = [row for row in rows if self._passes_max(row.get("pe"), max_pe)]
        rows = [row for row in rows if self._passes_max(row.get("pb"), max_pb)]
        rows = [row for row in rows if self._passes_min(row.get("reports_count"), min_reports)]
        rows = [row for row in rows if self._passes_min(row.get("indicators_count"), min_indicators)]

        allowed_sort_keys = {
            "ticker",
            "name",
            "reports_count",
            "indicators_count",
            "dividends_count",
            "price_points_count",
            "volume_1d",
            "volume_7d",
            "volume_30d",
            "change_1d",
            "change_7d",
            "change_30d",
            "roe",
            "roa",
            "pe",
            "pb",
            "market_cap",
            "dividend_yield",
            "latest_period",
        }
        sort_key = sort_by if sort_by in allowed_sort_keys else "reports_count"
        reverse = str(sort_dir).lower() != "asc"
        populated = [row for row in rows if row.get(sort_key) is not None]
        missing = [row for row in rows if row.get(sort_key) is None]
        populated = sorted(populated, key=lambda row: self._sort_value(row.get(sort_key)), reverse=reverse)
        rows = populated + missing

        start = max(offset, 0)
        page_size = max(1, min(limit, 200))
        selected = rows[start : start + page_size]
        selected = self._enrich_screener_rows_with_calculated_multiples(selected)
        return {
            "total": len(rows),
            "offset": start,
            "limit": page_size,
            "count": len(selected),
            "has_more": start + page_size < len(rows),
            "sort_by": sort_key,
            "sort_dir": "desc" if reverse else "asc",
            "items": selected,
            "coverage": {
                "total": coverage.get("total") if isinstance(coverage, dict) else len(rows),
                "generated_at": coverage.get("generated_at") if isinstance(coverage, dict) else None,
                "source_name": coverage.get("source_name") if isinstance(coverage, dict) else None,
                "source_url": coverage.get("source_url") if isinstance(coverage, dict) else None,
                "with_reports": coverage.get("with_reports") if isinstance(coverage, dict) else None,
                "with_indicators": coverage.get("with_indicators") if isinstance(coverage, dict) else None,
                "with_dividends": coverage.get("with_dividends") if isinstance(coverage, dict) else None,
                "with_price_history": coverage.get("with_price_history") if isinstance(coverage, dict) else None,
            },
        }

    def _enrich_screener_rows_with_calculated_multiples(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        rows_by_ticker = {str(row.get("ticker") or "").strip().upper(): dict(row) for row in rows if row.get("ticker")}
        missing = [
            ticker
            for ticker, row in rows_by_ticker.items()
            if (row.get("reports_count") or row.get("indicators_count"))
            and any(row.get(key) is None for key in ["pe", "pb", "roe", "roa", "dividend_yield"])
        ]
        if not missing:
            return [dict(row) for row in rows]

        def load(ticker: str) -> tuple[str, dict[str, Any] | None]:
            try:
                detail = self.get_listing_details(ticker)
                listing = detail.get("listing") if isinstance(detail, dict) and isinstance(detail.get("listing"), dict) else {}
                if not isinstance(detail, dict) or not listing:
                    return ticker, None
                return ticker, self._coverage_row(ticker, listing, detail)
            except Exception:
                return ticker, None

        with ThreadPoolExecutor(max_workers=4) as executor:
            for ticker, calculated in executor.map(load, missing):
                if not calculated:
                    continue
                row = rows_by_ticker.get(ticker)
                if row is None:
                    continue
                for key in ["market_cap", "roe", "roa", "pe", "pb", "dividend_yield", "latest_period", "reports_count", "indicators_count"]:
                    if calculated.get(key) is not None:
                        row[key] = calculated[key]
        return [rows_by_ticker.get(str(row.get("ticker") or "").strip().upper(), dict(row)) for row in rows]

    def _fetch_listing_details_coverage(self) -> dict[str, Any]:
        listings = self.get_listings()
        generated_at = self._now_iso()
        catalog = {
            str(item.get("ticker") or "").upper(): item
            for item in listings
            if str(item.get("ticker") or "").strip()
        }
        rows_by_ticker: dict[str, dict[str, Any]] = {}
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {executor.submit(self.get_listing_details, ticker): ticker for ticker in catalog}
            for future in as_completed(futures):
                ticker = futures[future]
                try:
                    detail = future.result()
                except Exception:
                    detail = {}
                rows_by_ticker[ticker] = self._coverage_row(ticker, catalog[ticker], detail)
        rows = [rows_by_ticker[ticker] for ticker in catalog]
        return {
            "total": len(rows),
            "generated_at": generated_at,
            "source_name": "StockScope",
            "source_url": f"{self.base_url}{STOCKSCOPE_SCREENER_PATH}",
            "with_reports": sum(1 for row in rows if row["reports_count"] > 0),
            "with_indicators": sum(1 for row in rows if row["indicators_count"] > 0),
            "with_dividends": sum(1 for row in rows if row["dividends_count"] > 0),
            "with_price_history": sum(1 for row in rows if row["price_points_count"] > 0),
            "items": rows,
        }

    def _load_coverage_snapshot(self) -> dict[str, Any]:
        try:
            snapshot = json.loads(STOCKSCOPE_SNAPSHOT_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return self._fetch_listing_details_coverage()
        if isinstance(snapshot, dict) and isinstance(snapshot.get("items"), list):
            snapshot = dict(snapshot)
            snapshot["items"] = self._with_source_metadata(snapshot)
            return snapshot
        return self._fetch_listing_details_coverage()

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
        if not value and cached:
            return cached.value
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
        self._attach_market_multiples(indicators, listing, dividend_facts)
        trading_stats = self._trading_stats(price_history)
        price_points = self._price_points(price_history)
        dividends = self._normalize_dividends(dividend_facts)
        charts = self._charts(fundamentals, price_history, indicators, trading_stats, company_type)

        return {
            "ticker": ticker,
            "listing": listing,
            "source": "stockscope.uz",
            "source_url": f"{self.base_url}/ru/listings/{ticker}/general",
            "fetched_at": self._now_iso(),
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

    def _compact_detail(self, detail: dict[str, Any], *, include_raw: bool) -> dict[str, Any]:
        if include_raw:
            return detail
        compact = dict(detail)
        fundamentals = dict(compact.get("fundamentals") or {})
        price_history = dict(compact.get("price_history") or {})
        fundamentals.pop("raw", None)
        price_history.pop("raw", None)
        compact["fundamentals"] = fundamentals
        compact["price_history"] = price_history
        return compact

    def _coverage_row(self, ticker: str, listing: dict[str, Any], detail: dict[str, Any]) -> dict[str, Any]:
        indicators = detail.get("indicators") if isinstance(detail.get("indicators"), list) else []
        latest_indicators = (indicators[0].get("values") if indicators and isinstance(indicators[0], dict) else {}) or {}
        reports = detail.get("reports") if isinstance(detail.get("reports"), list) else []
        dividends = detail.get("dividends") if isinstance(detail.get("dividends"), list) else []
        price_points = ((detail.get("price_history") or {}).get("points") if isinstance(detail.get("price_history"), dict) else []) or []
        current_price = self._number(listing.get("currentPrice"))
        shares = self._number(listing.get("noOfShares"))
        market_cap = self._market_cap(listing)
        latest_dividend = dividends[0] if dividends and isinstance(dividends[0], dict) else {}
        common_dividend = self._number(latest_dividend.get("common_dividend"))
        earnings_uzs = self._scaled_financial_value(latest_indicators.get("Earnings"))
        equity_uzs = self._scaled_financial_value(latest_indicators.get("Equity"))
        pe = latest_indicators.get("PE")
        pb = latest_indicators.get("PB")
        dividend_yield = latest_indicators.get("DividendYield")
        return {
            "ticker": ticker,
            "name": listing.get("name") or listing.get("uzseName") or ticker,
            "isin": listing.get("isin"),
            "openinfo_id": listing.get("openinfoId"),
            "sector": listing.get("sector") or None,
            "current_price": current_price,
            "market_cap": market_cap,
            "price_points_count": len(price_points),
            "reports_count": len(reports),
            "indicators_count": len(indicators),
            "dividends_count": len(dividends),
            "latest_period": indicators[0].get("period") if indicators and isinstance(indicators[0], dict) else None,
            "roe": latest_indicators.get("ROE"),
            "roa": latest_indicators.get("ROA"),
            "pe": pe if pe is not None else self._ratio(market_cap, earnings_uzs),
            "pb": pb if pb is not None else self._ratio(market_cap, equity_uzs),
            "dividend_yield": dividend_yield if dividend_yield is not None else self._ratio(common_dividend, current_price, 100),
            "source_name": "StockScope",
            "source_url": detail.get("source_url") or self._stockscope_listing_url(ticker),
            "fetched_at": detail.get("fetched_at") or self._now_iso(),
        }

    def _with_source_metadata(self, snapshot: dict[str, Any]) -> list[dict[str, Any]]:
        generated_at = str(snapshot.get("generated_at") or "").strip() or self._snapshot_file_timestamp()
        sectors = self.get_sectors()
        rows: list[dict[str, Any]] = []
        for item in snapshot.get("items") or []:
            if not isinstance(item, dict):
                continue
            row = dict(item)
            ticker = str(row.get("ticker") or "").strip().upper()
            if ticker:
                row["ticker"] = ticker
                row["source_url"] = row.get("source_url") or self._stockscope_listing_url(ticker)
                row["sector"] = row.get("sector") or sectors.get(ticker)
            row["source_name"] = row.get("source_name") or "StockScope"
            row["fetched_at"] = row.get("fetched_at") or generated_at
            rows.append(row)
        return rows

    def _stockscope_listing_url(self, ticker: str) -> str:
        return f"{self.base_url}/ru/listings/{ticker}/general"

    def _snapshot_file_timestamp(self) -> str:
        try:
            return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(STOCKSCOPE_SNAPSHOT_PATH.stat().st_mtime))
        except OSError:
            return self._now_iso()

    def _now_iso(self) -> str:
        return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

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
        for index, item in enumerate(fundamentals):
            if not isinstance(item, dict):
                continue
            earnings = item.get("earnings") if isinstance(item.get("earnings"), dict) else {}
            balance = self._statement_with_nonzero_values(fundamentals, index, "balancesheet")
            if company_type == "bank":
                net_profit = self._first_number(earnings, ["292"])
                revenue = self._first_number(earnings, ["246"])
                gross_profit = self._first_number(earnings, ["276"])
                assets = self._first_nonzero_number(balance, ["208"])
                equity = self._first_nonzero_number(balance, ["233"])
                debt = self._first_nonzero_number(balance, ["221"])
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
                revenue = self._first_number(earnings, ["010"])
                cost_of_revenue = self._first_number(earnings, ["020"])
                gross_profit = self._first_number(earnings, ["030"])
                if gross_profit is None and revenue is not None and cost_of_revenue is not None:
                    gross_profit = revenue - cost_of_revenue
                operating_expenses = self._sum_numbers(earnings, ["040", "050", "060", "070", "080"])
                operating_income = self._first_number(earnings, ["100"])
                if operating_income is None and gross_profit is not None and operating_expenses is not None:
                    operating_income = gross_profit - operating_expenses
                ebt = self._first_number(earnings, ["240"])
                taxes = self._sum_numbers(earnings, ["250", "260"])
                net_profit = self._first_number(earnings, ["270"])
                if net_profit is None and ebt is not None and taxes is not None:
                    net_profit = ebt - taxes

                long_term_assets = self._first_nonzero_number(balance, ["130"])
                current_assets = self._first_nonzero_number(balance, ["390"])
                assets = self._first_nonzero_number(balance, ["400"])
                if assets is None:
                    assets = self._sum_known([long_term_assets, current_assets])
                long_term_liabilities = self._first_nonzero_number(balance, ["490"])
                current_liabilities = self._first_nonzero_number(balance, ["600"])
                liabilities = self._first_nonzero_number(balance, ["770"])
                if liabilities is None:
                    liabilities = self._sum_known([long_term_liabilities, current_liabilities])
                total_liabilities_and_equity = self._first_nonzero_number(balance, ["780"])
                equity = self._first_nonzero_number(balance, ["480"])
                if equity is None and total_liabilities_and_equity is not None and liabilities is not None:
                    equity = total_liabilities_and_equity - liabilities
                if equity is None and assets is not None and liabilities is not None:
                    equity = assets - liabilities
                interest_debt = self._sum_numbers(balance, ["570", "580", "730", "740", "750"])
                working_capital = current_assets - current_liabilities if current_assets is not None and current_liabilities is not None else None
                payload = {
                    "ROA": self._ratio(net_profit, assets, 100),
                    "ROE": self._ratio(net_profit, equity, 100),
                    "DebtToEquity": self._ratio(liabilities, equity),
                    "DebtToEbit": self._ratio(interest_debt, operating_income),
                    "CurrentRatio": self._ratio(current_assets, current_liabilities),
                    "WorkingCapital": working_capital,
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

    def _attach_market_multiples(
        self,
        indicators: list[dict[str, Any]],
        listing: dict[str, Any],
        dividend_facts: list[dict[str, Any]],
    ) -> None:
        market_cap = self._market_cap(listing)
        current_price = self._number(listing.get("currentPrice"))
        latest_dividend = dividend_facts[0] if dividend_facts and isinstance(dividend_facts[0], dict) else {}
        common_dividend = self._number(latest_dividend.get("commonDividend"))
        earnings_fallback = self._latest_nonzero_indicator_value(indicators, "Earnings")
        equity_fallback = self._latest_nonzero_indicator_value(indicators, "Equity")
        for row in indicators:
            values = row.get("values") if isinstance(row.get("values"), dict) else {}
            earnings = self._number(values.get("Earnings"))
            equity = self._number(values.get("Equity"))
            earnings_basis = earnings if earnings else earnings_fallback[0]
            equity_basis = equity if equity else equity_fallback[0]
            earnings_uzs = self._scaled_financial_value(earnings_basis)
            equity_uzs = self._scaled_financial_value(equity_basis)
            values["MarketCap"] = market_cap
            values["PE"] = self._ratio(market_cap, earnings_uzs)
            values["PB"] = self._ratio(market_cap, equity_uzs)
            values["DividendYield"] = self._ratio(common_dividend, current_price, 100)
            if (not earnings) and earnings_fallback[1]:
                values["PEBasisPeriod"] = earnings_fallback[1]
            if (not equity) and equity_fallback[1]:
                values["PBBasisPeriod"] = equity_fallback[1]
            row["values"] = values

    def _latest_nonzero_indicator_value(self, indicators: list[dict[str, Any]], key: str) -> tuple[float | None, str | None]:
        for row in indicators:
            if not isinstance(row, dict):
                continue
            values = row.get("values") if isinstance(row.get("values"), dict) else {}
            value = self._number(values.get(key))
            if value:
                return value, str(row.get("period") or "") or None
        return None, None

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
                    "preferred_yield": self._number(item.get("preferredYield")),
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
                    {"name": key, "data": [(item.get("values") or {}).get(key) for item in indicators if item.get("type") == "annual"][:6]}
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
            bucket = grouped.setdefault(key, {"date": key, "price": None, "volume_uzs": None, "volume_pcs": None})
            price = row.get("price")
            if price is not None:
                bucket["price"] = price
            volume_uzs = row.get("volume_uzs")
            if volume_uzs is not None:
                bucket["volume_uzs"] = (bucket["volume_uzs"] or 0) + volume_uzs
            volume_pcs = row.get("volume_pcs")
            if volume_pcs is not None:
                bucket["volume_pcs"] = (bucket["volume_pcs"] or 0) + volume_pcs
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

    def _first_number(self, source: dict[str, Any], keys: list[str]) -> float | None:
        for key in keys:
            value = self._number(source.get(key))
            if value is not None:
                return value
        return None

    def _first_nonzero_number(self, source: dict[str, Any], keys: list[str]) -> float | None:
        for key in keys:
            value = self._number(source.get(key))
            if value not in (None, 0):
                return value
        return None

    def _statement_with_nonzero_values(self, fundamentals: list[dict[str, Any]], index: int, section: str) -> dict[str, Any]:
        current_item = fundamentals[index] if 0 <= index < len(fundamentals) and isinstance(fundamentals[index], dict) else {}
        current = current_item.get(section) if isinstance(current_item.get(section), dict) else {}
        if self._has_nonzero_statement_value(current):
            return current
        for item in fundamentals[index + 1 :]:
            if not isinstance(item, dict):
                continue
            candidate = item.get(section) if isinstance(item.get(section), dict) else {}
            if self._has_nonzero_statement_value(candidate):
                return candidate
        for item in fundamentals[:index]:
            if not isinstance(item, dict):
                continue
            candidate = item.get(section) if isinstance(item.get(section), dict) else {}
            if self._has_nonzero_statement_value(candidate):
                return candidate
        return current

    def _has_nonzero_statement_value(self, source: dict[str, Any]) -> bool:
        return any((self._number(value) not in (None, 0)) for value in source.values())

    def _sum_numbers(self, source: dict[str, Any], keys: list[str]) -> float | None:
        values = [self._number(source.get(key)) for key in keys]
        known = [value for value in values if value is not None]
        if not known:
            return None
        return sum(known)

    def _sum_known(self, values: list[float | None]) -> float | None:
        known = [value for value in values if value is not None]
        if not known:
            return None
        return sum(known)

    def _market_cap(self, listing: dict[str, Any]) -> float | None:
        current_price = self._number(listing.get("currentPrice"))
        shares = self._number(listing.get("noOfShares"))
        return current_price * shares if current_price is not None and shares is not None else None

    def _ratio(self, numerator: float | None, denominator: float | None, multiplier: float = 1.0) -> float | None:
        if numerator is None or denominator in (None, 0):
            return None
        return round((numerator / denominator) * multiplier, 4)

    def _passes_min(self, value: Any, minimum: float | int | None) -> bool:
        if minimum is None:
            return True
        numeric = self._number(value)
        return numeric is not None and numeric >= minimum

    def _passes_max(self, value: Any, maximum: float | int | None) -> bool:
        if maximum is None:
            return True
        numeric = self._number(value)
        return numeric is not None and numeric <= maximum

    def _passes_equal_text(self, value: Any, expected: str | None) -> bool:
        normalized = str(expected or "").strip().lower()
        if not normalized:
            return True
        return str(value or "").strip().lower() == normalized

    def _passes_fresh_report(self, row: dict[str, Any], expected: bool) -> bool:
        explicit = row.get("has_fresh_report") if "has_fresh_report" in row else row.get("hasFreshReport")
        if explicit is not None:
            return bool(explicit) is expected
        if expected:
            reports_count = self._number(row.get("reports_count"))
            return reports_count is not None and reports_count > 0
        return True

    def _sort_value(self, value: Any) -> tuple[int, Any]:
        numeric = self._number(value)
        if numeric is not None:
            return (1, numeric)
        if value is None:
            return (0, "")
        return (1, str(value))

    def _scaled_financial_value(self, value: Any) -> float | None:
        numeric = self._number(value)
        return numeric * 1000 if numeric is not None else None

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
