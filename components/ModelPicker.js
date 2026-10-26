"use client";
import Link from "next/link";
import { MODEL_OPTIONS } from "@/lib/models";
import { BOTS } from "@/lib/bots";
import { useModal } from "@/lib/useModal";
import BotIcon from "./BotIcon";
import s from "./chat.module.css";
import m from "./models.module.css";

// أيقونات سريعة من صفحة «الموديلات»
const QUICK = ["claude-opus", "gpt-astra", "gemini-pro", "grok", "gpt-oss-120b", "search-fast"];

// اللوحة الجانبية: الاختيارات الـ6 الأساسية، وتحتها اختصار لكل الموديلات. على الموبايل بتطلع من الجنب
export default function ModelPicker({ value, bot, onChange, onBot, open, onClose }) {
  useModal(open, onClose);
  const quick = QUICK.map((k) => BOTS.find((b) => b.key === k)).filter(Boolean);

  return (
    <>
      <div className={open ? s.scrim : s.scrimOff} onClick={onClose} aria-hidden="true" />

      <aside className={`${s.side} ${open ? s.sideOpen : ""}`} aria-label="اختيار الموديل">
        <div className={s.sideHead}>
          <span>اختار الموديل</span>
          <button className={s.closeBtn} onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        {bot && (
          <div className={s.botActive}>
            <BotIcon bot={bot} size={34} badge={false} />
            <span className={s.botActiveText}><b dir="auto">{bot.name}</b><small>{bot.maker} • مختار دلوقتي</small></span>
            <button className={s.closeBtn} onClick={() => { onChange(value || "balanced"); onClose(); }} aria-label="رجوع للموديلات الأساسية" title="رجوع للموديلات الأساسية">✕</button>
          </div>
        )}

        <div className={s.sideList}>
          {MODEL_OPTIONS.map((opt) => {
            const active = opt.key === value;
            return (
              <button
                key={opt.key}
                className={`${s.modelBtn} ${active ? s.modelActive : ""}`}
                onClick={() => { onChange(opt.key); onClose(); }}
                aria-pressed={active}
                title={opt.desc}
              >
                <span className={s.modelIcon} aria-hidden="true">{opt.icon}</span>
                <span className={s.modelText}>
                  <b>{opt.name}</b>
                  <small>{opt.tagline}</small>
                </span>
                {active && <span className={s.tick} aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>

        <div className={s.moreHead}>
          <span>موديلات أكتر</span>
          <Link href="/models" onClick={onClose}>كل الموديلات ←</Link>
        </div>
        <div className={m.strip}>
          {quick.map((b) => (
            <button key={b.key} type="button" className={m.stripItem} onClick={() => { onBot(b.key); onClose(); }} aria-pressed={bot?.key === b.key}>
              <BotIcon bot={b} size={40} />
              <span dir="auto">{b.name}</span>
            </button>
          ))}
        </div>

        <p className={s.sideNote}>
          كل موديل بيشتغل أحسن في حاجة. اختار حسب طلبك، والمحادثة بتكمل عادي بعد التغيير.
        </p>
      </aside>
    </>
  );
}
