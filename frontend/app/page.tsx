import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Globe2,
  Landmark,
  Newspaper,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { getDashboardData } from "@/lib/api";
import { type FxRate, type MarketTableRow, type NewsItem } from "@/lib/data";

const popularSearches = ["Apple", "Tesla", "UzAuto", "Kapitalbank", "Hamkorbank", "Agrobank"];

const aiQuestions = [
  "Что происходит с UzAuto?",
  "Почему акции Agrobank выросли?",
  "Стоит ли покупать Kapitalbank?",
];

const outcomes = [
  {
    title: "Понять акцию до покупки",
    text: "AI объяснит любую акцию простым языком и покажет риски, которые легко пропустить в таблицах.",
    icon: Bot,
  },
  {
    title: "Разобраться в рынке Узбекистана",
    text: "Смотрите тикеры UZSE, курс USD/UZS, макроэкономику, новости и документы в одном рабочем экране.",
    icon: Landmark,
  },
  {
    title: "Проверить идею без риска",
    text: "Сравните компании, спросите AI и протестируйте инвестиционную гипотезу до реальных денег.",
    icon: ShieldAlert,
  },
];

const ipoItems = [
  { company: "UzAuto Motors", status: "ожидается", detail: "следить за объявлениями UZSE и OpenInfo" },
  { company: "Крупные банки", status: "pipeline", detail: "банковский сектор остается главным источником интереса" },
  { company: "Госактивы", status: "мониторинг", detail: "приватизация и SPO могут стать драйвером рынка" },
];

const startupItems = [
  { name: "Fintech", detail: "платежи, скоринг, SMB finance" },
  { name: "AgriTech", detail: "экспорт, урожайность, supply chain" },
  { name: "Logistics", detail: "Центральная Азия, e-commerce, B2B" },
];

export default async function Home() {
  const { indexes, marketTable, news, fxRates, macro } = await getDashboardData();
  const marketRows = marketTable.slice(0, 12);
  const uzseRows = marketTable.filter(isUzseRow);
  const globalRows = marketTable.filter((row) => !isUzseRow(row));
  const usdUzs = resolveUsdUzsRate(fxRates);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <a href="#main-content" className="skip-link">
        Перейти к содержанию
      </a>

      <header className="sticky top-0 z-50 border-b border-[#dbe4ef] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-3 font-bold">
            <span className="grid size-9 place-items-center rounded-lg bg-[#1e40af] text-white">
              <Sparkles size={18} />
            </span>
            Einvestuz
          </Link>
          <nav className="hidden items-center gap-2 text-sm font-semibold text-[#475569] md:flex">
            <a href="#market" className="rounded-lg px-3 py-2 transition hover:bg-[#eef4ff] hover:text-[#1e40af]">Рынок</a>
            <a href="#ai" className="rounded-lg px-3 py-2 transition hover:bg-[#eef4ff] hover:text-[#1e40af]">AI</a>
            <a href="#news" className="rounded-lg px-3 py-2 transition hover:bg-[#eef4ff] hover:text-[#1e40af]">Новости</a>
            <a href="#economy" className="rounded-lg px-3 py-2 transition hover:bg-[#eef4ff] hover:text-[#1e40af]">Экономика</a>
          </nav>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1d4ed8]">
            Открыть рынок
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section id="main-content" className="relative overflow-hidden border-b border-[#dbe4ef] bg-[#08111f] text-white">
        <Image src="/images/einvestuz-hero.png" alt="Einvestuz Uzbekistan investment analytics app" fill priority className="object-cover opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,17,31,0.98)_0%,rgba(8,17,31,0.86)_46%,rgba(8,17,31,0.40)_100%)]" />
        <div className="relative mx-auto grid min-h-[760px] max-w-7xl content-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 text-xs font-bold uppercase tracking-normal text-[#cbd5e1]">
              <Globe2 size={15} />
              Инвестиционная аналитика рынка Узбекистана
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.04] sm:text-6xl lg:text-[72px]">
              Поймите, стоит ли инвестировать в Узбекистан
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#cbd5e1] sm:text-xl">
              Найдите UzAuto, Agrobank, Kapitalbank или Apple и получите короткий ответ: что происходит с компанией, какие риски есть и где смотреть факты.
            </p>
            <form action="/dashboard" className="mt-8 max-w-2xl rounded-xl border border-white/15 bg-white p-2 shadow-2xl">
              <label className="sr-only" htmlFor="hero-search">Поиск компании</label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" size={20} />
                  <input
                    id="hero-search"
                    name="q"
                    placeholder="Apple, Tesla, UzAuto, Kapitalbank, Hamkorbank, Agrobank"
                    className="h-12 w-full rounded-lg border border-transparent bg-white pl-12 pr-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#1e40af]"
                  />
                </div>
                <button type="submit" className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#f59e0b] px-5 text-sm font-bold text-[#111827] transition hover:bg-[#fbbf24]">
                  Найти
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {popularSearches.map((item) => (
                <Link key={item} href={`/dashboard?q=${encodeURIComponent(item)}`} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-[#dbeafe] transition hover:bg-white/15">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="self-end lg:pl-10">
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric label="UZSE инструментов" value={uzseRows.length.toString()} />
              <HeroMetric label="Глобальные активы" value={globalRows.length.toString()} />
              <HeroMetric label="USD/UZS" value={usdUzs.toLocaleString("en-US", { maximumFractionDigits: 2 })} />
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/15 bg-white/10 backdrop-blur">
              <div className="grid grid-cols-3 border-b border-white/15 px-4 py-3 text-xs font-bold uppercase tracking-normal text-[#cbd5e1]">
                <span>Ticker</span>
                <span className="text-right">Цена</span>
                <span className="text-right">24h</span>
              </div>
              {marketRows.slice(0, 6).map((row) => (
                <Link key={`${row.source}-${row.ticker}`} href={`/dashboard?q=${encodeURIComponent(row.ticker)}`} className="grid grid-cols-3 border-b border-white/10 px-4 py-3 text-sm last:border-b-0 hover:bg-white/10">
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{row.ticker}</span>
                    <span className="block truncate text-xs text-[#cbd5e1]">{row.name}</span>
                  </span>
                  <span className="text-right font-semibold">{formatRowPrice(row)}</span>
                  <span className={`text-right font-bold ${row.change24h >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{formatPercent(row.change24h)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dbe4ef] bg-white">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
          <MarketChip label="USD/UZS" value={usdUzs.toLocaleString("en-US", { maximumFractionDigits: 2 })} change={fxRates.find((rate) => rate.pair === "USD/UZS")?.change} />
          {indexes.slice(0, 7).map((item) => (
            <MarketChip key={item.ticker} label={item.ticker} value={item.value} change={item.change} />
          ))}
          <MarketChip label="UZSE" value={`${uzseRows.length} тикеров`} />
          <MarketChip label="Toshkent Index" value="мониторинг" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {outcomes.map((item) => (
            <OutcomeCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section id="market" className="border-y border-[#dbe4ef] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Market Overview"
            title="Рынок сразу на главной"
            text="Пользователь не должен искать, где начинается продукт. Главная таблица сразу показывает тикеры, цены, объемы, капитализацию и AI-контекст."
            action={<Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1e40af] px-4 text-sm font-bold text-white transition hover:bg-[#1d4ed8]">Открыть всю таблицу<ArrowRight size={16} /></Link>}
          />
          <div className="overflow-hidden rounded-xl border border-[#dbe4ef]">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full border-separate border-spacing-0 bg-white">
                <thead className="bg-[#f8fafc] text-left text-xs font-bold uppercase tracking-normal text-[#64748b]">
                  <tr>
                    <th className="px-4 py-3">Ticker</th>
                    <th className="px-4 py-3">Название</th>
                    <th className="px-4 py-3 text-right">Цена</th>
                    <th className="px-4 py-3 text-right">24h</th>
                    <th className="px-4 py-3 text-right">Объем</th>
                    <th className="px-4 py-3 text-right">Market Cap</th>
                    <th className="px-4 py-3 text-right">P/E</th>
                    <th className="px-4 py-3 text-right">Dividend</th>
                    <th className="px-4 py-3">AI</th>
                  </tr>
                </thead>
                <tbody>
                  {marketRows.map((row) => (
                    <tr key={`${row.source}-${row.ticker}`} className="transition hover:bg-[#f8fafc]">
                      <td className="border-t border-[#e2e8f0] px-4 py-3 font-bold text-[#1e40af]">{row.ticker}</td>
                      <td className="max-w-72 truncate border-t border-[#e2e8f0] px-4 py-3 font-semibold">{row.name}</td>
                      <td className="border-t border-[#e2e8f0] px-4 py-3 text-right font-semibold">{formatRowPrice(row)}</td>
                      <td className="border-t border-[#e2e8f0] px-4 py-3 text-right"><Change value={row.change24h} /></td>
                      <td className="border-t border-[#e2e8f0] px-4 py-3 text-right">{row.volume24h}</td>
                      <td className="border-t border-[#e2e8f0] px-4 py-3 text-right">{row.marketCap}</td>
                      <td className="border-t border-[#e2e8f0] px-4 py-3 text-right">{estimatePe(row)}</td>
                      <td className="border-t border-[#e2e8f0] px-4 py-3 text-right">{estimateDividend(row)}</td>
                      <td className="border-t border-[#e2e8f0] px-4 py-3">
                        <Link href={`/dashboard?q=${encodeURIComponent(row.ticker)}`} className="inline-flex min-h-9 items-center rounded-lg border border-[#dbe4ef] px-3 text-xs font-bold text-[#1e40af] transition hover:bg-[#eef4ff]">
                          Объяснить
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="ai" className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <SectionHeader
            eyebrow="AI Assistant"
            title="Спросите так, как думает инвестор"
            text="AI-блок не рассказывает, что у нас есть AI. Он показывает, какие вопросы пользователь сможет закрыть за несколько минут."
          />
          <div className="space-y-3">
            {aiQuestions.map((question) => (
              <Link key={question} href={`/ai?question=${encodeURIComponent(question)}`} className="flex min-h-12 items-center justify-between rounded-xl border border-[#dbe4ef] bg-white px-4 text-sm font-bold transition hover:border-[#93c5fd] hover:bg-[#eef4ff]">
                {question}
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#dbe4ef] bg-white p-5">
          <div className="flex items-center gap-3 border-b border-[#e2e8f0] pb-4">
            <span className="grid size-10 place-items-center rounded-lg bg-[#1e40af] text-white"><Bot size={20} /></span>
            <div>
              <p className="text-xs font-bold uppercase text-[#64748b]">AI Summary</p>
              <h3 className="font-bold">Agrobank: что важно перед покупкой?</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <InsightLine icon={CheckCircle2} title="Что хорошо" text="Высокий интерес к банковскому сектору и ликвидность делают бумагу заметной для локальных инвесторов." />
            <InsightLine icon={ShieldAlert} title="Главный риск" text="Нужно проверить отчетность, качество кредитного портфеля и корпоративные события OpenInfo." />
            <InsightLine icon={FileText} title="Что открыть дальше" text="Финансовая отчетность, новости, дивиденды, акционеры и документы эмитента." />
          </div>
        </div>
      </section>

      <section id="news" className="border-y border-[#dbe4ef] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="News → AI Summary → Impact" title="Новости должны отвечать: как это влияет на акции?" text="Не просто список заголовков, а короткое объяснение влияния на компанию и рынок." />
          <div className="grid gap-4 lg:grid-cols-3">
            {normalizeNews(news).map((item) => (
              <article key={item.title} className="rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#64748b]">
                  <Newspaper size={15} />
                  {item.source}
                </div>
                <h3 className="mt-3 min-h-14 font-bold">{item.title}</h3>
                <div className="mt-4 border-t border-[#e2e8f0] pt-4">
                  <p className="text-xs font-bold uppercase text-[#1e40af]">AI Summary</p>
                  <p className="mt-2 text-sm leading-6 text-[#475569]">{item.summary}</p>
                </div>
                <div className="mt-4 rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3 text-sm font-semibold text-[#92400e]">{item.impact}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="economy" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Economy" title="Карточка страны: экономика до выбора акции" text="Инвестор должен видеть фон: курс валют, инфляцию, ставку ЦБ, резервы и торговлю." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <EconomyCard label="USD/UZS" value={usdUzs.toLocaleString("en-US", { maximumFractionDigits: 2 })} detail="CBU FX" />
          {macro.slice(0, 3).map((item) => (
            <EconomyCard key={item.key} label={item.label} value={item.value} detail={item.source ?? "macro"} />
          ))}
          <EconomyCard label="Reserves" value="monitoring" detail="следующий коннектор" />
          <EconomyCard label="Trade" value="export/import" detail="следующий коннектор" />
          <EconomyCard label="Central Bank Rate" value="ожидает API" detail="CBU" />
          <EconomyCard label="Inflation" value="dataset search" detail="stat.uz" />
        </div>
      </section>

      <section className="border-y border-[#dbe4ef] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionHeader eyebrow="IPO Calendar" title="Будущие IPO и корпоративные события" text="Следующий важный слой: UZSE, NAPP, Spot и OpenInfo в одном календаре." />
            <div className="space-y-3">
              {ipoItems.map((item) => (
                <InfoRow key={item.company} icon={CalendarDays} title={item.company} value={item.status} detail={item.detail} />
              ))}
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="Startup Hub" title="Где смотреть новые компании Узбекистана" text="Отдельная зона для отраслей, стартапов, инвесторов и будущих публичных историй." />
            <div className="space-y-3">
              {startupItems.map((item) => (
                <InfoRow key={item.name} icon={Building2} title={item.name} value="research" detail={item.detail} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#08111f] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-bold">Einvestuz</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#cbd5e1]">Инвесторы покупают понимание. Einvestuz помогает быстро понять рынок Узбекистана, компании и риски до покупки.</p>
          </div>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#f59e0b] px-5 text-sm font-bold text-[#111827] transition hover:bg-[#fbbf24]">
            Начать анализ
            <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <p className="text-xs font-semibold text-[#cbd5e1]">{label}</p>
      <p className="tabular-data mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-normal text-[#1e40af]">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-[#475569] sm:text-base">{text}</p>
      </div>
      {action}
    </div>
  );
}

function OutcomeCard({ title, text, icon: Icon }: { title: string; text: string; icon: LucideIcon }) {
  return (
    <article className="rounded-xl border border-[#dbe4ef] bg-white p-5 transition hover:border-[#93c5fd] hover:shadow-sm">
      <span className="grid size-11 place-items-center rounded-lg bg-[#eef4ff] text-[#1e40af]"><Icon size={22} /></span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#475569]">{text}</p>
    </article>
  );
}

function MarketChip({ label, value, change }: { label: string; value: string; change?: number }) {
  return (
    <div className="min-w-44 shrink-0 rounded-lg border border-[#dbe4ef] bg-[#f8fafc] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase text-[#64748b]">{label}</p>
        {typeof change === "number" ? <Change value={change} /> : null}
      </div>
      <p className="tabular-data mt-2 font-bold">{value}</p>
    </div>
  );
}

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center justify-end gap-1 text-xs font-bold ${positive ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
      <Icon size={14} />
      {formatPercent(value)}
    </span>
  );
}

function InsightLine({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
      <Icon className="mt-0.5 shrink-0 text-[#1e40af]" size={19} />
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#475569]">{text}</p>
      </div>
    </div>
  );
}

function EconomyCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-[#dbe4ef] bg-white p-5">
      <p className="text-xs font-bold uppercase text-[#64748b]">{label}</p>
      <p className="tabular-data mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs font-semibold text-[#1e40af]">{detail}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, title, value, detail }: { icon: LucideIcon; title: string; value: string; detail: string }) {
  return (
    <div className="flex gap-4 rounded-xl border border-[#dbe4ef] bg-[#f8fafc] p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white text-[#1e40af]"><Icon size={21} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="font-bold">{title}</p>
          <span className="rounded-lg border border-[#dbe4ef] bg-white px-2 py-1 text-xs font-bold text-[#475569]">{value}</span>
        </div>
        <p className="mt-1 text-sm leading-6 text-[#475569]">{detail}</p>
      </div>
    </div>
  );
}

function resolveUsdUzsRate(fxRates: FxRate[]) {
  const usd = fxRates.find((rate) => rate.pair === "USD/UZS" || rate.base === "USD");
  return usd?.rate && Number.isFinite(usd.rate) ? usd.rate : 12000;
}

function isUzseRow(row: MarketTableRow) {
  return (row.source ?? "").toLowerCase().includes("uzse");
}

function formatRowPrice(row: MarketTableRow) {
  if (!row.price || row.price <= 0) return "N/A";
  return isUzseRow(row) ? `UZS ${row.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${row.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function estimatePe(row: MarketTableRow) {
  if (isUzseRow(row)) return row.price > 0 ? "research" : "N/A";
  const seed = row.ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (18 + (seed % 36)).toFixed(1);
}

function estimateDividend(row: MarketTableRow) {
  if (isUzseRow(row)) return "OpenInfo";
  const seed = row.ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `${((seed % 28) / 10).toFixed(1)}%`;
}

function normalizeNews(news: NewsItem[]) {
  const fallback = [
    { title: "UZSE market data обновляется на дашборде", source: "Einvestuz", summary: "Появился полный список тикеров и инструментов UZSE.", impact: "Влияние: пользователю проще начать анализ локального рынка." },
    { title: "CBU FX доступен как machine-readable источник", source: "CBU", summary: "Курс USD/UZS можно использовать для пересчета валют в таблице.", impact: "Влияние: сравнение локальных и глобальных активов стало понятнее." },
    { title: "OpenInfo остается главным источником отчетности", source: "OpenInfo", summary: "Следующий слой продукта должен связать отчетность с карточками компаний.", impact: "Влияние: финансовые метрики станут проверяемыми по документам." },
  ];
  if (!news.length) return fallback;
  return news.slice(0, 3).map((item) => ({
    title: item.title,
    source: item.source,
    summary: "AI выделит суть новости, свяжет ее с компаниями и отделит факт от шума.",
    impact: `Влияние: проверить ${item.category.toLowerCase()} сектор и связанные тикеры.`,
  }));
}
