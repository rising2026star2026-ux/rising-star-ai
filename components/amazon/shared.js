"use client";
// أجزاء مشتركة بين أدوات أمازون
import { useState } from "react";
import { MARKETS, FIELD_LABEL, LEVEL_LABEL } from "@/lib/amazon";
import { copyText } from "@/lib/imagefile";
import { toast } from "@/lib/store";
import s from "../seller/seller.module.css";
import a from "./amazon.module.css";
import { ICONS } from "./icons";

export function MarketChips({ value, onChange }) {
  return (
    <div className={s.chips} role="group" aria-label="سوق أمازون">
      {Object.entries(MARKETS).map(([k, m]) => (
        <button key={k} type="button" className={s.chip} aria-pressed={value === k} onClick={() => onChange(k)}>{m.label}</button>
      ))}
    </div>
  );
}

/** عدّاد: أخضر لحد 85% من الحد، برتقالي قرب الحد، أحمر لما يعدّيه */
export function Meter({ value, max, unit = "حرف" }) {
  const p = Math.min(100, (value / max) * 100);
  const cls = value > max ? a.over : value > max * 0.85 ? a.warn : "";
  return (
    <span className={`${a.meter} ${cls}`} style={{ "--p": `${p}%` }} aria-label={`${value} من ${max} ${unit}`}>
      <span>{value} / {max}</span><i aria-hidden="true" />
    </span>
  );
}

export function StatusBanner({ status, stats }) {
  const map = {
    blocked: ["stop", "فيه مشاكل ممكن توقف الليستنج", "صلّح الأخطاء الحمرا الأول. دي اللي أمازون بترفض أو تخفي بسببها."],
    risky: ["warn", "مفيش أخطاء قاطعة، بس فيه تحذيرات", "راجع التحذيرات البرتقالي مع دليل التصنيف الخاص بيك قبل النشر."],
    clean: ["ok", "مفيش مشاكل ظاهرة", "الفحص ده مش ضمان للقبول، فراجع دليل التصنيف لو المنتج في فئة حساسة."],
  };
  const [icon, title, sub] = map[status] || map.clean;
  return (
    <div className={`${a.status} ${a["st_" + status]}`} role="status">
      <span className={a.sIcon} aria-hidden="true">{ICONS[icon]}</span>
      <div>
        <b>{title}</b>
        <small>{sub}</small>
        <div className={a.counts}>
          <span className={a.count}>{stats.errors} خطأ</span>
          <span className={a.count}>{stats.warns} تحذير</span>
          <span className={a.count}>{stats.tips} تحسين</span>
        </div>
      </div>
    </div>
  );
}

export function IssueList({ issues, limit = 8 }) {
  const [all, setAll] = useState(false);
  if (!issues.length) return null;
  const shown = all ? issues : issues.slice(0, limit);
  return (
    <>
      <ul className={a.issues}>
        {shown.map((i, k) => (
          <li key={k} className={`${a.issue} ${a["lv_" + i.level]} ${i.code === "ai" ? a.lv_ai : ""}`}>
            <span className={a.tag}>{i.code === "ai" ? "مراجعة ذكية" : LEVEL_LABEL[i.level]}</span>
            <span>
              <span className={a.where}>{FIELD_LABEL[i.field]}{i.index != null ? ` ${i.index + 1}` : ""}:</span>
              {i.text}
              {i.match ? <bdi className={a.hit}>{i.match}</bdi> : null}
            </span>
          </li>
        ))}
      </ul>
      {issues.length > limit && (
        <button type="button" className={a.moreBtn} onClick={() => setAll(!all)}>{all ? "إخفاء" : `عرض باقي الملاحظات (${issues.length - limit})`}</button>
      )}
    </>
  );
}

export function CopyBlock({ label, text, meta }) {
  async function copy() { if (await copyText(text)) toast("اتنسخ"); }
  return (
    <div className={s.copyCard}>
      <div className={s.copyHead}>
        <b>{label}</b>
        {meta}
        <button type="button" className={s.miniBtn} onClick={copy} disabled={!text}>نسخ</button>
      </div>
      <div className={s.copyBody} dir="auto">{text || "—"}</div>
    </div>
  );
}

/** عرض ليستنج كامل (عنوان + نقاط + وصف + كلمات خلفية) بأزرار نسخ وعدّادات */
export function ListingView({ listing, titleMax = 200, extraActions = null }) {
  const { title, bullets = [], description, backend } = listing;
  const all = [title, ...bullets.map((b, i) => `${i + 1}. ${b}`), "", description, "", backend && `Search terms: ${backend}`].filter((x) => x != null).join("\n");
  return (
    <div className={s.copyGrid}>
      <CopyBlock label="العنوان" text={title} meta={<Meter value={title.length} max={titleMax} />} />
      <div className={s.copyCard}>
        <div className={s.copyHead}>
          <b>النقاط ({bullets.length})</b>
          <button type="button" className={s.miniBtn} onClick={async () => { if (await copyText(bullets.join("\n"))) toast("اتنسخ"); }}>نسخ الكل</button>
        </div>
        <ol className={`${a.bullets} ${s.copyBody}`} style={{ paddingInlineStart: 28 }}>
          {bullets.map((b, i) => <li key={i} dir="auto">{b}</li>)}
        </ol>
      </div>
      {description ? <CopyBlock label="الوصف" text={description} meta={<Meter value={description.length} max={2000} />} /> : null}
      {backend ? <CopyBlock label="كلمات البحث الخلفية" text={backend} meta={<Meter value={new TextEncoder().encode(backend).length} max={250} unit="بايت" />} /> : null}
      <div className={a.row}>
        <button type="button" className={s.miniBtn} onClick={async () => { if (await copyText(all)) toast("اتنسخ الليستنج كله"); }}>انسخ الليستنج كله</button>
        {extraActions}
      </div>
    </div>
  );
}
