// صورة صانع المحتوى: لو صاحبها بعتها بموافقته بتظهر، وإلا أول حرف من الاسم على دايرة ملونة
import s from "./creators.module.css";

export default function CreatorAvatar({ c, size = 56 }) {
  const style = { "--size": `${size}px`, "--t": c.tint || "#1f4dff" };
  if (c.photo) {
    return (
      <span className={s.avatar} style={style}>
        <img src={c.photo} alt={c.name} />
      </span>
    );
  }
  return (
    <span className={s.avatar} style={style} aria-hidden="true">
      {Array.from(c.name.trim())[0]}
    </span>
  );
}
