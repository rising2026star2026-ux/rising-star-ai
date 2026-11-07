import Link from "next/link";
import { notFound } from "next/navigation";
import { SECTIONS, SECTION_BY_ID, ITEMS, itemHref } from "@/lib/sections";
import s from "@/components/section.module.css";

export function generateStaticParams() {
  return SECTIONS.map((x) => ({ id: x.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const x = SECTION_BY_ID[id];
  if (!x) return {};
  const title = `${x.name}: ${x.tagline}`;
  return { title, description: `${x.name} في Rising StarAi: ${x.items.map((h) => ITEMS[h].label).join("، ")}.`, alternates: { canonical: `/s/${id}` }, openGraph: { title, url: `/s/${id}`, siteName: "Rising StarAi", locale: "ar_EG", type: "website" } };
}

export default async function SectionPage({ params }) {
  const { id } = await params;
  const x = SECTION_BY_ID[id];
  if (!x) notFound();
  return (
    <main className={s.page} style={{ "--sec": x.color }}>
      <header className={s.head}>
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={x.icon} /></svg>
        <h1>{x.name}</h1>
        <p>{x.tagline}</p>
      </header>
      <div className={s.grid}>
        {x.items.map((h) => (
          <Link key={h} href={itemHref(h, x.id)} className={s.card}>
            <b>{ITEMS[h].label}</b>
            <span>{ITEMS[h].desc}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
