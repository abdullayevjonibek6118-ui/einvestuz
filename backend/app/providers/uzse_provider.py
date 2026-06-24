from __future__ import annotations

import html
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen


UZSE_BASE_URL = "https://uzse.uz"
UZSE_TZ = timezone(timedelta(hours=5))


@dataclass
class _CacheEntry:
    expires_at: float
    value: Any


class _TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.tables: list[list[list[str]]] = []
        self._current_table: list[list[str]] | None = None
        self._current_row: list[str] | None = None
        self._current_cell: list[str] | None = None
        self._cell_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "table":
            self._current_table = []
        elif tag == "tr" and self._current_table is not None:
            self._current_row = []
        elif tag in {"td", "th"} and self._current_row is not None:
            self._current_cell = []
            self._cell_depth = 1
        elif self._current_cell is not None and tag == "br":
            self._current_cell.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"td", "th"} and self._current_cell is not None and self._current_row is not None:
            text = _clean_text("".join(self._current_cell))
            self._current_row.append(text)
            self._current_cell = None
            self._cell_depth = 0
        elif tag == "tr" and self._current_row is not None and self._current_table is not None:
            if any(cell for cell in self._current_row):
                self._current_table.append(self._current_row)
            self._current_row = None
        elif tag == "table" and self._current_table is not None:
            if self._current_table:
                self.tables.append(self._current_table)
            self._current_table = None

    def handle_data(self, data: str) -> None:
        if self._current_cell is not None:
            self._current_cell.append(data)


class UzseProvider:
    """Direct UZSE data provider.

    Uses only requests to uzse.uz. JSON endpoints are used when confirmed; otherwise
    public HTML tables are parsed and normalized.
    """

    INDEX_CODES = {"uci": {"code": "001", "name": "UCI"}}

    def __init__(self, base_url: str = UZSE_BASE_URL) -> None:
        self.base_url = base_url.rstrip("/")
        self._cache: dict[str, _CacheEntry] = {}

    def get_companies(self, mkt_id: str = "STK") -> list[dict[str, Any]]:
        market = (mkt_id or "STK").upper().strip()
        return self._cached(f"companies:{market}", 86400, lambda: self._fetch_companies(market))

    def get_market_indices(self, idx_ind_cd: str = "001") -> list[dict[str, Any]]:
        code = self._index_code(idx_ind_cd)
        return self._cached(f"indices:{code}", 300, lambda: self._fetch_market_indices(code))

    def get_quotes(
        self,
        mkt_id: str = "STK",
        page: int = 1,
        begin_date: str | None = None,
        end_date: str | None = None,
        search_key: str | None = None,
    ) -> list[dict[str, Any]]:
        market = (mkt_id or "STK").upper().strip()
        key = f"quotes:{market}:{page}:{begin_date or ''}:{end_date or ''}:{search_key or ''}"
        return self._cached(key, 300, lambda: self._fetch_quotes(market, page, begin_date, end_date, search_key))

    def get_index_history(self, index_name: str) -> list[dict[str, Any]]:
        code = self._index_code(index_name)
        return self._cached(f"history:{code}", 300, lambda: self._fetch_index_history(code))

    def get_listings(self, markets: str = "STK,BND") -> list[dict[str, Any]]:
        market_ids = ",".join(sorted({market.strip().upper() for market in markets.split(",") if market.strip()})) or "STK,BND"
        return self._cached(f"listings:{market_ids}", 86400, lambda: self._fetch_listings(market_ids))

    def get_trade_results(
        self,
        mkt_id: str = "ALL",
        page: int = 1,
        begin_date: str | None = None,
        end_date: str | None = None,
        search_key: str | None = None,
    ) -> list[dict[str, Any]]:
        market = (mkt_id or "ALL").upper().strip()
        key = f"trades:{market}:{page}:{begin_date or ''}:{end_date or ''}:{search_key or ''}"
        return self._cached(key, 300, lambda: self._fetch_trade_results(market, page, begin_date, end_date, search_key))

    def _cached(self, key: str, ttl_seconds: int, loader: Any) -> Any:
        now = time.time()
        cached = self._cache.get(key)
        if cached and cached.expires_at > now:
            return cached.value
        value = loader()
        self._cache[key] = _CacheEntry(now + ttl_seconds, value)
        return value

    def _fetch_companies(self, mkt_id: str) -> list[dict[str, Any]]:
        payload = self._request_json(
            "/isu_infos/names",
            {"mkt_id": mkt_id},
            accept="application/json",
            x_requested_with=True,
            referer="/isu_infos/",
        )
        companies: list[dict[str, Any]] = []
        if not isinstance(payload, list):
            return companies
        for row in payload:
            if not isinstance(row, list) or len(row) < 3:
                continue
            companies.append(
                {
                    "isin": _clean_text(row[0]),
                    "ticker": _clean_text(row[1]),
                    "name": _clean_company_name(row[2]),
                    "market_id": mkt_id,
                    "source": "uzse.uz/isu_infos/names",
                    "source_url": self._url("/isu_infos/names", {"mkt_id": mkt_id}),
                    "fetched_at": _now_iso(),
                }
            )
        return companies

    def _fetch_market_indices(self, idx_ind_cd: str) -> list[dict[str, Any]]:
        payload = self._request_json(
            "/price_indices",
            {"idx_ind_cd": idx_ind_cd},
            accept="application/json",
            x_requested_with=False,
            referer=f"/price_indices?idx_ind_cd={idx_ind_cd}",
        )
        if not isinstance(payload, dict):
            return []

        last_index = payload.get("last_index") or {}
        base_index = payload.get("base_index") or {}
        series = payload.get("indices") or []
        last_value = _to_float(last_index.get("idx"))
        base_value = _to_float(base_index.get("idx"))
        change = None
        change_percent = None
        if last_value is not None and base_value not in (None, 0):
            change = round(last_value - base_value, 2)
            change_percent = round(((last_value - base_value) / base_value) * 100, 2)

        return [
            {
                "idx_ind_cd": idx_ind_cd,
                "name": self._index_name(idx_ind_cd),
                "last_value": round(last_value, 2) if last_value is not None else None,
                "base_value": round(base_value, 2) if base_value is not None else None,
                "change": change,
                "change_percent": change_percent,
                "last_date": last_index.get("last_date"),
                "points": [
                    {
                        "calc_tm": point.get("calc_tm"),
                        "value": _to_float(point.get("idx")),
                    }
                    for point in series
                    if isinstance(point, dict)
                ],
                "source": "uzse.uz/price_indices",
                "source_url": self._url("/price_indices", {"idx_ind_cd": idx_ind_cd}),
                "fetched_at": _now_iso(),
            }
        ]

    def _fetch_quotes(
        self,
        mkt_id: str,
        page: int,
        begin_date: str | None,
        end_date: str | None,
        search_key: str | None,
    ) -> list[dict[str, Any]]:
        trades = self._fetch_trade_results(mkt_id, page, begin_date, end_date, search_key)
        latest: dict[tuple[str, str], dict[str, Any]] = {}
        for trade in trades:
            isin = str(trade.get("isin") or "")
            market_id = str(trade.get("market_id") or "")
            if not isin:
                continue
            latest.setdefault((isin, market_id), trade)

        quotes: list[dict[str, Any]] = []
        with ThreadPoolExecutor(max_workers=min(8, max(len(latest), 1))) as executor:
            for item in executor.map(self._enrich_quote, latest.values()):
                quotes.append(item)
        quotes.sort(key=lambda item: (item.get("market_id") or "", item.get("ticker") or "", item.get("isin") or ""))
        return quotes

    def _fetch_index_history(self, idx_ind_cd: str) -> list[dict[str, Any]]:
        payload = self._request_json(
            "/price_indices/histories",
            {"ind_idx_cd": idx_ind_cd},
            accept="application/json",
            x_requested_with=False,
            referer=f"/price_indices?idx_ind_cd={idx_ind_cd}",
        )
        rows = payload if isinstance(payload, list) else []
        history: list[dict[str, Any]] = []
        for row in reversed(rows):
            if not isinstance(row, dict):
                continue
            history.append(
                {
                    "idx_ind_cd": idx_ind_cd,
                    "date": _date_only(row.get("bz_dd")),
                    "open": _to_float(row.get("opnprc_idx")),
                    "high": _to_float(row.get("hgprc_idx")),
                    "low": _to_float(row.get("lwprc_idx")),
                    "close": _to_float(row.get("clsprc_idx")),
                    "previous_close": _to_float(row.get("prevdd_idx")),
                    "market_cap": _to_float(row.get("mktcap")),
                    "volume": _to_float(row.get("acc_trdvol")),
                    "turnover": _to_float(row.get("acc_trdval")),
                    "source": "uzse.uz/price_indices/histories",
                    "source_url": self._url("/price_indices/histories", {"ind_idx_cd": idx_ind_cd}),
                    "fetched_at": _now_iso(),
                }
            )
        return history

    def _fetch_listings(self, markets: str) -> list[dict[str, Any]]:
        text = self._request_text("/isu_infos/")
        table = _first_table_with_headers(text, ["Тикер", "Код ЦБ", "Эмитент", "Текущая цена"])
        listings: list[dict[str, Any]] = []
        for row in table[1:]:
            if len(row) < 11:
                continue
            category = _clean_text(row[2])
            market_id = _market_id_for_category(category)
            if market_id not in markets.split(","):
                continue
            ticker = _clean_text(row[3])
            isin = _clean_text(row[4])
            issuer = _clean_company_name(row[5])
            listing_date = _parse_uzse_date(row[6])
            listings.append(
                {
                    "market_id": market_id,
                    "category": category,
                    "ticker": ticker,
                    "isin": isin,
                    "issuer": issuer,
                    "listing_date": listing_date,
                    "currency": _clean_text(row[7]),
                    "nominal_value": _to_float(row[8]),
                    "shares_outstanding": _to_float(row[9]),
                    "current_price_label": _clean_text(row[10]),
                    "detail_url": self._url(f"/isu_infos/{market_id}", {"isu_cd": isin}) if isin else None,
                    "source": "uzse.uz/isu_infos/",
                    "source_url": self._url("/isu_infos/"),
                    "fetched_at": _now_iso(),
                }
            )
        return listings

    def _fetch_trade_results(
        self,
        mkt_id: str,
        page: int,
        begin_date: str | None,
        end_date: str | None,
        search_key: str | None,
    ) -> list[dict[str, Any]]:
        params: dict[str, str | int] = {"mkt_id": mkt_id, "page": page}
        if begin_date:
            params["begin_date"] = begin_date
        if end_date:
            params["end_date"] = end_date
        if search_key:
            params["search_key"] = search_key
        text = self._request_text("/trade_results", params)
        table = _first_table_with_headers(text, ["Время", "Код ЦБ", "Эмитент", "Торговая цена"])
        trades: list[dict[str, Any]] = []
        for row in table[1:]:
            if len(row) < 10:
                continue
            isin, ticker = _split_security_code(row[2])
            trades.append(
                {
                    "trade_time_text": _clean_text(row[0]),
                    "trade_time": _parse_trade_datetime(row[0]),
                    "isin": isin,
                    "ticker": ticker,
                    "issuer": _clean_company_name(row[3]),
                    "security_type": _clean_text(row[4]),
                    "market_id": _clean_text(row[5]),
                    "board_id": _clean_text(row[6]),
                    "price": _to_float(row[7]),
                    "quantity": _to_float(row[8]),
                    "volume": _to_float(row[9]),
                    "source": "uzse.uz/trade_results",
                    "source_url": self._url("/trade_results", params),
                    "status": "delayed",
                }
            )
        return trades

    def _request_json(
        self,
        path: str,
        params: dict[str, str | int] | None = None,
        *,
        accept: str = "application/json",
        x_requested_with: bool = False,
        referer: str = "/",
    ) -> Any:
        url = self._url(path, params)
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": accept,
            "Referer": f"{self.base_url}{referer}",
        }
        if x_requested_with:
            headers["X-Requested-With"] = "XMLHttpRequest"
        request = Request(url, headers=headers)
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8", "replace"))

    def _request_text(self, path: str, params: dict[str, str | int] | None = None) -> str:
        request = Request(
            self._url(path, params),
            headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        )
        with urlopen(request, timeout=20) as response:
            return response.read().decode("utf-8", "replace")

    def _url(self, path: str, params: dict[str, str | int] | None = None) -> str:
        url = path if path.startswith("http") else f"{self.base_url}{path}"
        return f"{url}?{urlencode(params)}" if params else url

    def _index_code(self, index_name: str) -> str:
        normalized = index_name.lower().strip()
        if normalized in self.INDEX_CODES:
            return self.INDEX_CODES[normalized]["code"]
        for meta in self.INDEX_CODES.values():
            if normalized == meta["code"] or normalized in meta["name"].lower():
                return meta["code"]
        if normalized.isdigit():
            return normalized.zfill(3)
        return "001"

    def _index_name(self, idx_ind_cd: str) -> str:
        if idx_ind_cd == "001":
            return "UCI"
        return f"Index {idx_ind_cd}"

    def _enrich_quote(self, trade: dict[str, Any]) -> dict[str, Any]:
        market_id = str(trade.get("market_id") or "").upper()
        isin = str(trade.get("isin") or "")
        detail = self._fetch_security_detail(market_id, isin) if market_id in {"STK", "BND"} and isin else {}
        price = _to_float(trade.get("price"))
        previous_close = detail.get("previous_close")
        change = detail.get("change")
        if change is None and price is not None and previous_close not in (None, 0):
            change = round(price - float(previous_close), 2)
        change_percent = None
        if change is not None and previous_close not in (None, 0):
            change_percent = round((float(change) / float(previous_close)) * 100, 2)
        return {
            "isin": isin,
            "ticker": trade.get("ticker"),
            "name": detail.get("name") or trade.get("issuer"),
            "market_id": market_id,
            "board_id": trade.get("board_id"),
            "security_type": trade.get("security_type"),
            "price": price,
            "change": change,
            "change_percent": change_percent,
            "previous_close": previous_close,
            "open": detail.get("open"),
            "high": detail.get("high"),
            "low": detail.get("low"),
            "issue_value": detail.get("issue_value"),
            "quantity": _to_float(trade.get("quantity")),
            "turnover": _to_float(trade.get("volume")),
            "last_trade_time": trade.get("trade_time").isoformat() if isinstance(trade.get("trade_time"), datetime) else trade.get("trade_time_text"),
            "last_trade_time_text": trade.get("trade_time_text"),
            "source": trade.get("source"),
            "source_url": trade.get("source_url"),
            "fetched_at": _now_iso(),
        }

    def _fetch_security_detail(self, market_id: str, isin: str) -> dict[str, Any]:
        cache_key = f"detail:{market_id}:{isin}"
        cached = self._cache.get(cache_key)
        if cached and cached.expires_at > time.time():
            return cached.value

        url = self._url(f"/isu_infos/{market_id}", {"isu_cd": isin})
        text = self._request_text(f"/isu_infos/{market_id}", {"isu_cd": isin})
        tables = _parse_tables(text)
        detail: dict[str, Any] = {
            "isin": isin,
            "market_id": market_id,
            "source_url": url,
        }
        if len(tables) < 5:
            self._cache[cache_key] = _CacheEntry(time.time() + 300, detail)
            return detail

        header_row = tables[0][0] if tables[0] else []
        header_text = " ".join(header_row)
        match = re.search(r"(?P<isin>UZ[0-9A-Z]+)\s+(?P<ticker>[A-Z0-9]+)\s+(?P<name>.+?)\s+Номинал", header_text)
        if match:
            detail["ticker"] = match.group("ticker")
            detail["name"] = _clean_company_name(match.group("name"))

        summary_row = tables[1][1] if len(tables[1]) > 1 else []
        stats_row = tables[2][1] if len(tables[2]) > 1 else []
        intraday_row = tables[3][1] if len(tables[3]) > 1 else []
        history_row = tables[4][1] if len(tables[4]) > 1 else []

        previous_close = _to_float(history_row[1]) if len(history_row) > 1 else None
        current_price = _to_float(intraday_row[1]) if len(intraday_row) > 1 else previous_close
        change = _parse_signed_change(summary_row[0]) if len(summary_row) > 0 else None
        if change is None and current_price is not None and previous_close not in (None, 0):
            change = round(current_price - float(previous_close), 2)

        detail.update(
            {
                "previous_close": previous_close,
                "close_price": previous_close,
                "last_trade_price": current_price,
                "change": change,
                "change_percent": round((float(change) / float(previous_close)) * 100, 2)
                if change is not None and previous_close not in (None, 0)
                else None,
                "open": _to_float(stats_row[0]) if len(stats_row) > 0 else None,
                "high": _to_float(stats_row[1]) if len(stats_row) > 1 else None,
                "low": _to_float(stats_row[2]) if len(stats_row) > 2 else None,
                "issue_value": _to_float(stats_row[3]) if len(stats_row) > 3 else None,
                "summary_change": _parse_signed_change(summary_row[0]) if len(summary_row) > 0 else None,
                "summary_volume": _to_float(summary_row[1]) if len(summary_row) > 1 else None,
                "summary_turnover": _to_float(summary_row[2]) if len(summary_row) > 2 else None,
                "last_trade_time_text": intraday_row[0] if len(intraday_row) > 0 else None,
                "last_trade_time": _parse_trade_datetime(intraday_row[0]).isoformat()
                if len(intraday_row) > 0 and _parse_trade_datetime(intraday_row[0]) is not None
                else None,
            }
        )
        self._cache[cache_key] = _CacheEntry(time.time() + 300, detail)
        return detail


def _first_table_with_headers(text: str, required_headers: list[str]) -> list[list[str]]:
    parser = _TableParser()
    parser.feed(text)
    required = [header.lower() for header in required_headers]
    for table in parser.tables:
        if not table:
            continue
        header = " ".join(table[0]).lower()
        if all(item.lower() in header for item in required):
            return table
    return []


def _clean_text(value: Any) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()
    return text


def _clean_company_name(value: Any) -> str:
    text = _clean_text(value)
    text = text.replace("<", "").replace(">", "").strip("«»\"'")
    return text


def _extract_ticker(value: str) -> str:
    parts = [part.strip() for part in re.split(r"[\s/]+", value) if part.strip()]
    return parts[-1] if parts else _clean_text(value)


def _split_security_code(value: str) -> tuple[str | None, str | None]:
    parts = [part.strip() for part in re.split(r"\s+", _clean_text(value)) if part.strip()]
    isin = next((part for part in parts if part.startswith("UZ") and len(part) >= 10), None)
    ticker = next((part for part in reversed(parts) if part != isin), None)
    return isin, ticker


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = _clean_text(value)
    if not text or text in {"-", "N/A"}:
        return None
    text = text.replace(" ", "")
    if "," in text and "." not in text:
        parts = text.split(",")
        if len(parts) > 2 or (len(parts) == 2 and len(parts[1]) == 3):
            text = "".join(parts)
        else:
            text = text.replace(",", ".")
    else:
        text = text.replace(",", "")
    text = re.sub(r"[^0-9.+-]", "", text)
    try:
        return float(text)
    except ValueError:
        return None


def _parse_signed_change(value: Any) -> float | None:
    text = _clean_text(value)
    if not text:
        return None
    sign = -1.0 if any(marker in text for marker in ("▼", "−", "-")) else 1.0
    number = _to_float(text)
    return round(sign * abs(number), 2) if number is not None else None


def _date_only(value: Any) -> str | None:
    text = _clean_text(value)
    if not text:
        return None
    return text[:10]


def _parse_uzse_date(value: str) -> str | None:
    text = _clean_text(value)
    match = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", text)
    if match:
        day, month, year = match.groups()
        return f"{year}-{month}-{day}"
    return _date_only(text)


def _parse_trade_datetime(value: Any) -> datetime | None:
    text = _clean_text(value)
    if not text:
        return None

    match = re.match(
        r"(?P<day>\d{1,2})\s+(?P<month>[А-Яа-яA-Za-z]+)(?:\s+(?P<year>\d{4}))?,\s*(?P<hour>\d{1,2}):(?P<minute>\d{2})",
        text,
    )
    if match:
        month = _month_number(match.group("month"))
        if month is not None:
            year = int(match.group("year") or datetime.now(timezone.utc).year)
            return datetime(
                year,
                month,
                int(match.group("day")),
                int(match.group("hour")),
                int(match.group("minute")),
                tzinfo=UZSE_TZ,
            )

    match = re.match(r"(?P<day>\d{2})\.(?P<month>\d{2})\.(?P<year>\d{4})", text)
    if match:
        return datetime(
            int(match.group("year")),
            int(match.group("month")),
            int(match.group("day")),
            tzinfo=UZSE_TZ,
        )

    return None


def _month_number(month: str) -> int | None:
    lookup = {
        "января": 1,
        "январь": 1,
        "февраля": 2,
        "февраль": 2,
        "марта": 3,
        "март": 3,
        "апреля": 4,
        "апрель": 4,
        "мая": 5,
        "май": 5,
        "июня": 6,
        "июнь": 6,
        "июля": 7,
        "июль": 7,
        "августа": 8,
        "август": 8,
        "сентября": 9,
        "сентябрь": 9,
        "октября": 10,
        "октябрь": 10,
        "ноября": 11,
        "ноябрь": 11,
        "декабря": 12,
        "декабрь": 12,
    }
    return lookup.get(month.lower())


def _parse_tables(text: str) -> list[list[list[str]]]:
    parser = _TableParser()
    parser.feed(text)
    return parser.tables


def _market_id_for_category(category: str) -> str:
    normalized = category.lower().strip()
    if "bond" in normalized or "облига" in normalized:
        return "BND"
    return "STK"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def save_discovered_endpoints(path: str | Path = "data/uzse_endpoints.json") -> None:
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base_url": UZSE_BASE_URL,
        "pages_investigated": [
            "https://uzse.uz/isu_infos/",
            "https://uzse.uz/price_indices/",
            "https://uzse.uz/listing",
            "https://uzse.uz/trade_results",
        ],
        "confirmed_json_endpoints": [
            {
                "method": "GET",
                "url": "https://uzse.uz/isu_infos/names?mkt_id=STK",
                "referer": "https://uzse.uz/isu_infos/",
                "notes": "Returns arrays [isin, ticker, issuer_name]. Requires XMLHttpRequest headers; plain request can return 406.",
            },
            {
                "method": "GET",
                "url": "https://uzse.uz/price_indices/range?idx_ind_cd=001&range_type=1y",
                "referer": "https://uzse.uz/price_indices/",
                "notes": "Returns {last_index, indices}; idx_ind_cd 001..008, range_type 1d/1m/1y.",
            },
            {
                "method": "GET",
                "url": "https://uzse.uz/price_indices/histories?ind_idx_cd=001",
                "referer": "https://uzse.uz/price_indices/",
                "notes": "Returns historical rows with bz_dd, clsprc_idx, prevdd_idx, acc_trdvol, acc_trdval.",
            },
        ],
        "confirmed_downloads": ["https://uzse.uz/price_indices/histories.xlsx"],
        "html_sources": [
            {"url": "https://uzse.uz/isu_infos/", "use": "Listings and current price table"},
            {"url": "https://uzse.uz/trade_results", "use": "Latest trade results table"},
        ],
        "not_found": [{"url": "https://uzse.uz/listing", "status": 404}],
        "script_assets": ["https://uzse.uz/assets/application.js"],
        "keywords_observed": [
            "/price_indices",
            "/price_indices/range",
            "/price_indices/histories",
            "/isu_infos",
            "/isu_infos/names",
            "/listing",
            "/trade_results",
            "/issuer",
        ],
    }
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
