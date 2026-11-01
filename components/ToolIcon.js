import { getCategory } from "@/lib/tools";
import { LOGOS } from "@/lib/icons";
import { glyphFor } from "@/lib/toolglyphs";

// أيقونة الأداة: بلاطة متدرجة بلون التصنيف ورمز مرسوم خصيصاً (أو شعار لو متسجل في LOGOS)
export default function ToolIcon({ tool, size = "md" }) {
  const c = getCategory(tool.cat);
  const logo = LOGOS[tool.id];
  const g = glyphFor(tool.id, tool.cat);
  return (
    <span className={`ticon ticon-${size}${logo ? " has-logo" : ""}`} style={{ "--c": c.color }} aria-hidden="true">
      {logo ? (
        <img src={logo} alt="" />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d={g.f} fill="#fff" fillOpacity="0.26" stroke="none" />
          <path d={g.l} />
        </svg>
      )}
    </span>
  );
}
