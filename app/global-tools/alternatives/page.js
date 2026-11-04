import Link from "next/link";
import { ALTERNATIVES, KIND, ALT_UPDATED_AR } from "@/lib/alternatives";
import { USD_EGP } from "@/lib/subscriptions";
import s from "@/components/alternatives.module.css";

export const metadata = {
  title: "بدائل مجانية لأشهر الأدوات المدفوعة",
  description: "20 أداة مدفوعة مشهورة (فوتوشوب، Midjourney، ChatGPT Plus، Grammarly…) وبديلها المجاني اللي بيعمل نفس الشغل، وإيه اللي تقدر تعمله جوه Rising StarAi بالعربي.",
  alternates: { canonical: "/global-tools/alternatives" },
};

const egp = (usd) => `${Math.round((usd * USD_EGP) / 10) * 10} ج تقريباً`;

export default function Alternatives() {
  const inSite = ALTERNATIVES.filter((x) => x.inSite).length;
  return (
    <div className={s.page}>
      <nav className={s.crumbs}><Link href="/global-tools">أدوات عالمية</Link> ‹ <span>بدائل مجانية</span></nav>
      <h1 className="page-title">بدائل مجانية للأدوات المدفوعة</h1>
      <p className={s.lead}>
        نفس الشغل بسعر مختلف. لكل مجال: الأداة المدفوعة المشهورة، والبديل المجاني اللي يعمل نفس الحاجة، و{inSite} مجال منهم تقدر تعمله هنا جوه الموقع بالعربي.
      </p>
      <p className={s.note}>اتراجعت يوم {ALT_UPDATED_AR}. الخطط المجانية بتتغير، فاتأكد من حدودها على موقع الأداة قبل ما تعتمد عليها.</p>

      <div className={s.list}>
        {ALTERNATIVES.map((x, i) => (
          <section key={x.id} className={s.card} id={x.id}>
            <header className={s.head}>
              <span className={s.num}>{String(i + 1).padStart(2, "0")}</span>
              <span className={s.icon} aria-hidden="true">{x.icon}</span>
              <h2>{x.cat}</h2>
            </header>
            <div className={s.cols}>
              <div className={s.paid}>
                <small>المدفوع</small>
                <a href={x.paid.url} target="_blank" rel="noopener noreferrer nofollow">{x.paid.name}</a>
                <span>{x.paid.usd ? `من ${x.paid.usd}$ في الشهر (${egp(x.paid.usd)})` : "اشتراك شهري"}</span>
                {x.paid.note && <em>{x.paid.note}</em>}
              </div>
              <div className={s.free}>
                <small>البديل المجاني</small>
                <ul>
                  {x.free.map((f) => (
                    <li key={f.name}>
                      <a href={f.url} target="_blank" rel="noopener noreferrer nofollow">{f.name}</a>
                      <i className={s[`k_${f.kind}`]}>{KIND[f.kind]}</i>
                      <span>{f.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {x.inSite && (
              <Link href={x.inSite.href} className={s.inSite}>
                <b>متاح جوه Rising</b>
                <span>{x.inSite.label} — بالعربي ومن غير تسجيل في موقع تاني</span>
              </Link>
            )}
            {x.fix && <p className={s.fix}>تصحيح: {x.fix}</p>}
          </section>
        ))}
      </div>

      <p className={s.note}>
        عايز تشوف كام بتدفع في اشتراكاتك وأرخص بديل لكل احتياج؟ جرّب <Link href="/subscriptions">مقارنة الاشتراكات</Link>. ولو عايز تفتح أدواتك الخارجية كلها بضغطة، استخدم <Link href="/my-tools">أدواتي</Link>.
      </p>
    </div>
  );
}
