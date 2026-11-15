"use client";
// مشروعاتي: كل اللي حفظه العميل على جهازه (ملف النشاط، آخر دراسة جدوى، المقارنات المحفوظة).
import Link from "next/link";
import { useStored } from "@/lib/store";
import { compareAll } from "@/lib/bizcompare";
import s from "./mywork.module.css";

const when = (t) => new Date(t).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });

export default function MyWork() {
  const [brand] = useStored("brand", null);
  const [feas] = useStored("feasibility-last", null);
  const [cmp, setCmp] = useStored("compare-saved", []);
  const none = !brand && !feas?.a && !cmp.length;

  return (
    <div className={s.wrap}>
      <section className={s.card}>
        <div className={s.head}><h2>ملف النشاط</h2><Link href="/brand" className={s.go}>{brand ? "عدّل" : "ابدأ"}</Link></div>
        {brand ? (
          <p className={s.line}><b>{brand.name}</b>{brand.field ? ` — ${brand.field}` : ""}{brand.city ? ` — ${brand.city}` : ""}</p>
        ) : <p className={s.empty}>لسه ما سجلتش نشاطك. سجله مرة واحدة وتتستخدم في كل الأدوات.</p>}
      </section>

      <section className={s.card}>
        <div className={s.head}><h2>دراسة الجدوى</h2><Link href="/feasibility" className={s.go}>{feas?.a ? "كمّل الدراسة" : "ابدأ دراسة"}</Link></div>
        {feas?.a ? (
          <p className={s.line}><b>{feas.form?.activity || "دراسة محفوظة"}</b>{feas.form?.governorate ? ` — ${feas.form.governorate}` : ""}</p>
        ) : <p className={s.empty}>مفيش دراسة محفوظة. أول ما تعمل دراسة بتتحفظ هنا على جهازك.</p>}
      </section>

      <section className={s.card}>
        <div className={s.head}><h2>مقارنات الأنشطة</h2><Link href="/compare-business" className={s.go}>مقارنة جديدة</Link></div>
        {cmp.length ? cmp.map((c) => {
          const { rows } = compareAll(c.list);
          return (
            <div key={c.id} className={s.row}>
              <span><b>{c.name}</b><small>{rows.map((r) => r.name).join(" ‏|‏ ")} — {when(c.at)}</small></span>
              <Link href="/compare-business" className={s.go}>افتح</Link>
              <button type="button" className={s.del} onClick={() => setCmp(cmp.filter((x) => x.id !== c.id))}>احذف</button>
            </div>
          );
        }) : <p className={s.empty}>مفيش مقارنات محفوظة. اضغط «احفظ المقارنة» بعد ما تقارن.</p>}
      </section>

      {none && <p className={s.note}>كل اللي هنا محفوظ على جهازك أنت بس. لو مسحت بيانات المتصفح بتتمسح.</p>}
    </div>
  );
}
