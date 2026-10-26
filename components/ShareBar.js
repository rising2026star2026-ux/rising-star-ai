"use client";
import { useEffect, useState } from "react";
import {
  whatsAppText,
  whatsAppUrl,
  wordDocument,
  printDocument,
  plainToHtml,
  safeFileName,
  BRAND,
} from "@/lib/share";
import s from "./share.module.css";

// رابط موقعك بيتحط في آخر الرسائل والملفات: من NEXT_PUBLIC_SITE_URL في Vercel، أو من عنوان الصفحة نفسها
const ENV_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
const siteUrl = () => ENV_URL || (typeof window !== "undefined" ? window.location.origin : "");

/**
 * شريط المشاركة.
 *  text     — النص الأصلي (Markdown)
 *  getHtml  — دالة بترجع HTML النتيجة زي ما هي معروضة (للـWord والـPDF)
 *  title    — اسم الأداة، بيبقى عنوان الملف
 *  compact  — أيقونات صغيرة من غير كلام (للشات)
 */
export default function ShareBar({ text, getHtml, title, compact = false }) {
  const [canShare, setCanShare] = useState(false);
  const [flash, setFlash] = useState("");
  const [hint, setHint] = useState("");

  // زرار «مشاركة» بيظهر بس على الأجهزة اللي بتدعمه (أغلب الموبايلات)
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  if (!text || !text.trim()) return null;

  const name = resolveTitle(title);

  function html() {
    const rendered = typeof getHtml === "function" ? getHtml() : "";
    return rendered && rendered.trim() ? rendered : plainToHtml(text);
  }

  function ping(key) {
    setFlash(key);
    setTimeout(() => setFlash(""), 1600);
  }

  function showHint(msg) {
    setHint(msg);
    setTimeout(() => setHint(""), 4500);
  }

  // رابط عادي (مش نافذة بالكود) عشان يفتح تطبيق واتساب صح على الموبايل
  // وواتساب ويب على الكمبيوتر، والمتصفح ما يمنعوش
  const waHref = whatsAppUrl(whatsAppText(text, siteUrl()));

  async function onShare() {
    try {
      await navigator.share({ title: `${name} — ${BRAND}`, text: whatsAppText(text, siteUrl()) });
    } catch (e) {
      // المستخدم قفل نافذة المشاركة: ده عادي ومش خطأ
      if (e && e.name !== "AbortError") showHint("المشاركة ما اشتغلتش على الجهاز ده. جرّب واتساب أو النسخ.");
    }
  }

  function onWord() {
    const doc = wordDocument(name, html(), siteUrl());
    // ﻿ في الأول بيخلي Word يعرف إن الملف عربي UTF-8
    const blob = new Blob(["﻿", doc], { type: "application/msword" });
    download(blob, `${safeFileName(name)} - ${BRAND}.doc`);
    ping("word");
  }

  function onPdf() {
    const w = window.open("", "_blank");
    if (!w) {
      showHint("المتصفح منع فتح نافذة جديدة. اسمح بالنوافذ المنبثقة للموقع وجرّب تاني.");
      return;
    }
    w.document.open();
    w.document.write(printDocument(name, html(), siteUrl()));
    w.document.close();
    ping("pdf");
  }

  return (
    <div className={`${s.wrap} ${compact ? s.compact : ""}`}>
      {!compact && <span className={s.label}>شارك النتيجة</span>}

      <div className={s.row}>
        <a
          className={`${s.btn} ${s.wa}`}
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="إرسال على واتساب"
          title="إرسال على واتساب"
        >
          <Icon name="send" />
          <span className={s.txt}>واتساب</span>
        </a>

        {canShare && (
          <button type="button" className={s.btn} onClick={onShare} aria-label="مشاركة" title="مشاركة">
            <Icon name="share" />
            <span className={s.txt}>مشاركة</span>
          </button>
        )}

        <button type="button" className={s.btn} onClick={onWord} aria-label="تحميل ملف Word" title="تحميل ملف Word">
          <Icon name={flash === "word" ? "check" : "doc"} />
          <span className={s.txt}>{flash === "word" ? "اتحمّل" : "Word"}</span>
        </button>

        <button type="button" className={s.btn} onClick={onPdf} aria-label="حفظ PDF" title="حفظ PDF">
          <Icon name={flash === "pdf" ? "check" : "pdf"} />
          <span className={s.txt}>PDF</span>
        </button>
      </div>

      {hint && <p className={s.hint} role="status">{hint}</p>}
    </div>
  );
}

// اسم الأداة: من الخاصية، أو من عنوان الصفحة «اسم الأداة | Rising StarAi»
function resolveTitle(title) {
  if (title && title.trim()) return title.trim();
  if (typeof document !== "undefined" && document.title) {
    const first = document.title.split("|")[0].trim();
    if (first) return first;
  }
  return BRAND;
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // التأخير ده بيمنع إن التحميل يتلغي في بعض المتصفحات
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function Icon({ name }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  switch (name) {
    case "send":
      // أيقونة «إرسال» عامة. لو عايز لوجو واتساب الرسمي، نزّله من صفحة الهوية بتاعتهم
      return (
        <svg {...p}>
          <path d="M21 3L10.5 13.5" />
          <path d="M21 3l-6.5 18-4-7.5L3 9.5z" />
        </svg>
      );
    case "share":
      return (
        <svg {...p}>
          <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" />
          <path d="M5 12v6.5A2.5 2.5 0 007.5 21h9a2.5 2.5 0 002.5-2.5V12" />
        </svg>
      );
    case "doc":
      return (
        <svg {...p}>
          <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h4" />
        </svg>
      );
    case "pdf":
      return (
        <svg {...p}>
          <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
          <path d="M14 3v5h5M12 11v6M9.5 14.5L12 17l2.5-2.5" />
        </svg>
      );
    case "check":
      return (
        <svg {...p}>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      );
    default:
      return null;
  }
}
