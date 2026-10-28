import Link from "next/link";
import BotIcon from "@/components/BotIcon";
import { MAKER_KINDS, MAKER_LIST, makersIn } from "@/lib/makers";
import d from "@/components/directory.module.css";
import s from "@/components/maker.module.css";

export const metadata = {
  title: "صانع الصور والفيديو بالذكاء الاصطناعي",
  description: "41 أداة مجانية أو فيها جزء مجاني أو بالرصيد لتوليد الصور والفيديو، منها Flux وLTX، مع مترجم يحوّل فكرتك العربي لوصف إنجليزي تفهمه الأدوات.",
  alternates: { canonical: "/maker" },
};

export default function MakerHub() {
  return (
    <div className={d.page}>
      <h1 className="page-title">صانع الصور والفيديو</h1>
      <p className={d.lead}>
        {MAKER_LIST.length} أداة مجانية أو فيها جزء مجاني. اكتب فكرتك بالعربي وإحنا نترجمها لوصف إنجليزي تفهمه الأدوات، وبعدين افتح الأداة اللي تعجبك.
      </p>

      <Link href="/maker/pollinations" className={s.featured}>
        <span style={{ fontSize: "2rem" }} aria-hidden="true">🎨</span>
        <span>
          <b>ولّد صورة دلوقتي جوه الموقع</b>
          <small>اكتب بالعربي وطلّع الصورة هنا من غير تسجيل ولا مغادرة الصفحة.</small>
        </span>
        <span className={s.go}>جرّب</span>
      </Link>

      <div className={s.how}>
        <div><b>1) اكتب بالعربي</b>اوصف الصورة أو المقطع اللي عاوزه.</div>
        <div><b>2) نترجم لك الوصف</b>بنحوّله لإنجليزي مفصّل.</div>
        <div><b>3) افتح الأداة</b>الصق الوصف واطلع شغلك.</div>
      </div>

      {MAKER_KINDS.map((k) => (
        <section key={k.id} className={s.sec}>
          <h2>{k.title}</h2>
          <p>{k.sub}</p>
          <div className={d.grid}>
            {makersIn(k.id).map((m) => (
              <Link key={m.slug} href={m.href} className={d.tool}>
                <BotIcon bot={{ name: m.name, logo: m.logo, mono: m.name.slice(0, 2), tint: "#1f4dff" }} size={46} />
                <span>
                  <b dir="auto">{m.name}</b>
                  <small>{m.free}</small>
                  <span className={`${d.badge} ${m.login === false ? d.free : d.freemium}`}>{m.login === false ? "من غير تسجيل" : "محتاج حساب"}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <p className={d.note}>الحدود المجانية من مقالات منشورة في 2026 وبتتغير بسرعة. اتأكد من الموقع الرسمي. الشعارات والأسماء علامات تجارية لأصحابها والصفحات دي تعريفية.</p>
    </div>
  );
}
