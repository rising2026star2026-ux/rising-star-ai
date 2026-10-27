import Link from "next/link";
import { notFound } from "next/navigation";
import BotIcon from "@/components/BotIcon";
import { DIR_TOOLS, getDirTool, getDirCategory, pricingOf, toolsIn, card } from "@/lib/directory";
import s from "@/components/directory.module.css";

export function generateStaticParams() {
  return DIR_TOOLS.map((t) => ({ slug: t.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const t = getDirTool(slug);
  if (!t) return {};
  return {
    title: `${t.name} بالعربي: بتعمل إيه وسعرها`,
    description: (t.ar?.intro || t.summary || "").slice(0, 160),
    alternates: { canonical: `/ai/${t.slug}` },
  };
}

const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }); } catch { return ""; } };

export default async function DirToolPage({ params }) {
  const { slug } = await params;
  const t = getDirTool(slug);
  if (!t) notFound();
  const c = getDirCategory(t.cat);
  const p = pricingOf(t);
  const ar = t.ar || {};
  const plans = t.pricing?.plans || [];
  const similar = toolsIn(t.cat).filter((x) => x.slug !== t.slug).slice(0, 6).map(card);

  const jsonLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication", name: t.name, url: t.url,
    applicationCategory: c?.name, description: ar.intro || t.summary,
    ...(t.company ? { author: { "@type": "Organization", name: t.company } } : {}),
  };

  return (
    <div className={s.toolPage}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className={s.crumbs} aria-label="مسار الصفحة">
        <Link href="/global-tools">أدوات عالمية</Link><span aria-hidden="true">/</span>
        <Link href={`/global-tools/${c.id}`}>{c.name}</Link><span aria-hidden="true">/</span><span dir="auto">{t.name}</span>
      </nav>

      <header className={s.hero}>
        <BotIcon bot={t} size={84} />
        <div>
          <h1 dir="auto">{t.name}</h1>
          <p>{t.summary}</p>
          <div className={s.meta}>
            <span className={`${s.badge} ${s[p.tone]}`}>{p.label}</span>
            {t.company && <span>الشركة: <bdi>{t.company}</bdi></span>}
            <span>{c.icon} {c.name}</span>
          </div>
        </div>
      </header>

      <a className={s.visit} href={t.url} target="_blank" rel="noopener noreferrer nofollow">زيارة موقع الأداة ↗</a>

      {ar.intro && <section className={s.box}><h2>نبذة عن {t.name}</h2><p>{ar.intro}</p></section>}
      {ar.what && <section className={s.box}><h2>بتعمل إيه؟</h2><p>{ar.what}</p></section>}
      {ar.features?.length > 0 && (
        <section className={s.box}><h2>أهم المميزات</h2><ul>{ar.features.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
      )}
      {ar.audience?.length > 0 && (
        <section className={s.box}><h2>تنفع لمين؟</h2><ul>{ar.audience.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
      )}
      {ar.steps?.length > 0 && (
        <section className={s.box}><h2>إزاي تبدأ</h2><ol>{ar.steps.map((x, i) => <li key={i}>{x}</li>)}</ol></section>
      )}

      <section className={s.box}>
        <h2>التسعير</h2>
        <p><span className={`${s.badge} ${s[p.tone]}`}>{p.label}</span> {ar.pricing || ""}</p>
        {plans.length > 0 && (
          <table className={s.plans}>
            <thead><tr><th>الخطة</th><th>السعر</th><th>تفاصيل</th></tr></thead>
            <tbody>
              {plans.map((pl, i) => (
                <tr key={i}><td><bdi>{pl.name}</bdi></td><td><bdi>{pl.price || "—"}</bdi></td><td>{pl.note || ""}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        <p className={s.note}>الأسعار من موقع الأداة وقت المراجعة وممكن تتغير. اتأكد من صفحة الأسعار الرسمية قبل ما تدفع.</p>
      </section>

      {ar.faq?.length > 0 && (
        <section className={`${s.box} ${s.faq}`}>
          <h2>أسئلة شائعة</h2>
          {ar.faq.map((f, i) => <details key={i}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>
      )}

      {similar.length > 0 && (
        <section className={s.box}>
          <h2>أدوات مشابهة في {c.name}</h2>
          <div className={s.grid}>
            {similar.map((x) => (
              <Link key={x.href} href={x.href} className={s.tool}>
                <BotIcon bot={x} size={40} />
                <span><b dir="auto">{x.name}</b><small>{x.summary}</small></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className={s.note}>
        المعلومات مكتوبة بالعربي من موقع الأداة الرسمي{t.checked ? ` بتاريخ ${fmtDate(t.checked)}` : ""}. الشعار والاسم علامات تجارية لأصحابها، والصفحة دي تعريفية ومش تابعة للشركة.
      </p>
    </div>
  );
}
