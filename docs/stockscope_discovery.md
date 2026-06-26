# StockScope Screener Discovery

Checked on 2026-06-26: https://stockscope.uz/ru/screener

## Firebase Web Config

```json
{
  "apiKey": "AIzaSyAadbSocGy3JPwY9LLGd8J66mxbwtvSBKw",
  "authDomain": "uz-finance.firebaseapp.com",
  "projectId": "uz-finance",
  "storageBucket": "uz-finance.appspot.com",
  "messagingSenderId": "1051010484128",
  "appId": "1:1051010484128:web:98f3b889a00d6c55bd46c5",
  "measurementId": "G-FGYCXCWT6K"
}
```

## Public Data Path

The page is a Nuxt app. Its `__NUXT_DATA__` SSR payload contains `data.listings`.

Result:

- `166` listings parsed from the SSR payload.
- `122` sector mappings parsed from `/_nuxt/screener.UmZIRfDl.js`.

Example fields:

- `ticker`
- `name`
- `uzseName`
- `isin`
- `currentPrice`
- `noOfShares`
- `marketCap`
- `volumes.lastWeekUzs`
- `pastPrices.yesterday`
- `pastPrices.lastWeek`
- `openinfoId`
- `listingCategory`
- `stockType`

## Firestore Usage Found In JS

The main bundle includes Firebase Firestore and wrapper methods for:

- `watchlists`
- `users`
- `uzse_listings`
- `otc_listings`
- `api_reports`
- `api_reports_scraped`
- `fundamentals`
- `market_overview`
- `dividend_facts`
- `checkout_sessions`
- `open_account_emails`
- `subscriptions`
- collection group `price_history`
- collection group `kpi_summary`

The screener calls:

- `$listings` from the Nuxt payload / VueFire state.
- `getAllKpiSummaries()`, implemented as a Firestore collection-group read for `kpi_summary`.

## Direct Firestore REST Check

Direct unauthenticated REST reads are blocked:

- `projects/uz-finance/databases/(default)/documents/listings` -> `403 Missing or insufficient permissions`
- `.../companies` -> `403 Missing or insufficient permissions`
- `.../stocks` -> `403 Missing or insufficient permissions`
- `.../kpi-summaries` -> `403 Missing or insufficient permissions`

Conclusion: use the public Nuxt SSR payload for listings and do not depend on direct Firestore REST access.
