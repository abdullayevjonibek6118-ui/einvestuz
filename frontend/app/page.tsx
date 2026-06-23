import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  LineChart,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

const productCards = [
  {
    title: "Мировые рынки",
    text: "S&P 500, Nasdaq, Dow Jones, Bitcoin, золото, нефть и акции крупных компаний в одном рабочем экране.",
    icon: BarChart3,
  },
  {
    title: "AI-аналитик",
    text: "Помощник объясняет компанию, плюсы, риски и фундаментальные показатели простым языком.",
    icon: Bot,
  },
  {
    title: "Виртуальный портфель",
    text: "Собирайте позиции без реальных денег и смотрите, как меняется доходность.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Академия инвестора",
    text: "Курс по акциям, ETF, дивидендам, отраслевому анализу, value chain и риск-менеджменту.",
    icon: BookOpen,
  },
];

const steps = ["Выберите компанию", "Посмотрите график и показатели", "Спросите AI", "Добавьте в виртуальный портфель"];

const stats = [
  { value: "0 сум", label: "реальных денег внутри MVP" },
  { value: "9", label: "уроков в академии" },
  { value: "24/7", label: "доступ к обучению и симуляции" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <header className="sticky top-0 z-30 border-b border-[#dbe4ef] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-[#1e40af] text-white shadow-sm">
              <Star size={18} fill="currentColor" />
            </span>
            <span>
              <span className="block text-base font-semibold">InvestAI</span>
              <span className="block text-xs font-medium text-[#64748b]">Uzbekistan</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#475569] md:flex" aria-label="Публичная навигация">
            <a href="#features" className="hover:text-[#1e40af]">Возможности</a>
            <a href="#academy" className="hover:text-[#1e40af]">Обучение</a>
            <a href="#safety" className="hover:text-[#1e40af]">Безопасность</a>
          </nav>
          <Link href="/dashboard" className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#0f172a] px-4 text-sm font-semibold text-white hover:bg-[#1e293b]">
            Открыть платформу
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#dbe4ef] bg-white">
        <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:py-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold text-[#1e40af]">
              <Sparkles size={14} />
              Инвестиционная аналитика для Узбекистана
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-[#0f172a] sm:text-5xl lg:text-6xl">
              Учитесь инвестировать и анализировать рынки в одном приложении
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#475569]">
              InvestAI помогает следить за мировыми активами, изучать компании, собирать виртуальный портфель и получать понятные AI-разборы без реальных сделок.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#1e40af] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]">
                Начать анализ
                <ArrowRight size={17} />
              </Link>
              <Link href="/academy" className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#dbe4ef] bg-white px-5 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc]">
                Посмотреть академию
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-[#dbe4ef] bg-[#f8fafc] p-4">
                  <p className="tabular-data text-xl font-semibold text-[#0f172a]">{stat.value}</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-6 rounded-[28px] bg-[#dbeafe] blur-3xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-[#dbe4ef] bg-[#f8fafc] shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
              <Image
                src="/images/investai-hero.png"
                alt="InvestAI mobile app mockup with market dashboard, AI analysis, and virtual portfolio"
                width={1200}
                height={900}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-semibold text-[#1e40af]">Возможности</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#0f172a]">Не брокер, а тренажер инвестиционного мышления</h2>
            <p className="mt-4 text-sm leading-7 text-[#475569]">
              MVP не принимает деньги пользователей и не исполняет сделки. Его задача — помочь разобраться в компаниях, рисках, новостях и портфеле до реальных инвестиций.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {productCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-lg border border-[#dbe4ef] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <div className="grid size-10 place-items-center rounded-md bg-[#eff6ff] text-[#1e40af]">
                    <Icon size={19} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#475569]">{card.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#dbe4ef] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className="rounded-lg border border-[#dbe4ef] bg-[#f8fafc] p-5">
              <p className="tabular-data text-sm font-semibold text-[#f59e0b]">0{index + 1}</p>
              <h3 className="mt-3 text-base font-semibold">{step}</h3>
              <p className="mt-2 text-sm leading-6 text-[#475569]">Переходите от идеи к проверке гипотезы через данные, AI и симуляцию.</p>
            </div>
          ))}
        </div>
      </section>

      <section id="academy" className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-[#dbe4ef] bg-[#0f172a] p-6 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#93c5fd]">
            <LineChart size={18} />
            Industry analysis
          </div>
          <h2 className="mt-4 text-3xl font-semibold">Академия построена на лекциях по отраслевому анализу</h2>
          <p className="mt-4 text-sm leading-7 text-[#cbd5e1]">
            Пользователь учится определять границы рынка, барьеры входа, модель конкуренции, value chain, жизненный цикл отрасли и ключевые финансовые метрики.
          </p>
          <Link href="/academy" className="mt-6 inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-[#0f172a] hover:bg-[#e2e8f0]">
            Перейти к урокам
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-3">
          {["Акции, ETF и дивиденды", "Барьеры входа и модели рынка", "Value chain и конкурентные преимущества", "Риск-менеджмент через отраслевой анализ"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-[#dbe4ef] bg-white p-4">
              <CheckCircle2 size={18} className="text-[#16a34a]" />
              <span className="text-sm font-semibold text-[#0f172a]">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="safety" className="border-t border-[#dbe4ef] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold text-[#1e40af]">Безопасный MVP</p>
            <h2 className="mt-2 text-3xl font-semibold">Сначала обучение и симуляция, потом реальные интеграции</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#475569]">
              Платформа не хранит клиентские деньги, не даёт персональных инвестиционных рекомендаций и не исполняет сделки. Это рабочее пространство для изучения рынка.
            </p>
          </div>
          <div className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] p-5">
            <ShieldCheck size={24} className="text-[#15803d]" />
            <h3 className="mt-4 text-base font-semibold text-[#14532d]">Дисклеймер встроен в продукт</h3>
            <p className="mt-2 text-sm leading-6 text-[#166534]">Аналитика носит образовательный характер и не является инвестиционной рекомендацией.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#0f172a] px-4 py-16 text-white sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#93c5fd]">
              <TrendingUp size={18} />
              InvestAI Uzbekistan
            </div>
            <h2 className="mt-3 text-3xl font-semibold">Откройте рабочее пространство инвестора</h2>
          </div>
          <Link href="/dashboard" className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#f59e0b] px-5 text-sm font-semibold text-[#111827] hover:bg-[#fbbf24]">
            Запустить платформу
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
