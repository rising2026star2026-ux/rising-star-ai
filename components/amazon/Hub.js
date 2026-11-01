// صفحة «أدوات أمازون»: أربع أدوات، كل واحدة بتحل مشكلة واحدة في دقيقة
import Link from "next/link";
import s from "../seller/showcase.module.css";

export const AMAZON_TOOLS = [
  {
    href: "/amazon/check", tone: "gold", step: "قبل النشر", icon: "🛡️",
    title: "فاحص الرفض", hook: "الصق ليستنجك واعرف اللي هيخلي أمازون ترفضه",
    gets: ["الحروف والكلمات الممنوعة بالعربي والإنجليزي", "رقم الواتساب والسعر جوه النص", "طول العنوان وكلمات البحث بالبايت", "نسخة مصلّحة جاهزة"],
  },
  {
    href: "/amazon/listing", tone: "blue", step: "اكتب", icon: "✍️",
    title: "ليستنج من كلامك", hook: "قول عن منتجك بالعامية أو صوّره",
    gets: ["عنوان و5 نقاط ووصف وكلمات بحث", "عربي وإنجليزي مع بعض", "متفحص على قواعد أمازون قبل ما يوصلك"],
  },
  {
    href: "/amazon/profit", tone: "green", step: "احسب", icon: "🧮",
    title: "حاسبة الربح الصافي", hook: "هتكسب كام في الوحدة بعد كل الرسوم؟",
    gets: ["ربحك وهامشك بعد العمولة والإعلانات والمرتجع", "أقل سعر من غير خسارة", "السعر اللي يحقق هامشك"],
  },
  {
    href: "/amazon/competitor", tone: "rose", step: "اتفوق", icon: "🔍",
    title: "تحليل المنافس", hook: "الصق ليستنجه وتقييماته واعرف نقطة ضعفه",
    gets: ["شكاوي عملائه بالدليل من تقييماتهم", "كلمات عنده وناقصة عندك", "نقاط جاهزة تعالج المشاكل دي"],
  },
];

export default function Hub() {
  return (
    <ol className={s.flow}>
      {AMAZON_TOOLS.map((f, i) => (
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
  );
}
