// أيقونة الموديل أو البرنامج:
//   1) لو فيه لوجو رسمي في public/logos → بيظهر هو
//   2) مساعد أو برنامج → أيقونة خطية موحدة
//   3) غير كده → اسم مختصر بخط نضيف على مربع داكن موحد
import s from "./models.module.css";
import { Glyph } from "./glyphs";

export default function BotIcon({ bot, size = 64 }) {
  const style = { "--size": `${size}px`, ...(bot.tint ? { "--t": bot.tint } : {}) };
  if (bot.logo) {
    return (
      <span className={`${s.icon} ${s.iconLogo}`} style={style} aria-hidden="true">
        <img src={bot.logo} alt="" loading="lazy" />
      </span>
    );
  }
  const glyph = bot.glyph || (bot.mono === "search" ? "search" : null);
  const mono = bot.mono || bot.name.slice(0, 2);
  return (
    <span className={s.icon} style={style} aria-hidden="true">
      {glyph ? (
        <Glyph name={glyph} className={s.iconGlyph} />
      ) : (
        <b className={s.iconMono} data-len={mono.length}>{mono}</b>
      )}
    </span>
  );
}
