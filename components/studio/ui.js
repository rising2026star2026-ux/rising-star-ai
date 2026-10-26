"use client";
// عناصر الواجهة المشتركة لأدوات الاستوديو
import { useEffect, useId, useRef, useState } from "react";
import s from "./studio.module.css";

/** مكان سحب الملفات: سحب وإفلات، أو اختيار، أو لصق صورة (Ctrl+V) */
export function Drop({ accept, multiple = false, onFiles, title, hint, compact = false }) {
  const [over, setOver] = useState(false);
  const inRef = useRef(null);
  const id = useId();

  function take(list) {
    const files = Array.from(list || []).filter((f) => matches(f, accept));
    if (files.length) onFiles(multiple ? files : [files[0]]);
  }

  // لصق صورة من الحافظة
  useEffect(() => {
    if (!accept || !accept.includes("image")) return;
    function onPaste(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length) take(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  return (
    <label
      htmlFor={id}
      className={`${s.drop} ${over ? s.dropOver : ""} ${compact ? s.dropCompact : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
    >
      <input
        id={id}
        ref={inRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className={s.hiddenInput}
        onChange={(e) => { take(e.target.files); e.target.value = ""; }}
      />
      <span className={s.dropIcon} aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4M7 9l5-5 5 5" />
          <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
        </svg>
      </span>
      <b>{title || (multiple ? "اسحب الملفات هنا أو اضغط تختار" : "اسحب الملف هنا أو اضغط تختار")}</b>
      {!compact && <small>{hint || "ملفاتك بتفضل على جهازك، ومفيش حاجة بتترفع لأي سيرفر."}</small>}
    </label>
  );
}

function matches(file, accept) {
  if (!accept) return true;
  return accept.split(",").some((a) => {
    a = a.trim();
    if (a.endsWith("/*")) return file.type.startsWith(a.slice(0, -1));
    if (a.startsWith(".")) return file.name.toLowerCase().endsWith(a);
    return file.type === a;
  });
}

/** شريط تحكم برقم */
export function Range({ label, value, min, max, step = 1, onChange, unit = "", format }) {
  const id = useId();
  return (
    <div className={s.range}>
      <label htmlFor={id}>
        <span>{label}</span>
        <output>{format ? format(value) : `${value}${unit}`}</output>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/** اختيار من كذا اختيار (نفس شكل اختيارات أدوات الذكاء الاصطناعي) */
export function Seg({ label, value, options, onChange }) {
  return (
    <div className={s.field}>
      {label && <span className={s.fieldLabel}>{label}</span>}
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={String(v)} type="button" role="radio" aria-checked={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ColorField({ label, value, onChange }) {
  const id = useId();
  return (
    <div className={s.colorField}>
      <label htmlFor={id}>{label}</label>
      <span className={s.colorWrap}>
        <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <code dir="ltr">{value}</code>
      </span>
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder, multiline = false, dir = "auto", inputMode, maxLength = 300 }) {
  const id = useId();
  const P = { id, value, placeholder, dir, maxLength, onChange: (e) => onChange(e.target.value), className: s.input };
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.fieldLabel}>{label}</label>
      {multiline ? <textarea rows={2} {...P} /> : <input type="text" inputMode={inputMode} {...P} />}
    </div>
  );
}

/** لوحة الأداة: معاينة على جنب وأدوات التحكم على الجنب التاني */
export function Workbench({ preview, controls, footer }) {
  return (
    <div className={s.bench}>
      <div className={s.stage}>{preview}</div>
      <div className={s.panel}>
        {controls}
        {footer && <div className={s.panelFoot}>{footer}</div>}
      </div>
    </div>
  );
}

export function Note({ children, tone = "info" }) {
  return <p className={`${s.note} ${tone === "warn" ? s.noteWarn : ""}`}>{children}</p>;
}

export function Busy({ text = "ثواني..." }) {
  return (
    <div className={s.busy} role="status">
      <span className={s.spinner} aria-hidden="true" />
      {text}
    </div>
  );
}

export { s as styles };
