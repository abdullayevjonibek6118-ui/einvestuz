from backend.app import main
from backend.app.market_data import SymbolSpec, _empty_quote, get_macro_summary
from backend.app.providers.financial_analytics import compute_financial_ratios
from backend.app.providers.siat_provider import SiatProvider


def test_official_macro_values_are_current_and_dated() -> None:
    indicators = {item["name"]: item for item in get_macro_summary().indicators}

    assert indicators["Инфляция (г/г)"]["value"] == 5.5
    assert indicators["Инфляция (г/г)"]["as_of"] == "2026-05-01"
    assert indicators["Рост ВВП (г/г)"]["value"] == 8.7
    assert indicators["Ключевая ставка ЦБ"]["value"] == 14.0


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
