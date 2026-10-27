import Link from "next/link";
import { notFound } from "next/navigation";
import BotIcon from "@/components/BotIcon";
import AskAbout from "@/components/AskAbout";
import { APPS, APP_SECTIONS, FREE_NOTE, getApp, altsFor } from "@/lib/apps";
import s from "@/components/program.module.css";

export function generateStaticParams() {
  return APPS.map((a) => ({ key: a.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { key } = await params;
  const a = getApp(key);
  if (!a) return {};
  return {
    title: `${a.name} بالعربي: بيعمل إيه وإزاي تستخدمه`,
    description: `${a.about} ${a.free ? a.free : ""}`.slice(0, 160),
    alternates: { canonical: `/program/${a.slug}` },
  };
}

export default async function ProgramPage({ params }) {
  const { key } = await params;
  const app = getApp(key);
  if (!app) notFound();
  const sec = APP_SECTIONS.find((x) => x.id === app.section);
  const alts = altsFor(app, 3);

  return (
    <div className={s.page}>
      <nav className={s.crumbs} aria-label="مسار الصفحة">
        <Link href="/models">الموديلات والبرامج</Link><span aria-hidden="true">/</span><span>{sec?.title}</span>
      </nav>

      <header className={s.head}>
        <BotIcon bot={app} size={72} />
        <div>
          <h1><bdi>{app.name}</bdi></h1>
          <p>من <bdi>{app.maker}</bdi>: {app.desc}</p>
          {sec && <span className={s.tag}>{sec.title}</span>}
        </div>
      </header>

      <div className={s.actions}>
        <a className={`${s.btn} ${s.main}`} href={app.url} target="_blank" rel="noopener noreferrer">
          افتح {app.name}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" /></svg>
        </a>
        <AskAbout name={app.name} className={s.btn}>اسأل عنه بالعربي في الشات</AskAbout>
      </div>

      <div className={s.grid}>
        <section className={s.card}>
          <h2>بيعمل إيه؟</h2>
          <p>{app.about}</p>
        </section>

        <section className={s.card}>
          <h2>ينفعك في إيه؟</h2>
          <ul>{app.uses.map((u) => <li key={u}>{u}</li>)}</ul>
        </section>

        <section className={`${s.card} ${app.free ? s.free : s.unknown}`}>
          <h2>مجاني ولا مدفوع؟</h2>
          <p>{app.free || "مش متأكدين من الأسعار والحدود الحالية، فاتأكد منها من الموقع الرسمي قبل ما تدفع."}</p>
          {app.free && <p className={s.small}>{FREE_NOTE}</p>}
        </section>

        <section className={s.card}>
          <h2>بدائل ليه</h2>
          <div className={s.alts}>
            {alts.map((b) => (
              <Link key={b.key} href={b.href} className={s.alt}>
                <BotIcon bot={b} size={40} />
                <span><b><bdi>{b.name}</bdi></b><small>{b.desc}</small></span>
              </Link>
            ))}
          </div>
        </section>

        <p className={s.tip}>
          البرنامج بيفتح في موقعه الرسمي بحسابك. لو الموقع ظهر بالإنجليزي: من كروم اضغط ⋮ ثم «ترجمة» وهيتحول للعربي.
          وتقدر تسأل عنه بالعربي في الشات وإحنا نشرحلك خطوة بخطوة.
        </p>
      </div>
    </div>
  );
}
