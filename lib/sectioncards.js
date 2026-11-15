// صفوف الكروت جوه كل قسم (بدل قايمة الأدوات في الشريط الجانبي): صف أدوات القسم، وصفوف أدوات الموقع حسب الفئة.
// فكرة اللون: كل فئة ليها تدرج من لون فاتح لغامق من نفس العيلة، وكل أداة ليها مجسّم 3D خاص بيها (lib/cardart.js).
// أدوات التاجر (تسويق، سوشيال، تجارة إلكترونية، أعمال، استوديو التصميم) مكانها «تسويق المحلات» بس، مش «شغل الذكاء الاصطناعي».
import { ITEMS } from "@/lib/sections";
import { tools, categories } from "@/lib/tools";
import { cardArt } from "@/lib/cardart";

const CAT = {
  writing: ["pen", "#8b6cff", "#3b2aa8"],
  marketing: ["megaphone", "#ff6a6a", "#b0193f"],
  social: ["social", "#ff5fa8", "#7a2bd1"],
  business: ["briefcase", "#22b8a4", "#0b5a52"],
  ecommerce: ["cart", "#ffa24a", "#c4410a"],
  education: ["cap", "#5a95ff", "#1d3fa6"],
  language: ["translate", "#2cc9ec", "#0b628a"],
  code: ["code", "#2ccf86", "#0a6440"],
  career: ["person", "#b07cff", "#5326ad"],
  productivity: ["checklist", "#14cf9f", "#06714f"],
  communication: ["mail", "#ffbf3a", "#b86500"],
  creative: ["sparkle", "#ff82c8", "#a5226f"],
  design: ["palette", "#ff6a45", "#a6290c"],
  studio: ["clapper", "#9d5cff", "#3c12b8"],
  analysis: ["pie", "#6a9bff", "#22408f"],
  lifestyle: ["plane", "#93cf55", "#3f7114"],
  calc: ["calc", "#26b5f2", "#075a86"],
  islamic: ["crescent", "#2fbf68", "#0c5a2b"],
  text: ["text", "#9b6dff", "#4a1d96"],
};

const ITEM = {
  "/brand": ["badge", "#ffbf3a", "#b86500"],
  "/seller/agent": ["cart", "#ff8a3d", "#c2410c"],
  "/seller": ["store", "#ff8a3d", "#c2410c"],
  "/compare-business": ["growth", "#22b8a4", "#0b5a52"],
  "/my-work": ["folder", "#8f99ad", "#3a4253"],
  "/feasibility": ["growth", "#22b8a4", "#0b5a52"],
  "/tools": ["grid", "#ff6a6a", "#b0193f"],
  "/maker": ["media", "#ff5fa8", "#7a2bd1"],
  "/prompts/studio": ["wand", "#9d5cff", "#3c12b8"],
  "/prompts": ["book", "#6a9bff", "#22408f"],
  "/resources": ["folder", "#8f99ad", "#3a4253"],
};

const MAX = 10;
const item = (href) => {
  const [glyph, c1, c2] = ITEM[href] || ["grid", "#3a4152", "#0f1218"];
  return { href, title: ITEMS[href].label, desc: ITEMS[href].desc, glyph, c1, c2, img: cardArt(href) };
};
const tool = (t) => {
  const [glyph, c1, c2] = CAT[t.cat] || ["grid", "#3a4152", "#0f1218"];
  return { href: `/tool/${t.id}`, title: t.name, desc: t.desc, glyph, c1, c2, img: cardArt(t.id) };
};
const inCats = (ids) => tools.filter((t) => ids.includes(t.cat));
const catName = (id) => categories.find((c) => c.id === id)?.name || id;
/** صف من فئة أو أكتر: أول 10 أدوات، و«عرض الكل» بيفتح كتالوج الأدوات على الفئة */
const catRow = (ids, title = catName(ids[0])) => {
  const list = inCats(ids);
  return { title, more: list.length > MAX ? (ids.length === 1 ? `/tools?cat=${ids[0]}` : "/tools") : null, count: list.length, cards: list.slice(0, MAX).map(tool) };
};
const itemsRow = (title, hrefs) => ({ title, more: null, count: hrefs.length, cards: hrefs.filter((h) => ITEMS[h]).map(item) });

const ROWS = {
  seller: () => [
    itemsRow("أدوات البيع", ["/seller/agent", "/seller", "/compare-business", "/feasibility", "/tools", "/maker", "/prompts/studio", "/prompts", "/brand", "/resources"]),
    catRow(["marketing"]),
    catRow(["social"]),
    catRow(["ecommerce", "business"], "بيع أونلاين ومشروعك"),
    catRow(["communication", "design", "analysis", "calc"], "تواصل وتصميم وحسابات"),
    catRow(["studio"]),
  ],
};

/** صفوف قسم: [{ title, more, count, cards: [{ href, title, desc, glyph, c1, c2, img }] }] */
export const sectionRows = (id) => (ROWS[id] ? ROWS[id]().filter((r) => r.cards.length) : []);
