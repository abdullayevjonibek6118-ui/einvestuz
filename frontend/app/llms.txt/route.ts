import { SITE_URL } from "@/lib/seo";

export function GET() {
  const body = `# EInvest

> EInvest is a Russian-language research platform for public companies and capital markets in Uzbekistan. It provides issuer profiles, prices, financial statements, profitability ratios, valuation multiples, dividends, reports, market news and AI-assisted explanations. It does not execute trades and does not provide personalized financial advice.

## Primary sections
- [Market overview](${SITE_URL}/): market indicators, leading issuers, macroeconomics and news.
- [Uzbekistan stock screener](${SITE_URL}/screener): filter issuers by ROE, ROA, P/E, P/B, dividends and disclosure coverage.
- [Company comparison](${SITE_URL}/compare): side-by-side financial metrics for up to six issuers.
- [Company research pages](${SITE_URL}/stocks/A011030): price history, financial statements, ratios, reports and dividends.
- [AI market analysis](${SITE_URL}/ai): plain-language explanations based on available platform data.
- [Investment academy](${SITE_URL}/academy): educational material about markets and company analysis.

## Data scope and sources
Primary coverage is the Uzbekistan market. Sources include UZSE-related market data, StockScope Uzbekistan public pages, issuer disclosures and OpenInfo references where available. Every figure should be interpreted with its displayed source and freshness status. Missing values are shown as unavailable rather than estimated.

## Important limitations
- Content is informational and educational, not an offer or investment recommendation.
- Uzbekistan securities may have limited liquidity and delayed prices.
- Verify material decisions against issuer filings and official market sources.

## Machine-readable discovery
- [XML sitemap](${SITE_URL}/sitemap.xml)
- [Robots policy](${SITE_URL}/robots.txt)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
