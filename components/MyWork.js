"use client";
// مشروعاتي: كل اللي حفظه العميل على جهازه (ملف النشاط، آخر دراسة جدوى، المقارنات المحفوظة).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStored, write } from "@/lib/store";
import { compareAll } from "@/lib/bizcompare";
import { groupOf } from "@/lib/bizgroups";
import { MODE_BY_ID } from "@/lib/bizassistant";
import { profileCompleteness } from "@/lib/bizprofile";
import s from "./mywork.module.css";

const when = (t) => new Date(t).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });

export default function MyWork() {
  const [brand] = useStored("brand", null);
  const [feas] = useStored("feasibility-last", null);
  const [cmp, setCmp] = useStored("compare-saved", []);
  const [studies, setStudies] = useStored("feasibility-saved", []);
  const [hist, setHist] = useStored("history", []);
  const [chats, setChats] = useStored("assistant-saved", []);
  const router = useRouter();
  const prog = profileCompleteness(brand);
  // مخرجات الأدوات المحفوظة بتتقسم حسب مجموعة الأداة
  const byGroup = (ids) => hist.filter((h) => ids.includes(groupOf(h.toolId)));
  const products = byGroup(["products"]);
  const marketing = byGroup(["marketing", "content"]);
  const reports = byGroup(["manage", "feasibility", "market", "sales", "identity"]);
  const studiesCount = studies.length + (feas?.a ? 1 : 0);
  const none = !brand && !feas?.a && !cmp.length && !studies.length && !hist.length && !chats.length;
  const tiles = [["الدراسات", studiesCount], ["المقارنات", cmp.length], ["المنتجات", products.length], ["خطط التسويق", marketing.length], ["التقارير", reports.length], ["المحادثات", chats.length]];
  const histRows = (list, empty) => list.length ? list.slice(0, 8).map((h) => (
    <div key={h.id} className={s.row}>
      <span><b>{h.toolName}</b><small>{(h.input || "").slice(0, 70)} — {when(h.at)}</small></span>
      <Link href={`/tool/${h.toolId}?h=${h.id}`} className={s.go}>افتح</Link>
      <button type="button" className={s.del} onClick={() => setHist(hist.filter((x) => x.id !== h.id))}>احذف</button>
    </div>
  )) : <p className={s.empty}>{empty}</p>;
  const openStudy = (st) => { write("feasibility-last", st.study); router.push("/feasibility"); };

  return (
    <div className={s.wrap}>
      <ul className={s.tiles} aria-label="ملخص مشروعاتك">
        {tiles.map(([l, n]) => <li key={l}><b>{n.toLocaleString("ar-EG")}</b><span>{l}</span></li>)}
      </ul>

      <section className={s.card}>
        <div className={s.head}><h2>ملف النشاط</h2><Link href="/brand" className={s.go}>{brand ? "عدّل" : "ابدأ"}</Link></div>
        {brand ? (
          <p className={s.line}><b>{brand.name}</b>{brand.field ? ` — ${brand.field}` : ""}{brand.city ? ` — ${brand.city}` : ""}<small className={s.sub}>الملف مكتمل {prog.percent.toLocaleString("ar-EG")}٪{prog.missing.length ? `، ناقص: ${prog.missing.slice(0, 3).map((m) => m.label).join("، ")}` : ""}</small></p>
        ) : <p className={s.empty}>لسه ما سجلتش نشاطك. سجله مرة واحدة وتتستخدم في كل الأدوات.</p>}
      </section>

      <section className={s.card}>
        <div className={s.head}><h2>دراسة الجدوى</h2><Link href="/feasibility" className={s.go}>{feas?.a ? "كمّل الدراسة" : "ابدأ دراسة"}</Link></div>
        {feas?.a ? (
          <p className={s.line}><b>{feas.form?.activity || "دراسة محفوظة"}</b>{feas.form?.governorate ? ` — ${feas.form.governorate}` : ""}</p>
        ) : <p className={s.empty}>مفيش دراسة محفوظة. أول ما تعمل دراسة بتتحفظ هنا على جهازك.</p>}
        {studies.map((st) => (
          <div key={st.id} className={s.row}>
            <span><b>{st.name}</b><small>{when(st.at)}</small></span>
            <button type="button" className={s.go} onClick={() => openStudy(st)}>افتح</button>
            <button type="button" className={s.del} onClick={() => setStudies(studies.filter((x) => x.id !== st.id))}>احذف</button>
          </div>
        ))}
      </section>

      <section className={s.card}>
        <div className={s.head}><h2>مقارنات الأنشطة</h2><Link href="/compare-business" className={s.go}>مقارنة جديدة</Link></div>
        {cmp.length ? cmp.map((c) => {
          const { rows } = compareAll(c.list);
          return (
            <div key={c.id} className={s.row}>
              <span><b>{c.name}</b><small>{rows.map((r) => r.name).join(" ‏|‏ ")} — {when(c.at)}</small></span>
              <button type="button" className={s.go} onClick={() => { write("compare-draft", c.list); router.push("/compare-business"); }}>افتح</button>
              <button type="button" className={s.del} onClick={() => setCmp(cmp.filter((x) => x.id !== c.id))}>احذف</button>
            </div>
          );
        }) : <p className={s.empty}>مفيش مقارنات محفوظة. اضغط «احفظ المقارنة» بعد ما تقارن.</p>}
      </section>

      <section className={s.card}>
        <div className={s.head}><h2>المنتجات</h2><Link href="/tools?cat=products" className={s.go}>أدوات المنتجات</Link></div>
        {histRows(products, "أوصاف المنتجات اللي تولدها بتتحفظ هنا.")}
      </section>

      <section className={s.card}>
        <div className={s.head}><h2>خطط التسويق والمحتوى</h2><Link href="/tools?cat=marketing" className={s.go}>أدوات التسويق</Link></div>
        {histRows(marketing, "الإعلانات والخطط والمحتوى اللي تولدها بتتحفظ هنا.")}
      </section>

      <section className={s.card}>
        <div className={s.head}><h2>التقارير والخطط</h2><Link href="/tools?cat=manage" className={s.go}>إدارة النشاط</Link></div>
        {histRows(reports, "خطة العمل والعروض وتحليل الجداول بتتحفظ هنا.")}
      </section>

      <section className={s.card}>
        <div className={s.head}><h2>محادثات مساعد الأعمال</h2><Link href="/s/seller" className={s.go}>افتح المساعد</Link></div>
        {chats.length ? chats.slice(0, 8).map((c) => (
          <details key={c.id} className={s.chat}>
            <summary><b>{c.question || "سؤال"}</b><small>{MODE_BY_ID[c.mode]?.label || "مساعد الأعمال"} — {when(c.at)}</small></summary>
            <p>{c.answer}</p>
            <button type="button" className={s.del} onClick={() => setChats(chats.filter((x) => x.id !== c.id))}>احذف</button>
          </details>
        )) : <p className={s.empty}>اضغط على أيقونة الحفظ تحت أي رد من المساعد ويتحفظ هنا.</p>}
      </section>

      {none && <p className={s.note}>كل اللي هنا محفوظ على جهازك أنت بس. لو مسحت بيانات المتصفح بتتمسح.</p>}
    </div>
  );
}
