"use client";
// زرار «تدقيق لغوي» في صناديق الكتابة: بيصحّح النص في مكانه، ومعاه تراجع
import { useState } from "react";
import { toast } from "@/lib/store";

export function useProofread(getText, setText) {
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState(null);

  async function run() {
    const text = (getText() || "").trim();
    if (!text) { toast("اكتب النص الأول وبعدين دقّقه"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/proofread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "حصل خطأ، جرّب تاني.");
      if (data.changed) {
        setUndo(text);
        setText(data.text);
        toast("اتصلّحت الأخطاء ✓");
      } else {
        toast("النص سليم ومفيهوش أخطاء ✓");
      }
    } catch (e) {
      toast(e.message || "الاتصال اتقطع. جرّب تاني.");
    } finally {
      setBusy(false);
    }
  }

  function revert() {
    if (undo !== null) setText(undo);
    setUndo(null);
  }

  return { busy, run, undo, revert, dismiss: () => setUndo(null) };
}

export const ProofIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 16l3.6-9.5L10.2 16M4.4 12.8h4.4" />
    <path d="M13.5 14.5l2.6 2.6L21 11.5" />
  </svg>
);
