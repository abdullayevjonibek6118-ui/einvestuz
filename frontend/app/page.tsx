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
  { name: "Bitcoin", value: "$103,420", change: 1.64 },
  { name: "Gold", value: "$3,318", change: -0.31 },
  { name: "Oil", value: "$71.90", change: 0.25 },
  { name: "USD/UZS", value: "12,640", change: -0.18 },
  { name: "CBU Interest Rate", value: "14.0%", change: 0 },
];

const popularStocks = [
  { ticker: "AAPL", company: "Apple", price: "$214.32", change: 0.84, risk: "Medium", score: 78 },
  { ticker: "MSFT", company: "Microsoft", price: "$467.81", change: 0.51, risk: "Low", score: 86 },
  { ticker: "NVDA", company: "Nvidia", price: "$142.67", change: 2.18, risk: "High", score: 84 },
  { ticker: "TSLA", company: "Tesla", price: "$331.45", change: -1.34, risk: "High", score: 62 },
  { ticker: "AMZN", company: "Amazon", price: "$196.88", change: -0.29, risk: "Medium", score: 76 },
];

const struggles = [
  { title: "Too many financial terms", text: "AI translates valuation, margins, and volatility into plain language.", icon: Brain },
  { title: "Too many companies and news sources", text: "A focused watchlist keeps global leaders and local context together.", icon: Search },
  { title: "Hard to understand risks", text: "Each stock view separates upside signals from valuation and market risks.", icon: ShieldAlert },
  { title: "Fear of losing money", text: "A virtual portfolio lets beginners test ideas before using real capital.", icon: WalletCards },
];

const features = [
  { title: "AI Analyst", text: "Explain companies in plain language.", icon: Bot },
  { title: "Virtual Portfolio", text: "Test ideas without real money.", icon: BriefcaseBusiness },
  { title: "Market Tracking", text: "Monitor global markets and Uzbekistan.", icon: BarChart3 },
  { title: "Investment Academy", text: "Learn using real companies and examples.", icon: GraduationCap },
];

const uzbekistanHub = [
  { label: "USD/UZS Exchange Rate", value: "12,640", change: "-0.18%" },
  { label: "Inflation", value: "10.6%", change: "watch" },
  { label: "Central Bank Rate", value: "14.0%", change: "stable" },
  { label: "Latest IPOs", value: "3", change: "pipeline" },
  { label: "Capital Markets News", value: "18", change: "today" },
  { label: "Uzbekistan Companies", value: "42", change: "tracked" },
];

const insights = [
  {
    title: "Stock of the Day",
    headline: "Nvidia remains an AI infrastructure leader",
    text: "Growth is strong, but the valuation needs discipline before beginners add a large position.",
    tag: "AI Score 84",
  },
  {
    title: "Risk Alert",
    headline: "Tesla volatility is elevated",
    text: "Price swings can overpower the long-term story, so position size matters more than hype.",
    tag: "High risk",
  },
  {
    title: "Company to Watch",
    headline: "Microsoft combines AI and cash flow",
    text: "Cloud growth, enterprise demand, and resilient margins make it easier for beginners to study.",
    tag: "AI Score 86",
  },
];

const academyTopics = ["Stocks", "ETFs", "Dividends", "Industry Analysis", "Competitive Advantages", "Risk Management"];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0B1426] text-white">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-[#2A3441] bg-[#0B1426]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-base font-semibold">
            <span className="grid size-9 place-items-center rounded-lg border border-[#2A3441] bg-[#171F2F] text-[#3861FB]">
              <Sparkles size={18} />
            </span>
            Einvestuz
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#A0AEC0] md:flex" aria-label="Landing navigation">
            <a href="#stocks" className="hover:text-white">Popular Stocks</a>
            <a href="#uzbekistan" className="hover:text-white">Uzbekistan</a>
            <a href="#academy" className="hover:text-white">Academy</a>
          </nav>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#3861FB] px-4 py-2 text-sm font-semibold transition hover:bg-[#2f54df]">
            Open Einvestuz
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section id="main-content" className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-18">
        <div className="order-2 flex flex-col justify-center lg:order-1">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-lg border border-[#2A3441] bg-[#171F2F] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#A0AEC0]">
            <Bot size={15} className="text-[#3861FB]" />
            AI Investment Copilot for Uzbekistan
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-[62px]">
            Understand Any Stock in 60 Seconds with AI
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#A0AEC0] sm:text-lg">
            Track Apple, Nvidia, Tesla and the Uzbekistan market in one place. Get AI-powered stock analysis, understand risks before investing, and build virtual portfolios without using real money.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/portfolio" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#3861FB] px-6 py-3 text-sm font-bold transition hover:bg-[#2f54df]">
              Create Virtual Portfolio
              <ArrowRight size={17} />
            </Link>
            <Link href="/ai" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#2A3441] bg-[#171F2F] px-6 py-3 text-sm font-bold transition hover:border-[#3861FB] hover:bg-[#1d2940]">
              Ask AI About a Stock
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["500+ Companies", "AI Analysis in 10 Seconds", "US + Uzbekistan Markets", "No Real Money Required"].map((item) => (
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
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8" aria-label="Live market bar">
          <div className="sticky left-0 z-10 shrink-0 rounded-lg border border-[#2A3441] bg-[#171F2F] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#A0AEC0]">
            Live Markets
          </div>
          {marketBar.map((item) => (
            <MarketTicker key={item.name} {...item} />
          ))}
        </div>
      </section>

      <section id="stocks" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Popular Stocks" title="Companies most followed by beginner investors." text="A CoinMarketCap-inspired table layout with beginner-friendly AI score and risk labels." />
        <div className="overflow-hidden rounded-lg border border-[#2A3441] bg-[#171F2F]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-[#11182A] text-left text-xs uppercase tracking-wide text-[#A0AEC0]">
                <tr>
                  <th className="px-4 py-4 font-semibold sm:px-6">Company</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">Price</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">24H Change</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">Risk Level</th>
                  <th className="px-4 py-4 font-semibold sm:px-6">AI Score</th>
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
        <SectionHeader eyebrow="Why investing is hard" title="Why Do Most Beginners Struggle?" text="The first problem is not a lack of charts. It is not knowing which signal matters and what risk means." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {struggles.map((item) => <InfoCard key={item.title} {...item} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="How Einvestuz helps" title="Make Better Investment Decisions" text="The product turns market data into short explanations, practice workflows, and lessons that build confidence." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((item) => <InfoCard key={item.title} {...item} />)}
        </div>
      </section>

      <section id="uzbekistan" className="border-y border-[#2A3441] bg-[#11182A]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-6">
            <div className="mb-5 h-1 rounded-full bg-[linear-gradient(90deg,#2FA7DF_0_34%,#FFFFFF_34%_42%,#EA3943_42%_46%,#16C784_46%_100%)]" />
            <SectionHeader eyebrow="Uzbekistan Market Center" title="Global investing with local context." text="A local hub for exchange rates, inflation, central bank policy, IPOs, capital markets news, and Uzbekistan companies." compact />
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
                <p className="text-xs font-semibold uppercase tracking-wide text-[#A0AEC0]">Local snapshot</p>
                <h3 className="mt-1 text-xl font-semibold">USD/UZS and market confidence</h3>
              </div>
              <MapPinned className="text-[#3861FB]" size={24} />
            </div>
            <div className="mt-8 h-56 rounded-lg border border-[#2A3441] bg-[#0B1426] p-4">
              <div className="flex h-full items-end gap-2" aria-label="Small market chart">
                {[36, 42, 38, 48, 55, 52, 64, 59, 70, 76, 72, 82].map((height, index) => (
                  <span key={index} className="flex-1 rounded-t bg-[#3861FB]" style={{ height: `${height}%`, opacity: 0.35 + index * 0.04 }} />
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#A0AEC0]">
              The hub makes Uzbekistan visible on the landing page, so visitors see this is not a generic stock screener with a translated interface.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="AI insights" title="Today's AI Insights" text="Short, dynamic cards that show how Einvestuz explains opportunities and risks before a beginner invests." />
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
            <SectionHeader eyebrow="Virtual portfolio preview" title="Practice Before Investing" text="A realistic portfolio widget helps beginners learn by doing before real money is involved." compact />
            <Link href="/portfolio" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#3861FB] px-6 py-3 text-sm font-bold transition hover:bg-[#2f54df]">
              Build My Portfolio
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Metric label="Portfolio Value" value="$10,000" />
              <Metric label="Performance" value="+12.4%" positive />
            </div>
            <div className="mt-6 space-y-3">
              {["Nvidia", "Microsoft", "S&P 500 ETF"].map((holding, index) => (
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
        <SectionHeader eyebrow="Investment Academy" title="Learn Investing Through Practice" text="Lessons use real companies and portfolio exercises instead of isolated definitions." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {academyTopics.map((topic, index) => (
            <article key={topic} className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-5">
              <BookOpen size={20} className="text-[#3861FB]" />
              <h3 className="mt-4 font-semibold">{topic}</h3>
              <p className="mt-2 text-sm leading-6 text-[#A0AEC0]">{12 + index * 3} min lesson with a real-market example.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#2A3441] bg-[#171F2F] p-8 text-center">
          <h2 className="text-3xl font-bold sm:text-5xl">Start Investing Without Risk</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#A0AEC0] sm:text-base">
            Understand companies, ask AI questions, and test investment ideas before using real money.
          </p>
          <Link href="/dashboard" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#3861FB] px-7 py-3 text-sm font-bold transition hover:bg-[#2f54df]">
            Open Einvestuz
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#2A3441] bg-[#0B1426] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <p className="text-xl font-bold">Einvestuz</p>
            <p className="mt-3 text-sm leading-6 text-[#A0AEC0]">The AI Investment Copilot for Uzbekistan.</p>
            <p className="mt-5 text-xs leading-5 text-[#A0AEC0]">Информация носит образовательный характер и не является индивидуальной инвестиционной рекомендацией.</p>
          </div>
          <FooterLinks title="Product" links={["Features", "AI Analyst", "Portfolio", "Academy"]} />
          <FooterLinks title="Company" links={["Privacy Policy", "Terms", "Contact"]} />
          <div>
            <h3 className="text-sm font-semibold">Newsletter Subscription</h3>
            <p className="mt-3 text-sm leading-6 text-[#A0AEC0]">Get AI market notes and product updates.</p>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-[#A0AEC0]">Question</p>
          <h2 className="mt-1 text-xl font-bold">Should I buy Nvidia?</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-[#3861FB]/40 bg-[#3861FB]/10 px-3 py-2 text-xs font-semibold text-[#9FB2FF]">
          <Sparkles size={14} />
          AI Analysis in 10 sec
        </span>
      </div>
      <div className="mt-5 rounded-lg border border-[#2A3441] bg-[#11182A] p-4">
        <div className="flex items-center gap-3 rounded-lg border border-[#2A3441] bg-[#0B1426] px-4 py-3">
          <Search size={16} className="text-[#A0AEC0]" />
          <p className="text-sm text-[#D7DEE8]">Should I buy Nvidia?</p>
        </div>
        <div className="mt-5 grid gap-3">
          {["AI infrastructure leader", "Revenue growth +XX%", "Strong competitive moat"].map((item) => (
            <p key={item} className="flex items-center gap-2 text-sm text-[#D7DEE8]"><CheckCircle2 size={17} className="text-[#16C784]" />{item}</p>
          ))}
          {["High valuation", "Market volatility risk"].map((item) => (
            <p key={item} className="flex items-center gap-2 text-sm text-[#D7DEE8]"><AlertTriangle size={17} className="text-[#EA3943]" />{item}</p>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-[#2A3441] bg-[#11182A] p-4">
          <p className="text-xs font-medium text-[#A0AEC0]">AI Score</p>
          <p className="mt-2 text-4xl font-bold">84<span className="text-lg text-[#A0AEC0]">/100</span></p>
          <div className="mt-4 h-2 rounded-full bg-[#0B1426]"><div className="h-2 w-[84%] rounded-full bg-[#16C784]" /></div>
        </div>
        <div className="rounded-lg border border-[#2A3441] bg-[#11182A] p-4">
          <p className="text-xs font-medium text-[#A0AEC0]">Plain-language summary</p>
          <p className="mt-2 text-sm leading-6 text-[#D7DEE8]">Strong business, but beginners should size carefully because the stock already prices in high expectations.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href="/stocks/NVDA" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-[#3861FB] px-4 py-2 text-sm font-bold transition hover:bg-[#2f54df]">View Company</Link>
        <Link href="/dashboard" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-[#2A3441] bg-[#11182A] px-4 py-2 text-sm font-bold transition hover:border-[#3861FB]">Add to Watchlist</Link>
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
  const color = value === "Low" ? "text-[#16C784] border-[#16C784]/30 bg-[#16C784]/10" : value === "High" ? "text-[#EA3943] border-[#EA3943]/30 bg-[#EA3943]/10" : "text-[#A0AEC0] border-[#2A3441] bg-[#11182A]";
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
