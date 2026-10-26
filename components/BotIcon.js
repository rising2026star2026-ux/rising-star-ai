// أيقونة الموديل: مربع بتدرّج لون الشركة وحروف مختصرة (تصميم خاص بالموقع، مش شعار الشركة)
import s from "./models.module.css";

export default function BotIcon({ bot, size = 64, badge = true }) {
  const [a, b] = bot.colors || ["#222", "#444"];
  const mono = bot.mono || bot.name.slice(0, 2);
  const style = { "--c1": a, "--c2": b, "--size": `${size}px` };
  return (
    <span className={s.icon} style={style} aria-hidden="true">
      {mono === "search" ? (
        <svg viewBox="0 0 24 24" className={s.iconGlyph} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="M19.5 19.5l-4.6-4.6M4.5 10.5h12M10.5 4.5c1.7 1.8 2.5 3.8 2.5 6s-.8 4.2-2.5 6c-1.7-1.8-2.5-3.8-2.5-6s.8-4.2 2.5-6z" />
        </svg>
      ) : (
        <b className={s.iconMono} data-len={mono.length}>{mono}</b>
      )}
      {badge && bot.tier === "pro" && <i className={s.iconPro}>✦</i>}
    </span>
  );
}
