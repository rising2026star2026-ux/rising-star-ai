import Link from "next/link";
import { notFound } from "next/navigation";
import { DIR_CATEGORIES, getDirCategory, toolsIn, card } from "@/lib/directory";
import DirTools from "@/components/DirTools";
import s from "@/components/directory.module.css";

export function generateStaticParams() {
  return DIR_CATEGORIES.map((c) => ({ cat: c.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { cat } = await params;
  const c = getDirCategory(cat);
  if (!c) return {};
  return { title: `أدوات ${c.name} بالذكاء الاصطناعي`, description: `أفضل أدوات الذكاء الاصطناعي في ${c.name}: ${c.desc}. لكل أداة صفحة بالعربي.`, alternates: { canonical: `/global-tools/${c.id}` } };
}

export default async function DirCategory({ params }) {
  const { cat } = await params;
  const c = getDirCategory(cat);
  if (!c) notFound();
  const items = toolsIn(c.id).map(card);
  return (
    <div className={s.page}>
      <nav className={s.crumbs} aria-label="مسار الصفحة">
        <Link href="/global-tools">أدوات عالمية</Link><span aria-hidden="true">/</span><span>{c.name}</span>
      </nav>
      <h1 className="page-title"><span aria-hidden="true">{c.icon}</span> {c.name}</h1>
      <p className={s.lead}>{c.desc}. {items.length} أداة في المجال ده.</p>
      <DirTools items={items} />
    </div>
  );
}
