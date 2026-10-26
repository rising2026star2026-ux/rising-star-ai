"use client";
// تفعيل كود الاشتراك (للموديلات العالمية). الكود بيتحفظ على جهاز المستخدم بس.
import { useState } from "react";
import { useStored, toast } from "@/lib/store";
import s from "./models.module.css";

export default function ProCode({ compact = false, onActivated }) {
  const [code, setCode] = useStored("pro-code", "");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function activate(e) {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/pro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: v }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setCode(v);
        setValue("");
        toast("الاشتراك اتفعّل ✓");
        onActivated?.();
      } else setError(data.error || "الكود ده مش صحيح.");
    } catch {
      setError("الاتصال اتقطع. جرّب تاني.");
    } finally {
      setBusy(false);
    }
  }

  if (code) {
    return (
      <div className={`${s.pro} ${s.proOn}`}>
        <span className={s.proDot} aria-hidden="true">✦</span>
        <span className={s.proText}><b>الموديلات العالمية مفعّلة</b><small>تقدر تستخدم GPT وClaude وGemini وGrok وباقي الموديلات.</small></span>
        <button type="button" className={s.proGhost} onClick={() => { setCode(""); toast("اتشال الكود من الجهاز ده"); }}>إلغاء</button>
      </div>
    );
  }

  return (
    <form className={`${s.pro} ${compact ? s.proCompact : ""}`} onSubmit={activate}>
      <span className={s.proDot} aria-hidden="true">✦</span>
      <span className={s.proText}>
        <b>عندك كود اشتراك؟</b>
        <small>فعّله عشان تفتح الموديلات العالمية (GPT وClaude وGemini وGrok).</small>
      </span>
      <span className={s.proForm}>
        <input
          className={s.proInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="اكتب الكود"
          aria-label="كود الاشتراك"
          dir="ltr"
          autoComplete="off"
          maxLength={64}
        />
        <button className="btn" disabled={busy || !value.trim()}>{busy ? "..." : "تفعيل"}</button>
      </span>
      {error && <small className={s.proError} role="alert">{error}</small>}
    </form>
  );
}
