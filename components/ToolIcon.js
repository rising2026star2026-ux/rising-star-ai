import { getCategory } from "@/lib/tools";
import { ICONS, LOGOS } from "@/lib/icons";

export default function ToolIcon({ tool, size = "md" }) {
  const c = getCategory(tool.cat);
  const logo = LOGOS[tool.id];
  return (
    <span className={`ticon ticon-${size}${logo ? " has-logo" : ""}`} style={{ "--c": c.color }} aria-hidden="true">
      {logo ? <img src={logo} alt="" /> : ICONS[tool.id] || c.icon}
    </span>
  );
}
