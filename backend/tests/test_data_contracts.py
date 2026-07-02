from backend.app import main
from backend.app.market_data import SymbolSpec, _empty_quote, get_macro_summary
from backend.app.providers.financial_analytics import compute_financial_ratios


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
