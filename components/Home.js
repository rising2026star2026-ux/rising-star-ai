"use client";
// الرئيسية: لوحة Rising Business. مقدمة، اختيار نوع النشاط، ملف النشاط، اختصارات المقارنة والجدوى والمساعد وستوديو البيّاع،
// مجموعات الأدوات (من غير كتالوج طويل)، ومشروعات العميل المحفوظة.
import Link from "next/link";
import { useStored, write } from "@/lib/store";
import { compareAll } from "@/lib/bizcompare";
import { BIZ_GROUPS } from "@/lib/bizgroups";
import { tools } from "@/lib/tools";
import { Glyph } from "@/lib/toolglyphs";
import StarMark from "./StarMark";
import s from "./home.module.css";
import d from "./dash.module.css";

const count = (g) => g.tools.length + g.links.length;
const when = (t) => new Date(t).toLocaleDateString("ar-EG", { day: "numeric", month: "long" });

export default function Home() {
  const [brand] = useStored("brand", null);
  const [feas] = useStored("feasibility-last", null);
  const [cmp] = useStored("compare-saved", []);
  const hasWork = !!brand || !!feas?.a || cmp.length > 0;

  return (
    <div className={s.page}>
      <section className={`${s.band} ${s.night} ${s.hero} on-night`} data-band-sec="night">
        <i className={s.starfield} aria-hidden="true" />
        <i className={s.horizon} aria-hidden="true" />
        <div className={s.in}>
          <div className={s.brand} style={{ textAlign: "center" }}>
            <span className={s.mark}><StarMark size={52} /></span>
            <h1 className={d.title}>كل أدوات تجارتك في مكان واحد</h1>
            <p>حلّل السوق، قارن الفرص، ادرس مشروعك، جهّز منتجاتك، وسوّق وبِع بمساعدة الذكاء الاصطناعي.</p>
          </div>
          <div className={d.choice} role="group" aria-label="نوع النشاط">
            <Link href="/brand" className={d.choiceBtn} onClick={() => write("biz-status", "existing")}>
              <b>عندي نشاط قائم</b><span>سجّل نشاطك وطوّره</span>
            </Link>
            <Link href="/compare-business" className={d.choiceBtn} onClick={() => write("biz-status", "new")}>
              <b>مشروع جديد</b><span>قارن الفرص وادرس الجدوى</span>
            </Link>
          </div>
        </div>
      </section>

      <section className={`${s.band} ${s.white}`}>
        <div className={s.in} style={{ maxWidth: 1000 }}>
          <div className={d.block}>
            <div className={d.grid2}>
              <Link href="/brand" className={d.panel}>
                <h2>ملف نشاطك</h2>
                {brand ? (
                  <p><b>{brand.name}</b>{brand.city ? ` — ${brand.city}` : ""}{brand.field ? `. ${brand.field}` : ""}</p>
                ) : <p>سجّل نوع النشاط والمدينة والعملاء والمنتجات والميزانية مرة واحدة، والأدوات والمساعد يشتغلوا على مقاسك.</p>}
                <span className={d.more}>{brand ? "عدّل الملف" : "ابدأ الملف"}</span>
              </Link>
              <Link href="/s/seller" className={`${d.panel} ${d.dark}`}>
                <h2>مساعد الأعمال</h2>
                <p>استشارات تجارية، جدوى، منافسين، تسعير وأرباح، تسويق ومبيعات. مساعد واحد على ملف نشاطك.</p>
                <span className={d.more}>اسأل المساعد</span>
              </Link>
            </div>
          </div>

          <div className={d.block}>
            <div className={d.head}><h2>قارن وادرس</h2></div>
            <div className={d.grid2}>
              <Link href="/compare-business" className={d.panel}>
                <h2>مقارنة الأنشطة التجارية</h2>
                <p>من نشاطين لخمسة: رأس المال، التعادل، الربح، الاسترداد والمخاطر، بجداول ورسوم.</p>
                <span className={d.more}>ابدأ المقارنة</span>
              </Link>
              <Link href="/feasibility" className={d.panel}>
                <h2>دراسة الجدوى</h2>
                <p>سيناريوهات متحفظ ومتوقع ومتفائل، ونقطة تعادل وحساسية، بافتراضات تعدّلها بنفسك.</p>
                <span className={d.more}>{feas?.a ? "كمّل دراستك" : "ابدأ دراسة"}</span>
              </Link>
            </div>
          </div>

          <div className={d.block}>
            <div className={d.head}><h2>بيع وسوّق</h2></div>
            <Link href="/seller" className={`${d.panel} ${d.wide}`}>
              <h2>ستوديو البيّاع</h2>
              <p>إعلان من صورة، منشورات من تسجيل صوتي، كتالوج بأزرار واتساب، فحص السوق واختبار الإعلان.</p>
              <span className={d.more}>افتح الاستوديو</span>
            </Link>
          </div>

          <div className={d.block}>
            <div className={d.head}><h2>أدوات المنتجات والتسويق</h2><Link href="/tools" className={d.all}>كل الأدوات ({tools.length.toLocaleString("ar-EG")})</Link></div>
            <div className={d.groups}>
              {BIZ_GROUPS.filter((g) => g.tools.length).map((g) => (
                <Link key={g.id} href={`/tools?cat=${g.id}`} className={d.group}>
                  <i><Glyph name={g.glyph} size={20} /></i>
                  <b>{g.name}</b>
                  <span>{g.desc}</span>
                  <small>{g.tools.length.toLocaleString("ar-EG")} أداة</small>
                </Link>
              ))}
            </div>
          </div>

          <div className={d.block}>
            <div className={d.head}><h2>مشروعاتك وتقاريرك</h2>{hasWork && <Link href="/my-work" className={d.all}>الكل</Link>}</div>
            {hasWork ? (
              <div className={d.recent}>
                {brand && <Link href="/brand" className={d.rItem}><b>ملف النشاط</b><span>{brand.name}</span></Link>}
                {feas?.a && <Link href="/feasibility" className={d.rItem}><b>آخر دراسة جدوى</b><span>{feas.form?.activity || "دراسة محفوظة"}</span></Link>}
                {cmp.slice(0, 3).map((c) => (
                  <Link key={c.id} href="/compare-business" className={d.rItem}><b>{c.name}</b><span>{compareAll(c.list).rows.length.toLocaleString("ar-EG")} أنشطة — {when(c.at)}</span></Link>
                ))}
              </div>
            ) : (
              <p className={d.emptyBox}>لسه ما فيش مشروعات. أول ما تحفظ ملف نشاطك أو دراسة أو مقارنة بتظهر هنا.</p>
            )}
          </div>

          <p className={d.foot}>
            <Link href="/plans">الباقات</Link>
            <Link href="/support">الدعم</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
