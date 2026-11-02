"use client";
// مولد QR كامل: رابط، واتساب برسالة جاهزة، نص، تليفون، إيميل، واي فاي، كارت شخصي.
// ألوان، شكل النقاط، لوجو في النص، تصحيح أخطاء، وتحميل PNG أو SVG. كله بيشتغل على جهازك.
import { useEffect, useMemo, useState } from "react";
import { Drop, Seg, Note, styles as s } from "./ui";
import { IMAGE_TYPES, download, canvasToBlob, makeCanvas } from "./util";
import { readImage, scaledCanvas, copyText } from "@/lib/imagefile";
import { toast } from "@/lib/store";
import { COUNTRIES, QR_TYPES, DOT_STYLES, buildPayload, colorWarning, qrSvg } from "@/lib/qrstudio";

// مكتبة صغيرة مفتوحة المصدر (qrcode-generator، رخصة MIT) بتتحمّل وقت الحاجة بس
let libPromise = null;
let attempts = 0;
function loadLib() {
  if (!libPromise) {
    // المتصفح بيفتكر إن استيراد الرابط ده فشل، فكل محاولة تانية بنغيّر آخر الرابط عشان تتحاول فعلاً
    const url = `https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm${attempts++ ? `?retry=${attempts}` : ""}`;
    libPromise = import(/* webpackIgnore: true */ url)
      .then((m) => {
        const q = m.default || m;
        // الحروف العربية لازم تتكتب UTF-8، وإلا الرمز بيطلع بحروف مبوّظة
        q.stringToBytes = q.stringToBytesFuncs?.["UTF-8"] || ((str) => Array.from(new TextEncoder().encode(str)));
        return q;
      })
      .catch((e) => { libPromise = null; throw e; });
  }
  return libPromise;
}

const LEVELS = [["M", "عادي"], ["Q", "عالي"], ["H", "أقصى"]];
const SIZES = [[512, "صغير"], [1024, "متوسط"], [2048, "كبير للطباعة"]];

const EMPTY = {
  url: "", country: "eg", phone: "", msg: "", text: "", email: "", subject: "", body: "",
  ssid: "", pass: "", sec: "WPA", hidden: false, name: "", org: "", title: "", site: "",
};

const HINTS = {
  url: "رابط متجرك أو صفحتك أو أي موقع.",
  whatsapp: "العميل يمسح الرمز فتفتح له محادثة معاك على واتساب، وممكن تجهّز له الرسالة.",
  text: "أي كلام: عنوان، كود خصم، تعليمات.",
  phone: "العميل يمسح الرمز فيتصل بيك على طول.",
  email: "يفتح رسالة جديدة لإيميلك، وممكن تحط موضوع جاهز.",
  wifi: "الضيف يمسح الرمز ويتوصل بالشبكة من غير ما يكتب الباسورد.",
  vcard: "كارت بياناتك يتحفظ في جهات اتصال اللي يمسحه.",
};

function Field({ label, value, onChange, placeholder, dir = "auto", inputMode, multiline = false, maxLength = 300 }) {
  const P = { className: s.input, value, placeholder, dir, maxLength, inputMode, onChange: (e) => onChange(e.target.value) };
  return (
    <label className={s.field}>
      <span className={s.fieldLabel}>{label}</span>
      {multiline ? <textarea rows={3} {...P} /> : <input type="text" {...P} />}
    </label>
  );
}

function PhoneFields({ f, set, label = "رقم التليفون" }) {
  return (
    <>
      <Seg label="الدولة" value={f.country} onChange={(v) => set("country", v)} options={Object.entries(COUNTRIES).map(([k, c]) => [k, c.name])} />
      <Field label={label} value={f.phone} onChange={(v) => set("phone", v)} dir="ltr" inputMode="tel" maxLength={20}
        placeholder={f.country === "sa" ? "05XXXXXXXX" : f.country === "eg" ? "01XXXXXXXXX" : "+49 151 1234567"} />
    </>
  );
}

export default function QrStudio() {
  const [type, setType] = useState("url");
  const [f, setF] = useState(EMPTY);
  const [fg, setFg] = useState("#111111");
  const [bg, setBg] = useState("#ffffff");
  const [dots, setDots] = useState("square");
  const [level, setLevel] = useState("M");
  const [size, setSize] = useState(1024);
  const [logo, setLogo] = useState("");
  const [logoPct, setLogoPct] = useState(20);
  const [lib, setLib] = useState(null);
  const [libErr, setLibErr] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));

  function load() {
    setLibErr(false);
    loadLib().then((q) => setLib(() => q)).catch(() => setLibErr(true));
  }
  useEffect(load, []);

  const payload = useMemo(() => buildPayload(type, f), [type, f]);
  const effLevel = logo ? "H" : level; // اللوجو بيغطي جزء، فلازم أقصى تصحيح أخطاء

  const code = useMemo(() => {
    if (!lib || !payload.text) return null;
    try {
      const qr = lib(0, effLevel);
      qr.addData(payload.text);
      qr.make();
      return { n: qr.getModuleCount(), isDark: (r, c) => qr.isDark(r, c) };
    } catch {
      return { error: "البيانات طويلة على مستوى التصحيح ده. قصّر النص أو اختار مستوى «عادي» وشيل اللوجو." };
    }
  }, [lib, payload.text, effLevel]);

  const svg = useMemo(
    () => (code && !code.error ? qrSvg({ ...code, fg, bg, size: 1024, style: dots, logo, logoPct }) : ""),
    [code, fg, bg, dots, logo, logoPct],
  );
  const preview = useMemo(() => (svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : ""), [svg]);
  const warn = colorWarning(fg, bg);

  async function pickLogo(files) {
    try {
      const img = await readImage(files[0]);
      setLogo(scaledCanvas(img, 256).toDataURL("image/png")); // PNG عشان الشفافية تفضل
    } catch (e) { toast(e.message); }
  }

  async function savePng() {
    if (!preview) return;
    setBusy(true);
    try {
      const img = new Image();
      img.decoding = "async";
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = preview; });
      const c = makeCanvas(size, size);
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, size, size);
      download(await canvasToBlob(c, "png"), `qr-${type}.png`);
    } catch {
      toast("ما قدرناش نجهّز الصورة. جرّب نزّل SVG.");
    } finally {
      setBusy(false);
    }
  }

  function saveSvg() {
    if (!svg) return;
    download(new Blob([svg.replace(/width="1024" height="1024"/, `width="${size}" height="${size}"`)], { type: "image/svg+xml" }), `qr-${type}.svg`);
  }

  async function copyContent() {
    if (payload.text && (await copyText(payload.text))) toast("اتنسخ النص اللي جوه الرمز");
  }

  const fields = {
    url: <Field label="الرابط" value={f.url} onChange={(v) => set("url", v)} dir="ltr" inputMode="url" maxLength={600} placeholder="example.com أو https://..." />,
    whatsapp: (
      <>
        <PhoneFields f={f} set={set} label="رقم الواتساب" />
        <Field label="رسالة جاهزة (اختياري)" value={f.msg} onChange={(v) => set("msg", v)} multiline maxLength={400} placeholder="السلام عليكم، عايز أسأل عن..." />
      </>
    ),
    text: <Field label="النص" value={f.text} onChange={(v) => set("text", v)} multiline maxLength={1000} placeholder="اكتب أي نص" />,
    phone: <PhoneFields f={f} set={set} />,
    email: (
      <>
        <Field label="الإيميل" value={f.email} onChange={(v) => set("email", v)} dir="ltr" inputMode="email" maxLength={120} placeholder="name@example.com" />
        <Field label="الموضوع (اختياري)" value={f.subject} onChange={(v) => set("subject", v)} maxLength={150} />
        <Field label="نص الرسالة (اختياري)" value={f.body} onChange={(v) => set("body", v)} multiline maxLength={400} />
      </>
    ),
    wifi: (
      <>
        <Field label="اسم الشبكة" value={f.ssid} onChange={(v) => set("ssid", v)} maxLength={32} dir="ltr" />
        <Seg label="نوع الحماية" value={f.sec} onChange={(v) => set("sec", v)} options={[["WPA", "WPA / WPA2"], ["WEP", "WEP"], ["nopass", "من غير كلمة سر"]]} />
        {f.sec !== "nopass" && <Field label="كلمة السر" value={f.pass} onChange={(v) => set("pass", v)} maxLength={63} dir="ltr" />}
        <Seg label="ظهور الشبكة" value={f.hidden} onChange={(v) => set("hidden", v)} options={[[false, "ظاهرة"], [true, "مخفية"]]} />
      </>
    ),
    vcard: (
      <>
        <Field label="الاسم" value={f.name} onChange={(v) => set("name", v)} maxLength={80} />
        <div className={s.row2}>
          <Field label="الشركة (اختياري)" value={f.org} onChange={(v) => set("org", v)} maxLength={80} />
          <Field label="الوظيفة (اختياري)" value={f.title} onChange={(v) => set("title", v)} maxLength={80} />
        </div>
        <PhoneFields f={f} set={set} label="التليفون (اختياري)" />
        <Field label="الإيميل (اختياري)" value={f.email} onChange={(v) => set("email", v)} dir="ltr" inputMode="email" maxLength={120} />
        <Field label="الموقع (اختياري)" value={f.site} onChange={(v) => set("site", v)} dir="ltr" inputMode="url" maxLength={200} />
      </>
    ),
  };

  const empty = !payload.text && !payload.error;
  // رسالة الخطأ بتظهر بس بعد ما العميل يبدأ يكتب، مش على أول فتحة
  const touched = Object.entries(f).some(([k, v]) => v && !["country", "sec", "hidden"].includes(k));

  return (
    <div className={s.root}>
      <span className={s.badge}><i />بيشتغل على جهازك، وبياناتك ما بتتبعتش لأي سيرفر</span>
      <div className={s.calcBox}>
        <div className={s.calcForm}>
          <div className={s.qrTypes} role="group" aria-label="نوع الرمز">
            {QR_TYPES.map(([k, name]) => (
              <button key={k} type="button" aria-pressed={type === k} className={`${s.qrType} ${type === k ? s.qrTypeOn : ""}`} onClick={() => setType(k)}>{name}</button>
            ))}
          </div>
          <Note>{HINTS[type]}</Note>
          {fields[type]}
          {touched && payload.error && <Note tone="warn">{payload.error}</Note>}

          <hr className={s.qrSep} />

          <div className={s.row2}>
            <label className={s.field}><span className={s.fieldLabel}>لون الرمز</span><input type="color" className={s.colorIn} value={fg} onChange={(e) => setFg(e.target.value)} /></label>
            <label className={s.field}><span className={s.fieldLabel}>لون الخلفية</span><input type="color" className={s.colorIn} value={bg} onChange={(e) => setBg(e.target.value)} /></label>
          </div>
          {warn && <Note tone="warn">{warn}</Note>}
          <Seg label="شكل النقط" value={dots} onChange={setDots} options={DOT_STYLES} />

          <div className={s.field}>
            <span className={s.fieldLabel}>لوجو في النص (اختياري)</span>
            {logo ? (
              <div className={s.qrLogoRow}>
                <img src={logo} alt="اللوجو المختار" width="44" height="44" />
                <button type="button" className="btn ghost" onClick={() => setLogo("")}>شيل اللوجو</button>
              </div>
            ) : (
              <Drop accept={IMAGE_TYPES} onFiles={pickLogo} compact title="اختار صورة اللوجو" />
            )}
          </div>
          {logo && (
            <>
              <label className={s.range}>
                <span className={s.rangeTop}><span>حجم اللوجو</span><output>{logoPct}%</output></span>
                <input type="range" min="10" max="26" value={logoPct} onChange={(e) => setLogoPct(Number(e.target.value))} />
              </label>
              <Note>مع اللوجو بنرفع تصحيح الأخطاء للأقصى تلقائياً، وده بيخلي الرمز أكتر كثافة. جرّب مسحه بموبايلك قبل الطباعة.</Note>
            </>
          )}
          {!logo && <Seg label="تصحيح الأخطاء" value={level} onChange={setLevel} options={LEVELS} />}
        </div>

        <div className={s.calcAside}>
          <div className={s.qrBox}>
            {preview ? <img src={preview} alt="رمز QR جاهز" /> : <Note>{libErr ? "ما قدرناش نحمّل مولّد الرموز. اتأكد من الاتصال." : empty || !lib ? "املا البيانات وهيظهر الرمز هنا على طول." : code?.error || "راجع البيانات."}</Note>}
            {code?.error && <Note tone="warn">{code.error}</Note>}
            {libErr && <button type="button" className="btn ghost" onClick={load}>حاول تاني</button>}
          </div>
          {preview && (
            <>
              <Seg label="حجم الصورة" value={size} onChange={setSize} options={SIZES} />
              <button type="button" className="btn" disabled={busy} onClick={savePng}>{busy ? "ثواني…" : "نزّل PNG"}</button>
              <button type="button" className="btn ghost" onClick={saveSvg}>نزّل SVG (للطباعة والتكبير)</button>
              <button type="button" className="btn ghost" onClick={copyContent}>انسخ النص اللي جوه الرمز</button>
              <Note>جرّب مسح الرمز بموبايلك قبل الطباعة أو النشر.</Note>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
