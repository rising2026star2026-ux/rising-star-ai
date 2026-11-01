import { getCategory } from "@/lib/tools";
import { LOGOS } from "@/lib/icons";
import { glyphFor, brandFor } from "@/lib/toolglyphs";

// أيقونة الأداة: بلاطة متدرجة بلون التصنيف ورمز مرسوم خصيصاً (أو شعار لو متسجل في LOGOS)
export default function ToolIcon({ tool, size = "md" }) {
  const c = getCategory(tool.cat);
  const logo = LOGOS[tool.id];
  const g = glyphFor(tool.id, tool.cat);
  const b = brandFor(tool.id);
  return (
    <span className={`ticon ticon-${size}${logo ? " has-logo" : ""}${b.round ? " ticon-round" : ""}`} style={{ "--c": c.color, "--c1": b.c1, "--c2": b.c2, "--ac": b.ac }} aria-hidden="true">
      {logo ? (
        <img src={logo} alt="" />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={g.f} fill="var(--ac)" stroke="none" />
          <path d={g.l} />
        </svg>
      )}
    </span>
  );
}
