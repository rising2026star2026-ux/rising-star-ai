import Link from "next/link";

export const metadata = {
  title: "الباقات",
  description: "باقات Rising StarAi بالجنيه المصري.",
  robots: { index: false },
};

// صفحة مؤقتة. هتتبدل بالباقات الحقيقية بعد ما نضيف تسجيل الدخول والدفع.
// عدّل الأسعار والمميزات من هنا.
const PLANS = [
  { name: "تجربة", price: "0", note: "عشان تجرب الموقع", items: ["عدد محدود من الطلبات يومياً", "كل الأدوات", "الشات بالموديلات الأساسية"] },
  { name: "أساسي", price: "99", note: "للاستخدام اليومي", items: ["طلبات أكتر بكتير", "كل الأدوات", "كل الموديلات الـ6"], best: true },
  { name: "احترافي", price: "299", note: "للشغل الكتير", items: ["أعلى حد استخدام", "كل الأدوات والموديلات", "أولوية في السرعة"] },
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

      <p className="notice">
        الاشتراكات لسه مش مفعّلة، والموقع دلوقتي في مرحلة التجربة.
        الصفحة دي هتشتغل بعد ما نضيف تسجيل الدخول وبوابة الدفع.{" "}
        <Link href="/tools" className="link">جرّب الأدوات</Link>
      </p>
    </>
  );
}
