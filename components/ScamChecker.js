"use client";
// كاشف النصب: العميل بيحط لينك الموقع و/أو صفحة الفيسبوك واسم البائع، والموقع بيحقق بنفسه
// (عمر الدومين، الأمان، محتوى الموقع، انتحال الأسماء، الشكاوى، شفافية الصفحة) ويطلع تقرير بالأدلة.
import { useEffect, useRef, useState } from "react";
import s from "./scam.module.css";

const LEVEL = {
  low: { t: "خطر منخفض", b: "مالقيناش علامات خطر قوية. ده مش ضمان، فادفع بطريقة فيها حماية زي الدفع عند الاستلام أو الكارت." },
  mid: { t: "خطر متوسط: خلّي بالك", b: "فيه علامات تستاهل تتأكد منها قبل ما تدفع أي فلوس." },
  high: { t: "خطر عالي: الأفضل متدفعش", b: "العلامات دي بتتكرر في حالات النصب. متحوّلش فلوس قبل ما تتأكد بطريقة مستقلة." },
};
const CONF = { high: "دقة الفحص عالية", mid: "دقة الفحص متوسطة", low: "الفحص محدود" };
const GROUPS = [
  ["site", "الموقع الإلكتروني"],
  ["page", "صفحة الفيسبوك"],
  ["reviews", "السمعة والشكاوى"],
  ["offer", "نص العرض"],
];
const STEPS = ["بنسأل سجل الدومينات عن عمر الموقع…", "بنفتح الموقع ونقرا محتواه…", "بندوّر على شكاوى باسم البائع…", "بنقرا صورة شفافية الصفحة…", "بنجمّع الأدلة ونحسب الدرجة…"];

async function shrink(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

function Icon({ sev }) {
  const map = { bad: "✕", warn: "!", good: "✓", info: "i" };
  return <span className={`${s.ico} ${s[sev]}`} aria-hidden="true">{map[sev]}</span>;
}

export default function ScamChecker() {
  const [url, setUrl] = useState("");
  const [fb, setFb] = useState("");
  const [name, setName] = useState("");
  const [offer, setOffer] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [res, setRes] = useState(null);
  const fileRef = useRef(null);
  const outRef = useRef(null);

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const t = setInterval(() => setStep((n) => Math.min(n + 1, STEPS.length - 1)), 2600);
    return () => clearInterval(t);
  }, [busy]);

  async function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setImage(await shrink(f)); } catch { setErr("مقدرناش نفتح الصورة. جرّب صورة PNG أو JPG."); }
  }

  async function run(e) {
    e?.preventDefault();
    if (busy) return;
    setErr(""); setRes(null); setBusy(true);
    try {
      const r = await fetch("/api/scam-scan", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, fb, name, offer, image }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "حصلت مشكلة. جرّب تاني.");
      setRes(j);
      requestAnimationFrame(() => outRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  const ready = url.trim() || fb.trim() || name.trim() || offer.trim() || image;
  const lv = res ? LEVEL[res.level] : null;

  return (
    <div className={s.wrap}>
      <form className={s.form} onSubmit={run}>
        <div className={s.fields}>
          <label className={s.field}>
            <span>لينك الموقع</span>
            <input dir="ltr" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com" autoComplete="off" />
          </label>
          <label className={s.field}>
            <span>لينك صفحة الفيسبوك</span>
            <input dir="ltr" inputMode="url" value={fb} onChange={(e) => setFb(e.target.value)} placeholder="facebook.com/page-name" autoComplete="off" />
          </label>
          <label className={`${s.field} ${s.full}`}>
            <span>اسم البائع أو الصفحة (عشان ندوّر على شكاوى)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: متجر النور للإلكترونيات" maxLength={120} />
          </label>
        </div>

        <div className={s.shot}>
          <div>
            <b>صورة «شفافية الصفحة» من فيسبوك</b>
            <p>فيسبوك مش بيسمح لأي موقع يقرا صفحاته. صوّر القسم ده وارفعه، وهنقرا منه عمر الصفحة وعدد مرات تغيير اسمها:
              افتح الصفحة ← «حول» ← «شفافية الصفحة» ← «عرض الكل».</p>
          </div>
          {image ? (
            <div className={s.thumb}>
              <img src={image} alt="صورة شفافية الصفحة" />
              <button type="button" onClick={() => { setImage(""); if (fileRef.current) fileRef.current.value = ""; }}>شيل الصورة</button>
            </div>
          ) : (
            <button type="button" className={s.upload} onClick={() => fileRef.current?.click()}>ارفع الصورة</button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} hidden />
        </div>

        <details className={s.more}>
          <summary>عندك رسالة أو إعلان من البائع؟ الصقه هنا</summary>
          <textarea value={offer} onChange={(e) => setOffer(e.target.value)} maxLength={4000} placeholder="مثلاً: اشتراك مدى الحياة بـ 300 جنيه، حوّل على فودافون كاش والكمية محدودة…" />
        </details>

        <button type="submit" className={s.go} disabled={!ready || busy}>
          {busy ? <><span className={s.spin} /> {STEPS[step]}</> : "افحص البائع"}
        </button>
        {err && <p className={s.err} role="alert">{err}</p>}
      </form>

      {res && (
        <section ref={outRef} className={s.report} aria-live="polite">
          <div className={`${s.verdict} ${s[res.level]}`}>
            <div className={s.gauge} style={{ "--p": res.score }}>
              <b>{res.score}</b>
              <small>من 100</small>
            </div>
            <div className={s.vText}>
              <h2>{lv.t}</h2>
              <p>{res.summary || lv.b}</p>
              <span className={s.conf}>{CONF[res.confidence]}</span>
            </div>
          </div>

          {res.advice?.length > 0 && (
            <div className={s.advice}>
              <h3>تعمل إيه دلوقتي</h3>
              <ul>{res.advice.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}

          {GROUPS.map(([g, title]) => {
            const list = res.findings.filter((f) => f.group === g);
            if (!list.length) return null;
            return (
              <div key={g} className={s.group}>
                <h3>{title}</h3>
                <ul>
                  {list.map((f, i) => (
                    <li key={i} className={s.find}>
                      <Icon sev={f.sev} />
                      <div>
                        <b>{f.title}</b>
                        {f.detail && <p>{f.detail}</p>}
                        {f.links?.length > 0 && (
                          <ol className={s.links}>
                            {f.links.map((l) => (
                              <li key={l.u}><a href={l.u} target="_blank" rel="noopener noreferrer">{l.t}</a>{l.s && <small>{l.s}</small>}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {res.meta?.domain && (
            <p className={s.metaLine} dir="auto">
              {res.meta.domain}
              {res.meta.created && <> • اتسجّل {new Date(res.meta.created).toLocaleDateString("ar-EG")}</>}
              {res.meta.registrar && <> • {res.meta.registrar}</>}
            </p>
          )}
          <p className={s.note}>ده تقييم آلي للمخاطر من بيانات عامة، مش حكم نهائي على البائع، وممكن يكون فيه أخطاء. القرار في الآخر ليك.</p>
          <button type="button" className={s.again} onClick={() => { setRes(null); setUrl(""); setFb(""); setName(""); setOffer(""); setImage(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>افحص بائع تاني</button>
        </section>
      )}
    </div>
  );
}
