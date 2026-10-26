"use client";
import { MODEL_OPTIONS } from "@/lib/models";
import { useModal } from "@/lib/useModal";
import s from "./chat.module.css";

// اللوحة الجانبية: 6 اختيارات للموديل. على الموبايل بتطلع من الجنب
export default function ModelPicker({ value, onChange, open, onClose }) {
  useModal(open, onClose);

  return (
    <>
      <div className={open ? s.scrim : s.scrimOff} onClick={onClose} aria-hidden="true" />

      <aside className={`${s.side} ${open ? s.sideOpen : ""}`} aria-label="اختيار الموديل">
        <div className={s.sideHead}>
          <span>اختار الموديل</span>
          <button className={s.closeBtn} onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        <div className={s.sideList}>
          {MODEL_OPTIONS.map((m) => {
            const active = m.key === value;
            return (
              <button
                key={m.key}
                className={`${s.modelBtn} ${active ? s.modelActive : ""}`}
                onClick={() => { onChange(m.key); onClose(); }}
                aria-pressed={active}
                title={m.desc}
              >
                <span className={s.modelIcon} aria-hidden="true">{m.icon}</span>
                <span className={s.modelText}>
                  <b>{m.name}</b>
                  <small>{m.tagline}</small>
                </span>
                {active && <span className={s.tick} aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>

        <p className={s.sideNote}>
          كل موديل بيشتغل أحسن في حاجة. اختار حسب طلبك، والمحادثة بتكمل عادي بعد التغيير.
        </p>
      </aside>
    </>
  );
}
