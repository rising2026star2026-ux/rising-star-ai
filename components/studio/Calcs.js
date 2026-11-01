"use client";
// حاسبات وأدوات نصوص عربية: كلها بتشتغل على جهازك من غير سيرفر ومن غير ذكاء اصطناعي.
import { useMemo, useState } from "react";
import { Seg, Note, styles as s } from "./ui";
import { copyText } from "@/lib/imagefile";
import { toast } from "@/lib/store";
import {
  num, fmt, percentOf, whatPercent, changePercent, zakat, hourlyRate, toHijri, fromHijri, HIJRI_MONTHS, GREG_MONTHS,
  numberToWords, CURRENCIES, cleanText, textStats, genPassword, NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS,
} from "@/lib/arcalc";

export default function Calcs({ mode }) {
  const M = { percent: Percent, hourly: Hourly, zakat: Zakat, hijri: Hijri, numwords: NumWords, wordcount: WordCount, textclean: TextClean, password: Password, qr: QrTool }[mode];
  return M ? <M /> : null;
}

/* ============ عناصر مشتركة ============ */
function NumField({ label, value, onChange, hint, unit, placeholder = "0" }) {
  return (
    <label className={s.field}>
      <span className={s.fieldLabel}>{label}{hint && <small className={s.hint}> {hint}</small>}</span>
      <span className={s.unitWrap}>
        <input className={s.input} inputMode="decimal" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value.slice(0, 18))} />
        {unit && <em>{unit}</em>}
      </span>
    </label>
  );
}

function Result({ title, value, sub, tone }) {
  return (
    <div className={`${s.result} ${tone === "good" ? s.resultGood : ""}`} role="status" aria-live="polite">
      <small>{title}</small>
      <b dir="auto">{value}</b>
      {sub && <span>{sub}</span>}
    </div>
  );
}

function Box({ children, aside }) {
  return (
    <div className={s.calcBox}>
      <div className={s.calcForm}>{children}</div>
      {aside && <div className={s.calcAside}>{aside}</div>}
    </div>
  );
}

async function copy(text, msg = "اتنسخ") {
  if (await copyText(text)) toast(msg);
}

/* ============ النسبة المئوية ============ */
function Percent() {
  const [kind, setKind] = useState("of");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const x = num(a);
  const y = num(b);
  const ok = Number.isFinite(x) && Number.isFinite(y);
  const R = {
    of: { la: "النسبة", ua: "%", lb: "من الرقم", out: () => ({ t: `${fmt(x)}% من ${fmt(y)}`, v: fmt(percentOf(x, y)) }) },
    what: { la: "الرقم", lb: "من إجمالي", out: () => ({ t: `${fmt(x)} من ${fmt(y)} يمثل`, v: Number.isFinite(whatPercent(x, y)) ? `${fmt(whatPercent(x, y))}%` : "—" }) },
    change: { la: "من (القيمة القديمة)", lb: "إلى (القيمة الجديدة)", out: () => { const c = changePercent(x, y); return { t: c >= 0 ? "نسبة الزيادة" : "نسبة النقص", v: Number.isFinite(c) ? `${fmt(Math.abs(c))}%` : "—" }; } },
    off: { la: "السعر", lb: "نسبة الخصم", ub: "%", out: () => ({ t: `السعر بعد خصم ${fmt(y)}%`, v: fmt(x - percentOf(y, x)), sub: `قيمة الخصم ${fmt(percentOf(y, x))}` }) },
    add: { la: "السعر", lb: "نسبة الزيادة / الضريبة", ub: "%", out: () => ({ t: `السعر بعد إضافة ${fmt(y)}%`, v: fmt(x + percentOf(y, x)), sub: `قيمة الإضافة ${fmt(percentOf(y, x))}` }) },
  }[kind];
  const r = ok ? R.out() : null;
  return (
    <Box aside={r ? <Result title={r.t} value={r.v} sub={r.sub} tone="good" /> : <Note>اكتب الرقمين وهتظهر النتيجة فوراً.</Note>}>
      <Seg label="عايز تحسب إيه؟" value={kind} onChange={setKind} options={[["of", "كام % من رقم"], ["what", "رقم يمثل كام %"], ["change", "نسبة التغيير"], ["off", "بعد الخصم"], ["add", "بعد الزيادة"]]} />
      <NumField label={R.la} value={a} onChange={setA} unit={R.ua} />
      <NumField label={R.lb} value={b} onChange={setB} unit={R.ub} />
    </Box>
  );
}

/* ============ أجر الفريلانسر ============ */
function Hourly() {
  const [f, setF] = useState({ income: "", expenses: "", hours: "30", billable: "65", off: "4", tax: "0", buffer: "10" });
  const set = (k) => (v) => setF((o) => ({ ...o, [k]: v }));
  const r = useMemo(() => {
    const income = num(f.income);
    if (!(income > 0)) return null;
    return hourlyRate({ income, expenses: num(f.expenses) || 0, hoursWeek: num(f.hours), billablePct: num(f.billable), weeksOff: num(f.off) || 0, taxPct: num(f.tax) || 0, buffer: num(f.buffer) || 0 });
  }, [f]);
  return (
    <Box
      aside={r ? (
        <>
          <Result title="سعر ساعتك المناسب" value={fmt(r.hour, 0)} sub={`وسعر يوم 8 ساعات: ${fmt(r.day, 0)}`} tone="good" />
          <Note>معناها إنك بتشتغل فعلياً (بتتحاسب) حوالي {fmt(r.billableWeek, 1)} ساعة في الأسبوع، وبتحتاج {fmt(r.yearly, 0)} في السنة عشان تحقق دخلك وتغطي مصاريفك وضرايبك.</Note>
        </>
      ) : <Note>اكتب الدخل الشهري اللي عايزه، وهنحسبلك سعر الساعة اللي لازم تطلبه.</Note>}
    >
      <NumField label="الدخل الشهري اللي عايزه (صافي)" value={f.income} onChange={set("income")} />
      <NumField label="مصاريف شغل شهرية" hint="(برامج، اشتراكات، إنترنت)" value={f.expenses} onChange={set("expenses")} />
      <div className={s.row2}>
        <NumField label="ساعات الشغل في الأسبوع" value={f.hours} onChange={set("hours")} unit="ساعة" />
        <NumField label="منها بتتحاسب عليها" value={f.billable} onChange={set("billable")} unit="%" hint="(الباقي مراسلات وبحث عن شغل)" />
      </div>
      <div className={s.row2}>
        <NumField label="أسابيع إجازة في السنة" value={f.off} onChange={set("off")} unit="أسبوع" />
        <NumField label="ضريبة أو عمولة منصة" value={f.tax} onChange={set("tax")} unit="%" />
      </div>
      <NumField label="هامش أمان" hint="(لأشهر الشغل القليل)" value={f.buffer} onChange={set("buffer")} unit="%" />
    </Box>
  );
}

/* ============ الزكاة ============ */
function Zakat() {
  const [f, setF] = useState({ cash: "", gold: "", silver: "", trade: "", owed: "", debts: "", gp: "", sp: "" });
  const [basis, setBasis] = useState("gold");
  const set = (k) => (v) => setF((o) => ({ ...o, [k]: v }));
  const n = (k) => num(f[k]) || 0;
  const r = zakat({ cash: n("cash"), gold: n("gold"), silver: n("silver"), trade: n("trade"), owed: n("owed"), debts: n("debts"), basis, goldPrice: n("gp"), silverPrice: n("sp") });
  const price = basis === "gold" ? n("gp") : n("sp");
  return (
    <Box
      aside={
        <>
          {price > 0 ? (
            <Result
              title={r.reached ? "زكاة مالك (2.5%)" : "مالك لسه ما بلغش النصاب"}
              value={r.reached ? fmt(r.due) : "0"}
              sub={`إجمالي مالك الزكوي ${fmt(r.total)} • النصاب ${fmt(r.nisab, 0)}`}
              tone={r.reached ? "good" : undefined}
            />
          ) : <Note>اكتب سعر جرام {basis === "gold" ? "الذهب عيار 24" : "الفضة"} النهارده عشان نعرف النصاب.</Note>}
          <Note tone="warn">الحاسبة دي للتقدير فقط. الزكاة شرطها إن المال يمر عليه سنة هجرية كاملة وهو فوق النصاب. في الحالات الخاصة (أسهم، عقارات تجارية، ديون مشكوك فيها) اسأل دار الإفتاء أو عالم موثوق.</Note>
        </>
      }
    >
      <Seg label="النصاب بيتحسب بـ" value={basis} onChange={setBasis} options={[["gold", `الذهب (${NISAB_GOLD_GRAMS} جرام)`], ["silver", `الفضة (${NISAB_SILVER_GRAMS} جرام)`]]} />
      {basis === "gold" ? <NumField label="سعر جرام الذهب عيار 24 النهارده" value={f.gp} onChange={set("gp")} /> : <NumField label="سعر جرام الفضة النهارده" value={f.sp} onChange={set("sp")} />}
      <NumField label="نقدية وحسابات بنكية وودائع" value={f.cash} onChange={set("cash")} />
      <NumField label="قيمة الذهب اللي معاك" hint="(بسعر النهارده، للادخار مش للزينة المعتادة)" value={f.gold} onChange={set("gold")} />
      <NumField label="قيمة الفضة" value={f.silver} onChange={set("silver")} />
      <NumField label="بضاعة تجارة وعروض" hint="(بسعر البيع الحالي)" value={f.trade} onChange={set("trade")} />
      <NumField label="ديون ليك مضمونة السداد" value={f.owed} onChange={set("owed")} />
      <NumField label="ديون عليك حالّة" hint="(بتتخصم)" value={f.debts} onChange={set("debts")} />
    </Box>
  );
}

/* ============ هجري ↔ ميلادي ============ */
function Hijri() {
  const now = new Date();
  const [dir, setDir] = useState("g2h");
  const [g, setG] = useState({ d: String(now.getDate()), m: String(now.getMonth() + 1), y: String(now.getFullYear()) });
  const todayH = toHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const [h, setH] = useState({ d: "1", m: "9", y: String(todayH?.y || 1448) });
  const out = useMemo(() => {
    if (dir === "g2h") {
      const r = toHijri(num(g.y), num(g.m), num(g.d));
      return r ? { t: "التاريخ الهجري", v: `${r.d} ${HIJRI_MONTHS[r.m - 1]} ${r.y} هـ`, sub: r.weekday } : null;
    }
    const r = fromHijri(num(h.y), num(h.m), num(h.d));
    return r ? { t: "التاريخ الميلادي", v: `${r.d} ${GREG_MONTHS[r.m - 1]} ${r.y} م`, sub: r.weekday } : null;
  }, [dir, g, h]);
  const set = (setter) => (k) => (v) => setter((o) => ({ ...o, [k]: v }));
  const months = (list) => list.map((n, i) => <option key={n} value={i + 1}>{n}</option>);
  return (
    <Box
      aside={
        <>
          {out ? <Result title={out.t} value={out.v} sub={out.sub} tone="good" /> : <Note tone="warn">التاريخ ده مش موجود. راجع اليوم والشهر والسنة.</Note>}
          {todayH && <Note>النهارده: {todayH.d} {HIJRI_MONTHS[todayH.m - 1]} {todayH.y} هـ (حسب تقويم أم القرى). ممكن يختلف يوم عن رؤية الهلال المعتمدة في بلدك، خصوصاً أول رمضان والأعياد.</Note>}
        </>
      }
    >
      <Seg label="التحويل" value={dir} onChange={setDir} options={[["g2h", "ميلادي ← هجري"], ["h2g", "هجري ← ميلادي"]]} />
      {dir === "g2h" ? (
        <div className={s.row3}>
          <NumField label="اليوم" value={g.d} onChange={set(setG)("d")} />
          <label className={s.field}><span className={s.fieldLabel}>الشهر</span><select className={s.input} value={g.m} onChange={(e) => set(setG)("m")(e.target.value)}>{months(GREG_MONTHS)}</select></label>
          <NumField label="السنة" value={g.y} onChange={set(setG)("y")} />
        </div>
      ) : (
        <div className={s.row3}>
          <NumField label="اليوم" value={h.d} onChange={set(setH)("d")} />
          <label className={s.field}><span className={s.fieldLabel}>الشهر</span><select className={s.input} value={h.m} onChange={(e) => set(setH)("m")(e.target.value)}>{months(HIJRI_MONTHS)}</select></label>
          <NumField label="السنة" value={h.y} onChange={set(setH)("y")} />
        </div>
      )}
    </Box>
  );
}

/* ============ الأرقام بالحروف ============ */
function NumWords() {
  const [v, setV] = useState("");
  const [cur, setCur] = useState("none");
  const [cheque, setCheque] = useState(true);
  const words = numberToWords(v, cur, cheque && cur !== "none");
  return (
    <Box
      aside={words ? (
        <>
          <Result title="مكتوب بالحروف" value={words} tone="good" />
          <button type="button" className="btn ghost" onClick={() => copy(words, "اتنسخ الرقم بالحروف")}>نسخ</button>
        </>
      ) : <Note>اكتب الرقم (يقبل الأرقام الهندية والعربية والفواصل)، لحد 999 تريليون.</Note>}
    >
      <NumField label="الرقم" value={v} onChange={setV} placeholder="مثلاً 1250.50" />
      <Seg label="العملة" value={cur} onChange={setCur} options={[["none", "من غير عملة"], ["egp", "جنيه"], ["sar", "ريال"], ["aed", "درهم"], ["usd", "دولار"]]} />
      {cur !== "none" && (
        <label className={s.check}><input type="checkbox" checked={cheque} onChange={(e) => setCheque(e.target.checked)} /> صيغة الشيكات: «فقط ... لا غير»</label>
      )}
    </Box>
  );
}

/* ============ عداد الكلمات ============ */
function WordCount() {
  const [t, setT] = useState("");
  const st = useMemo(() => textStats(t), [t]);
  const Stat = ({ k, v }) => <div><b>{v}</b><small>{k}</small></div>;
  return (
    <div className={s.wc}>
      <textarea className={`${s.input} ${s.bigText}`} dir="auto" value={t} onChange={(e) => setT(e.target.value.slice(0, 300000))} placeholder="الصق نصك أو اكتبه هنا..." rows={9} />
      <div className={s.stats}>
        <Stat k="كلمة" v={fmt(st.words, 0)} />
        <Stat k="حرف" v={fmt(st.chars, 0)} />
        <Stat k="حرف من غير مسافات" v={fmt(st.charsNoSpace, 0)} />
        <Stat k="جملة" v={fmt(st.sentences, 0)} />
        <Stat k="فقرة" v={fmt(st.paragraphs, 0)} />
        <Stat k="وقت القراءة" v={st.words ? (st.readMin < 1 ? "أقل من دقيقة" : `${fmt(st.readMin, 0)} دقيقة`) : "—"} />
      </div>
      {st.top.length > 0 && (
        <div className={s.topWords}>
          <span>الكلمات الأكتر تكراراً</span>
          {st.top.map((x) => <em key={x.w}>{x.w} <small>{x.c} • {fmt(x.pct, 1)}%</small></em>)}
        </div>
      )}
    </div>
  );
}

/* ============ منظف النصوص ============ */
const CLEAN_OPTS = [
  ["spaces", "مسافات زيادة"], ["blank", "أسطر فاضية"], ["tashkeel", "التشكيل"], ["tatweel", "التطويل (ـــ)"],
  ["digits", "أرقام هندية ← عادية"], ["normalizeAlef", "توحيد الألف (أ إ آ ← ا)"], ["punct", "ظبط مسافات علامات الترقيم"], ["hidden", "رموز مخفية (من النسخ من مواقع)"],
];
function TextClean() {
  const [t, setT] = useState("");
  const [o, setO] = useState({ spaces: true, blank: true, tashkeel: false, tatweel: true, digits: false, normalizeAlef: false, punct: true, hidden: true });
  const out = useMemo(() => cleanText(t, o), [t, o]);
  return (
    <div className={s.wc}>
      <textarea className={`${s.input} ${s.bigText}`} dir="auto" value={t} onChange={(e) => setT(e.target.value.slice(0, 300000))} placeholder="الصق النص هنا..." rows={7} />
      <div className={s.checks}>
        {CLEAN_OPTS.map(([k, label]) => (
          <label key={k} className={s.check}><input type="checkbox" checked={!!o[k]} onChange={(e) => setO((x) => ({ ...x, [k]: e.target.checked }))} /> {label}</label>
        ))}
      </div>
      <textarea className={`${s.input} ${s.bigText}`} dir="auto" value={out} readOnly rows={7} placeholder="النص بعد التنضيف يظهر هنا" aria-label="النص بعد التنضيف" />
      <div className={s.rowBtns}>
        <button type="button" className="btn" disabled={!out} onClick={() => copy(out, "اتنسخ النص")}>نسخ النص</button>
        {t && t !== out && <small className={s.hint}>اتشال {fmt([...t].length - [...out].length, 0)} حرف</small>}
      </div>
    </div>
  );
}

/* ============ كلمة مرور قوية ============ */
function Password() {
  const [o, setO] = useState({ length: 16, lower: true, upper: true, digits: true, symbols: true, ambiguous: false });
  const [r, setR] = useState(() => ({ pw: "", bits: 0 }));
  const [shown, setShown] = useState(false);
  const make = (opts = o) => { setR(genPassword(opts)); setShown(true); };
  const strength = r.bits >= 90 ? ["قوية جداً", "good"] : r.bits >= 60 ? ["قوية", "good"] : r.bits >= 40 ? ["متوسطة", ""] : ["ضعيفة", "bad"];
  const set = (k, v) => { const n = { ...o, [k]: v }; setO(n); if (shown) make(n); };
  return (
    <Box
      aside={
        <>
          <div className={s.pw} dir="ltr">{r.pw || "اضغط «ولّد كلمة مرور»"}</div>
          {r.pw && <Note>القوة: {strength[0]} (حوالي {r.bits} بت). اتولّدت على جهازك بمولّد عشوائي آمن في المتصفح، ومبتتبعتش لأي مكان.</Note>}
          <div className={s.rowBtns}>
            <button type="button" className="btn" onClick={() => make()}>ولّد كلمة مرور</button>
            <button type="button" className="btn ghost" disabled={!r.pw} onClick={() => copy(r.pw, "اتنسخت كلمة المرور")}>نسخ</button>
          </div>
        </>
      }
    >
      <label className={s.range}>
        <span className={s.rangeTop}><span>الطول</span><output>{o.length}</output></span>
        <input type="range" min="8" max="64" value={o.length} onChange={(e) => set("length", Number(e.target.value))} />
      </label>
      <div className={s.checks}>
        {[["lower", "حروف صغيرة a-z"], ["upper", "حروف كبيرة A-Z"], ["digits", "أرقام 0-9"], ["symbols", "رموز !@#"], ["ambiguous", "حروف متشابهة (I l 1 O 0)"]].map(([k, label]) => (
          <label key={k} className={s.check}><input type="checkbox" checked={!!o[k]} onChange={(e) => set(k, e.target.checked)} /> {label}</label>
        ))}
      </div>
    </Box>
  );
}

/* ============ QR ============ */
let qrLib = null;
const loadQr = () => {
  if (!qrLib) qrLib = import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm").then((m) => m.default || m).catch((e) => { qrLib = null; throw e; });
  return qrLib;
};

function QrTool() {
  const [text, setText] = useState("");
  const [fg, setFg] = useState("#111111");
  const [bg, setBg] = useState("#ffffff");
  const [size, setSize] = useState(768);
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function make() {
    const v = text.trim();
    if (!v) return;
    setBusy(true); setErr("");
    try {
      const qrcode = await loadQr();
      const qr = qrcode(0, "M");
      qr.addData(v);
      qr.make();
      const n = qr.getModuleCount();
      const quiet = 4;
      const cell = Math.max(1, Math.floor(size / (n + quiet * 2)));
      const px = cell * (n + quiet * 2);
      const c = document.createElement("canvas");
      c.width = c.height = px;
      const ctx = c.getContext("2d");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, px, px);
      ctx.fillStyle = fg;
      for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) ctx.fillRect((k + quiet) * cell, (r + quiet) * cell, cell, cell);
      setUrl(c.toDataURL("image/png"));
    } catch {
      setErr("ما قدرناش نجهّز المولّد. اتأكد من الاتصال وجرّب تاني، أو النص طويل أوي.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      aside={
        <div className={s.qrBox}>
          {url ? <img src={url} alt="رمز QR جاهز" /> : <Note>اكتب الرابط أو النص واضغط «اعمل QR».</Note>}
          {url && <a className="btn" href={url} download="qr-code.png">نزّل الصورة PNG</a>}
        </div>
      }
    >
      <label className={s.field}>
        <span className={s.fieldLabel}>الرابط أو النص</span>
        <textarea className={s.input} dir="auto" rows={3} maxLength={1200} value={text} onChange={(e) => setText(e.target.value)} placeholder="https://wa.me/201012345678 أو أي نص" />
      </label>
      <div className={s.row2}>
        <label className={s.field}><span className={s.fieldLabel}>لون الرمز</span><input type="color" className={s.colorIn} value={fg} onChange={(e) => setFg(e.target.value)} /></label>
        <label className={s.field}><span className={s.fieldLabel}>لون الخلفية</span><input type="color" className={s.colorIn} value={bg} onChange={(e) => setBg(e.target.value)} /></label>
      </div>
      <Seg label="الحجم" value={size} onChange={setSize} options={[[512, "صغير"], [768, "متوسط"], [1280, "كبير"]]} />
      <button type="button" className="btn" disabled={!text.trim() || busy} onClick={make}>{busy ? "ثواني…" : "اعمل QR"}</button>
      {err && <Note tone="warn">{err}</Note>}
      <Note>لو هتطبعه خلّي اللون الغامق للرمز والفاتح للخلفية، وجرّب مسحه بموبايلك قبل الطباعة.</Note>
    </Box>
  );
}
