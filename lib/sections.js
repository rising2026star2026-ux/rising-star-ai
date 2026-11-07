// أقسام الموقع الخمسة. كل قسم له قايمة جانبية خاصة بيه، وكأنه موقع لوحده.
// أي أداة ممكن تظهر في أكتر من قسم (مشتركة)، والكود بتاعها واحد. القسم الحالي بيتحدد من المسار،
// ولو الأداة مشتركة بنفضل في القسم اللي جيت منه، وبنقدر نفتحها من رابط فيه ?from= لقسم معيّن.
// ممنوع نحذف أو نغيّر أي رابط قديم: الروابط هي نفسها، والأقسام بتجمّعها بس.

/** كل الأدوات: الاسم والوصف القصير وبدايات المسارات اللي تتبعها (الأطول بيكسب) */
export const ITEMS = {
  "/realestate": { label: "الباحث العقاري", desc: "حلّل السوق وقارن العقارات، من غير أسعار مخترعة.", match: ["/realestate"] },
  "/realestate/chat": { label: "الشات العقاري", desc: "اسأل المستشار العقاري زي ما بتسأل خبير، وهو يرد بمصادر.", match: ["/realestate/chat"] },
  "/brand": { label: "هوية نشاطي", desc: "سجّل بيانات نشاطك مرة واحدة وتتستخدم في كل الأدوات.", match: ["/brand"] },
  "/seller": { label: "ستوديو البيّاع", desc: "أدوات البيع أونلاين: إعلانات، كتالوج، فحص سوق، وصف منتجات.", match: ["/seller", "/market-check", "/test-ad", "/photo-ad", "/voice-post", "/catalog", "/amazon", "/survey"] },
  "/feasibility": { label: "الباحث التجاري", desc: "دراسة جدوى لمشروعك بسيناريوهات وافتراضات تعدّلها بنفسك.", match: ["/feasibility"] },
  "/maker": { label: "صانع الصور والفيديو", desc: "اعمل صور وفيديو قصير لمنتجك أو محلك.", match: ["/maker", "/lab"] },
  "/prompts/studio": { label: "استوديو البرومبتات", desc: "برومبتات احترافية لفيديو وصورة وشات وهوك وإعلان.", match: ["/prompts/studio"] },
  "/prompts": { label: "مكتبة البرومبتات", desc: "برومبتات جاهزة تنسخها وتغيّر الكلام اللي بين الأقواس.", match: ["/prompts"] },
  "/resources": { label: "مكتبة الموارد", desc: "أقسام الموارد والقوالب.", match: ["/resources"] },
  "/research": { label: "الباحث الأكاديمي", desc: "تقارير بحثية بمصادر ومراجع، وشات متخصص على المصادر.", match: ["/research"] },
  "/projects": { label: "المشاريع", desc: "ارفع ملفاتك واسأل عنها.", match: ["/projects"] },
  "/learn": { label: "تعلّم الذكاء الاصطناعي", desc: "مصادر عربية لتعلّم الذكاء الاصطناعي.", match: ["/learn"] },
  "/flows": { label: "المهام الكاملة", desc: "طلب واحد بيعدّي على أكتر من أداة ويطلّع شغل كامل.", match: ["/flows", "/flow/"] },
  "/tools": { label: "كل الأدوات", desc: "كل أدوات الموقع في مكان واحد.", match: ["/tools", "/tool/"] },
  "/tasks": { label: "أداة لأي مهمة", desc: "اكتب مهمتك وهنرشّح لك الأداة المناسبة.", match: ["/tasks", "/task/"] },
  "/agents": { label: "الوكلاء", desc: "وكلاء جاهزين لمهام محددة.", match: ["/agents"] },
  "/library": { label: "مكتبة الأدوات", desc: "تصفّح الأدوات حسب التصنيف.", match: ["/library"] },
  "/global-tools": { label: "أدوات عالمية", desc: "دليل أدوات الذكاء الاصطناعي العالمية بالعربي، وبدائل مجانية.", match: ["/global-tools", "/ai/"] },
  "/creators": { label: "صناع المحتوى", desc: "صناع محتوى الذكاء الاصطناعي العرب.", match: ["/creators"] },
  "/news": { label: "جديد الذكاء الاصطناعي", desc: "آخر أخبار شركات الذكاء الاصطناعي.", match: ["/news"] },
  "/subscriptions": { label: "مقارن الاشتراكات", desc: "قارن أسعار الاشتراكات بالجنيه وافحص البائع قبل ما تدفع.", match: ["/subscriptions", "/scam-check"] },
  "/my-tools": { label: "أدواتي", desc: "افتح أدواتك الخارجية كلها من مكان واحد.", match: ["/my-tools"] },
  "/chat": { label: "الشات العام", desc: "محادثة عامة بالعربي مع نماذج قوية، وبحث على الإنترنت.", match: ["/chat"] },
  "/models": { label: "الموديلات والبرامج", desc: "اختار من أكتر من 40 نموذج وبرنامج.", match: ["/models", "/program"] },
  "/compare": { label: "مقارنة الموديلات", desc: "ابعت سؤال واحد لأكتر من نموذج وقارن الإجابات.", match: ["/compare"] },
  "/history": { label: "السجل", desc: "محادثاتك السابقة.", match: ["/history"] },
};

// مسارات الأدوات المشتركة: القسم الأصلي لو ما عرفناش جيت منين
const OWNER = { "/prompts/studio": "aiwork", "/brand": "seller", "/maker": "seller" };

// icon: مسار SVG جاهز (viewBox 24)
export const SECTIONS = [
  { id: "realestate", name: "عقاري", tagline: "سوق العقارات المصري", color: "#0e8a6f", icon: "M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6", items: ["/realestate", "/realestate/chat", "/brand"] },
  { id: "seller", name: "تسويق محلات", tagline: "بيع وإعلان ودراسة جدوى", color: "#e8590c", icon: "M4 9.5l1.6-4.2A1.5 1.5 0 017 4.3h10a1.5 1.5 0 011.4 1l1.6 4.2M4 9.5a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0 2.7 2.7 0 005.3 0M5.5 12.5V19a1 1 0 001 1h11a1 1 0 001-1v-6.5M10 20v-4.5h4V20", items: ["/seller", "/feasibility", "/maker", "/prompts/studio", "/prompts", "/brand", "/resources"] },
  { id: "academic", name: "أكاديمي وطلبة", tagline: "بحث وتعلّم ومشاريع", color: "#7048e8", icon: "M3 9l9-4.5L21 9l-9 4.5zM7 11.5v4.2c0 1.2 2.2 2.8 5 2.8s5-1.6 5-2.8v-4.2", items: ["/research", "/projects", "/learn", "/flows", "/prompts/studio"] },
  { id: "aiwork", name: "شغل الذكاء الاصطناعي", tagline: "أدوات ودليل وأخبار", color: "#1f4dff", icon: "M14.5 6.5l3-3 3 3-3 3zM4 20l9-9M3.5 7.5h6M6.5 4.5v6M14 17.5h6M17 14.5v6", items: ["/tools", "/tasks", "/prompts/studio", "/maker", "/agents", "/library", "/global-tools", "/creators", "/news", "/subscriptions", "/my-tools"] },
  { id: "chat", name: "الشات العام", tagline: "أكتر من 40 نموذج", color: "#d6336c", icon: "M20.5 11.5a8.3 8.3 0 01-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1120.5 11.5z", items: ["/chat", "/models", "/compare", "/history"] },
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
