import Link from "next/link";
import { ArrowRight, Bot, Newspaper, Search } from "lucide-react";
import { getNews } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Новости финансового рынка",
  description: "Свежие новости рынка, компаний и макроэкономики для инвесторов EINVESTUZ.",
  path: "/news",
});

const images = ["/images/stitch-home/news-market.jpg", "/images/stitch-home/news-banking.jpg", "/images/stitch-home/news-macro.jpg"];

export default async function NewsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await Promise.resolve(searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const selectedCategory = first(params.category);
  const news = await getNews();
  const categories = [...new Set(news.map((item) => item.category).filter(Boolean))];
  const visibleNews = selectedCategory ? news.filter((item) => item.category === selectedCategory) : news;
  const featured = visibleNews[0];
  const rest = visibleNews.slice(1);

  return (
    <div className="stitch-page">
      <section className="stitch-page-hero">
        <div>
          <span><Newspaper size={17} /> EINVESTUZ NEWSROOM</span>
          <h1>Новости финансового рынка</h1>
          <p>Отслеживайте события, которые могут влиять на эмитентов, отрасли, ликвидность и макроэкономический фон.</p>
        </div>
        <Link href="/ai" className="stitch-button stitch-button-primary"><Bot size={18} /> Спросить AI о влиянии</Link>
      </section>

      <section className="stitch-filter-row" aria-label="Категории новостей">
        <Link href="/news" className={selectedCategory ? undefined : "active"}>Все</Link>
        {categories.map((category) => <Link href={`/news?category=${encodeURIComponent(category)}`} className={selectedCategory === category ? "active" : undefined} key={category}>{category}</Link>)}
      </section>

      {featured ? (
        <section className="stitch-featured-news">
          <div className="stitch-featured-image" style={{ backgroundImage: `url(${images[0]})` }}><span>{featured.category}</span></div>
          <div>
            <small>{featured.time} · {featured.source}</small>
            <h2>{featured.title}</h2>
            {featured.summary ? <p>{featured.summary}</p> : <p>Источник не передал краткое содержание. Откройте материал для полного контекста.</p>}
            <Link href={featured.url || "/ai"} target={featured.url ? "_blank" : undefined} rel={featured.url ? "noreferrer" : undefined}>Читать полностью <ArrowRight size={17} /></Link>
          </div>
        </section>
      ) : <EmptyNews category={selectedCategory} />}

      <section className="stitch-news-list-grid">
        {rest.map((item, index) => (
          <article className="stitch-news-card" key={item.id}>
            <div className="stitch-news-image" style={{ backgroundImage: `url(${images[(index + 1) % images.length]})` }}><span>{item.category}</span></div>
            <div className="stitch-news-body">
              <small>{item.time} · {item.source}</small>
              <h3>{item.title}</h3>
              {item.summary ? <p>{item.summary}</p> : null}
              <Link href={item.url || "/ai"} target={item.url ? "_blank" : undefined} rel={item.url ? "noreferrer" : undefined}>Читать полностью <ArrowRight size={16} /></Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function EmptyNews({ category }: { category?: string }) {
  return (
    <div className="stitch-empty">
      <Search size={18} />
      <b>{category ? "В этой категории новостей нет" : "Новости временно недоступны"}</b>
      <span>{category ? "Выберите другую категорию или сбросьте фильтр." : "Backend не получил публикации от подключённых источников."}</span>
    </div>
  );
}
