import Link from "next/link";
import { notFound } from "next/navigation";
import { CREATORS, LINK_LABELS, getCreator } from "@/lib/creators";
import CreatorAvatar from "@/components/CreatorAvatar";
import s from "@/components/creators.module.css";

export function generateStaticParams() {
  return CREATORS.map((c) => ({ slug: c.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = getCreator(slug);
  if (!c) return {};
  return { title: `${c.name}: ${c.role}`, description: c.about.slice(0, 160), alternates: { canonical: `/creators/${c.slug}` } };
}

const ORDER = ["facebook", "youtube", "website", "instagram", "tiktok", "linkedin", "x", "telegram", "github", "email"];

export default async function CreatorPage({ params }) {
  const { slug } = await params;
  const c = getCreator(slug);
  if (!c) notFound();
  const links = ORDER.filter((k) => c.links[k]);
  const others = CREATORS.filter((x) => x.slug !== c.slug).slice(0, 4);

  return (
    <div className={s.profile}>
      <nav className={s.crumbs} aria-label="مسار الصفحة">
        <Link href="/creators">صناع المحتوى</Link><span aria-hidden="true">/</span><span>{c.name}</span>
      </nav>

      <header className={s.hero}>
        <CreatorAvatar c={c} size={92} />
        <div>
          <h1>{c.name}</h1>
          {c.en && c.en !== c.name && <span dir="ltr">{c.en}</span>}
          <p>{c.role}</p>
        </div>
      </header>

      <div className={s.links}>
        {links.map((k, i) => (
          <a key={k} href={k === "email" ? `mailto:${c.links[k]}` : c.links[k]} target="_blank" rel="noopener noreferrer" className={`${s.link} ${i === 0 ? s.main : ""}`}>
            {LINK_LABELS[k] || k} ↗
          </a>
        ))}
      </div>

      <section className={s.box}>
        <h2>بيقدّم إيه</h2>
        <p>{c.about}</p>
      </section>

      <section className={s.box}>
        <h2>مواضيعه</h2>
        <div className={s.tags}>{c.topics.map((t) => <span key={t}>{t}</span>)}</div>
      </section>

      <section className={s.box}>
        <h2>صناع محتوى تانيين</h2>
        <div className={s.grid}>
          {others.map((o) => (
            <Link key={o.slug} href={`/creators/${o.slug}`} className={s.card}>
              <CreatorAvatar c={o} size={44} />
              <span><b>{o.name}</b><small>{o.role}</small></span>
            </Link>
          ))}
        </div>
      </section>

      <p className={s.note}>
        مصدر المعلومات: <a href={c.source} target="_blank" rel="noopener noreferrer">هنا</a>. آخر مراجعة: 27 أكتوبر 2026.
        الصفحة دي تعريفية ومش تابعة لصاحبها. لو أنت صاحبها وعاوز تعدّل حاجة أو تضيف صورتك، تواصل مع إدارة الموقع.
      </p>
    </div>
  );
}
