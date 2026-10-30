import Link from "next/link";
import { notFound } from "next/navigation";
import { LIBRARY, LIB_CATS, getLibTool, libByCat, LIB_HF_NOTE } from "@/lib/library";
import { SITE_URL, BRAND } from "@/lib/site";
import LibraryFrame from "@/components/LibraryFrame";
import s from "@/components/library.module.css";

export function generateStaticParams() {
  return LIBRARY.map((t) => ({ slug: t.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const t = getLibTool(slug);
  if (!t) return {};
  const title = `${t.ar} (${t.name}) مجاناً جوه الموقع`;
  return { title, description: `${t.desc} افتحها مجاناً على ${BRAND} بواجهتها الأصلية.`, alternates: { canonical: `/library/${slug}` } };
}

export default async function LibTool({ params }) {
  const { slug } = await params;
  const t = getLibTool(slug);
  if (!t) notFound();
  const cat = LIB_CATS.find((c) => c.id === t.cat);
  const more = libByCat(t.cat).filter((x) => x.slug !== t.slug).slice(0, 6);
  return (
    <div className={s.page}>
      <p className={s.crumbs}><Link href="/library">مكتبة الأدوات</Link> ← {cat?.name}</p>
      <h1 className="page-title">{t.ar}</h1>
      <p className={s.lead} style={{ marginBottom: 6 }}>{t.desc}</p>
      <div className={s.meta}>
        <span>✅ مجانية</span>
        <span>📜 {t.lic}</span>
        {t.arabic ? <span>🇪🇬 تدعم العربي</span> : null}
        <span dir="ltr">{t.name}</span>
      </div>
      <LibraryFrame url={t.url} name={t.ar} hf={t.hf} hfNote={t.hf ? LIB_HF_NOTE : ""} pageUrl={`${SITE_URL}/library/${t.slug}`} />
      {more.length > 0 && (
        <div className={s.about}>
          <h2>أدوات تانية في {cat?.name}</h2>
          <div className={s.more}>
            {more.map((x) => (
              <Link key={x.slug} href={`/library/${x.slug}`} className={s.card}><b>{x.ar}</b><small>{x.desc}</small></Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
