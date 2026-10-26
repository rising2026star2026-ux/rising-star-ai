"use client";
// كاشف النصب: اختار العلامات اللي شايفها في العرض (أو الصق نصه) وهنقيّم الخطر. كله على جهازك ومفيش حاجة بتتبعت.
import { useMemo, useState } from "react";
import { FLAGS, LEVELS_TEXT, score, detect } from "@/lib/scamflags";
import s from "./subs.module.css";

export default function ScamChecker() {
  const [sel, setSel] = useState([]);
  const [text, setText] = useState("");
  const [found, setFound] = useState(null);

  const res = useMemo(() => score(sel), [sel]);
  const toggle = (id) => setSel((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  function analyze() {
    const ids = detect(text);
    setFound(ids.length);
    setSel((a) => Array.from(new Set([...a, ...ids])));
  }

  const v = LEVELS_TEXT[res.level];

  return (
    <div className={s.stack}>
      <section className={s.panel} aria-labelledby="paste-h">
        <h2 id="paste-h">الصق نص العرض (اختياري)</h2>
        <p>انسخ رسالة البائع أو إعلانه والصقها، وهنعلّم العلامات اللي لقيناها. التحليل بيتم على جهازك ومفيش حاجة بتتبعت لأي حد.</p>
        <textarea className={s.paste} value={text} onChange={(e) => setText(e.target.value)} placeholder="مثلاً: اشتراك ChatGPT Plus مدى الحياة بـ 300 جنيه، ادفع على فودافون كاش..." aria-label="نص العرض" />
        <div className={s.btnRow} style={{ marginTop: 10 }}>
          <button type="button" className={`${s.btn} ${s.main}`} onClick={analyze} disabled={!text.trim()}>حلّل النص</button>
          {found !== null && <span style={{ alignSelf: "center", color: "var(--muted)", fontSize: "0.84rem" }}>{found ? `لقينا ${found} علامة وعلّمناها تحت` : "مالقيناش علامات واضحة في النص. راجع الأسئلة تحت بنفسك"}</span>}
        </div>
      </section>

      <section className={s.panel} aria-labelledby="flags-h">
        <h2 id="flags-h">علّم اللي شايفه في العرض</h2>
        <p>اختار كل علامة موجودة. اللي عليها «خطر قاطع» لوحدها كفاية تخلي النتيجة عالية.</p>
        <div className={s.flags}>
          {FLAGS.map((f) => (
            <label key={f.id} className={`${s.flag} ${sel.includes(f.id) ? s.on : ""} ${f.crit ? s.crit : ""}`}>
              <input type="checkbox" checked={sel.includes(f.id)} onChange={() => toggle(f.id)} />
              <div>
                <b>{f.title}{f.crit && <em>خطر قاطع</em>}</b>
                {sel.includes(f.id) && <span>{f.why}</span>}
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className={`${s.verdict} ${s[res.level]}`} aria-live="polite">
        <h2>{v.title}</h2>
        <div className={s.meter} aria-hidden="true"><i style={{ width: `${Math.max(4, res.pct)}%` }} /></div>
        <p>{v.body}</p>
        {res.picked.length > 0 && <p><b>العلامات:</b> {res.picked.map((f) => f.title).join(" · ")}</p>}
        <div className={s.btnRow}>
          <button type="button" className={s.btn} onClick={() => { setSel([]); setText(""); setFound(null); }}>ابدأ من جديد</button>
        </div>
      </section>

      <div className={s.guide}>
        <section className={s.panel}>
          <h2>طرق دفع أأمن</h2>
          <ul>
            <li>اشتري من الموقع الرسمي للأداة مباشرة، وافتح الموقع بنفسك مش من رابط جايلك.</li>
            <li>استخدم كارت بنكي مفعّل للدفع الدولي، أو كارت افتراضي/مسبق الدفع بحد صرف صغير يكفي الاشتراك بس.</li>
            <li>الدفع بالكارت بيخليك تقدر تقدم نزاع للبنك لو حصلت مشكلة. التحويل لمحفظة أو رقم شخصي ما فيهوش الحماية دي.</li>
            <li>اربط الاشتراك بإيميلك الشخصي، وفعّل التحقق بخطوتين، وخلّي فواتيرك على إيميلك.</li>
            <li>راجع التجديد التلقائي، وحط تنبيه قبل تاريخ التجديد.</li>
          </ul>
        </section>
        <section className={s.panel}>
          <h2>لو اتنصب عليك</h2>
          <ul>
            <li>كلّم البنك فوراً لإيقاف الكارت وتقديم نزاع (chargeback) لو الدفع كان بكارت.</li>
            <li>غيّر باسورد الإيميل والحسابات اللي ممكن يكون البائع شافها، وفعّل التحقق بخطوتين.</li>
            <li>احتفظ بالأدلة: لقطات شاشة للمحادثة والإعلان وإيصال التحويل.</li>
            <li>بلّغ المنصة اللي اتباع عليها الإعلان، وفي مصر ممكن تبلّغ الإدارة العامة لمكافحة جرائم الحاسبات وشبكات المعلومات.</li>
            <li>ده إرشاد عام ومش استشارة قانونية.</li>
          </ul>
        </section>
        <section className={s.panel}>
          <h2>بلاغات المستخدمين</h2>
          <p style={{ margin: 0 }}>لما نضيف حسابات المستخدمين هتقدر تبلّغ عن بائع نصب وتشوف بلاغات غيرك. لحد دلوقتي مفيش بلاغات منشورة، وما بنعرضش أسماء أشخاص من غير دليل.</p>
        </section>
      </div>
    </div>
  );
}
