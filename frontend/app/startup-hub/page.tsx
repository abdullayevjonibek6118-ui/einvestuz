import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Globe2,
  Lightbulb,
  MapPin,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Startup Hub Узбекистана",
  description: "Стартапы, инвесторы, программы поддержки и аналитика венчурной экосистемы Узбекистана в одном разделе.",
  path: "/startup-hub",
});

const startups = [
  { name: "TASS Vision", category: "AI & Computer Vision", stage: "Growth", city: "Ташкент", signal: "B2B" },
  { name: "Billz", category: "RetailTech", stage: "Series A", city: "Ташкент", signal: "SaaS" },
  { name: "Uzum", category: "E-commerce & Fintech", stage: "Late stage", city: "Ташкент", signal: "B2C" },
  { name: "Mohirdev", category: "EdTech", stage: "Early stage", city: "Ташкент", signal: "B2C" },
  { name: "PointAI", category: "Artificial Intelligence", stage: "Early stage", city: "Ташкент", signal: "B2B" },
  { name: "IMAN", category: "Fintech", stage: "Growth", city: "Ташкент", signal: "B2C" },
];

const opportunities = [
  {
    icon: CircleDollarSign,
    eyebrow: "Для стартапов",
    title: "Найдите капитал",
    text: "Подготовьте профиль компании и станьте заметнее для ангелов, фондов и корпоративных инвесторов.",
    action: "Добавить стартап",
    href: "mailto:hello@einvestuz.com?subject=Startup%20Hub%3A%20добавить%20стартап",
  },
  {
    icon: BarChart3,
    eyebrow: "Для инвесторов",
    title: "Откройте новые сделки",
    text: "Изучайте команды по сектору, стадии и бизнес-модели в едином аналитическом формате.",
    action: "Смотреть каталог",
    href: "#catalog",
  },
  {
    icon: Users,
    eyebrow: "Для экосистемы",
    title: "Запустите программу",
    text: "Расскажите о гранте, акселераторе, хакатоне или отраслевом мероприятии.",
    action: "Предложить событие",
    href: "mailto:hello@einvestuz.com?subject=Startup%20Hub%3A%20событие",
  },
];

export default function StartupHubPage() {
  return (
    <div className="stitch-page">
      <section className="relative overflow-hidden rounded-[18px] bg-[#101c2c] px-5 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
        <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-[#255af2]/35 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-[20%] h-36 w-36 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-black tracking-[.12em] text-[#dce1ff]">
              <Rocket size={17} /> EINVEST STARTUP HUB
            </span>
            <h1 className="mt-5 max-w-3xl text-[clamp(36px,5vw,64px)] font-black leading-[1.04] tracking-[-.045em]">
              Точка роста для стартапов Узбекистана
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#d7e3f9] sm:text-lg">
              Исследуйте команды, находите возможности и следите за развитием венчурной экосистемы в одном месте.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#catalog" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#255af2] px-5 font-extrabold text-white transition-colors hover:bg-[#1748d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <Search size={18} /> Найти стартап
              </Link>
              <a href="mailto:hello@einvestuz.com?subject=Startup%20Hub%3A%20добавить%20стартап" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/30 px-5 font-extrabold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Добавить компанию <ArrowRight size={18} />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15">
            <HeroMetric value="6" label="в подборке" />
            <HeroMetric value="5+" label="секторов" />
            <HeroMetric value="3" label="стадии роста" />
            <HeroMetric value="UZ" label="главный фокус" />
          </div>
        </div>
      </section>

      <section aria-labelledby="startup-directions">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-black uppercase tracking-[.1em] text-[#0041cd]">Один хаб — вся экосистема</span>
            <h2 id="startup-directions" className="mt-2 text-2xl font-black tracking-tight text-[#101c2c] sm:text-3xl">Выберите свой маршрут</h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-[#555f72]">Инструменты для тех, кто строит, финансирует и развивает технологические компании.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {opportunities.map(({ icon: Icon, ...item }) => (
            <article key={item.title} className="group flex min-h-72 flex-col rounded-xl border border-[#c3c5d8] bg-white p-6 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#0041cd] hover:shadow-[0_16px_36px_rgba(16,28,44,.08)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eff4ff] text-[#0041cd]"><Icon size={22} /></div>
              <span className="mt-6 text-xs font-black uppercase tracking-[.09em] text-[#555f72]">{item.eyebrow}</span>
              <h3 className="mt-2 text-xl font-black text-[#101c2c]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#555f72]">{item.text}</p>
              <Link href={item.href} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 font-extrabold text-[#0041cd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0041cd]">
                {item.action} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="catalog" className="stitch-panel scroll-mt-28" aria-labelledby="startup-catalog-title">
        <div className="stitch-panel-head">
          <div>
            <h2 id="startup-catalog-title">Стартапы в фокусе</h2>
            <p className="mt-1 text-sm text-[#555f72]">Редакционная подборка · не является инвестиционной рекомендацией</p>
          </div>
          <span className="hidden items-center gap-2 text-sm font-bold text-[#005e3b] sm:inline-flex"><ShieldCheck size={17} /> Профили проверяются</span>
        </div>
        <div className="grid gap-px bg-[#c3c5d8] md:grid-cols-2 xl:grid-cols-3">
          {startups.map((startup) => (
            <article key={startup.name} className="group bg-white p-5 transition-colors hover:bg-[#f8f9ff]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#d7e3f9] text-lg font-black text-[#0041cd]">{startup.name[0]}</div>
                <span className="rounded-full bg-[#eff4ff] px-3 py-1 text-xs font-extrabold text-[#0041cd]">{startup.stage}</span>
              </div>
              <h3 className="mt-5 text-lg font-black text-[#101c2c]">{startup.name}</h3>
              <p className="mt-1 text-sm font-semibold text-[#555f72]">{startup.category}</p>
              <div className="mt-5 flex items-center justify-between border-t border-[#e4e6ef] pt-4 text-xs font-bold text-[#555f72]">
                <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{startup.city}</span>
                <span>{startup.signal}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-xl border border-[#c3c5d8] bg-[#f8f9ff] p-6 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#0041cd] shadow-sm"><CalendarDays size={22} /></div>
          <span className="mt-6 block text-xs font-black uppercase tracking-[.1em] text-[#0041cd]">Календарь экосистемы</span>
          <h2 className="mt-2 text-2xl font-black text-[#101c2c]">Гранты, акселераторы и события</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#555f72]">Собираем дедлайны программ поддержки и ключевые встречи сообщества. Предложите возможность — после проверки мы добавим её в хаб.</p>
          <a href="mailto:hello@einvestuz.com?subject=Startup%20Hub%3A%20возможность" className="mt-6 inline-flex min-h-11 items-center gap-2 font-extrabold text-[#0041cd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0041cd]">
            Предложить возможность <ArrowRight size={17} />
          </a>
        </article>
        <article className="rounded-xl bg-[#0041cd] p-6 text-white sm:p-8">
          <Sparkles size={25} />
          <h2 className="mt-6 text-2xl font-black">Startup Pulse</h2>
          <p className="mt-3 text-sm leading-6 text-[#dce1ff]">Следующий этап — данные по раундам, динамике секторов и активности инвесторов с прозрачными источниками.</p>
          <div className="mt-6 space-y-3">
            {["Карта венчурных сделок", "Трекер финансирования", "Отраслевые бенчмарки"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 size={16} className="text-cyan-300" />{item}</div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-[#c3c5d8] bg-white px-5 py-7 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <TrustItem icon={Globe2} title="Фокус на Узбекистане" text="Локальный контекст и компании" />
          <TrustItem icon={Building2} title="Для рынка капитала" text="Единый язык данных и стадий" />
          <TrustItem icon={Lightbulb} title="Кураторский подход" text="Проверка перед публикацией" />
          <TrustItem icon={ShieldCheck} title="Прозрачные оговорки" text="Без выдуманных live-метрик" />
        </div>
      </section>
    </div>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-[#0d2f67]/90 p-4 sm:p-5">
      <b className="block font-mono text-2xl text-white">{value}</b>
      <span className="mt-1 block text-xs font-semibold text-[#d7e3f9]">{label}</span>
    </div>
  );
}

function TrustItem({ icon: Icon, title, text }: { icon: typeof Globe2; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <Icon size={20} className="mt-0.5 shrink-0 text-[#0041cd]" />
      <div><h3 className="text-sm font-black text-[#101c2c]">{title}</h3><p className="mt-1 text-xs leading-5 text-[#555f72]">{text}</p></div>
    </div>
  );
}
