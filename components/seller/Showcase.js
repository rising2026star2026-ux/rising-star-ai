// كروت «ستوديو البيّاع»: في الرئيسية (شريط) وفي صفحة الستوديو (كبيرة بالتفاصيل)
import Link from "next/link";
import s from "./showcase.module.css";

export const FEATURES = [
  {
    href: "/photo-ad", tone: "gold", step: "صوّر", icon: "📸",
    title: "صوّرها بموبايلك", hook: "صورة على ترابيزة المطبخ ← صور استوديو وإعلان كامل",
    gets: ["6 صور شكل الاستوديو لمنتجك", "بوستات فيسبوك وإنستجرام وواتساب وتيك توك", "فيديو إعلان 15 ثانية"],
  },
  {
    href: "/voice-post", tone: "cyan", step: "اتكلم", icon: "🎙️",
    title: "اتكلم بس.. واحنا نكتب", hook: "فويس بالمصري عن منتجك ← بوستات جاهزة لكل منصة",
    gets: ["سجّل أو ارفع فويس من واتساب", "الكلام بيظهر وانت بتتكلم", "بنقولك المعلومات الناقصة اللي بتفرق في البيع"],
  },
  {
    href: "/test-ad", tone: "blue", step: "اختبر", icon: "👥",
    title: "جرّب إعلانك على 100 زبون", hook: "شوف مين هيطلب ومين هيعدّي قبل ما تدفع جنيه",
    gets: ["تعليقات زباين مصريين زي فيسبوك بالظبط", "درجة من 100 والاعتراضات بنسبها", "نسخة أقوى تختبرها تاني وتقارن"],
  },
  {
    href: "/catalog", tone: "green", step: "انشر", icon: "📒",
    title: "كتالوجك في دقيقة", hook: "كل منتجاتك في PDF واحد بزرار «اطلب» على واتساب",
    gets: ["رقم لكل منتج عشان الطلب يبقى سهل", "صور للحالة والستوري", "بيتحفظ وتحدّث الأسعار في أي وقت"],
  },
];

export const RECEIPT = {
  href: "/subscriptions/receipt", tone: "rose", icon: "🧾",
  title: "كشف حساب اشتراكاتك", hook: "بتدفع كام على ChatGPT وCanva وCapCut؟ واللي بيضيع منهم كام؟",
  gets: ["إيصال بالإجمالي بالجنيه", "الفلوس اللي بتضيع وليه", "كارت تشاركه ستوري"],
};

/** شريط الرئيسية */
export function ShowcaseStrip() {
  return (
    <div className={s.strip}>
      {[...FEATURES, RECEIPT].map((f) => (
        <Link key={f.href} href={f.href} className={`${s.tile} ${s["t_" + f.tone]}`}>
          <span className={s.tIcon} aria-hidden="true">{f.icon}</span>
          <b>{f.title}</b>
          <small>{f.hook}</small>
          <span className={s.tGo}>جرّب دلوقتي ←</span>
        </Link>
      ))}
    </div>
  );
}

/** صفحة الستوديو */
export function ShowcaseFull() {
  return (
    <>
      <ol className={s.flow}>
        {FEATURES.map((f, i) => (
          <li key={f.href}>
            <Link href={f.href} className={`${s.card} ${s["t_" + f.tone]}`}>
              <span className={s.num}>{i + 1}<em>{f.step}</em></span>
              <span className={s.cIcon} aria-hidden="true">{f.icon}</span>
              <span className={s.cText}>
                <b>{f.title}</b>
                <small>{f.hook}</small>
                <ul>{f.gets.map((g) => <li key={g}>{g}</li>)}</ul>
              </span>
              <span className={s.cGo}>ابدأ ←</span>
            </Link>
          </li>
        ))}
      </ol>
      <h2 className={s.sub}>ولو بتدفع اشتراكات ذكاء اصطناعي</h2>
      <Link href={RECEIPT.href} className={`${s.card} ${s.wide} ${s["t_" + RECEIPT.tone]}`}>
        <span className={s.cIcon} aria-hidden="true">{RECEIPT.icon}</span>
        <span className={s.cText}>
          <b>{RECEIPT.title}</b>
          <small>{RECEIPT.hook}</small>
          <ul>{RECEIPT.gets.map((g) => <li key={g}>{g}</li>)}</ul>
        </span>
        <span className={s.cGo}>اطبع كشفك ←</span>
      </Link>
    </>
  );
}
