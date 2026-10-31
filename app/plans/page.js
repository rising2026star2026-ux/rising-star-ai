import Link from "next/link";
import ProCode from "@/components/ProCode";

export const metadata = {
  title: "الباقات",
  description: "باقات Rising StarAi بالجنيه المصري.",
  robots: { index: false },
};

// صفحة مؤقتة. هتتبدل بالباقات الحقيقية بعد ما نضيف تسجيل الدخول والدفع.
// عدّل الأسعار والمميزات من هنا.
const PLANS = [
  { name: "تجربة", price: "0", note: "عشان تجرب الموقع", items: ["عدد محدود من الطلبات يومياً", "كل الأدوات", "الشات بالموديلات الأساسية"] },
  { name: "أساسي", price: "99", note: "للاستخدام اليومي", items: ["طلبات أكتر بكتير", "كل الأدوات", "كل الموديلات الـ6"] },
  {
    name: "المتكاملة", price: "250", note: "بديل اشتراكات الشات والبحث والتلخيص", best: true,
    items: ["شات بأقوى الموديلات ودمج 4 نماذج", "بحث على الإنترنت بالمصادر", "تلخيص PDF وWord والإجابة من الملفات", "مشاريع: ملفات وتعليمات ومحادثات محفوظة", "ستوديو البيّاع وكل الأدوات", "وصول مشترك لأدوات Toolsurf (Canva وغيرها) كإضافة، بشروطها"],
  },
  { name: "احترافي", price: "450", note: "للشغل الكتير", items: ["كل مميزات المتكاملة", "الموديلات العالمية: GPT وClaude وGemini وGrok", "أعلى حد استخدام", "أولوية في السرعة"] },
];

export default function Plans() {
  return (
    <>
      <h1 className="page-title">الباقات</h1>
      <p className="page-sub">الأسعار بالجنيه المصري شهرياً، والإلغاء في أي وقت.</p>

      <div className="plans">
        {PLANS.map((p) => (
          <div key={p.name} className={`plan ${p.best ? "best" : ""}`}>
            {p.best && <span className="tag">الأكثر اختياراً</span>}
            <h2>{p.name}</h2>
            <p className="price">{p.price} <small>جنيه / شهر</small></p>
            <p className="plan-note">{p.note}</p>
            <ul>{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        <ProCode />
      </div>

      <p className="notice">
        الاشتراكات لسه مش مفعّلة، والموقع دلوقتي في مرحلة التجربة.
        الصفحة دي هتشتغل بعد ما نضيف تسجيل الدخول وبوابة الدفع.{" "}
        <Link href="/tools" className="link">جرّب الأدوات</Link>
      </p>
    </>
  );
}
