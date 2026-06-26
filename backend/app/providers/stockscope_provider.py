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
        match = re.search(r'<script type="application/json" id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
        if not match:
            return []
        payload = json.loads(match.group(1))
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
