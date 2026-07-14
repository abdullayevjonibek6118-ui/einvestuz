import Link from "next/link";
import { ArrowRight, Bell, BriefcaseBusiness, CircleUserRound, DatabaseZap, GitCompareArrows, ShieldCheck, Star } from "lucide-react";
import { SourceStatusBadge } from "@/components/ui";
import { getStockScopeScreener } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Личный кабинет и Watchlist",
  description: "Рабочее пространство пользователя EInvest: watchlist, портфель, сравнение и контроль источников.",
  path: "/profile",
  noIndex: true,
});

export default async function ProfilePage() {
  const screener = await getStockScopeScreener({ limit: 6, sort_by: "volume_30d", sort_dir: "desc" });
  const watchlistCandidates = screener.items.filter((item) => item.ticker).slice(0, 4);
  const coverage = screener.coverage;

  return (
    <div className="stitch-page">
      <section className="stitch-page-hero">
        <div>
          <span><CircleUserRound size={18} aria-hidden="true" /> EINVEST WORKSPACE</span>
          <h1>Личный кабинет и Watchlist</h1>
          <p>
            Один экран для избранных компаний, учебного портфеля и быстрых переходов к анализу.
            Рыночные кандидаты ниже подтягиваются из StockScope, без фиктивных позиций.
          </p>
        </div>
        <Link className="stitch-button stitch-button-secondary" href="/portfolio">
          Открыть портфель <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <section className="stitch-profile-grid">
        <article className="stitch-profile-card stitch-profile-card-primary">
          <div>
            <span className="stitch-card-icon"><BriefcaseBusiness size={22} aria-hidden="true" /></span>
            <h2>Портфель в этом браузере</h2>
            <p>
              Позиции и watchlist сохраняются локально в браузере пользователя. Сервер не подменяет их моками и не создаёт
              “примерные” сделки.
            </p>
          </div>
          <Link className="stitch-card-link" href="/portfolio">
            Перейти к позициям <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </article>

        <article className="stitch-profile-card">
          <span className="stitch-card-icon"><DatabaseZap size={22} aria-hidden="true" /></span>
          <h2>Покрытие данных</h2>
          <dl className="stitch-profile-metrics">
            <div><dt>Эмитентов</dt><dd>{coverage?.total ?? screener.total}</dd></div>
            <div><dt>С отчётами</dt><dd>{coverage?.withReports ?? "—"}</dd></div>
            <div><dt>С ценами</dt><dd>{coverage?.withPriceHistory ?? "—"}</dd></div>
          </dl>
          <SourceStatusBadge source="StockScope" status="delayed" />
        </article>

        <article className="stitch-profile-card">
          <span className="stitch-card-icon"><ShieldCheck size={22} aria-hidden="true" /></span>
          <h2>Auth-слой</h2>
          <p>
            Для серверного профиля нужны авторизация, база пользователей и согласие на хранение персональных настроек.
            До этого кабинет не имитирует личные данные.
          </p>
          <Link className="stitch-card-link" href="/ai">
            Проверить через AI <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Watchlist-кандидаты по ликвидности</h2>
            <span>Компании из живого скринера: удобно добавить в локальный портфель или сравнение.</span>
          </div>
          <Star size={18} className="text-[#0041cd]" fill="currentColor" aria-hidden="true" />
        </div>
        <div className="stitch-watchlist-grid">
          {watchlistCandidates.map((stock) => (
            <Link key={stock.ticker} href={`/stocks/${stock.ticker}`} className="stitch-watchlist-row">
              <span>{stock.ticker.slice(0, 2)}</span>
              <div>
                <b>{stock.ticker}</b>
                <small>{stock.name}</small>
              </div>
              <strong>{formatMoney(stock.currentPrice)}</strong>
            </Link>
          ))}
        </div>
        {!watchlistCandidates.length ? (
          <div className="stitch-empty">
            <Bell size={24} aria-hidden="true" />
            <b>Скринер не вернул компании</b>
            <span>Когда источник станет доступен, кандидаты появятся автоматически.</span>
          </div>
        ) : null}
      </section>

      <section className="stitch-profile-actions">
        <Link href={`/compare?tickers=${encodeURIComponent(watchlistCandidates.map((item) => item.ticker).slice(0, 3).join(","))}`}>
          <GitCompareArrows size={19} aria-hidden="true" />
          <span>
            <b>Сравнить watchlist</b>
            <small>Открыть матрицу показателей</small>
          </span>
        </Link>
        <Link href="/news">
          <Bell size={19} aria-hidden="true" />
          <span>
            <b>Новости и события</b>
            <small>Локальные макро-новости и рынок</small>
          </span>
        </Link>
        <Link href="/industries">
          <DatabaseZap size={19} aria-hidden="true" />
          <span>
            <b>Отрасли</b>
            <small>Группировка эмитентов</small>
          </span>
        </Link>
      </section>
    </div>
  );
}

function formatMoney(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} UZS`;
}
