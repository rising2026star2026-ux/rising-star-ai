// أقسام الموقع (Rising Business: قسم الأعمال والتسويق بس؛ العقاري والأكاديمي وشغل الذكاء الاصطناعي والشات العام اتشالوا في 2026-11-15). كل قسم كأنه موقع لوحده: أدواته كروت جوه صفحته (lib/sectioncards.js).
// أي أداة ممكن تظهر في أكتر من قسم (مشتركة)، والكود بتاعها واحد. القسم الحالي بيتحدد من المسار،
// ولو الأداة مشتركة بنفضل في القسم اللي جيت منه، وبنقدر نفتحها من رابط فيه ?from= لقسم معيّن.
// ممنوع نحذف أو نغيّر أي رابط قديم: الروابط هي نفسها، والأقسام بتجمّعها بس.

/** كل الأدوات: الاسم والوصف القصير وبدايات المسارات اللي تتبعها (الأطول بيكسب) */
export const ITEMS = {
  "/brand": { label: "هوية نشاطي", desc: "سجّل بيانات نشاطك مرة واحدة وتتستخدم في كل الأدوات.", match: ["/brand"] },
  "/seller/agent": { label: "وكيل التاجر", desc: "اكتب مهمتك مرة واحدة: أسعار السوق والربح والإعلان والمنشورات في شغلة واحدة.", match: ["/seller/agent"] },
  "/seller": { label: "ستوديو البيّاع", desc: "أدوات البيع أونلاين: إعلانات، كتالوج، فحص سوق، وصف منتجات.", match: ["/seller", "/market-check", "/test-ad", "/photo-ad", "/voice-post", "/catalog", "/amazon", "/survey"] },
  "/compare-business": { label: "مقارنة الأنشطة التجارية", desc: "قارن من نشاطين لخمسة: رأس المال والتعادل والربح والاسترداد والمخاطر.", match: ["/compare-business"] },
  "/my-work": { label: "مشروعاتي", desc: "ملف نشاطك ودراساتك ومقارناتك المحفوظة.", match: ["/my-work"] },
  "/feasibility": { label: "الباحث التجاري", desc: "دراسة جدوى لمشروعك بسيناريوهات وافتراضات تعدّلها بنفسك.", match: ["/feasibility"] },
  "/maker": { label: "صانع الصور والفيديو", desc: "اعمل صور وفيديو قصير لمنتجك أو محلك.", match: ["/maker", "/lab"] },
  "/tools": { label: "أدوات التسويق والمحتوى", desc: "إعلانات ومنشورات ووصف منتجات وردود على العملاء وتصميم صور ولوجو.", match: ["/tools", "/tool/"] },
  "/prompts/studio": { label: "استوديو البرومبتات", desc: "برومبتات احترافية لفيديو وصورة وإعلان وهوك.", match: ["/prompts/studio"] },
  "/prompts": { label: "مكتبة البرومبتات", desc: "برومبتات جاهزة تنسخها وتغيّر الكلام اللي بين الأقواس.", match: ["/prompts"] },
  "/resources": { label: "مكتبة الموارد", desc: "أقسام الموارد والقوالب.", match: ["/resources"] },
};

// مسارات الأدوات المشتركة: القسم الأصلي لو ما عرفناش جيت منين
const OWNER = {};

// icon: مسار SVG جاهز (viewBox 24)
export const SECTIONS = [
  { id: "seller", name: "مساعد الأعمال", tagline: "قرار وتسعير وتسويق ومبيعات", color: "#e8590c", icon: "M4 9.5l1.6-4.2A1.5 1.5 0 017 4.3h10a1.5 1.5 0 011.4 1l1.6 4.2M4 9.5a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0 2.7 2.7 0 005.3 0M5.5 12.5V19a1 1 0 001 1h11a1 1 0 001-1v-6.5M10 20v-4.5h4V20", items: ["/seller/agent", "/seller", "/compare-business", "/my-work", "/feasibility", "/tools", "/maker", "/prompts/studio", "/prompts", "/brand", "/resources"] },
];
export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

/** الأداة مشتركة لو ظاهرة في أكتر من قسم */
export const isShared = (href) => SECTIONS.filter((s) => s.items.includes(href)).length > 1;

/** أطول بداية مسار بتطابق المسار ده في الأداة، أو 0 */
function matchLen(item, pathname) {
  let best = 0;
  for (const m of item.match) if (pathname === m || pathname.startsWith(m.endsWith("/") ? m : m + "/") || pathname === m.replace(/\/$/, "")) best = Math.max(best, m.length);
  return best;
}

/** أفضل أداة مطابقة للمسار جوه قايمة أدوات، أو null */
export function bestItem(pathname, hrefs) {
  let best = null, len = 0;
  for (const h of hrefs) {
    const n = matchLen(ITEMS[h], pathname);
    if (n > len) { len = n; best = h; }
  }
  return best;
}

/**
 * بيحدد القسم الحالي. prefs: أقسام نفضّلها بالترتيب (القسم اللي كنا فيه، وبعده ?from=).
 * بيرجّع { id, href } أو null لو المسار مش تابع لأي قسم (الرئيسية، الباقات، الدعم…).
 */
export function resolveSection(pathname, prefs = []) {
  const entry = /^\/s\/([a-z]+)\/?$/.exec(pathname);
  if (entry) return SECTION_BY_ID[entry[1]] ? { id: entry[1], href: null } : null; // صفحة دخول القسم نفسه
  const all = Object.keys(ITEMS);
  const top = bestItem(pathname, all);
  if (!top) return null;
  const hit = SECTIONS.filter((s) => bestItem(pathname, s.items) === top);
  if (!hit.length) return null;
  for (const p of prefs) if (p && hit.some((s) => s.id === p)) return { id: p, href: top };
  const owner = OWNER[top];
  return { id: hit.find((s) => s.id === owner)?.id || hit[0].id, href: top };
}

/** رابط أداة جوه قسم: المشتركة بتاخد ?from عشان تفضل في نفس القسم لو اتفتحت من برّه */
export const itemHref = (href, sectionId) => (isShared(href) && !href.includes("?") ? `${href}?from=${sectionId}` : href);

/** صفحة دخول القسم: شات القسم نفسه */
export const sectionHome = (id) => `/s/${id}`;
