import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Bot, CheckCircle2, GraduationCap, Rocket, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";

const features = [
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
    icon: WalletCards,
  },
  {
    title: "Академия инвестора",
    text: "Курс по акциям, ETF, дивидендам, отраслевому анализу, value chain и риск-менеджменту.",
    icon: GraduationCap,
  },
];

const steps = ["Выберите компанию", "Проверьте показатели", "Спросите AI", "Виртуальный портфель"];
const stats = [
  { value: "0 сум", label: "реальных денег" },
  { value: "9", label: "уроков в академии" },
  { value: "24/7", label: "доступ" },
];
const academyItems = ["Акции, ETF и дивиденды", "Барьеры входа и модели рынка", "Value chain и конкурентные преимущества", "Риск-менеджмент через отраслевой анализ"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F9FA] text-[#191C1D]">
      <header className="fixed top-0 z-50 h-16 w-full border-b border-[#C5C6CF] bg-white">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 md:px-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-[#0A1F44]">
              Einvestuz
            </Link>
            <nav className="hidden gap-6 md:flex" aria-label="Публичная навигация">
              <a className="text-xs font-semibold uppercase tracking-[0.05em] text-[#44464E] hover:text-[#0A1F44]" href="#features">Возможности</a>
              <a className="text-xs font-semibold uppercase tracking-[0.05em] text-[#44464E] hover:text-[#0A1F44]" href="#academy">Обучение</a>
              <a className="text-xs font-semibold uppercase tracking-[0.05em] text-[#44464E] hover:text-[#0A1F44]" href="#security">Безопасность</a>
            </nav>
          </div>
          <Link href="/dashboard" className="rounded px-6 py-2 text-xs font-semibold uppercase tracking-[0.05em] text-white transition hover:opacity-90 bg-[#0A1F44]">
            Открыть платформу
          </Link>
        </div>
      </header>

      <section className="overflow-hidden px-4 pb-24 pt-28 md:px-16 md:pb-32 md:pt-40">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded border border-[#C5C6CF] bg-[#E7E8E9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#0A1F44]">
              <BarChart3 size={18} className="text-[#CCA730]" />
              Инвестиционная аналитика для Узбекистана
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-[#191C1D] md:text-[56px]">
              Учитесь инвестировать и анализировать рынки в <span className="bg-gradient-to-br from-[#0A1F44] to-[#CCA730] bg-clip-text text-transparent">одном приложении</span>
            </h1>
            <p className="max-w-xl text-base leading-6 text-[#44464E]">
              Einvestuz помогает следить за мировыми активами, изучать компании, собирать виртуальный портфель и получать понятные AI-разборы без реальных сделок.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded bg-[#0A1F44] px-8 py-4 text-xs font-semibold uppercase tracking-[0.05em] text-white shadow-sm transition hover:opacity-95">
                Начать анализ
                <ArrowRight size={18} />
              </Link>
              <Link href="/academy" className="inline-flex items-center justify-center rounded border border-[#75777F] px-8 py-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#0A1F44] transition hover:bg-[#EDEEEF]">
                Посмотреть академию
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-8">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded border border-[#C5C6CF] bg-white p-4">
                  <div className="font-display text-2xl font-semibold text-[#0A1F44]">{stat.value}</div>
                  <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-[#44464E]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <Image
            alt="Einvestuz Analytics Interface"
            src="/images/einvestuz-hero.png"
            width={1200}
            height={900}
            priority
            className="relative z-10 w-full rounded border border-[#C5C6CF] object-cover shadow-xl"
          />
        </div>
      </section>

      <section id="features" className="bg-[#F3F4F5] px-4 py-24 md:px-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-16 max-w-2xl">
            <span className="mb-4 block text-xs font-semibold uppercase tracking-widest text-[#0A1F44]">Возможности</span>
            <h2 className="mb-6 font-display text-[40px] font-semibold leading-tight text-[#191C1D]">Не брокер, а тренажер инвестиционного мышления</h2>
            <p className="text-sm leading-6 text-[#44464E]">
              MVP не принимает деньги пользователей и не исполняет сделки. Его задача - помочь разобраться в компаниях, рисках, новостях и портфеле до реальных инвестиций.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded border border-[#C5C6CF] bg-white p-8 transition hover:border-[#CCA730]">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded bg-[#0A1F44]/5 text-[#0A1F44]">
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-[#191C1D]">{feature.title}</h3>
                  <p className="text-sm leading-6 text-[#44464E]">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 md:px-16">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="mb-16 text-center font-display text-4xl font-semibold text-[#191C1D]">Как это работает</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="relative">
                <div className="absolute -top-10 left-0 -z-0 select-none font-display text-[64px] font-bold text-[#0A1F44]/10">0{index + 1}</div>
                <h3 className="relative mb-4 text-xl font-semibold text-[#191C1D]">{step}</h3>
                <p className="relative text-sm leading-6 text-[#44464E]">Переходите от идеи к проверке гипотезы через данные, AI и симуляцию.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="academy" className="overflow-hidden bg-[#0A1F44] px-4 py-24 text-white md:px-16">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-20 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.05em] text-[#CCA730]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#CCA730]" />
              Industry analysis
            </div>
            <h2 className="mb-8 font-display text-[40px] font-semibold leading-tight">Академия построена на лекциях по отраслевому анализу</h2>
            <p className="mb-10 max-w-xl text-base leading-6 text-white/70">
              Пользователь учится определять границы рынка, барьеры входа, модель конкуренции, value chain, жизненный цикл отрасли и ключевые финансовые метрики.
            </p>
            <Link href="/academy" className="inline-flex rounded bg-[#CCA730] px-8 py-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#0A1F44] transition hover:opacity-90">
              Перейти к урокам
            </Link>
          </div>
          <div className="space-y-4">
            {academyItems.map((item) => (
              <div key={item} className="flex items-center gap-4 rounded border border-white/10 bg-white/5 p-6 transition hover:bg-white/10">
                <CheckCircle2 size={21} className="text-[#00875A]" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="bg-white px-4 py-24 md:px-16">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="mb-4 block text-xs font-semibold uppercase tracking-widest text-[#0A1F44]">Безопасный MVP</span>
            <h2 className="mb-8 font-display text-[40px] font-semibold leading-tight text-[#191C1D]">Сначала обучение и симуляция, потом реальные интеграции</h2>
            <p className="max-w-2xl text-base leading-6 text-[#44464E]">
              Платформа не хранит клиентские деньги, не даёт персональных инвестиционных рекомендаций и не исполняет сделки. Это рабочее пространство для изучения рынка.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded border border-[#C5C6CF] bg-[#EDEEEF] p-8 shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded bg-[#00875A]/10 text-[#00875A]">
                <ShieldCheck size={24} />
              </div>
              <h3 className="mb-4 font-display text-2xl font-semibold text-[#191C1D]">Дисклеймер встроен в продукт</h3>
              <p className="text-sm leading-6 text-[#44464E]">Аналитика носит образовательный характер и не является инвестиционной рекомендацией.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0A1F44] px-4 py-24 text-center text-white md:px-16">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest opacity-60">
            <TrendingUp size={18} />
            Einvestuz
          </div>
          <h2 className="font-display text-5xl font-bold leading-tight md:text-[56px]">Откройте рабочее пространство инвестора</h2>
          <Link href="/dashboard" className="mx-auto inline-flex items-center justify-center gap-3 rounded bg-[#CCA730] px-10 py-5 text-xl font-semibold text-[#0A1F44] shadow-lg transition hover:opacity-90">
            Запустить платформу
            <Rocket size={22} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#C5C6CF] bg-[#F8F9FA] px-4 py-16 md:px-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            <div>
              <div className="mb-6 font-display text-2xl font-semibold tracking-tight text-[#0A1F44]">Einvestuz</div>
              <p className="mb-6 text-sm leading-6 text-[#44464E]">Financial Analytics for Uzbekistan. Повышайте свою финансовую грамотность и анализируйте рынки профессионально.</p>
            </div>
            <FooterColumn title="Продукт" links={["Возможности", "AI-Аналитик", "Виртуальный портфель", "Академия"]} />
            <FooterColumn title="Ресурсы" links={["Политика конфиденциальности", "Условия сервиса", "Связаться с нами"]} />
            <div>
              <h4 className="mb-6 text-xs font-semibold uppercase tracking-wider text-[#191C1D]">Связь</h4>
              <p className="mb-4 text-sm leading-6 text-[#44464E]">Подпишитесь на новости и обновления.</p>
              <NewsletterForm />
            </div>
          </div>
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#C5C6CF] pt-8 md:flex-row">
            <p className="text-[11px] font-medium text-[#44464E]">© 2026 Einvestuz. Financial Analytics for Uzbekistan.</p>
            <span className="flex items-center gap-2 text-[11px] font-medium text-[#44464E]">
              <span className="h-2 w-2 rounded-full bg-[#00875A]" />
              Статус рынка: данные доступны
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="mb-6 text-xs font-semibold uppercase tracking-wider text-[#191C1D]">{title}</h4>
      <ul className="space-y-4">
        {links.map((link) => (
          <li key={link}>
            <Link href="/dashboard" className="text-sm text-[#44464E] transition hover:text-[#0A1F44]">
              {link}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
