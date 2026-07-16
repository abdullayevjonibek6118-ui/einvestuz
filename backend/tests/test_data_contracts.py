import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from backend.app import main
from backend.app import market_data
from backend.app.database import DatabaseHealth, SupabaseDataAPI
from backend.app.market_data import SymbolSpec, _empty_quote, get_macro_summary
from backend.app.providers.financial_analytics import compute_financial_ratios
from backend.app.providers.siat_provider import SiatProvider
from backend.app.providers.stockscope_provider import StockScopeProvider


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


def test_market_table_preserves_observed_zero_values() -> None:
    response = main._market_table_row_response(
        {
            "rank": 1,
            "branding": {"monogram": "Z"},
            "name": "Zero",
            "ticker": "ZERO",
            "price": 0,
            "change_1h": 0,
            "change_24h": 0,
            "change_7d": 0,
            "market_cap": "UZS 0.00",
            "volume_24h": "UZS 0.00",
            "circulating_supply": "0 ZERO",
            "market_cap_value": 0,
            "volume_24h_value": 0,
            "circulating_supply_value": 0,
            "source": "test",
            "status": "delayed",
        }
    )

    assert response.price == 0
    assert response.change_1h == 0
    assert response.change_24h == 0
    assert response.change_7d == 0
    assert response.market_cap_value == 0
    assert response.volume_24h_value == 0
    assert response.circulating_supply_value == 0


def test_ratios_do_not_invent_fields_without_source_inputs() -> None:
    ratios = compute_financial_ratios({"pe": 8, "dividendYield": 5})

    assert ratios.quick_ratio is None
    assert ratios.ev_ebitda is None
    assert ratios.payout_ratio is None


def test_server_portfolio_mutation_routes_are_not_exposed() -> None:
    paths = {route.path for route in main.app.routes}

    assert "/portfolio/add" not in paths
    assert "/portfolio/remove" not in paths


def test_supabase_configuration_reads_current_environment(monkeypatch) -> None:
    database = SupabaseDataAPI()

    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    assert database.configured is False

    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co/")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")

    assert database.configured is True
    assert database.url == "https://example.supabase.co"


def test_database_health_endpoint_does_not_expose_upstream_error_detail(monkeypatch) -> None:
    monkeypatch.setattr(
        main.supabase,
        "health",
        lambda: DatabaseHealth(
            configured=True,
            connected=False,
            detail='Supabase returned HTTP 401: {"message":"JWT expired","hint":"internal upstream detail"}',
        ),
    )

    result = main.database_health()

    assert result["configured"] is True
    assert result["connected"] is False
    assert result["detail"] == "Supabase Data API is unreachable"
    assert "JWT" not in str(result)


def test_rate_limit_window_blocks_until_old_entries_expire() -> None:
    main._RATE_LIMIT_BUCKETS.clear()

    assert main._rate_limit_allows("chat:test", max_requests=2, window_seconds=60, now=100)
    assert main._rate_limit_allows("chat:test", max_requests=2, window_seconds=60, now=101)
    assert not main._rate_limit_allows("chat:test", max_requests=2, window_seconds=60, now=102)
    assert main._rate_limit_allows("chat:test", max_requests=2, window_seconds=60, now=161)


def test_origin_policy_matches_configured_cors_origins(monkeypatch) -> None:
    monkeypatch.setattr(main, "CORS_ORIGINS", ["https://einvestuz.com", "http://localhost:3000"])

    assert main._is_allowed_origin("https://einvestuz.com")
    assert main._is_allowed_origin("https://einvestuz.com/")
    assert main._is_allowed_origin(None)
    assert not main._is_allowed_origin("https://evil.example")


def test_chat_endpoint_rate_limits_per_client(monkeypatch) -> None:
    main._RATE_LIMIT_BUCKETS.clear()
    monkeypatch.setenv("CHAT_RATE_LIMIT_PER_MINUTE", "1")
    monkeypatch.setenv("CHAT_RATE_LIMIT_WINDOW_SECONDS", "60")
    monkeypatch.setattr(main, "_build_ai_context", lambda payload: {"content": "", "sources": []})
    monkeypatch.setattr(main, "_aimlapi_chat_completion", lambda payload, context=None: "OK")

    client = TestClient(main.app)
    first = client.post("/chat", json={"message": "Hello"})
    second = client.post("/chat", json={"message": "Hello again"})

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.json()["detail"] == "Too many requests"


def test_quotes_websocket_rejects_unconfigured_browser_origin() -> None:
    client = TestClient(main.app)

    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/ws/quotes", headers={"origin": "https://evil.example"}):
            pass

    assert exc.value.code == 1008


def test_quotes_websocket_allows_configured_origin(monkeypatch) -> None:
    monkeypatch.setattr(main, "fetch_live_quotes", lambda symbols: [])
    client = TestClient(main.app)

    with client.websocket_connect("/ws/quotes?symbols=AAPL&interval=5", headers={"origin": "https://einvestuz.com"}) as websocket:
        payload = websocket.receive_json()

    assert payload["type"] == "quote_snapshot"
    assert payload["symbols"] == ["AAPL"]
    assert payload["quotes"] == []


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


def test_siat_provider_caches_successful_dataset_downloads() -> None:
    calls: list[str] = []

    def fetch(url: str, timeout: int):
        calls.append(url)
        if "table/download" in url:
            return {"file": "https://api.siat.stat.uz/media/data.json", "updated_at": "2026-06-05"}
        return [{"metadata": [{"name_en": "Unit", "value_en": "Percent"}], "data": [{"2026-M05": 100.2}]}]

    provider = SiatProvider(fetch_json=fetch)
    first = provider.get_dataset("cpi_monthly")
    first["data"].append({"mutated": True})

    second = provider.get_dataset("cpi_monthly")

    assert second["data"] == [{"2026-M05": 100.2}]
    assert len(calls) == 2


def test_missing_uzse_stock_does_not_fetch_listing_or_trade_tables(monkeypatch) -> None:
    class Provider:
        listings_calls = 0
        trades_calls = 0

        def get_companies(self):
            return [{"ticker": "KNOWN", "name": "Known Issuer"}]

        def get_listings(self):
            self.listings_calls += 1
            return []

        def get_trade_results(self):
            self.trades_calls += 1
            return []

    provider = Provider()
    monkeypatch.setattr(main, "UZSE_PROVIDER", provider)

    assert main._uzse_stock_by_ticker("MISSING") is None
    assert provider.listings_calls == 0
    assert provider.trades_calls == 0


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


def test_ratios_read_stockscope_detail_period_values() -> None:
    ratios = compute_financial_ratios(
        {
            "listing": {"currentPrice": 20, "noOfShares": 10_000},
            "indicators": [
                {
                    "period": "FY_2025",
                    "values": {
                        "MarketCap": 200_000,
                        "PE": 2,
                        "PB": 1,
                        "ROE": 50,
                        "ROA": 20,
                        "Revenue": 1000,
                        "Earnings": 100,
                        "Assets": 500,
                        "Equity": 200,
                        "Debt": 300,
                        "GrossProfitMargin": 40,
                        "NetProfitMargin": 10,
                        "DividendYield": 0,
                    },
                }
            ],
        }
    )

    assert ratios.pe == 2
    assert ratios.pb == 1
    assert ratios.roe == 50
    assert ratios.roa == 20
    assert ratios.debt_to_equity == 1.5
    assert ratios.net_margin == 10
    assert ratios.dividend_yield == 0
    assert ratios.eps == 10
    assert ratios.book_value_per_share == 20


def test_stockscope_indicators_fill_calculable_multiples_from_statements() -> None:
    provider = StockScopeProvider()
    fundamentals = [
        {
            "period": "2025",
            "type": "annual",
            "date": {"seconds": 1767139200},
            "companyType": "jsc",
            "earnings": {
                "010": 1000,  # revenue
                "020": 600,  # cost of revenue; gross profit should be derived
                "270": 100,  # net profit
            },
            "balancesheet": {
                "130": 350,  # long-term assets
                "390": 150,  # current assets
                "770": 300,  # liabilities
                # equity is intentionally absent and should be assets - liabilities
            },
        }
    ]

    indicators = provider._performance_indicators(fundamentals, "jsc")
    provider._attach_market_multiples(
        indicators,
        {"currentPrice": 20, "noOfShares": 10_000},
        [{"commonDividend": 2}],
    )
    values = indicators[0]["values"]

    assert values["GrossProfitMargin"] == 40
    assert values["NetProfitMargin"] == 10
    assert values["ROA"] == 20
    assert values["ROE"] == 50
    assert values["DebtToEquity"] == 1.5
    assert values["CurrentRatio"] is None
    assert values["WorkingCapital"] is None
    assert values["PE"] == 2
    assert values["PB"] == 1
    assert values["DividendYield"] == 10


def test_stockscope_coverage_row_reuses_calculated_pe_pb() -> None:
    provider = StockScopeProvider()
    row = provider._coverage_row(
        "TEST",
        {"ticker": "TEST", "name": "Test Co", "currentPrice": 20, "noOfShares": 10_000},
        {
            "indicators": [
                {
                    "period": "2025",
                    "values": {
                        "Earnings": 100,
                        "Equity": 200,
                        "ROE": 50,
                        "ROA": 20,
                        "PE": 2,
                        "PB": 1,
                    },
                }
            ],
            "reports": [{}],
            "dividends": [{"common_dividend": 2}],
        },
    )

    assert row["pe"] == 2
    assert row["pb"] == 1
    assert row["roe"] == 50
    assert row["roa"] == 20


def test_stockscope_coverage_row_preserves_observed_zero_ratios() -> None:
    provider = StockScopeProvider()
    row = provider._coverage_row(
        "ZERO",
        {"ticker": "ZERO", "name": "Zero Co", "currentPrice": 100, "noOfShares": 1_000},
        {
            "indicators": [
                {
                    "period": "2025",
                    "values": {
                        "Earnings": 0,
                        "Equity": 100,
                        "PE": 0,
                        "PB": 1,
                        "DividendYield": 0,
                    },
                }
            ],
            "reports": [{}],
            "dividends": [],
        },
    )

    assert row["pe"] == 0
    assert row["pb"] == 1
    assert row["dividend_yield"] == 0


def test_stockscope_stock_response_preserves_zero_dividend_yield() -> None:
    stock = main._stockscope_stock_response(
        {
            "ticker": "ZERO",
            "name": "Zero Co",
            "current_price": 100,
            "market_cap": 100_000,
            "pe": 0,
            "dividend_yield": 0,
            "latest_period": "2025",
        }
    )

    assert stock.dividend == "0.0%"
    assert stock.pe == 0


def test_stockscope_stock_response_does_not_invent_zero_pe_for_missing_value() -> None:
    stock = main._stockscope_stock_response(
        {
            "ticker": "MISS",
            "name": "Missing Co",
            "current_price": 100,
            "market_cap": 100_000,
            "latest_period": "2025",
        }
    )

    assert stock.pe is None


def test_stockscope_stock_response_uses_snapshot_timestamp_for_as_of() -> None:
    stock = main._stockscope_stock_response(
        {
            "ticker": "SNAP",
            "name": "Snapshot Co",
            "current_price": 100,
            "market_cap": 100_000,
            "latest_period": "2025",
            "fetched_at": "2026-06-26T21:02:59Z",
        }
    )

    assert stock.as_of.isoformat() == "2026-06-26T21:02:59+00:00"


def test_technical_analytics_as_of_uses_latest_observed_price_date(monkeypatch) -> None:
    monkeypatch.setattr(
        main.STOCKSCOPE_PROVIDER,
        "get_listing_details",
        lambda ticker: {
            "trading_stats": {
                "daily": [
                    {"date": "2026-06-27", "price": 14, "volume_uzs": 140},
                    {"date": "2026-06-25", "price": 12, "volume_uzs": 120},
                    {"date": "2026-06-26", "price": 13, "volume_uzs": 130},
                    {"date": "2026-06-24", "price": 11, "volume_uzs": 110},
                    {"date": "2026-06-23", "price": 10, "volume_uzs": 100},
                ]
            }
        },
    )

    result = main.analytics_technical("SNAP")

    assert result["as_of"] == "2026-06-27T00:00:00+00:00"


def test_ratio_analytics_as_of_uses_latest_financial_report_date(monkeypatch) -> None:
    monkeypatch.setattr(
        main.STOCKSCOPE_PROVIDER,
        "get_listing_details",
        lambda ticker: {
            "listing": {"ticker": ticker, "currentPrice": 20, "noOfShares": 100_000},
            "fetched_at": "2026-07-16T12:00:00Z",
            "reports": [{"date": "2026-03-01T00:00:00Z"}],
            "indicators": [{"period": "FY_2025", "values": {"Earnings": 100, "Equity": 800}}],
        },
    )

    result = main.analytics_ratios("SNAP")

    assert result["as_of"] == "2026-03-01T00:00:00+00:00"


def test_stockscope_indicator_charts_keep_missing_values_missing() -> None:
    provider = StockScopeProvider()

    charts = provider._charts(
        fundamentals=[],
        price_history={},
        indicators=[
            {"period": "2025", "type": "annual", "values": {"ROE": 0, "ROA": None}},
            {"period": "2024", "type": "annual", "values": {"ROE": 12.5}},
        ],
        trading_stats={"monthly": []},
        company_type="jsc",
    )

    series = {item["name"]: item["data"] for item in charts["indicators"]["series"]}
    assert series["ROE"] == [0, 12.5]
    assert series["ROA"] == [None, None]


def test_stockscope_trading_aggregation_keeps_missing_volume_missing_and_zero_zero() -> None:
    provider = StockScopeProvider()

    missing = provider._aggregate_trading(
        [{"date": "2026-07-01", "price": 10, "volume_uzs": None, "volume_pcs": None}],
        7,
    )
    observed_zero = provider._aggregate_trading(
        [{"date": "2026-07-02", "price": 10, "volume_uzs": 0, "volume_pcs": 0}],
        7,
    )

    assert missing[0]["volume_uzs"] is None
    assert missing[0]["volume_pcs"] is None
    assert observed_zero[0]["volume_uzs"] == 0
    assert observed_zero[0]["volume_pcs"] == 0


def test_ai_number_formatter_does_not_invent_zero_for_missing_values() -> None:
    assert main._fmt_ai_number(None) == "нет данных"
    assert main._fmt_ai_number("not available") == "нет данных"
    assert main._fmt_ai_number(0) == "0"


def test_stockscope_ai_context_preserves_zero_dividend_and_missing_metrics(monkeypatch) -> None:
    monkeypatch.setattr(
        main.STOCKSCOPE_PROVIDER,
        "get_listing_details",
        lambda ticker: {
            "ticker": ticker,
            "listing": {"ticker": ticker, "name": "Zero Co", "currentPrice": 0, "noOfShares": None},
            "source_url": "https://stockscope.uz/ru/listings/ZERO/general",
            "indicators": [{"period": "2025", "values": {"PE": 0, "PB": None, "DividendYield": 0}}],
            "reports": [],
            "dividends": [{"common_dividend": 0, "published_date": "2026-01-01"}],
            "trading_stats": {"daily": []},
        },
    )

    context = main._stockscope_ai_company_context("ZERO")

    assert context is not None
    content = context["content"]
    assert "PE=0" in content
    assert "PB=нет данных" in content
    assert "DividendYield=0%" in content
    assert "common=0" in content
    assert "акций: нет данных" in content


def test_stockscope_bank_ratios_use_latest_available_balance_sheet() -> None:
    provider = StockScopeProvider()
    fundamentals = [
        {
            "period": "Q1_2026",
            "type": "quarter",
            "companyType": "bank",
            "earnings": {"246": 1000, "276": 600, "292": 100},
            "balancesheet": {"208": 0, "221": 0, "233": 0},
        },
        {
            "period": "FY_2025",
            "type": "annual",
            "companyType": "bank",
            "earnings": {"246": 900, "276": 500, "292": 80},
            "balancesheet": {"208": 2000, "221": 1200, "233": 800},
        },
    ]

    indicators = provider._performance_indicators(fundamentals, "bank")
    provider._attach_market_multiples(indicators, {"currentPrice": 20, "noOfShares": 100_000}, [])
    latest = indicators[0]["values"]

    assert latest["ROA"] == 5
    assert latest["ROE"] == 12.5
    assert latest["DebtToEquity"] == 1.5
    assert latest["PE"] == 20
    assert latest["PB"] == 2.5


def test_stockscope_market_multiples_fallback_to_latest_nonzero_denominator() -> None:
    provider = StockScopeProvider()
    indicators = [
        {"period": "Q1_2026", "values": {"Earnings": 0, "Equity": 0}},
        {"period": "FY_2025", "values": {"Earnings": 100, "Equity": 800}},
    ]

    provider._attach_market_multiples(indicators, {"currentPrice": 20, "noOfShares": 100_000}, [])
    latest = indicators[0]["values"]

    assert latest["PE"] == 20
    assert latest["PB"] == 2.5
    assert latest["PEBasisPeriod"] == "FY_2025"
    assert latest["PBBasisPeriod"] == "FY_2025"


def test_stockscope_screener_enriches_snapshot_rows_with_detail_ratios(monkeypatch) -> None:
    provider = StockScopeProvider()
    monkeypatch.setattr(
        provider,
        "get_listing_details_coverage",
        lambda: {
            "total": 1,
            "generated_at": "2026-07-14T00:00:00Z",
            "source_name": "StockScope",
            "source_url": "https://stockscope.uz/ru/screener",
            "items": [
                {
                    "ticker": "BANK",
                    "name": "Bank",
                    "reports_count": 2,
                    "indicators_count": 2,
                    "market_cap": 2_000_000,
                    "pe": 20,
                    "pb": None,
                    "roe": None,
                    "roa": None,
                }
            ],
        },
    )
    monkeypatch.setattr(
        provider,
        "get_listing_details",
        lambda ticker: {
            "listing": {"ticker": ticker, "name": "Bank", "currentPrice": 20, "noOfShares": 100_000},
            "indicators": [{"period": "2025", "values": {"Earnings": 100, "Equity": 800, "ROE": 12.5, "ROA": 5, "PE": 20, "PB": 2.5}}],
            "reports": [{}, {}],
            "dividends": [],
        },
    )

    result = provider.screen_listings(limit=1)
    row = result["items"][0]

    assert row["pe"] == 20
    assert row["pb"] == 2.5
    assert row["roe"] == 12.5
    assert row["roa"] == 5
    assert result["coverage"]["generated_at"] == "2026-07-14T00:00:00Z"
    assert result["coverage"]["source_url"] == "https://stockscope.uz/ru/screener"


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
        status_code = 200
        headers = {"content-type": "application/json"}
        content = '{"choices":[{"message":{"content":"Ответ из AIMLAPI"}}]}'.encode()

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, list[dict[str, dict[str, str]]]]:
            return {"choices": [{"message": {"content": "Ответ из AIMLAPI"}}]}

    def fake_post(url: str, headers: dict[str, str], json: dict[str, object], timeout: int) -> FakeResponse:
        captured.update({"url": url, "headers": headers, "json": json, "timeout": timeout})
        return FakeResponse()

    monkeypatch.setenv("AIMLAPI_KEY", "test-key")
    monkeypatch.setattr(main.requests, "post", fake_post)
    monkeypatch.setattr(main, "_build_ai_context", lambda payload: {"content": "", "sources": []})

    result = main.chat(main.ChatRequest(message="Hello", history=[]))

    assert result.response == "Ответ из AIMLAPI"
    assert result.mode == "general"
    assert result.sources == []
    assert captured["url"] == "https://api.aimlapi.com/v1/chat/completions"
    assert captured["headers"]["Authorization"] == "Bearer test-key"
    assert captured["headers"]["Accept"] == "application/json"
    assert captured["timeout"] == 45
    assert captured["json"]["model"] == "openai/gpt-5.4-nano"


def test_chat_removes_bom_from_aimlapi_key(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class FakeResponse:
        status_code = 200
        headers = {"content-type": "application/json"}
        content = '{"choices":[{"message":{"content":"OK"}}]}'.encode()

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, list[dict[str, dict[str, str]]]]:
            return {"choices": [{"message": {"content": "OK"}}]}

    def fake_post(url: str, headers: dict[str, str], json: dict[str, object], timeout: int) -> FakeResponse:
        captured["headers"] = headers
        return FakeResponse()

    monkeypatch.setenv("AIMLAPI_KEY", "\ufefftest-key")
    monkeypatch.setattr(main.requests, "post", fake_post)
    monkeypatch.setattr(main, "_build_ai_context", lambda payload: {"content": "", "sources": []})

    main.chat(main.ChatRequest(message="Hello", history=[]))

    assert captured["headers"]["Authorization"] == "Bearer test-key"


def test_chat_reads_aimlapi_model_from_current_environment(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class FakeResponse:
        status_code = 200
        headers = {"content-type": "application/json"}
        content = '{"choices":[{"message":{"content":"OK"}}]}'.encode()

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, list[dict[str, dict[str, str]]]]:
            return {"choices": [{"message": {"content": "OK"}}]}

    def fake_post(url: str, headers: dict[str, str], json: dict[str, object], timeout: int) -> FakeResponse:
        captured["json"] = json
        return FakeResponse()

    monkeypatch.setenv("AIMLAPI_KEY", "test-key")
    monkeypatch.setenv("AIMLAPI_MODEL", "\ufeffcustom/model ")
    monkeypatch.setattr(main.requests, "post", fake_post)
    monkeypatch.setattr(main, "_build_ai_context", lambda payload: {"content": "", "sources": []})

    main.chat(main.ChatRequest(message="Hello", history=[]))

    assert captured["json"]["model"] == "custom/model"


def test_chat_fails_when_aimlapi_key_is_missing(monkeypatch) -> None:
    monkeypatch.delenv("AIMLAPI_KEY", raising=False)

    with pytest.raises(main.HTTPException) as exc:
        main.chat(main.ChatRequest(message="Hello", history=[]))

    assert exc.value.status_code == 503


def test_chat_investment_mode_injects_stockscope_evidence(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class FakeResponse:
        status_code = 200
        headers = {"content-type": "application/json"}
        content = b'{"choices":[{"message":{"content":"brief"}}]}'

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, list[dict[str, dict[str, str]]]]:
            return {"choices": [{"message": {"content": "brief"}}]}

    monkeypatch.setenv("AIMLAPI_KEY", "test-key")

    def fake_post(url: str, headers: dict[str, str], json: dict[str, object], timeout: int) -> FakeResponse:
        captured["json"] = json
        return FakeResponse()

    monkeypatch.setattr(main.requests, "post", fake_post)
    monkeypatch.setattr(
        main.STOCKSCOPE_PROVIDER,
        "get_listing_details",
        lambda ticker: {
            "ticker": ticker,
            "listing": {"ticker": ticker, "name": "Test Bank", "currentPrice": 20, "noOfShares": 100_000, "isin": "UZTEST"},
            "source_url": "https://stockscope.uz/ru/listings/TEST/general",
            "company_type": "bank",
            "indicators": [
                {
                    "period": "FY_2025",
                    "values": {
                        "MarketCap": 2_000_000,
                        "PE": 20,
                        "PB": 2.5,
                        "ROE": 12.5,
                        "ROA": 5,
                        "Revenue": 1000,
                        "Earnings": 100,
                        "Assets": 2000,
                        "Equity": 800,
                        "Debt": 1200,
                    },
                }
            ],
            "reports": [{"period": "FY_2025", "date": "2026-03-01", "url": "https://example.com/report"}],
            "dividends": [],
            "trading_stats": {"daily": [{"date": "2026-07-15", "price": 20}]},
        },
    )
    monkeypatch.setattr(
        main.STOCKSCOPE_PROVIDER,
        "screen_listings",
        lambda **kwargs: {"items": [{"ticker": "TEST", "market_cap": 2_000_000, "pe": 20, "pb": 2.5, "roe": 12.5, "reports_count": 1}]},
    )

    result = main.chat(main.ChatRequest(message="Дай тезис", mode="investment_research", ticker="TEST"))
    messages = captured["json"]["messages"]
    context = "\n".join(message["content"] for message in messages)

    assert result.mode == "investment_research"
    assert "stockscope.uz" in result.sources
    assert "Test Bank" in context
    assert "PE=20" in context
    assert "bull/base/bear" in context


def test_industries_summary_groups_stockscope_rows(monkeypatch) -> None:
    monkeypatch.setattr(
        main.STOCKSCOPE_PROVIDER,
        "get_listing_details_coverage",
        lambda: {
            "generated_at": "2026-07-14T00:00:00Z",
            "items": [
                {"ticker": "AAA", "name": "A", "sector": "Financials", "market_cap": 100, "roe": 12, "change_30d": 3, "reports_count": 2},
                {"ticker": "BBB", "name": "B", "sector": "Financials", "market_cap": 50, "roe": 8, "change_30d": -1, "reports_count": 0},
                {"ticker": "CCC", "name": "C", "sector": "", "market_cap": 500},
            ],
        },
    )

    result = main.industries_summary()

    assert len(result) == 1
    assert result[0].name == "Financials"
    assert result[0].issuers == 2
    assert result[0].market_cap == 150
    assert result[0].average_roe == 10
    assert result[0].with_reports == 1
    assert [leader["ticker"] for leader in result[0].leaders] == ["AAA", "BBB"]


def test_ipo_summary_uses_listing_and_disclosure_signals(monkeypatch) -> None:
    monkeypatch.setattr(
        main.STOCKSCOPE_PROVIDER,
        "get_listing_details_coverage",
        lambda: {
            "generated_at": "2026-07-14T00:00:00Z",
            "items": [
                {"ticker": "IPO1", "name": "IPO Co", "listing_category": "IPO", "market_cap": 100, "reports_count": 1},
                {"ticker": "NEW1", "name": "New Co", "listing_category": "Standard", "market_cap": 80, "reports_count": 0},
                {"ticker": "OLD1", "name": "Old Co", "listing_category": "Standard", "market_cap": 60, "reports_count": 3},
            ],
        },
    )

    result = main.ipo_summary()

    assert result.total == 2
    assert [item["ticker"] for item in result.items] == ["IPO1", "NEW1"]


def test_cbu_news_html_is_parsed_as_macro_news(monkeypatch) -> None:
    html = """
    <a href="/ru/press_center/news/3902211/" class="news">
      <div class="news__title">Центральный банк опубликовал обзор</div>
      <div class="news__date"><span>25 мая 2026</span></div>
      <div class="news__text">Краткое описание</div>
    </a>
    """

    monkeypatch.setattr(market_data, "_fetch_text", lambda url, timeout: html)
    monkeypatch.setattr(market_data, "_company_news", lambda symbol, limit=10: [])
    market_data._DETAIL_CACHE._values.pop("news:local", None)

    items = market_data.get_news()

    assert items[0]["title"] == "Центральный банк опубликовал обзор"
    assert items[0]["category"] == "Macro"
    assert items[0]["published_at"].isoformat().startswith("2026-05-25")


def test_news_response_preserves_macro_category() -> None:
    item = main._news_response({"title": "CBU update", "source": "CBU", "category": "Macro"})

    assert item.category == "Macro"
