import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  MapPinned,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";

const marketBar = [
  { name: "S&P 500", value: "6,112.34", change: 0.42 },
  { name: "NASDAQ", value: "19,841.20", change: 0.77 },
  { name: "Биткоин", value: "$103,420", change: 1.64 },
  { name: "Золото", value: "$3,318", change: -0.31 },
  { name: "Нефть", value: "$71.90", change: 0.25 },
  { name: "USD/UZS", value: "12,640", change: -0.18 },
  { name: "Ставка ЦБ РУз", value: "14.0%", change: 0 },
];

const popularStocks = [
  { ticker: "AAPL", company: "Apple", price: "$214.32", change: 0.84, risk: "Средний", score: 78 },
  { ticker: "MSFT", company: "Microsoft", price: "$467.81", change: 0.51, risk: "Низкий", score: 86 },
  { ticker: "NVDA", company: "Nvidia", price: "$142.67", change: 2.18, risk: "Высокий", score: 84 },
  { ticker: "TSLA", company: "Tesla", price: "$331.45", change: -1.34, risk: "Высокий", score: 62 },
  { ticker: "AMZN", company: "Amazon", price: "$196.88", change: -0.29, risk: "Средний", score: 76 },
];

const struggles = [
  { title: "Слишком много финансовых терминов", text: "AI объясняет оценку, маржу и волатильность простым языком.", icon: Brain },
  { title: "Слишком много компаний и новостей", text: "Фокусный список наблюдения держит мировых лидеров и локальный контекст в одном месте.", icon: Search },
  { title: "Сложно понять риски", text: "Каждый разбор акции отделяет сильные стороны от рисков оценки и рынка.", icon: ShieldAlert },
  { title: "Страх потерять деньги", text: "Виртуальный портфель помогает тестировать идеи до использования реального капитала.", icon: WalletCards },
];

const features = [
  { title: "AI-аналитик", text: "Объясняет компании простым языком.", icon: Bot },
  { title: "Виртуальный портфель", text: "Позволяет тестировать идеи без реальных денег.", icon: BriefcaseBusiness },
  { title: "Мониторинг рынков", text: "Помогает следить за глобальными рынками и Узбекистаном.", icon: BarChart3 },
  { title: "Инвестиционная академия", text: "Обучает на реальных компаниях и примерах.", icon: GraduationCap },
];

const uzbekistanHub = [
  { label: "Курс USD/UZS", value: "12,640", change: "-0.18%" },
  { label: "Инфляция", value: "10.6%", change: "наблюдать" },
  { label: "Ставка Центрального банка", value: "14.0%", change: "стабильно" },
  { label: "Последние IPO", value: "3", change: "в планах" },
  { label: "Новости рынка капитала", value: "18", change: "сегодня" },
  { label: "Компании Узбекистана", value: "42", change: "отслеживаются" },
];

const insights = [
  {
    title: "Акция дня",
    headline: "Nvidia остается лидером AI-инфраструктуры",
    text: "Рост сильный, но оценка требует дисциплины перед тем, как новичок добавит крупную позицию.",
    tag: "AI-оценка 84",
  },
  {
    title: "Сигнал риска",
    headline: "Волатильность Tesla остается высокой",
    text: "Колебания цены могут перекрывать долгосрочную историю, поэтому размер позиции важнее хайпа.",
    tag: "Высокий риск",
  },
  {
    title: "Компания для наблюдения",
    headline: "Microsoft сочетает AI и сильный денежный поток",
    text: "Рост облака, корпоративный спрос и устойчивая маржа делают компанию понятной для изучения новичками.",
    tag: "AI-оценка 86",
  },
];

const academyTopics = ["Акции", "ETF", "Дивиденды", "Отраслевой анализ", "Конкурентные преимущества", "Риск-менеджмент"];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0B1426] text-white">
      <a href="#main-content" className="skip-link">
        Перейти к содержанию
      </a>

      <header className="sticky top-0 z-50 border-b border-[#2A3441] bg-[#0B1426]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-base font-semibold">
            <span className="grid size-9 place-items-center rounded-lg border border-[#2A3441] bg-[#171F2F] text-[#3861FB]">
              <Sparkles size={18} />
            </span>
            Einvestuz
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#A0AEC0] md:flex" aria-label="Навигация лендинга">
            <a href="#stocks" className="hover:text-white">Популярные акции</a>
            <a href="#uzbekistan" className="hover:text-white">Узбекистан</a>
            <a href="#academy" className="hover:text-white">Академия</a>
          </nav>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#3861FB] px-4 py-2 text-sm font-semibold transition hover:bg-[#2f54df]">
            Открыть Einvestuz
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section id="main-content" className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-18">
        <div className="order-2 flex flex-col justify-center lg:order-1">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-lg border border-[#2A3441] bg-[#171F2F] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#A0AEC0]">
            <Bot size={15} className="text-[#3861FB]" />
            AI-инвесткопилот для Узбекистана
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-[62px]">
            Поймите любую акцию за 60 секунд с AI
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#A0AEC0] sm:text-lg">
            Следите за Apple, Nvidia, Tesla и рынком Узбекистана в одном месте. Получайте AI-анализ акций, понимайте риски до инвестирования и собирайте виртуальные портфели без реальных денег.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/portfolio" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#3861FB] px-6 py-3 text-sm font-bold transition hover:bg-[#2f54df]">
              Создать виртуальный портфель
              <ArrowRight size={17} />
            </Link>
            <Link href="/ai" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#2A3441] bg-[#171F2F] px-6 py-3 text-sm font-bold transition hover:border-[#3861FB] hover:bg-[#1d2940]">
              Спросить AI об акции
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["500+ компаний", "AI-анализ за 10 секунд", "Рынки США и Узбекистана", "Без реальных денег"].map((item) => (
              <div key={item} className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-3 text-xs font-semibold leading-5 text-[#D7DEE8]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <AICopilotCard />
        </div>
      </section>

      <section className="border-y border-[#2A3441] bg-[#11182A]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8" aria-label="Живая рыночная лента">
          <div className="sticky left-0 z-10 shrink-0 rounded-lg border border-[#2A3441] bg-[#171F2F] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#A0AEC0]">
            Живые рынки
          </div>
          {marketBar.map((item) => (
            <MarketTicker key={item.name} {...item} />
          ))}
        </div>
      </section>

      <section id="stocks" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Популярные акции" title="Компании, за которыми чаще всего следят начинающие инвесторы." text="Табличная структура в духе финансовых агрегаторов: понятная AI-оценка, риск и движение цены." />
        <div className="overflow-hidden rounded-lg border border-[#2A3441] bg-[#171F2F]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-[#11182A] text-left text-xs uppercase tracking-wide text-[#A0AEC0]">
                <tr>
                  <th className="px-4 py-4 font-semibold sm:px-6">Компания</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">Цена</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">Изменение 24ч</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">Уровень риска</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">AI-оценка</th>
                </tr>
              </thead>
              <tbody>
                {popularStocks.map((stock) => (
                  <tr key={stock.ticker} tabIndex={0} className="group cursor-pointer outline-none transition hover:bg-[#1C273A] focus-visible:bg-[#1C273A] focus-visible:shadow-[inset_0_0_0_2px_#3861FB]">
                    <td className="border-t border-[#2A3441] px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-lg bg-[#11182A] text-sm font-bold">{stock.ticker.slice(0, 1)}</span>
                        <div>
                          <p className="font-semibold">{stock.company}</p>
                          <p className="text-xs text-[#A0AEC0]">{stock.ticker}</p>
                        </div>
                      </div>
                    </td>
                    <td className="border-t border-[#2A3441] px-4 py-4 font-semibold sm:px-6">{stock.price}</td>
                    <td className="border-t border-[#2A3441] px-4 py-4 sm:px-6"><Change value={stock.change} /></td>
                    <td className="border-t border-[#2A3441] px-4 py-4 sm:px-6"><RiskBadge value={stock.risk} /></td>
                    <td className="border-t border-[#2A3441] px-4 py-4 sm:px-6">
                      <div className="flex min-w-36 items-center gap-3">
                        <span className="tabular-data w-12 font-semibold">{stock.score}/100</span>
                        <span className="h-2 flex-1 rounded-full bg-[#0B1426]">
                          <span className="block h-2 rounded-full bg-[#3861FB]" style={{ width: `${stock.score}%` }} />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Почему инвестировать сложно" title="Почему большинство новичков сталкиваются с трудностями?" text="Главная проблема не в отсутствии графиков, а в том, что непонятно, какой сигнал важен и что именно означает риск." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {struggles.map((item) => <InfoCard key={item.title} {...item} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Как помогает Einvestuz" title="Принимайте более осознанные инвестиционные решения" text="Продукт превращает рыночные данные в короткие объяснения, практику и уроки, которые помогают набрать уверенность." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((item) => <InfoCard key={item.title} {...item} />)}
        </div>
      </section>

      <section id="uzbekistan" className="border-y border-[#2A3441] bg-[#11182A]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-6">
            <div className="mb-5 h-1 rounded-full bg-[linear-gradient(90deg,#2FA7DF_0_34%,#FFFFFF_34%_42%,#EA3943_42%_46%,#16C784_46%_100%)]" />
            <SectionHeader eyebrow="Центр рынка Узбекистана" title="Глобальные инвестиции с локальным контекстом." text="Локальный хаб для курса валют, инфляции, политики Центрального банка, IPO, новостей рынка капитала и компаний Узбекистана." compact />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {uzbekistanHub.map((item) => (
                <div key={item.label} className="rounded-lg border border-[#2A3441] bg-[#11182A] p-4">
                  <p className="text-xs font-medium text-[#A0AEC0]">{item.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="tabular-data text-2xl font-bold">{item.value}</p>
                    <span className="rounded-md border border-[#2A3441] px-2 py-1 text-xs font-semibold text-[#A0AEC0]">{item.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#A0AEC0]">Локальный срез</p>
                <h3 className="mt-1 text-xl font-semibold">USD/UZS и уверенность рынка</h3>
              </div>
              <MapPinned className="text-[#3861FB]" size={24} />
            </div>
            <div className="mt-8 h-56 rounded-lg border border-[#2A3441] bg-[#0B1426] p-4">
              <div className="flex h-full items-end gap-2" aria-label="Малый рыночный график">
                {[36, 42, 38, 48, 55, 52, 64, 59, 70, 76, 72, 82].map((height, index) => (
                  <span key={index} className="flex-1 rounded-t bg-[#3861FB]" style={{ height: `${height}%`, opacity: 0.35 + index * 0.04 }} />
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#A0AEC0]">
              Этот блок сразу показывает локальную релевантность: перед пользователем не обычный скринер акций с переводом интерфейса, а продукт с учетом Узбекистана.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="AI-инсайты" title="AI-инсайты на сегодня" text="Короткие динамичные карточки показывают, как Einvestuz объясняет возможности и риски до того, как новичок инвестирует." />
        <div className="grid gap-4 lg:grid-cols-3">
          {insights.map((item) => (
            <article key={item.title} className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-5 transition hover:border-[#3861FB]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#A0AEC0]">{item.title}</p>
                <span className="rounded-md border border-[#3861FB]/40 bg-[#3861FB]/10 px-2 py-1 text-xs font-semibold text-[#8FA7FF]">{item.tag}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{item.headline}</h3>
              <p className="mt-3 text-sm leading-6 text-[#A0AEC0]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#2A3441] bg-[#11182A]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <SectionHeader eyebrow="Превью виртуального портфеля" title="Практикуйтесь перед инвестированием" text="Реалистичный виджет портфеля помогает новичкам учиться на практике до использования реальных денег." compact />
            <Link href="/portfolio" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#3861FB] px-6 py-3 text-sm font-bold transition hover:bg-[#2f54df]">
              Собрать мой портфель
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Metric label="Стоимость портфеля" value="$10,000" />
              <Metric label="Доходность" value="+12.4%" positive />
            </div>
            <div className="mt-6 space-y-3">
              {["Nvidia", "Microsoft", "ETF на S&P 500"].map((holding, index) => (
                <div key={holding} className="rounded-lg border border-[#2A3441] bg-[#11182A] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{holding}</p>
                    <p className="text-sm text-[#A0AEC0]">{[38, 34, 28][index]}%</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-[#0B1426]">
                    <div className="h-2 rounded-full bg-[#16C784]" style={{ width: `${[38, 34, 28][index]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="academy" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Инвестиционная академия" title="Учитесь инвестировать через практику" text="Уроки используют реальные компании и упражнения с портфелем вместо отдельных сухих определений." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {academyTopics.map((topic, index) => (
            <article key={topic} className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-5">
              <BookOpen size={20} className="text-[#3861FB]" />
              <h3 className="mt-4 font-semibold">{topic}</h3>
              <p className="mt-2 text-sm leading-6 text-[#A0AEC0]">{12 + index * 3} минут обучения на примере реального рынка.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-8 text-center">
          <h2 className="text-3xl font-bold sm:text-5xl">Начните инвестировать без риска</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#A0AEC0] sm:text-base">
            Разбирайтесь в компаниях, задавайте вопросы AI и тестируйте инвестиционные идеи до использования реальных денег.
          </p>
          <Link href="/dashboard" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#3861FB] px-7 py-3 text-sm font-bold transition hover:bg-[#2f54df]">
            Открыть Einvestuz
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#2A3441] bg-[#0B1426] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <p className="text-xl font-bold">Einvestuz</p>
            <p className="mt-3 text-sm leading-6 text-[#A0AEC0]">AI-инвесткопилот для Узбекистана.</p>
            <p className="mt-5 text-xs leading-5 text-[#A0AEC0]">Информация носит образовательный характер и не является индивидуальной инвестиционной рекомендацией.</p>
          </div>
          <FooterLinks title="Продукт" links={["Возможности", "AI-аналитик", "Портфель", "Академия"]} />
          <FooterLinks title="Компания" links={["Политика конфиденциальности", "Условия", "Контакты"]} />
          <div>
            <h3 className="text-sm font-semibold">Подписка на новости</h3>
            <p className="mt-3 text-sm leading-6 text-[#A0AEC0]">Получайте AI-заметки о рынке и обновления продукта.</p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function AICopilotCard() {
  return (
    <div className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
      <div className="flex items-center justify-between gap-4 border-b border-[#2A3441] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#A0AEC0]">Вопрос</p>
          <h2 className="mt-1 text-xl font-bold">Стоит ли покупать Nvidia?</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-[#3861FB]/40 bg-[#3861FB]/10 px-3 py-2 text-xs font-semibold text-[#9FB2FF]">
          <Sparkles size={14} />
          AI-анализ за 10 сек
        </span>
      </div>
      <div className="mt-5 rounded-lg border border-[#2A3441] bg-[#11182A] p-4">
        <div className="flex items-center gap-3 rounded-lg border border-[#2A3441] bg-[#0B1426] px-4 py-3">
          <Search size={16} className="text-[#A0AEC0]" />
          <p className="text-sm text-[#D7DEE8]">Стоит ли покупать Nvidia?</p>
        </div>
        <div className="mt-5 grid gap-3">
          {["Лидер AI-инфраструктуры", "Рост выручки +XX%", "Сильное конкурентное преимущество"].map((item) => (
            <p key={item} className="flex items-center gap-2 text-sm text-[#D7DEE8]"><CheckCircle2 size={17} className="text-[#16C784]" />{item}</p>
          ))}
          {["Высокая оценка", "Риск рыночной волатильности"].map((item) => (
            <p key={item} className="flex items-center gap-2 text-sm text-[#D7DEE8]"><AlertTriangle size={17} className="text-[#EA3943]" />{item}</p>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-[#2A3441] bg-[#11182A] p-4">
          <p className="text-xs font-medium text-[#A0AEC0]">AI-оценка</p>
          <p className="mt-2 text-4xl font-bold">84<span className="text-lg text-[#A0AEC0]">/100</span></p>
          <div className="mt-4 h-2 rounded-full bg-[#0B1426]"><div className="h-2 w-[84%] rounded-full bg-[#16C784]" /></div>
        </div>
        <div className="rounded-lg border border-[#2A3441] bg-[#11182A] p-4">
          <p className="text-xs font-medium text-[#A0AEC0]">Краткое объяснение</p>
          <p className="mt-2 text-sm leading-6 text-[#D7DEE8]">Сильный бизнес, но новичкам стоит выбирать размер позиции осторожно: в цене уже заложены высокие ожидания.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href="/stocks/NVDA" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-[#3861FB] px-4 py-2 text-sm font-bold transition hover:bg-[#2f54df]">Открыть компанию</Link>
        <Link href="/dashboard" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-[#2A3441] bg-[#11182A] px-4 py-2 text-sm font-bold transition hover:border-[#3861FB]">Добавить в список</Link>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text, compact = false }: { eyebrow: string; title: string; text: string; compact?: boolean }) {
  return (
    <div className={compact ? "" : "mb-8 max-w-3xl"}>
      <p className="text-xs font-bold uppercase tracking-wide text-[#3861FB]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[#A0AEC0] sm:text-base">{text}</p>
    </div>
  );
}

function MarketTicker({ name, value, change }: { name: string; value: string; change: number }) {
  return (
    <div className="min-w-48 shrink-0 rounded-lg border border-[#2A3441] bg-[#171F2F] px-4 py-3 transition hover:border-[#3861FB]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{name}</p>
        <Change value={change} />
      </div>
      <p className="tabular-data mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-bold ${positive ? "text-[#16C784]" : "text-[#EA3943]"}`}>
      <Icon size={15} />
      {value > 0 ? "+" : ""}{value.toFixed(value === 0 ? 0 : 2)}%
    </span>
  );
}

function RiskBadge({ value }: { value: string }) {
  const color = value === "Низкий" ? "text-[#16C784] border-[#16C784]/30 bg-[#16C784]/10" : value === "Высокий" ? "text-[#EA3943] border-[#EA3943]/30 bg-[#EA3943]/10" : "text-[#A0AEC0] border-[#2A3441] bg-[#11182A]";
  return <span className={`rounded-lg border px-3 py-1 text-xs font-bold ${color}`}>{value}</span>;
}

function InfoCard({ title, text, icon: Icon }: { title: string; text: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <article className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-5 transition hover:border-[#3861FB]">
      <div className="grid size-11 place-items-center rounded-lg bg-[#11182A] text-[#3861FB]"><Icon size={21} /></div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#A0AEC0]">{text}</p>
    </article>
  );
}

function Metric({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border border-[#2A3441] bg-[#11182A] p-5">
      <p className="text-xs font-medium text-[#A0AEC0]">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${positive ? "text-[#16C784]" : "text-white"}`}>{value}</p>
    </div>
  );
}

function FooterLinks({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-[#A0AEC0]">
        {links.map((link) => (
          <li key={link}>
            <Link href="/dashboard" className="transition hover:text-white">{link}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
