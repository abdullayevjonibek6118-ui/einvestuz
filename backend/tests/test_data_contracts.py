import json
from pathlib import Path

import pytest
from backend.app import main
from backend.app import market_data
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
