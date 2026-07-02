"""Client for official SIAT machine-readable statistical datasets."""

from __future__ import annotations

import json
import ssl
from dataclasses import dataclass
from typing import Any, Callable
from urllib.parse import urlparse
from urllib.request import Request, urlopen

import certifi

SIAT_API = "https://api.siat.stat.uz"


@dataclass(frozen=True)
class SiatDatasetSpec:
    dataset_id: int
    code: str
    name: str
    page_url: str


DATASETS = {
    "cpi_monthly": SiatDatasetSpec(4585, "1.11.01.0026", "Индекс потребительских цен к предыдущему месяцу", "https://siat.stat.uz/data/4585/?lang=ru"),
    "gdp_annual": SiatDatasetSpec(587, "1.01.02.0001", "ВВП в текущих ценах, годовые данные", "https://siat.stat.uz/data/587/?lang=ru"),
}


class SiatProvider:
    """Downloads a SIAT export through its stable metadata endpoint."""

    def __init__(self, timeout: int = 12, fetch_json: Callable[[str, int], Any] | None = None) -> None:
        self.timeout = timeout
        self._fetch = fetch_json or _fetch_json

    def get_dataset(self, key: str) -> dict[str, Any]:
        if key not in DATASETS:
            raise KeyError(f"Unknown SIAT dataset: {key}")
        spec = DATASETS[key]
        descriptor_url = f"{SIAT_API}/sdmx/{spec.dataset_id}/table/download/?download_format=json"
        descriptor = self._fetch(descriptor_url, self.timeout)
        file_url = str(descriptor.get("file") or "") if isinstance(descriptor, dict) else ""
        parsed = urlparse(file_url)
        if parsed.scheme != "https" or parsed.netloc != "api.siat.stat.uz":
            raise ValueError("SIAT returned an unexpected download URL")
        payload = self._fetch(file_url, self.timeout)
        document = payload[0] if isinstance(payload, list) and payload else payload
        if not isinstance(document, dict) or not isinstance(document.get("data"), list):
            raise ValueError("SIAT dataset has an unsupported structure")
        return {"dataset": key, "dataset_id": spec.dataset_id, "code": spec.code, "name": spec.name, "source": spec.page_url, "license": "CC BY 4.0", "updated_at": descriptor.get("updated_at"), "metadata": document.get("metadata") or [], "data": document["data"]}


def _fetch_json(url: str, timeout: int) -> Any:
    context = ssl.create_default_context(cafile=certifi.where())
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "EInvestuz/0.3"})
    with urlopen(request, timeout=timeout, context=context) as response:
        return json.loads(response.read().decode("utf-8-sig"))
