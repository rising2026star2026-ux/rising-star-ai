import Link from "next/link";
import { LIBRARY, LIB_CATS, BLOCKED, getLibTool } from "@/lib/library";
import BrandLogo from "@/components/BrandLogo";
import LibraryGrid from "@/components/LibraryGrid";
import s from "@/components/library.module.css";

export const metadata = {
  title: "مكتبة الأدوات: أدوات مجانية بتفتح جوه الموقع",
  description: "أكتر من 100 أداة مجانية بتفتح جوه Rising StarAi بواجهتها الأصلية: توليد وتعديل صور، صوت عربي، محرر صور، مخططات، برمجة، رياضيات ومحاكاة علمية.",
  alternates: { canonical: "/library" },
};

const LEVEL = { "قريب جداً": s.s1, "كويس": s.s2, "أضعف": s.s3 };

export default function Library() {
  const tools = LIBRARY.map(({ slug, cat, name, ar, desc, hf, arabic, top }) => ({ slug, cat, name, ar, desc, hf, arabic, top }));
  return (
    <div className={s.page}>
      <h1 className="page-title">مكتبة الأدوات</h1>
      <p className={s.lead}>
        أدوات مجانية بتفتح هنا جوه الموقع بواجهة الشركة الأصلية، من غير ما تخرج. اختبرنا كل أداة وراجعنا رخصتها: كلها مجانية ومفيش مانع لاستخدامها. شغلك بتحفظه على جهازك من زر التحميل جوه الأداة، وبعدين تشاركه.
      </p>
      <div className={s.stats}>
        <span className={s.stat}><b>{LIBRARY.length}</b>أداة</span>
        <span className={`${s.stat} ${s.blue}`}><b>{LIB_CATS.length}</b>تصنيف</span>
        <span className={s.stat}><b>{LIBRARY.filter((t) => t.arabic).length}</b>تدعم العربي</span>
      </div>
      <LibraryGrid tools={tools} cats={LIB_CATS} />

      <section className={s.blocked} id="blocked">
        <h2>برامج مشهورة مش بتفتح جوه أي موقع، والبديل هنا</h2>
        <p>البرامج دي شركاتها بتمنع فتحها جوه مواقع تانية، فبتفتح في تبويب جديد. وجنب كل واحد البديل اللي بيفتح عندنا، وقوته قد إيه مقارنة بالأصلي.</p>
        <div className={s.bgrid}>
          {BLOCKED.map((b) => (
            <div key={b.name} className={s.bcard}>
              <header>
                <b><BrandLogo tool={{ name: b.name, slug: b.name, url: b.url }} size={24} /> {b.name}<span className={`${s.strength} ${LEVEL[b.strength] || ""}`}>البديل: {b.strength}</span></b>
                <a href={b.url} target="_blank" rel="noopener noreferrer">الأصلي ↗</a>
              </header>
              {b.why}
              <div className={s.alts}>
                {b.alt.map((a) => { const t = getLibTool(a); return t ? <Link key={a} href={`/library/${a}`}>{t.ar}</Link> : null; })}
                {b.site ? <Link href={b.site}>{b.site === "/tools" ? "أدوات الموقع" : "أداة الريلز الاحترافية"}</Link> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
