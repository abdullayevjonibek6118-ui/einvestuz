from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class DatabaseHealth:
    configured: bool
    connected: bool
    detail: str


class SupabaseDataAPI:
    def __init__(self) -> None:
        self.url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    @property
    def configured(self) -> bool:
        return bool(self.url and self.key)

    def health(self) -> DatabaseHealth:
        if not self.configured:
            return DatabaseHealth(False, False, "Supabase environment variables are missing")
        try:
            self.select("data_sources", columns="id", limit=1)
            return DatabaseHealth(True, True, "Supabase Data API is reachable")
        except RuntimeError as exc:
            return DatabaseHealth(True, False, str(exc))

    def select(self, table: str, *, columns: str = "*", limit: int | None = None) -> list[dict[str, Any]]:
        query: dict[str, str | int] = {"select": columns}
        if limit is not None:
            query["limit"] = limit
        result = self._request("GET", table, query=query)
        return result if isinstance(result, list) else []

    def upsert(self, table: str, rows: list[dict[str, Any]], *, on_conflict: str) -> None:
        if not rows:
            return
        self._request(
            "POST",
            table,
            query={"on_conflict": on_conflict},
            payload=rows,
            prefer="resolution=merge-duplicates,return=minimal",
        )

    def _request(
        self,
        method: str,
        table: str,
        *,
        query: dict[str, str | int] | None = None,
        payload: Any | None = None,
        prefer: str | None = None,
    ) -> Any:
        if not self.configured:
            raise RuntimeError("Supabase is not configured")
        suffix = f"?{urlencode(query)}" if query else ""
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Accept": "application/json",
        }
        if payload is not None:
            headers["Content-Type"] = "application/json"
        if prefer:
            headers["Prefer"] = prefer
        request = Request(
            f"{self.url}/rest/v1/{table}{suffix}",
            data=json.dumps(payload).encode("utf-8") if payload is not None else None,
            headers=headers,
            method=method,
        )
        try:
            with urlopen(request, timeout=15) as response:
                body = response.read()
                return json.loads(body) if body else None
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:500]
            raise RuntimeError(f"Supabase returned HTTP {exc.code}: {detail}") from exc
        except (URLError, TimeoutError) as exc:
            raise RuntimeError(f"Supabase connection failed: {exc}") from exc


supabase = SupabaseDataAPI()
