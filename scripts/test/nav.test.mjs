// كل مسار ظاهر ليه عنصر واحد بالظبط في كل قايمة، والقايمتين حسب PRD 1.0. تشغيل: node scripts/test/nav.test.mjs
import assert from "node:assert/strict";
import { SIDE_NAV, TAB_NAV, activeOf } from "../../lib/nav.js";
assert.deepEqual(SIDE_NAV.map((x) => x.label), ["لوحة التحكم", "مساعد الأعمال", "ذكاء السوق", "مقارنة الأنشطة", "دراسة الجدوى", "إدارة المنتجات", "التسويق والمبيعات", "استوديو الإنتاج التجاري", "مشروعاتي وتقاريري", "ملف النشاط", "الباقات والإعدادات"]);
assert.deepEqual(TAB_NAV.map((x) => x.label), ["الرئيسية", "السوق", "المساعد", "أعمالي", "الأدوات"]);
const want = {
  "/": ["لوحة التحكم", "الرئيسية"], "/brand": ["ملف النشاط", "أعمالي"], "/my-work": ["مشروعاتي وتقاريري", "أعمالي"],
  "/market": ["ذكاء السوق", "السوق"], "/market-check": ["ذكاء السوق", "السوق"], "/amazon/competitor": ["ذكاء السوق", "السوق"],
  "/compare-business": ["مقارنة الأنشطة", "السوق"], "/feasibility": ["دراسة الجدوى", "السوق"], "/feasibility/chat": ["دراسة الجدوى", "السوق"],
  "/products": ["إدارة المنتجات", "الأدوات"], "/amazon": ["إدارة المنتجات", "الأدوات"], "/amazon/profit": ["إدارة المنتجات", "الأدوات"], "/catalog": ["إدارة المنتجات", "الأدوات"],
  "/marketing": ["التسويق والمبيعات", "الأدوات"], "/seller": ["التسويق والمبيعات", "الأدوات"], "/seller/agent": ["التسويق والمبيعات", "الأدوات"], "/tools": ["التسويق والمبيعات", "الأدوات"], "/tool/ad-copy": ["التسويق والمبيعات", "الأدوات"],
  "/studio": ["استوديو الإنتاج التجاري", "الأدوات"], "/photo-ad": ["استوديو الإنتاج التجاري", "الأدوات"], "/maker": ["استوديو الإنتاج التجاري", "الأدوات"],
  "/s/seller": ["مساعد الأعمال", "المساعد"], "/plans": ["الباقات والإعدادات", "أعمالي"], "/data-sources": ["ذكاء السوق", "السوق"],
};
for (const [p, [side, tab]] of Object.entries(want)) {
  assert.equal(activeOf(SIDE_NAV, p)?.label, side, `جانبي ${p}`);
  assert.equal(activeOf(TAB_NAV, p)?.label, tab, `سفلي ${p}`);
}
assert.equal(activeOf(SIDE_NAV, "/support"), null);
console.log("nav: تمام");
