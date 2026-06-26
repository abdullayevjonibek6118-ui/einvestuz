# Data Ingestion Plan

## Goal

Build the data layer in this order:

1. Uzbekistan companies and listed securities.
2. Company news with AI enrichment.
3. Uzbekistan macro indicators.
4. Financial reports and corporate events.
5. IPO calendar.
6. Global company data.

## Current Findings

UZSE is ready for the first production connector. The endpoint `https://uzse.uz/isu_infos/names?mkt_id=STK` returned 121 stock-market rows on 2026-06-26 and the existing `UzseProvider` already normalizes `isin`, `ticker`, and issuer name. UZSE index endpoints also returned JSON.

CBU FX is ready. `https://cbu.uz/en/arkhiv-kursov-valyut/json/` returns official currency rows with `Ccy`, `Rate`, `Diff`, and `Date`.

Statistics Agency macro data is ready for at least national accounts. `https://api.stat.uz/api/v1.0/data/milliy-hisoblar-choraklik?format=json&lang=ru` returns JSON and the same dataset also supports `format=xlsx`.

News RSS is available for Gazeta.uz, Kun.uz, Spot.uz, and UZA. Daryo needs a second pass: `/ru/feed` returned HTML, while `/rss` is only a candidate.

OpenInfo remains the biggest blocker. The public `/api/v1/reports/` candidate returned 404 and the `test.openinfo.uz` API candidate failed TLS handshake on 2026-06-26. Treat it as high-priority, but do not build around it until access is confirmed or an HTML/document fallback is implemented.

## PostgreSQL Tables

Minimum normalized schema:

- `data_sources`: source metadata, status, priority, refresh cadence.
- `companies`: canonical issuer profile.
- `security_aliases`: ticker, ISIN, issuer spellings, language variants.
- `securities`: listed shares, preferred shares, bonds, market, board, currency.
- `quotes_latest`: latest normalized price snapshot.
- `trades`: trade-level rows from UZSE where available.
- `market_indices`: index metadata.
- `index_history`: date/value/volume/turnover rows.
- `news_items`: raw article metadata and text summary.
- `news_company_mentions`: AI/entity links between articles and companies.
- `ai_news_analysis`: sentiment, impact, summary, confidence.
- `macro_indicators`: FX, inflation, key rate, GDP, reserves, export, import, debt.
- `issuer_reports`: report metadata from OpenInfo or issuer disclosures.
- `financial_statements`: period-level normalized financial metrics.
- `corporate_events`: material facts, dividends, meetings, disclosure events.
- `ipo_events`: IPO calendar records.
- `documents`: source PDFs/XLSX/HTML snapshots and parsed text.

## Connector Order

1. Extend the existing UZSE provider into a scheduled ingestion job that upserts `companies`, `securities`, `quotes_latest`, `trades`, `market_indices`, and `index_history`.
2. Add RSS ingestion for `gazeta_uz_rss`, `kun_uz_rss`, `spot_uz_rss`, and `uza_uz_rss`; dedupe by canonical URL and title hash.
3. Add AI enrichment after RSS ingestion: entity match against `companies` and `security_aliases`, then sentiment, market impact, summary, and confidence.
4. Add macro jobs for CBU FX and `api.stat.uz` national accounts. Expand `api.stat.uz` dataset IDs for inflation, exports, imports, and GDP components.
5. Implement OpenInfo discovery as a separate spike: confirm authenticated/public API or build an HTML/document crawler.
6. Add IPO calendar from UZSE/NAPP/Spot/OpenInfo once corporate-event ingestion exists.
7. Keep Finnhub as the default global-company API through `FINNHUB_API_KEY`; add ROIC AI or Finazon only after product requirements require their extra coverage.

## Normalization Rules

Use ISIN as the strongest identity key for Uzbek securities. Use ticker as a secondary key because common shares and preferred shares can share issuer names but have different instruments.

Store issuer names exactly as sourced and separately maintain a cleaned display name. For AI matching, keep aliases in Uzbek, Russian, and English where available.

Every row from an external source should include `source_id`, `source_url`, `fetched_at`, and, when available, `published_at` or `as_of_date`.

Financial metrics should be period-based and auditable. Keep raw document links and parsed values; do not overwrite historical reported values when a later corrected filing appears. Insert a new version and mark the latest version.

## Immediate Backend Tasks

The current backend can already expose UZSE and CBU data. The next backend increment is PostgreSQL persistence:

- Add SQLAlchemy or SQLModel models for the tables above.
- Add an ingestion CLI, for example `python -m app.ingest uzse-companies`.
- Add idempotent upserts for UZSE companies and securities.
- Add RSS parser dependencies only if needed; Python standard XML parsing is enough for MVP RSS.
- Add `/api/companies/uz` backed by PostgreSQL instead of in-memory UZSE fetches.
