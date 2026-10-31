"use client";
// صفحة «المشاريع»: مشاريعك اللي على الجهاز، وقوالب جاهزة تبدأ منها
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listProjects, createProject, TEMPLATES } from "@/lib/projects";
import { toast } from "@/lib/store";
import { ago, countLabel } from "./time";
import ps from "./projects.module.css";

export default function ProjectsHome() {
  const router = useRouter();
  const [list, setList] = useState(null);
  const [making, setMaking] = useState("");

  useEffect(() => {
    listProjects().then(setList).catch(() => setList([]));
  }, []);

  async function start(key) {
    if (making) return;
    setMaking(key);
    try {
      const p = await createProject({ template: key });
      router.push(`/projects/${p.id}`);
    } catch {
      setMaking("");
      toast("المتصفح ده مش سامح بالحفظ على الجهاز. جرّب متصفح تاني أو اقفل وضع التصفح الخفي.");
    }
  }

  return (
    <div className={ps.body}>
      {list === null ? (
        <div className={ps.card}><div className={ps.loading}><span className={ps.spin} /> بنفتح مشاريعك…</div></div>
      ) : list.length > 0 ? (
        <section className={ps.card}>
          <h2 className={ps.h2}>مشاريعك</h2>
          <div className={ps.projGrid}>
            {list.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className={ps.projCard}>
                <i aria-hidden="true">{p.icon}</i>
                <span>
                  <b dir="auto">{p.name}</b>
                  <small>{countLabel(p.files, "ملف")} • {countLabel(p.chats, "محادثة")} • {ago(p.updated)}</small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={ps.card}>
        <h2 className={ps.h2}>{list?.length ? "مشروع جديد" : "ابدأ أول مشروع"}</h2>
        <p className={ps.lead}>اختار قالب قريب من شغلك (تقدر تغيّر اسمه وتعليماته بعدين)، أو ابدأ مشروع فاضي.</p>
        <div className={ps.tplGrid}>
          {TEMPLATES.map((t) => (
            <button key={t.key} type="button" className={`${ps.tpl} ${t.key === "blank" ? ps.tplBlank : ""}`} onClick={() => start(t.key)} disabled={!!making}>
              <i aria-hidden="true">{making === t.key ? <span className={ps.spin} /> : t.icon}</i>
              <b>{t.name}</b>
              <span>{t.desc}</span>
              {t.files && <small>ارفع: {t.files}</small>}
            </button>
          ))}
        </div>
      </section>

      <section className={ps.card}>
        <h2 className={ps.h2}>المشروع بيفرق إيه عن الشات العادي؟</h2>
        <div className={ps.why}>
          <div><i aria-hidden="true">📁</i><b>ترفع الملفات مرة واحدة</b><span>PDF وWord وصور ومستندات مصوّرة، وكل محادثة في المشروع بتقرا منهم من غير ما ترفعهم تاني.</span></div>
          <div><i aria-hidden="true">🧭</i><b>تعليمات ثابتة</b><span>تقول للمساعد مرة واحدة يكتب إزاي ويركز على إيه، وكل رد في المشروع يمشي عليها.</span></div>
          <div><i aria-hidden="true">💬</i><b>محادثات كتير، نفس الذاكرة</b><span>محادثة للتلخيص، وواحدة للأسئلة، وواحدة للكتابة، وكلهم فاهمين المشروع.</span></div>
        </div>
        <p className={ps.privacy}>
          مشاريعك وملفاتها محفوظة على الجهاز ده بس، والملف نفسه مبيترفعش: الكلام اللي فيه بس هو اللي بيتبعت مع سؤالك. لو مسحت بيانات المتصفح المشاريع هتتمسح.
        </p>
      </section>
    </div>
  );
}
