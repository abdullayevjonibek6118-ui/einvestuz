import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Banknote, Bot, ChartNoAxesCombined, FileText, Globe2, Newspaper, Plus, ShieldAlert, Star, TriangleAlert, type LucideIcon } from "lucide-react";
import { ChangeBadge, Metric, PageHeader, Panel, SourceStatusBadge } from "@/components/ui";
import { getStock, getStockScopeBatchDetails, getStockScopeScreener } from "@/lib/api";
import { type Stock, type StockRiskFactor, type StockScopeChart, type StockScopeIndicatorPeriod, type StockScopeTradingRow, type StockSourceMeta } from "@/lib/data";
import { pageMetadata, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PeerRow = { ticker: string; market?: string; currency?: string };

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const { ticker } = await params;
  const normalized = ticker.toUpperCase();
  const stock = await getStock(normalized);
  const name = stock?.name ?? normalized;
  const description = stock
    ? `${name} (${normalized}): цена, финансовая отчётность, ROE, ROA, мультипликаторы, дивиденды, документы и риски.`
    : `${normalized}: финансовые показатели, отчётность и рыночные данные компании на EInvest.`;
  return pageMetadata({ title: `${name} (${normalized}) — цена и финансовые показатели`, description, path: `/stocks/${encodeURIComponent(normalized)}` });
}

export default async function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  let stock = await getStock(ticker);
  if (!stock) {
    const screener = await getStockScopeScreener({ q: ticker, limit: 1 });
    const row = screener.items.find((item) => item.ticker.toUpperCase() === ticker.toUpperCase());
    if (row) {
      stock = {
        ticker: row.ticker,
        name: row.name,
        price: row.currentPrice ?? 0,
        change: 0,
        marketCap: row.marketCap ? `UZS ${row.marketCap.toLocaleString("ru-RU")}` : "N/A",
        pe: row.pe ?? 0,
        dividend: row.dividendYield == null ? "N/A" : `${row.dividendYield.toFixed(2)}%`,
        sector: "Uzbekistan",
        description: `${row.name} — эмитент рынка Узбекистана. Подробные данные источника временно загружаются.`,
        source: "stockscope.uz",
        sourceStatus: "delayed",
        currency: "UZS",
        market: "uzbekistan",
        isin: row.isin,
        openinfoId: row.openinfoId,
      };
    }
  }
  if (!stock) notFound();

  const resolvedStock = stock;
  const stockscopeBatch = await getStockScopeBatchDetails([resolvedStock.ticker]);
  const stockscopeDetails = resolvedStock.stockscope ?? stockscopeBatch.items.find((item) => item.ticker?.toUpperCase() === resolvedStock.ticker.toUpperCase()) ?? stockscopeBatch.items[0];
  if (stockscopeDetails) {
    stock = { ...resolvedStock, stockscope: stockscopeDetails };
  } else {
    stock = resolvedStock;
  }

  const fundamentals = resolveFundamentals(stock);
  const companyMetrics = resolveCompanyMetrics(stock, fundamentals);
  const earnings = stock.earnings ?? [];
  const sources = stock.sources?.length ? stock.sources : resolveSources(stock);
  const companyNews = stock.news ?? [];
  const isLocal = stock.market === "uzbekistan" || stock.currency === "UZS" || (stock.source ?? "").toLowerCase().includes("stockscope");
  const peerRows = isLocal ? await resolvePeerRows(stock) : [];
  const compareHref = buildCompareHref(stock.ticker, peerRows);
  const websiteHref = normalizeExternalUrl(stock.website);
  const riskTone = resolveRiskTone(fundamentals, stock);
  const insight = stock.insight;
  const decision = stock.decisionSummary;
  const riskFactors = stock.riskFactors?.length ? stock.riskFactors : fallbackRiskFactors(stock, fundamentals, riskTone);
  const primaryRisk = riskFactors[0]?.detail ?? buildRiskLine(stock, fundamentals, riskTone);
  const pricingLine = insight?.headline ?? insight?.signals?.[0] ?? buildValuationLine(stock, fundamentals);
  const nextAction = decision?.nextStep ?? "Откройте документы, сравните похожие компании и проверьте тезис через учебного помощника.";
  const companySchema = {
    "@context": "https://schema.org",
    "@type": "Corporation",
    name: stock.name,
    tickerSymbol: stock.ticker,
    url: `${SITE_URL}/stocks/${encodeURIComponent(stock.ticker)}`,
    description: stock.description,
    identifier: stock.isin ? { "@type": "PropertyValue", propertyID: "ISIN", value: stock.isin } : undefined,
    sameAs: stock.website ? [stock.website.startsWith("http") ? stock.website : `https://${stock.website}`] : undefined,
  };

  return (
    <main className="space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(companySchema).replace(/</g, "\\u003c") }} />
      <PageHeader
        title={`${stock.name} (${stock.ticker})`}
        subtitle="Карточка исследования: профиль, цена, риски, источники и сравнение с похожими компаниями в одном экране."
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Профиль и цена" action={<SourceStatusBadge source={stock.source} status={stock.sourceStatus} />}>
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#dbe4ef] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">{formatMarketLabel(stock)}</span>
                {stock.market ? <span className="rounded-full border border-[#dbe4ef] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">{stock.market}</span> : null}
                {stock.listingCategory ? <span className="rounded-full border border-[#dbe4ef] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">{stock.listingCategory}</span> : null}
                {stock.stockType ? <span className="rounded-full border border-[#dbe4ef] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">{stock.stockType}</span> : null}
              </div>

              <h1 className="mt-4 text-3xl font-semibold leading-tight text-[#0f172a] sm:text-5xl">{stock.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#475569] sm:text-base">{stock.description}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Metric label="ISIN" value={stock.isin ?? "N/A"} detail={stock.openinfoId ? `OpenInfo ID ${stock.openinfoId}` : undefined} />
                <Metric label="Сайт" value={stock.website ?? "N/A"} detail={stock.website ? "официальный сайт" : "не указан"} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={compareHref} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b63f6] px-4 text-sm font-semibold text-white transition hover:bg-[#084fc7]">
                  Сравнить компанию
                  <ChartNoAxesCombined size={16} />
                </Link>
                <Link href={`/ai?ticker=${encodeURIComponent(stock.ticker)}&question=${encodeURIComponent(`Дай краткий учебный тезис по ${stock.ticker}`)}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dbe4ef] bg-white px-4 text-sm font-semibold text-[#0f172a] transition hover:border-[#c7d2fe] hover:bg-[#eef2ff] hover:text-[#1e40af]">
                  Спросить помощника
                  <Bot size={16} />
                </Link>
                {websiteHref ? (
                  <a href={websiteHref} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dbe4ef] bg-[#f8fafc] px-4 text-sm font-semibold text-[#0f172a] transition hover:border-[#bfdbfe] hover:bg-white">
                    Открыть сайт
                    <ArrowRight size={16} />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="rounded-[18px] border border-[#dbe4ef] bg-[#08111f] p-5 text-white shadow-[0_18px_55px_rgba(8,17,31,0.16)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93a4ba]">Цена и рынок</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-4xl font-semibold">{formatStockPrice(stock)}</p>
                  <p className="mt-1 text-sm text-[#c7d2e0]">
                    {stock.currency ?? "USD"} · {stock.sector}
                  </p>
                </div>
                <ChangeBadge value={stock.change} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <StatPill label="Капитализация" value={fundamentals.marketCap ?? stock.marketCap} />
                <StatPill label="P/E" value={formatNumber(fundamentals.pe)} />
                <StatPill label="Дивиденды" value={fundamentals.dividendYield ?? stock.dividend} />
                <StatPill label="Beta" value={formatNumber(fundamentals.beta)} />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93a4ba]">Контрольный чек</p>
                <p className="mt-2 text-sm leading-6 text-[#e2e8f0]">
                  Проверьте цепочку источников, качество раскрытия и ликвидность, затем сравните компанию с похожими эмитентами.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Учебное резюме" action={<Bot size={18} className="text-[#1e40af]" />}>
          <div className="space-y-3">
            <p className="text-sm leading-6 text-[#334155]">
              {insight?.summary ?? decision?.bottomLine ?? buildAisummary(stock, riskTone)}
            </p>
            <div className="rounded-[16px] border border-[#c7d2fe] bg-[#eef2ff] p-4 text-sm leading-6 text-[#1e40af]">
              Сигнал: {insight?.orientation ?? buildSignal(stock)}. {decision?.timeHorizon ?? "Используйте карточку как быстрый фильтр, а не как итоговую рекомендацию."}
            </div>
            <div className="space-y-2">
              <ThesisLine icon={ChartNoAxesCombined} title="Что отражено в цене" text={pricingLine} />
              <ThesisLine icon={TriangleAlert} title="Профиль риска" text={primaryRisk} />
              <ThesisLine icon={FileText} title="Следующий шаг" text={nextAction} />
            </div>
            {decision?.whoItMightFit?.length || decision?.whoItMightNotFit?.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <DecisionList title="Кому подходит" items={decision.whoItMightFit} />
                <DecisionList title="Кому не подходит" items={decision.whoItMightNotFit} />
              </div>
            ) : null}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <Panel title="Профиль риска" action={<ShieldAlert size={18} className={riskTone === "high" ? "text-[#dc2626]" : riskTone === "medium" ? "text-[#d97706]" : "text-[#16a34a]"} />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Рынок" value={formatMarketLabel(stock)} detail={stock.market ?? "global"} />
            <Metric label="Валюта" value={stock.currency ?? "USD"} detail={isLocal ? "локальный рынок" : "глобальный инструмент"} />
            <Metric label="Листинг" value={stock.listingCategory ?? "N/A"} detail={stock.stockType ?? "инструмент"} />
            <Metric label="OpenInfo" value={stock.openinfoId ? String(stock.openinfoId) : "N/A"} detail="якорь документов" />
          </div>

          <div className="mt-4 rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              <ShieldAlert size={14} />
              Факторы риска
            </div>
            <p className="mt-3 text-sm leading-6 text-[#475569]">{primaryRisk}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {riskFactors.slice(0, 6).map((risk) => (
                <RiskChip key={`${risk.code ?? risk.label}-${risk.severity ?? "na"}`} label={risk.label} value={(risk.severity ?? "check").toUpperCase()} />
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Сравнение и помощник" action={<ChartNoAxesCombined size={18} className="text-[#1e40af]" />}>
          <div className="space-y-3">
            <p className="text-sm leading-6 text-[#334155]">
              Сравнение с похожими компаниями держится рядом с тезисом, чтобы быстро перейти к метрикам или задать уточняющий вопрос.
            </p>
            <div className="flex flex-wrap gap-2">
                {peerRows.length ? (
                  peerRows.map((peer) => (
                    <Link key={peer.ticker} href={`/stocks/${encodeURIComponent(peer.ticker)}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dbe4ef] bg-white px-3 text-sm font-semibold text-[#0f172a] transition hover:border-[#c7d2fe] hover:bg-[#eef2ff] hover:text-[#1e40af]">
                      {peer.ticker}
                      <span className="text-[11px] text-[#64748b]">{peer.market === "uzbekistan" || peer.currency === "UZS" ? "Узбекистан" : "Глобальный"}</span>
                    </Link>
                  ))
              ) : (
                <span className="text-sm text-[#64748b]">Похожие компании появятся, когда рыночная таблица вернет сопоставимые эмитенты.</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link href={compareHref} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b63f6] px-4 text-sm font-semibold text-white transition hover:bg-[#084fc7]">
                Сравнить метрики
                <ArrowRight size={16} />
              </Link>
              <Link href={`/ai?ticker=${encodeURIComponent(stock.ticker)}&question=${encodeURIComponent(`Проверь риски и источники по ${stock.ticker}`)}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dbe4ef] bg-white px-4 text-sm font-semibold text-[#0f172a] transition hover:border-[#c7d2fe] hover:bg-[#eef2ff] hover:text-[#1e40af]">
                Спросить помощника
                <Bot size={16} />
              </Link>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4">
        <Panel title="Ключевые показатели" action={<SourceStatusBadge source="UZSE / OpenInfo" status="delayed" />}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Цена" value={companyMetrics.price} detail={companyMetrics.priceDetail} />
            <Metric label="Изм. за день" value={companyMetrics.dayChange} detail="по последней котировке" />
            <Metric label="Market cap" value={companyMetrics.marketCap} detail="расчёт у нас / источник" />
            <Metric label="Объём 1D" value={companyMetrics.volume1d} detail="UZSE trades" />
            <Metric label="Объём 7D" value={companyMetrics.volume7d} detail="сумма дневных торгов" />
            <Metric label="Объём 30D" value={companyMetrics.volume30d} detail="сумма дневных торгов" />
            <Metric label="P/E" value={companyMetrics.pe} detail="market cap / net profit" />
            <Metric label="P/B" value={companyMetrics.pb} detail="market cap / equity" />
            <Metric label="ROE" value={companyMetrics.roe} detail="net profit / equity" />
            <Metric label="ROA" value={companyMetrics.roa} detail="net profit / assets" />
            <Metric label="Дивиденды" value={companyMetrics.dividendYield} detail={companyMetrics.dividendDetail} />
            <Metric label="Отчётность" value={companyMetrics.reports} detail={companyMetrics.reportDetail} />
          </div>
        </Panel>
      </section>

      {stock.stockscope ? (
        <section className="grid gap-4">
          <Panel title="Данные StockScope" action={<SourceStatusBadge source="stockscope.uz" status="delayed" />}>
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <ChartPanel chart={stock.stockscope.charts?.price} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric label="Отчёты" value={`${stock.stockscope.reports?.length ?? 0}`} detail="OpenInfo / раскрытие эмитента" />
                <Metric label="Точек цены" value={`${stock.stockscope.priceHistory?.points?.length ?? 0}`} detail={stock.stockscope.priceHistory?.lastUpdateAt ? `обновлено ${formatStamp(stock.stockscope.priceHistory.lastUpdateAt)}` : "история"} />
                <Metric label="Дивиденды" value={`${stock.stockscope.dividends?.length ?? 0}`} detail="утвержденные факты" />
                <Metric label="Строк торгов" value={`${stock.stockscope.tradingStats?.daily?.length ?? 0}`} detail="дневной объём и цена" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <ChartPanel chart={stock.stockscope.charts?.earnings} />
              <ChartPanel chart={stock.stockscope.charts?.balance} />
              <ChartPanel chart={stock.stockscope.charts?.indicators} />
              <ChartPanel chart={stock.stockscope.charts?.trading_volume} />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <IndicatorGrid indicators={stock.stockscope.indicators} />
              <StockScopeTables stock={stock} />
            </div>
          </Panel>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="История сделок" action={<SourceStatusBadge source="UZSE / StockScope" status="delayed" />}>
          <TradeHistory rows={stock.stockscope?.tradingStats?.daily ?? []} />
        </Panel>
        <Panel title="AI summary: что важно знать" action={<Bot size={18} className="text-[#1e40af]" />}>
          <div className="space-y-3">
            {buildCompanyBrief(stock, companyMetrics).map((item) => (
              <ThesisLine key={item.title} icon={item.icon} title={item.title} text={item.text} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Фундаментальные показатели" action={<Banknote size={18} className="text-[#1e40af]" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Капитализация" value={fundamentals.marketCap ?? "N/A"} detail={fundamentals.asOf ? `на ${formatStamp(fundamentals.asOf)}` : undefined} />
            <Metric label="P/E" value={formatNumber(fundamentals.pe)} />
            <Metric label="EPS" value={formatNumber(fundamentals.eps)} detail="TTM / reported" />
            <Metric label="Див. доходность" value={fundamentals.dividendYield ?? "N/A"} />
            <Metric label="Валовая маржа" value={fundamentals.grossMargin ?? "N/A"} />
            <Metric label="Опер. маржа" value={fundamentals.operatingMargin ?? "N/A"} />
            <Metric label="Долг / капитал" value={fundamentals.debtToEquity ?? "N/A"} />
            <Metric label="Beta" value={formatNumber(fundamentals.beta)} />
          </div>
        </Panel>

        <Panel title="Новости и события" action={<Newspaper size={18} className="text-[#1e40af]" />}>
          <div className="space-y-3">
            {earnings.length ? (
              <div className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                  <ChartNoAxesCombined size={14} />
                  Финансовые результаты
                </div>
                <div className="mt-3 space-y-2">
                  {earnings.slice(0, 4).map((item) => (
                    <div key={`${item.period}-${item.asOf ?? "na"}`} className="rounded-2xl border border-white bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-[#667085]">{item.period}</p>
                          <p className="mt-1 text-sm font-semibold text-[#0f172a]">
                            EPS {formatNumber(item.epsActual)} / {formatNumber(item.epsEstimate)}
                          </p>
                        </div>
                        {typeof item.surprisePercent === "number" ? <ChangeBadge value={item.surprisePercent} /> : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                        {item.revenueActual || item.revenueEstimate ? (
                          <span>
                            Выручка {item.revenueActual ?? "N/A"} / {item.revenueEstimate ?? "N/A"}
                          </span>
                        ) : null}
                        {item.asOf ? <span>обновлено {formatStamp(item.asOf)}</span> : null}
                        <SourceStatusBadge source={item.source} status={item.sourceStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              {companyNews.length ? companyNews.map((item) => (
                <Link key={item.id} href="/dashboard" className="block rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4 transition hover:border-[#c7d2fe] hover:bg-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                    {item.category} · {item.time}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold leading-6 text-[#0f172a]">{item.title}</h3>
                </Link>
              )) : <p className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4 text-sm text-[#64748b]">Актуальные новости по этому эмитенту сейчас недоступны.</p>}
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Источники и документы" action={<Globe2 size={18} className="text-[#1e40af]" />}>
          <div className="space-y-2">
            <SourcePriorityTable stock={stock} />
            {sources.length ? (
              sources.map((source) => (
                <div key={`${source.source}-${source.asOf ?? "na"}`} className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#0f172a]">{source.source}</p>
                    <SourceStatusBadge source={source.source} status={source.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#64748b]">
                    {source.market ? <span>{source.market}</span> : null}
                    {source.asOf ? <span>обновлено {formatStamp(source.asOf)}</span> : null}
                  </div>
                  {source.detail ? <p className="mt-2 text-sm text-[#475569]">{source.detail}</p> : null}
                  {source.notes ? <p className="mt-1 text-xs text-[#64748b]">{source.notes}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[#64748b]">Источник данных еще не описан backend-ом.</p>
            )}
          </div>
        </Panel>

        <Panel title="Заметки для сравнения" action={<Star size={18} className="text-[#1e40af]" />}>
          <div className="space-y-3">
            <p className="text-sm leading-6 text-[#334155]">
              Этот блок помогает держать сравнение рядом с тезисом, чтобы быстро перейти к похожим компаниям, источникам или портфелю.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Metric label="Идентификатор" value={stock.ticker} detail={stock.name} />
              <Metric label="Путь пользователя" value="поиск -> акция -> риск" detail="затем источники и сравнение" />
              {stock.sourceMeta?.freshnessBand ? <Metric label="Свежесть" value={stock.sourceMeta.freshnessBand} detail={stock.sourceMeta.freshnessRisk} /> : null}
              {stock.sourceMeta?.changeBasis ? <Metric label="База изменения" value={stock.sourceMeta.changeBasis} detail={stock.sourceMeta.source} /> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dbe4ef] bg-white px-4 text-sm font-semibold text-[#0f172a] transition hover:border-[#c7d2fe] hover:bg-[#eef2ff] hover:text-[#1e40af]">
                Вернуться к рынку
                <ArrowRight size={16} />
              </Link>
              <Link href={`/portfolio?ticker=${encodeURIComponent(stock.ticker)}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b63f6] px-4 text-sm font-semibold text-white transition hover:bg-[#084fc7]">
                Добавить в портфель
                <Plus size={16} />
              </Link>
            </div>
          </div>
        </Panel>
      </section>
    </main>
  );
}

function resolveFundamentals(stock: Stock) {
  const indicators = stock.stockscope?.indicators?.[0]?.values ?? {};
  return {
    marketCap: stock.fundamentals?.marketCap ?? stock.marketCap,
    pe: stock.fundamentals?.pe ?? indicators.PE ?? indicators.PriceToEarnings ?? stock.pe,
    eps: stock.fundamentals?.eps,
    revenueGrowth: stock.fundamentals?.revenueGrowth,
    grossMargin: stock.fundamentals?.grossMargin,
    operatingMargin: stock.fundamentals?.operatingMargin,
    debtToEquity: stock.fundamentals?.debtToEquity,
    beta: stock.fundamentals?.beta,
    dividendYield: stock.fundamentals?.dividendYield ?? stock.dividend,
    asOf: stock.fundamentals?.asOf ?? stock.asOf,
    source: stock.fundamentals?.source ?? stock.source,
    sourceStatus: stock.fundamentals?.sourceStatus ?? stock.sourceStatus,
  };
}

async function resolvePeerRows(stock: Stock): Promise<PeerRow[]> {
  const ticker = stock.ticker.toUpperCase();
  const peersBySector = stock.sector && stock.sector !== "N/A"
    ? await getStockScopeScreener({ sector: stock.sector, limit: 8, sort_by: "market_cap", sort_dir: "desc" })
    : undefined;
  const sectorPeers = (peersBySector?.items ?? [])
    .filter((peer) => peer.ticker.toUpperCase() !== ticker)
    .map((peer) => ({ ticker: peer.ticker, market: peer.market, currency: peer.currency }));

  if (sectorPeers.length >= 2) return sectorPeers.slice(0, 5);

  const marketPeers = await getStockScopeScreener({ limit: 8, sort_by: "market_cap", sort_dir: "desc" });
  const fallbackPeers = marketPeers.items
    .filter((peer) => peer.ticker.toUpperCase() !== ticker)
    .map((peer) => ({ ticker: peer.ticker, market: peer.market, currency: peer.currency }));

  return [...sectorPeers, ...fallbackPeers.filter((peer) => !sectorPeers.some((existing) => existing.ticker === peer.ticker))].slice(0, 5);
}

function buildCompareHref(ticker: string, peers: PeerRow[]) {
  return `/compare?tickers=${encodeURIComponent([ticker, ...peers.slice(0, 2).map((peer) => peer.ticker)].join(","))}`;
}

function normalizeExternalUrl(value?: string) {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function resolveCompanyMetrics(stock: Stock, fundamentals: ReturnType<typeof resolveFundamentals>) {
  const dailyRows = stock.stockscope?.tradingStats?.daily ?? [];
  const indicators = stock.stockscope?.indicators?.[0]?.values ?? {};
  const dividends = stock.stockscope?.dividends ?? [];
  const latestDividend = dividends[0];
  const latestTrade = dailyRows[0];
  const price = latestTrade?.price ?? stock.price;

  return {
    price: price && Number.isFinite(price) ? `${price.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ${stock.currency ?? "UZS"}` : "N/A",
    priceDetail: latestTrade?.date ? `сделка ${latestTrade.date}` : stock.asOf ? `обновлено ${formatStamp(stock.asOf)}` : undefined,
    dayChange: `${stock.change >= 0 ? "+" : ""}${stock.change.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}%`,
    marketCap: fundamentals.marketCap ?? stock.marketCap ?? "N/A",
    volume1d: formatUzbekMoney(sumTradingVolume(dailyRows, 1)),
    volume7d: formatUzbekMoney(sumTradingVolume(dailyRows, 7)),
    volume30d: formatUzbekMoney(sumTradingVolume(dailyRows, 30)),
    pe: formatNumber(indicators.PE ?? indicators.PriceToEarnings ?? fundamentals.pe),
    pb: formatNumber(indicators.PB ?? indicators.PtoB ?? indicators.PriceToBook),
    roe: formatPercentValue(indicators.ROE),
    roa: formatPercentValue(indicators.ROA),
    dividendYield: fundamentals.dividendYield ?? formatPercentValue(latestDividend?.commonYield),
    dividendDetail: latestDividend?.publishedDate ? `опубликовано ${formatStamp(latestDividend.publishedDate)}` : `${dividends.length} записей`,
    reports: String(stock.stockscope?.reports?.length ?? 0),
    reportDetail: stock.stockscope?.reports?.[0]?.period ?? "openinfo / issuer disclosure",
  };
}

function sumTradingVolume(rows: StockScopeTradingRow[], count: number) {
  const value = rows.slice(0, count).reduce((sum, row) => sum + (row.volumeUzs ?? 0), 0);
  return value || null;
}

function formatUzbekMoney(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "нет данных";
  return `${value.toLocaleString("ru-RU", { notation: "compact", maximumFractionDigits: 1 })} UZS`;
}

function buildCompanyBrief(stock: Stock, metrics: ReturnType<typeof resolveCompanyMetrics>) {
  const reportsCount = stock.stockscope?.reports?.length ?? 0;
  const tradeRows = stock.stockscope?.tradingStats?.daily?.length ?? 0;
  const dividendsCount = stock.stockscope?.dividends?.length ?? 0;
  return [
    {
      icon: ChartNoAxesCombined,
      title: "Ликвидность",
      text: tradeRows ? `Есть ${tradeRows} дневных строк торгов; 30D объём: ${metrics.volume30d}. Перед сделкой всё равно проверьте стакан и последние сделки.` : "История торгов пока не загружена из UZSE/StockScope, поэтому ликвидность нельзя подтвердить численно.",
    },
    {
      icon: Banknote,
      title: "Оценка и прибыльность",
      text: `P/E: ${metrics.pe}, P/B: ${metrics.pb}, ROE: ${metrics.roe}, ROA: ${metrics.roa}. Если показатель пустой, в отчётности нет нормализованной строки для расчёта.`,
    },
    {
      icon: FileText,
      title: "Раскрытие",
      text: reportsCount ? `Найдено ${reportsCount} отчётов; последний период: ${metrics.reportDetail}. Дивидендных записей: ${dividendsCount}.` : "Свежая отчётность не подтверждена в текущем snapshot, нужен парсер openinfo.uz или документы эмитента.",
    },
  ];
}

function resolveSources(stock: Stock) {
  if (stock.source) {
    return [
      {
        source: stock.source,
        status: stock.sourceStatus,
        asOf: stock.asOf,
        market: undefined,
        detail: undefined,
        notes: undefined,
      } satisfies StockSourceMeta,
    ];
  }

  return [];
}

function resolveRiskTone(fundamentals: ReturnType<typeof resolveFundamentals>, stock: Stock) {
  if ((fundamentals.beta ?? 0) >= 1.5 || Math.abs(stock.change) >= 3) return "high";
  if ((fundamentals.beta ?? 0) >= 1 || Math.abs(stock.change) >= 1.2) return "medium";
  return "low";
}

function buildAisummary(stock: Stock, riskTone: string) {
  const toneWord = riskTone === "high" ? "более волатильная" : riskTone === "medium" ? "сбалансированная" : "защитная";
  return `${stock.name} выглядит как ${toneWord} идея для предварительного исследования. Перед выводом проверьте цену, маржинальность и качество источников.`;
}

function buildSignal(stock: Stock) {
  return stock.change >= 0 ? "позитивный импульс" : "под давлением";
}

function buildValuationLine(stock: Stock, fundamentals: ReturnType<typeof resolveFundamentals>) {
  const peLine = typeof fundamentals.pe === "number" && Number.isFinite(fundamentals.pe) ? `P/E ${formatNumber(fundamentals.pe)}` : "оценка требует уточнения";
  return `${stock.ticker}: ${peLine}, дивидендная доходность: ${fundamentals.dividendYield ?? "нет данных"}.`;
}

function buildRiskLine(stock: Stock, fundamentals: ReturnType<typeof resolveFundamentals>, riskTone: string) {
  return `Профиль риска: ${riskTone.toUpperCase()}. Рынок: ${stock.market ?? "не указан"}, валюта: ${stock.currency ?? "не указана"}, долг / капитал: ${fundamentals.debtToEquity ?? "нет данных"}.`;
}

function fallbackRiskFactors(stock: Stock, fundamentals: ReturnType<typeof resolveFundamentals>, riskTone: string): StockRiskFactor[] {
  return [
    {
      code: "liquidity",
      label: "Ликвидность",
      severity: stock.change >= 0 ? "medium" : "high",
      detail: stock.change >= 0 ? "Перед выбором размера позиции нужно проверить объём торгов и спред." : "Слабая динамика цены усиливает важность проверки ликвидности и спреда.",
    },
    {
      code: "disclosure",
      label: "Раскрытие",
      severity: stock.sourceStatus === "live" ? "low" : "medium",
      detail: stock.source ? `Основной источник: ${stock.source}.` : "Документы и раскрытие эмитента нужно проверить до инвестиционного тезиса.",
    },
    {
      code: "balance-sheet",
      label: "Баланс",
      severity: riskTone,
      detail: `Долг / капитал: ${fundamentals.debtToEquity ?? "нет данных"}.`,
    },
  ];
}

function seriesPointValue(point: number | string | null | [string | number, number | null]) {
  if (Array.isArray(point)) return typeof point[1] === "number" ? point[1] : null;
  if (typeof point === "number") return point;
  if (typeof point === "string") {
    const numeric = Number(point);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function formatKpiValue(key: string, value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  if (key.includes("Margin") || key === "ROE" || key === "ROA") return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
  return formatCompactValue(value);
}

function formatCompactValue(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
  if (abs >= 1_000) return `${(value / 1_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}K`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatPercentValue(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "нет данных";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

function formatNumber(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatStockPrice(stock: Stock) {
  if (!Number.isFinite(stock.price) || stock.price <= 0) return "N/A";
  if (stock.currency === "UZS") return `UZS ${stock.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${stock.price.toFixed(2)}`;
}

function formatStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatMarketLabel(stock: Stock) {
  return stock.market === "uzbekistan" || stock.currency === "UZS" ? "Узбекистан" : "Глобальный";
}

function ThesisLine({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
      <Icon className="mt-0.5 shrink-0 text-[#1e40af]" size={18} />
      <div>
        <p className="font-semibold text-[#0f172a]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#475569]">{text}</p>
      </div>
    </div>
  );
}

function DecisionList({ title, items }: { title: string; items?: string[] }) {
  return (
    <div className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">{title}</p>
      {items?.length ? (
        <ul className="mt-2 space-y-1 text-sm leading-6 text-[#475569]">
          {items.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#64748b]">Пока нет явного совпадения.</p>
      )}
    </div>
  );
}

function ChartPanel({ chart }: { chart?: StockScopeChart }) {
  const series = chart?.series?.filter((item) => item.data?.length) ?? [];
  if (!series.length) {
    return (
      <div className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
        <p className="text-sm font-semibold text-[#0f172a]">{chart?.title ?? "График"}</p>
        <p className="mt-3 text-sm text-[#64748b]">Точек для графика пока нет.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[#dbe4ef] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#0f172a]">{chart?.title ?? "График"}</p>
        <div className="flex flex-wrap gap-2">
          {series.slice(0, 3).map((item) => (
            <span key={item.name} className="rounded-full bg-[#eef2ff] px-2 py-1 text-[11px] font-semibold text-[#1e40af]">{item.name}</span>
          ))}
        </div>
      </div>
      <MiniSeriesChart series={series.slice(0, 3)} />
    </div>
  );
}

function MiniSeriesChart({ series }: { series: NonNullable<StockScopeChart["series"]> }) {
  const width = 620;
  const height = 180;
  const padding = 16;
  const colors = ["#0b63f6", "#16a34a", "#d97706"];
  const numericSeries = series.map((item) => ({
    name: item.name,
    values: item.data.map(seriesPointValue).filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
  }));
  const allValues = numericSeries.flatMap((item) => item.values);
  if (!allValues.length) {
    return <p className="mt-4 text-sm opacity-60">Нет данных для графика</p>;
  }
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const spread = max - min || 1;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-48 w-full overflow-visible">
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#e2e8f0" />
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#e2e8f0" />
      {numericSeries.map((item, seriesIndex) => {
        const step = (width - padding * 2) / Math.max(1, item.values.length - 1);
        const points = item.values
          .map((value, index) => {
            const x = padding + index * step;
            const y = height - padding - ((value - min) / spread) * (height - padding * 2);
            return `${x},${y}`;
          })
          .join(" ");
        return <polyline key={item.name} points={points} fill="none" stroke={colors[seriesIndex % colors.length]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </svg>
  );
}

function IndicatorGrid({ indicators }: { indicators?: StockScopeIndicatorPeriod[] }) {
  const latest = indicators?.[0];
  const values = latest?.values ?? {};
  const keys = ["ROE", "ROA", "GrossProfitMargin", "NetProfitMargin", "DebtToEquity", "CurrentRatio", "WorkingCapital", "Earnings"];

  return (
    <div className="rounded-[16px] border border-[#dbe4ef] bg-[#f8fafc] p-4">
      <p className="text-sm font-semibold text-[#0f172a]">Показатели эффективности</p>
      <p className="mt-1 text-xs text-[#64748b]">{latest?.period ?? "Последний период"} · ROE, ROA и коэффициенты StockScope</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {keys.map((key) => (
          <MetricChip key={key} label={key} value={formatKpiValue(key, values[key])} />
        ))}
      </div>
    </div>
  );
}

function StockScopeTables({ stock }: { stock: Stock }) {
  const earningsRows = stock.stockscope?.fundamentals?.earnings?.rows ?? [];
  const balanceRows = stock.stockscope?.fundamentals?.balanceSheet?.rows ?? [];
  const dividends = stock.stockscope?.dividends ?? [];
  const reports = stock.stockscope?.reports ?? [];

  return (
    <div className="grid gap-3">
      <MiniFinancialTable title="Строки отчёта о прибылях" rows={earningsRows.slice(0, 10)} />
      <MiniFinancialTable title="Строки баланса" rows={balanceRows.slice(0, 10)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FactsList title="Отчёты" items={reports.slice(0, 5).map((item) => `${item.period ?? item.type ?? "Отчёт"} · ${item.date ? formatStamp(item.date) : "дата не указана"}`)} />
        <FactsList title="Дивиденды" items={dividends.slice(0, 5).map((item) => `${formatCompactValue(item.commonDividend)} UZS · ${formatPercentValue(item.commonYield)}`)} />
      </div>
    </div>
  );
}

function MiniFinancialTable({ title, rows }: { title: string; rows: Array<{ id: string; label: string; values: Array<{ period?: string; value?: number | null }> }> }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#dbe4ef] bg-white">
      <div className="border-b border-[#e2e8f0] px-4 py-3 text-sm font-semibold text-[#0f172a]">{title}</div>
      <div className="max-h-72 overflow-auto">
        <table className="min-w-full text-sm">
          <tbody>
            {rows.map((row) => {
              const latest = row.values?.[0];
              return (
                <tr key={`${title}-${row.id}`} className="border-b border-[#f1f5f9] last:border-0">
                  <td className="px-4 py-2 text-xs font-semibold text-[#64748b]">{row.id}</td>
                  <td className="px-3 py-2 text-[#0f172a]">{row.label}</td>
                  <td className="tabular-data px-4 py-2 text-right font-semibold text-[#0f172a]">{formatCompactValue(latest?.value)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FactsList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[16px] border border-[#dbe4ef] bg-white p-4">
      <p className="text-sm font-semibold text-[#0f172a]">{title}</p>
      <div className="mt-2 space-y-1">
        {items.length ? items.map((item) => <p key={item} className="text-sm text-[#475569]">{item}</p>) : <p className="text-sm text-[#64748b]">Данных пока нет.</p>}
      </div>
    </div>
  );
}

function TradeHistory({ rows }: { rows: StockScopeTradingRow[] }) {
  const visibleRows = rows.slice(0, 12);
  if (!visibleRows.length) {
    return <p className="text-sm text-[#64748b]">История сделок появится после ежедневной загрузки UZSE: цена, объём в UZS и количество бумаг.</p>;
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead><tr><th>Дата</th><th>Цена</th><th>Объём, UZS</th><th>Бумаги</th></tr></thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={`${row.date}-${row.price ?? "na"}-${row.volumeUzs ?? "na"}`}>
              <td>{row.date}</td>
              <td>{row.price == null ? "—" : row.price.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}</td>
              <td>{row.volumeUzs == null ? "—" : row.volumeUzs.toLocaleString("ru-RU", { notation: "compact", maximumFractionDigits: 1 })}</td>
              <td>{row.volumePcs == null ? "—" : row.volumePcs.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourcePriorityTable({ stock }: { stock: Stock }) {
  const rows = [
    { priority: 1, source: "UZSE", purpose: "цены, сделки, листинг, торговая статистика", status: stock.stockscope?.tradingStats?.daily?.length ? "delayed" : "offline" },
    { priority: 2, source: "openinfo.uz", purpose: "финансовая отчётность эмитентов", status: stock.stockscope?.reports?.length ? "delayed" : "offline" },
    { priority: 3, source: "CBU", purpose: "курс валют, ставка ЦБ", status: "delayed" },
    { priority: 4, source: "stat.uz", purpose: "инфляция, ВВП, макро", status: "delayed" },
    { priority: 5, source: "StockScope", purpose: "UX-референс, KPI, проверка логики", status: stock.stockscope ? "delayed" : "offline" },
    { priority: 6, source: "Новости / сайты эмитентов", purpose: "события и раскрытие информации", status: stock.news?.length ? "delayed" : "offline" },
  ] as const;

  return (
    <div className="mb-3 overflow-hidden rounded-[16px] border border-[#dbe4ef] bg-white">
      <div className="border-b border-[#e2e8f0] px-4 py-3 text-sm font-semibold text-[#0f172a]">Приоритет источников</div>
      <table className="min-w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.source} className="border-b border-[#f1f5f9] last:border-0">
              <td className="px-4 py-2 text-xs font-semibold text-[#64748b]">{row.priority}</td>
              <td className="px-3 py-2 font-semibold text-[#0f172a]">{row.source}</td>
              <td className="px-3 py-2 text-[#475569]">{row.purpose}</td>
              <td className="px-4 py-2"><SourceStatusBadge source={row.source} status={row.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dbe4ef] bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <p className="tabular-data mt-1 text-sm font-semibold text-[#0f172a]">{value}</p>
    </div>
  );
}

function RiskChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dbe4ef] bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <p className="tabular-data mt-1 text-sm font-semibold text-[#0f172a]">{value}</p>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#93a4ba]">{label}</p>
      <p className="tabular-data mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
