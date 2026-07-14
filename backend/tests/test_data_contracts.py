import json
from pathlib import Path

import pytest
from backend.app import main
from backend.app import market_data
from backend.app.market_data import SymbolSpec, _empty_quote, get_macro_summary
from backend.app.providers.financial_analytics import compute_financial_ratios
from backend.app.providers.siat_provider import SiatProvider


def test_macro_summary_uses_observed_cbu_fx_only(monkeypatch) -> None:
    market_data._DETAIL_CACHE._values.pop("fx:rates", None)
    market_data._DETAIL_CACHE._values.pop("macro:summary", None)

    def fake_fetch_json(url: str, timeout: int):
        assert "cbu.uz" in url
        return [
            {"Ccy": "USD", "Rate": "12021.32", "Diff": "-20.73", "Date": "08.07.2026", "Nominal": "1", "CcyNm_EN": "US Dollar"},
            {"Ccy": "EUR", "Rate": "13734.36", "Diff": "-10.44", "Date": "08.07.2026", "Nominal": "1", "CcyNm_EN": "Euro"},
        ]

    monkeypatch.setattr(market_data, "_fetch_json", fake_fetch_json)
    indicators = {item["name"]: item for item in get_macro_summary().indicators}

    assert indicators["USD/UZS"]["value"] == 12021.32
    assert indicators["USD/UZS"]["as_of"] == "2026-07-08"
    assert "Инфляция (г/г)" not in indicators
    assert "Рост ВВП (г/г)" not in indicators
    assert "Ключевая ставка ЦБ" not in indicators


def test_unavailable_quote_is_not_replaced_with_plausible_price() -> None:
    quote = _empty_quote(SymbolSpec("TEST", "TEST", "Test", "unknown"))

    assert quote.price == 0
    assert quote.change_percent is None
    assert quote.status == "offline"
    assert quote.source == "unavailable"


def test_market_table_keeps_missing_values_missing() -> None:
    response = main._market_table_row_response(
        {
            "rank": 1,
            "branding": {"monogram": "T"},
            "name": "Test",
            "ticker": "TEST",
            "market_cap": "N/A",
            "volume_24h": "N/A",
            "circulating_supply": "N/A",
            "source": "test",
            "status": "delayed",
        }
    )

    assert response.price is None
    assert response.change_1h is None
    assert response.change_24h is None
    assert response.change_7d is None
    assert response.sparkline_7d == []


def test_ratios_do_not_invent_fields_without_source_inputs() -> None:
    ratios = compute_financial_ratios({"pe": 8, "dividendYield": 5})

    assert ratios.quick_ratio is None
    assert ratios.ev_ebitda is None
    assert ratios.payout_ratio is None


def test_server_portfolio_mutation_routes_are_not_exposed() -> None:
    paths = {route.path for route in main.app.routes}

    assert "/portfolio/add" not in paths
    assert "/portfolio/remove" not in paths


def test_siat_provider_follows_official_download_descriptor() -> None:
    calls: list[str] = []

    def fetch(url: str, timeout: int):
        calls.append(url)
        if "table/download" in url:
            return {"file": "https://api.siat.stat.uz/media/data.json", "updated_at": "2026-06-05"}
        return [{"metadata": [{"name_en": "Unit", "value_en": "Percent"}], "data": [{"2026-M05": 100.2}]}]

    result = SiatProvider(fetch_json=fetch).get_dataset("cpi_monthly")
    assert result["data"] == [{"2026-M05": 100.2}]
    assert result["license"] == "CC BY 4.0"
    assert len(calls) == 2


def test_ratios_are_calculated_from_raw_financial_rows() -> None:
    ratios = compute_financial_ratios({"currentPrice": "20", "noOfShares": "10", "indicators": [
        {"key": "netIncome", "value": 20}, {"key": "revenue", "value": 200},
        {"key": "totalEquity", "value": 120}, {"key": "priorEquity", "value": 80},
        {"key": "totalAssets", "value": 300}, {"key": "priorAssets", "value": 200},
    ]})
    assert ratios.roe == 20.0
    assert ratios.roa == 8.0
    assert ratios.net_margin == 10.0
    assert ratios.ps == 1.0
    assert ratios.pe == 10.0
    assert ratios.pb == 200 / 120


def test_stockscope_snapshot_rows_are_auditable() -> None:
    path = Path("backend/app/data/stockscope_screener.json")
    snapshot = json.loads(path.read_text(encoding="utf-8"))
    rows = snapshot["items"]

    assert rows
    assert all(row.get("source_name") == "StockScope" for row in rows)
    assert all(str(row.get("source_url") or "").startswith("https://stockscope.uz/ru/listings/") for row in rows)
    assert all(row.get("fetched_at") for row in rows)


def test_cbu_fx_rates_keep_all_official_currencies(monkeypatch) -> None:
    market_data._DETAIL_CACHE._values.pop("fx:rates", None)

    def fake_fetch_json(url: str, timeout: int):
        assert "cbu.uz" in url
        return [
            {"Ccy": "GBP", "Rate": "16085.73", "Diff": "27.66", "Date": "08.07.2026", "Nominal": "1", "CcyNm_EN": "Pound Sterling"},
            {"Ccy": "USD", "Rate": "12021.32", "Diff": "-20.73", "Date": "08.07.2026", "Nominal": "1", "CcyNm_EN": "US Dollar"},
            {"Ccy": "RUB", "Rate": "157.64", "Diff": "2.61", "Date": "08.07.2026", "Nominal": "1", "CcyNm_EN": "Russian Ruble"},
            {"Ccy": "EUR", "Rate": "13734.36", "Diff": "-10.44", "Date": "08.07.2026", "Nominal": "1", "CcyNm_EN": "Euro"},
        ]

    monkeypatch.setattr(market_data, "_fetch_json", fake_fetch_json)
    rates = market_data.get_fx_rates()

    assert [rate.ccy for rate in rates] == ["USD", "EUR", "RUB", "GBP"]
    assert rates[3].rate == 16085.73


def test_chat_uses_aimlapi_completion(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, list[dict[str, dict[str, str]]]]:
            return {"choices": [{"message": {"content": "Ответ из AIMLAPI"}}]}

    def fake_post(url: str, headers: dict[str, str], json: dict[str, object], timeout: int) -> FakeResponse:
        captured.update({"url": url, "headers": headers, "json": json, "timeout": timeout})
        return FakeResponse()

    monkeypatch.setenv("AIMLAPI_KEY", "test-key")
    monkeypatch.setattr(main.requests, "post", fake_post)

    result = main.chat(main.ChatRequest(message="Hello", history=[]))

    assert result.response == "Ответ из AIMLAPI"
    assert captured["url"] == "https://api.aimlapi.com/v1/chat/completions"
    assert captured["headers"] == {"Authorization": "Bearer test-key"}
    assert captured["timeout"] == 45
    assert captured["json"]["model"] == "openai/gpt-5.4-nano"


def test_chat_fails_when_aimlapi_key_is_missing(monkeypatch) -> None:
    monkeypatch.delenv("AIMLAPI_KEY", raising=False)

    with pytest.raises(main.HTTPException) as exc:
        main.chat(main.ChatRequest(message="Hello", history=[]))

    assert exc.value.status_code == 503
