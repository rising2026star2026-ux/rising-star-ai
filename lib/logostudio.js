// محرك مولّد اللوجو: رموز مرسومة بالكود، ألوان، خطوط عربي، وتركيبات جاهزة.
// الملف ده نقي (من غير متصفح)، فبيشتغل على السيرفر والمتصفح ونقدر نختبره.
// كل رمز بيترسم جوه مربع 100×100.

// ───────────── الرموز ─────────────
const txt = (p, size = 56, y = 54) =>
  `<text x="50" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="${p.fam}" font-weight="700" font-size="${size}" fill="${p.on}">${esc(p.letter)}</text>`;

export const SYMBOLS = [
  {
    id: "circle-mono", name: "حرف في دائرة", tags: ["general", "business", "tech", "beauty"],
    draw: (p) => `<circle cx="50" cy="50" r="46" fill="${p.c1}"/><circle cx="50" cy="50" r="38" fill="none" stroke="${p.on}" stroke-opacity=".35" stroke-width="2.5"/><path d="M50 4A46 46 0 0 1 96 50" fill="none" stroke="${p.c3}" stroke-width="6" stroke-linecap="round"/>${txt(p)}`,
  },
  {
    id: "squircle-mono", name: "حرف في مربع", tags: ["tech", "general", "business", "shop"],
    draw: (p) => `<rect x="5" y="5" width="90" height="90" rx="28" fill="${p.c1}"/><circle cx="76" cy="25" r="7" fill="${p.c3}"/>${txt(p, 54, 56)}`,
  },
  {
    id: "hex-mono", name: "حرف في سداسي", tags: ["tech", "finance", "general", "auto"],
    draw: (p) => `<polygon points="50,9 86,30 86,70 50,91 14,70 14,30" fill="${p.c1}" stroke="${p.c1}" stroke-width="9" stroke-linejoin="round"/>${txt(p, 50)}<circle cx="50" cy="9" r="5" fill="${p.c3}"/>`,
  },
  {
    id: "shield-mono", name: "درع بحرف", tags: ["finance", "auto", "health", "business", "luxury"],
    draw: (p) => `<path d="M50 5L88 18V50C88 74 70 90 50 96C30 90 12 74 12 50V18Z" fill="${p.c1}"/><path d="M50 5L88 18V50C88 74 70 90 50 96Z" fill="${p.c2}" opacity=".25"/>${txt(p, 48, 52)}`,
  },
  {
    id: "spark", name: "نجمة لامعة", tags: ["tech", "beauty", "media", "general", "kids"],
    draw: (p) => `<path d="M46 8C50 36 62 46 90 50C62 54 50 64 46 92C42 64 30 54 2 50C30 46 42 36 46 8Z" fill="${p.c1}"/><path d="M80 6C81.5 16 86 20 96 21.5C86 23 81.5 27 80 37C78.5 27 74 23 64 21.5C74 20 78.5 16 80 6Z" fill="${p.c3}"/>`,
  },
  {
    id: "orbit", name: "مدار", tags: ["tech", "media", "general", "finance"],
    draw: (p) => `<circle cx="50" cy="50" r="34" fill="none" stroke="${p.c1}" stroke-width="10"/><circle cx="50" cy="50" r="13" fill="${p.c2}"/><circle cx="74.5" cy="25.5" r="10" fill="${p.c3}"/>`,
  },
  {
    id: "bars", name: "أعمدة نمو", tags: ["finance", "business", "edu", "tech", "realestate"],
    draw: (p) => `<rect x="9" y="58" width="22" height="38" rx="8" fill="${p.c2}"/><rect x="39" y="36" width="22" height="60" rx="8" fill="${p.c1}"/><rect x="69" y="10" width="22" height="86" rx="8" fill="${p.c3}"/>`,
  },
  {
    id: "peak", name: "جبال", tags: ["travel", "nature", "sports", "realestate", "auto"],
    draw: (p) => `<path d="M30 90L68 28L98 90Z" fill="${p.c2}"/><path d="M2 90L38 30L74 90Z" fill="${p.c1}"/><circle cx="84" cy="15" r="8" fill="${p.c3}"/>`,
  },
  {
    id: "leaf", name: "ورقتين", tags: ["nature", "health", "food", "beauty", "kids"],
    draw: (p) => `<path d="M48 92C18 88 8 60 12 18C42 20 60 46 48 92Z" fill="${p.c1}"/><path d="M52 92C82 88 92 60 88 18C58 20 40 46 52 92Z" fill="${p.c2}"/>`,
  },
  {
    id: "wave", name: "موجات", tags: ["travel", "media", "health", "beauty", "general"],
    draw: (p) => `<path d="M8 30q21-22 42 0t42 0" fill="none" stroke="${p.c1}" stroke-width="11" stroke-linecap="round"/><path d="M8 52q21-22 42 0t42 0" fill="none" stroke="${p.c2}" stroke-width="11" stroke-linecap="round"/><path d="M8 74q21-22 42 0t42 0" fill="none" stroke="${p.c3}" stroke-width="11" stroke-linecap="round"/>`,
  },
  {
    id: "bolt", name: "صاعقة", tags: ["tech", "auto", "sports"],
    draw: (p) => `<rect x="5" y="5" width="90" height="90" rx="28" fill="${p.c1}"/><polygon points="57,14 27,56 46,56 40,88 74,43 54,43" fill="${p.c3}" stroke="${p.c3}" stroke-width="4" stroke-linejoin="round"/>`,
  },
  {
    id: "gem", name: "جوهرة", tags: ["beauty", "fashion", "finance", "luxury"],
    draw: (p) => `<path d="M24 14H76L96 38H4Z" fill="${p.c2}"/><path d="M4 38H96L50 94Z" fill="${p.c1}"/><path d="M38 38L50 94L62 38M24 14L38 38M76 14L62 38" fill="none" stroke="${p.on}" stroke-opacity=".45" stroke-width="3" stroke-linejoin="round"/>`,
  },
  {
    id: "arrow-circle", name: "سهم نمو", tags: ["finance", "business", "tech", "auto", "edu"],
    draw: (p) => `<circle cx="50" cy="50" r="46" fill="${p.c1}"/><path d="M32 68L68 32M40 32H68V60" fill="none" stroke="${p.c3}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    id: "bag", name: "شنطة تسوق", tags: ["shop", "fashion", "food"],
    draw: (p) => `<path d="M34 42V30a16 16 0 0 1 32 0v12" fill="none" stroke="${p.c2}" stroke-width="9" stroke-linecap="round"/><rect x="12" y="36" width="76" height="58" rx="12" fill="${p.c1}"/><path d="M36 62q14 16 28 0" fill="none" stroke="${p.c3}" stroke-width="7" stroke-linecap="round"/>`,
  },
  {
    id: "chat", name: "فقاعة حوار", tags: ["tech", "edu", "business", "media"],
    draw: (p) => `<path d="M16 12H84A10 10 0 0 1 94 22V62A10 10 0 0 1 84 72H50L28 92V72H16A10 10 0 0 1 6 62V22A10 10 0 0 1 16 12Z" fill="${p.c1}"/><circle cx="29" cy="42" r="6.5" fill="${p.on}"/><circle cx="50" cy="42" r="6.5" fill="${p.c3}"/><circle cx="71" cy="42" r="6.5" fill="${p.on}"/>`,
  },
  {
    id: "grid4", name: "مربعات", tags: ["tech", "business", "general", "shop"],
    draw: (p) => `<rect x="6" y="6" width="40" height="40" rx="13" fill="${p.c1}"/><circle cx="73" cy="26" r="20" fill="${p.c2}"/><path d="M6 54H46V94H20A14 14 0 0 1 6 80Z" fill="${p.c3}"/><rect x="54" y="54" width="40" height="40" rx="13" fill="${p.c1}" opacity=".7"/>`,
  },
  {
    id: "rings", name: "حلقتين متصلتين", tags: ["general", "business", "finance", "edu"],
    draw: (p) => `<circle cx="36" cy="50" r="28" fill="none" stroke="${p.c1}" stroke-width="11"/><circle cx="64" cy="50" r="28" fill="none" stroke="${p.c2}" stroke-width="11" opacity=".9"/><circle cx="50" cy="50" r="6" fill="${p.c3}"/>`,
  },
  {
    id: "petals", name: "وردة", tags: ["beauty", "nature", "kids", "health", "fashion"],
    draw: (p) => `${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="50" cy="27" rx="12" ry="24" transform="rotate(${i * 60} 50 50)" fill="${i % 2 ? p.c2 : p.c1}" opacity=".92"/>`).join("")}<circle cx="50" cy="50" r="9" fill="${p.c3}"/>`,
  },
  {
    id: "cube", name: "مكعب", tags: ["tech", "shop", "realestate", "auto", "business"],
    draw: (p) => `<path d="M50 5L91 28L50 51L9 28Z" fill="${p.c3}"/><path d="M9 28L50 51V95L9 72Z" fill="${p.c1}"/><path d="M91 28L50 51V95L91 72Z" fill="${p.c2}"/>`,
  },
  {
    id: "drop", name: "قطرة", tags: ["health", "nature", "beauty", "auto", "food"],
    draw: (p) => `<path d="M50 5C50 5 17 44 17 65a33 33 0 0 0 66 0C83 44 50 5 50 5Z" fill="${p.c1}"/><path d="M33 66a17 17 0 0 0 17 17" fill="none" stroke="${p.c3}" stroke-width="7" stroke-linecap="round"/>`,
  },
  {
    id: "heart", name: "قلب", tags: ["health", "kids", "beauty", "general"],
    draw: (p) => `<path d="M50 92C8 62 4 34 23 19C36 9 48 17 50 28C52 17 64 9 77 19C96 34 92 62 50 92Z" fill="${p.c1}"/><circle cx="74" cy="30" r="7" fill="${p.c3}" opacity=".95"/>`,
  },
  {
    id: "book", name: "كتاب مفتوح", tags: ["edu", "media"],
    draw: (p) => `<path d="M48 26C36 14 18 14 5 20V80C18 74 36 74 48 84Z" fill="${p.c1}"/><path d="M52 26C64 14 82 14 95 20V80C82 74 64 74 52 84Z" fill="${p.c2}"/><circle cx="50" cy="10" r="6" fill="${p.c3}"/>`,
  },
  {
    id: "home", name: "بيت", tags: ["realestate", "general"],
    draw: (p) => `<path d="M6 50L50 10L94 50H82V92H18V50Z" fill="${p.c1}" stroke="${p.c1}" stroke-width="4" stroke-linejoin="round"/><rect x="41" y="62" width="18" height="30" rx="5" fill="${p.c3}"/><path d="M6 50L50 10L94 50" fill="none" stroke="${p.c2}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    id: "plate", name: "طبق", tags: ["food"],
    draw: (p) => `<circle cx="50" cy="60" r="34" fill="none" stroke="${p.c1}" stroke-width="9"/><circle cx="50" cy="60" r="19" fill="${p.c2}"/><path d="M36 18q-5-7 0-14M50 18q-5-7 0-14M64 18q-5-7 0-14" fill="none" stroke="${p.c3}" stroke-width="5" stroke-linecap="round"/>`,
  },
  {
    id: "cross", name: "صليب طبي", tags: ["health"],
    draw: (p) => `<path d="M36 6H64V36H94V64H64V94H36V64H6V36H36Z" fill="${p.c1}" stroke="${p.c1}" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="50" r="9" fill="${p.c3}"/>`,
  },
  {
    id: "crown", name: "تاج", tags: ["luxury", "fashion", "beauty", "general"],
    draw: (p) => `<path d="M8 76L14 28L36 52L50 20L64 52L86 28L92 76Z" fill="${p.c1}" stroke="${p.c1}" stroke-width="5" stroke-linejoin="round"/><rect x="8" y="80" width="84" height="12" rx="6" fill="${p.c2}"/><circle cx="14" cy="26" r="6" fill="${p.c3}"/><circle cx="50" cy="18" r="6" fill="${p.c3}"/><circle cx="86" cy="26" r="6" fill="${p.c3}"/>`,
  },
  {
    id: "camera", name: "كاميرا", tags: ["media", "travel"],
    draw: (p) => `<path d="M30 28L38 12H62L70 28Z" fill="${p.c2}"/><rect x="5" y="26" width="90" height="64" rx="15" fill="${p.c1}"/><circle cx="50" cy="58" r="21" fill="${p.on}"/><circle cx="50" cy="58" r="12" fill="${p.c3}"/><circle cx="81" cy="40" r="4" fill="${p.c3}"/>`,
  },
  {
    id: "rocket", name: "صاروخ", tags: ["tech", "business", "edu", "sports"],
    draw: (p) => `<path d="M50 5C71 20 79 46 70 72H30C21 46 29 20 50 5Z" fill="${p.c1}"/><circle cx="50" cy="40" r="10" fill="${p.on}"/><path d="M31 56L12 80L31 75Z" fill="${p.c2}"/><path d="M69 56L88 80L69 75Z" fill="${p.c2}"/><path d="M41 78H59L50 97Z" fill="${p.c3}"/>`,
  },
  {
    id: "pin", name: "دبوس موقع", tags: ["travel", "realestate", "auto", "food", "shop"],
    draw: (p) => `<path d="M50 96C50 96 18 62 18 40a32 32 0 0 1 64 0C82 62 50 96 50 96Z" fill="${p.c1}"/><circle cx="50" cy="40" r="13" fill="${p.c3}"/><ellipse cx="50" cy="96" rx="20" ry="3" fill="${p.c2}" opacity=".5"/>`,
  },
  {
    id: "tooth", name: "ضرس", tags: ["health"],
    draw: (p) => `<path d="M26 12C14 12 8 24 10 38C12 52 20 58 22 76C23 90 30 92 33 82C36 70 40 60 50 60S64 70 67 82C70 92 77 90 78 76C80 58 88 52 90 38C92 24 86 12 74 12C64 12 58 18 50 18S36 12 26 12Z" fill="${p.c1}"/><path d="M24 30Q28 24 36 24" fill="none" stroke="${p.c3}" stroke-width="5" stroke-linecap="round"/>`,
  },
  {
    id: "wheel", name: "عجلة سيارة", tags: ["auto", "sports"],
    draw: (p) => `<circle cx="50" cy="50" r="42" fill="none" stroke="${p.c1}" stroke-width="12"/><circle cx="50" cy="50" r="10" fill="${p.c3}"/>${[0, 72, 144, 216, 288].map((a) => `<rect x="46" y="14" width="8" height="26" rx="4" transform="rotate(${a} 50 50)" fill="${p.c2}"/>`).join("")}`,
  },
];

// ───────────── الألوان ─────────────
// c1 اللون الأساسي، c2 الثانوي، c3 لمسة، ink لون الاسم
export const PALETTES = [
  { id: "midnight-gold", name: "كحلي وذهبي", c1: "#14213d", c2: "#2c4a8a", c3: "#fca311", ink: "#14213d", moods: ["luxury", "dark", "finance", "classic"] },
  { id: "warm-gold", name: "ذهبي فاخر", c1: "#b8892b", c2: "#e3c16f", c3: "#3b2a0b", ink: "#3b2a0b", moods: ["luxury", "warm", "beauty"] },
  { id: "ocean", name: "أزرق المحيط", c1: "#0b6fb6", c2: "#35c4e0", c3: "#ffd166", ink: "#0b2e4a", moods: ["cool", "health", "travel", "edu"] },
  { id: "navy-sky", name: "كحلي وسماوي", c1: "#1e3a8a", c2: "#3b82f6", c3: "#22d3ee", ink: "#172554", moods: ["cool", "finance", "tech", "edu"] },
  { id: "royal-purple", name: "بنفسجي ملكي", c1: "#5b2a9d", c2: "#9b6bff", c3: "#ffc857", ink: "#2a1450", moods: ["luxury", "beauty", "tech", "edu"] },
  { id: "emerald", name: "زمردي", c1: "#0f7a5a", c2: "#4cc9a0", c3: "#f2c94c", ink: "#0a3d2e", moods: ["nature", "health", "finance", "cool"] },
  { id: "teal-coral", name: "تركواز ومرجاني", c1: "#0f766e", c2: "#14b8a6", c3: "#fb7185", ink: "#134e4a", moods: ["health", "beauty", "kids", "cool"] },
  { id: "sunset", name: "غروب دافئ", c1: "#e8502e", c2: "#ff9a3d", c3: "#ffd23f", ink: "#4a1c0f", moods: ["warm", "food", "kids", "bright"] },
  { id: "crimson", name: "أحمر قوي", c1: "#b3202a", c2: "#e85d5d", c3: "#ffb703", ink: "#4a0f13", moods: ["warm", "food", "sports", "auto", "bold"] },
  { id: "rose", name: "وردي أنيق", c1: "#d6336c", c2: "#ff8fab", c3: "#ffb703", ink: "#5a1534", moods: ["beauty", "fashion", "kids", "soft"] },
  { id: "coffee", name: "قهوة", c1: "#6f4e37", c2: "#c8a27a", c3: "#e9c46a", ink: "#3b2a1f", moods: ["earth", "food", "warm", "classic"] },
  { id: "olive-earth", name: "زيتي وترابي", c1: "#4d5d2a", c2: "#a3b18a", c3: "#d4a373", ink: "#2b3318", moods: ["earth", "nature", "food"] },
  { id: "neon", name: "تقني نيون", c1: "#111827", c2: "#6366f1", c3: "#22e6b8", ink: "#111827", moods: ["tech", "dark", "bold"] },
  { id: "charcoal", name: "فحمي وبرتقالي", c1: "#1f2937", c2: "#6b7280", c3: "#f59e0b", ink: "#111827", moods: ["dark", "auto", "bold", "business"] },
  { id: "sky-pastel", name: "باستيل سماوي", c1: "#4f8cff", c2: "#a8c7ff", c3: "#ff9bb3", ink: "#1f3a73", moods: ["soft", "kids", "bright", "edu"] },
  { id: "mono", name: "أبيض وأسود", c1: "#111111", c2: "#555555", c3: "#b3b3b3", ink: "#111111", moods: ["minimal", "dark", "classic"] },
];

// ───────────── الخطوط (من Fontsource على jsDelivr، ترخيص مفتوح) ─────────────
export const FONTS = [
  { id: "cairo", name: "القاهرة", slug: "cairo", weight: 700, family: "RS Cairo", styles: ["modern", "bold", "minimal"] },
  { id: "tajawal", name: "تجوّل", slug: "tajawal", weight: 800, family: "RS Tajawal", styles: ["modern", "minimal"] },
  { id: "almarai", name: "المراعي", slug: "almarai", weight: 800, family: "RS Almarai", styles: ["minimal", "modern"] },
  { id: "plex", name: "IBM Plex عربي", slug: "ibm-plex-sans-arabic", weight: 700, family: "RS Plex", styles: ["modern", "minimal"] },
  { id: "rubik", name: "روبيك", slug: "rubik", weight: 700, family: "RS Rubik", styles: ["modern", "bold", "playful"] },
  { id: "messiri", name: "المسيري", slug: "el-messiri", weight: 700, family: "RS Messiri", styles: ["classic", "luxury"] },
  { id: "reem", name: "ريم كوفي", slug: "reem-kufi", weight: 700, family: "RS Reem", styles: ["classic", "luxury", "bold"] },
  { id: "amiri", name: "أميري", slug: "amiri", weight: 700, family: "RS Amiri", styles: ["classic", "luxury"] },
  { id: "ruqaa", name: "عارف رقعة", slug: "aref-ruqaa", weight: 700, family: "RS Ruqaa", styles: ["classic", "luxury", "playful"] },
  { id: "lalezar", name: "لاليزار", slug: "lalezar", weight: 400, family: "RS Lalezar", styles: ["playful", "bold"] },
  { id: "changa", name: "شانجا", slug: "changa", weight: 700, family: "RS Changa", styles: ["bold", "playful"] },
];

export const STYLES = [
  { id: "modern", name: "عصري", fonts: ["cairo", "tajawal", "plex", "rubik"], palettes: ["navy-sky", "neon", "ocean", "royal-purple"] },
  { id: "classic", name: "كلاسيكي", fonts: ["messiri", "amiri", "reem", "ruqaa"], palettes: ["midnight-gold", "coffee", "crimson", "emerald"] },
  { id: "playful", name: "مرح", fonts: ["lalezar", "changa", "rubik", "cairo"], palettes: ["sunset", "sky-pastel", "teal-coral", "rose"] },
  { id: "luxury", name: "فاخر", fonts: ["messiri", "reem", "amiri"], palettes: ["midnight-gold", "warm-gold", "charcoal", "royal-purple"] },
  { id: "bold", name: "قوي", fonts: ["reem", "changa", "rubik", "cairo"], palettes: ["crimson", "charcoal", "neon", "sunset"] },
  { id: "minimal", name: "بسيط", fonts: ["almarai", "tajawal", "plex"], palettes: ["mono", "navy-sky", "charcoal", "emerald"] },
];

export const LAYOUTS = [["stacked", "رمز فوق الاسم"], ["horizontal", "رمز بجانب الاسم"], ["wordmark", "اسم فقط"], ["icon", "رمز فقط"]];

// ───────────── كشف المجال من الوصف ─────────────
const FIELD_WORDS = {
  food: ["مطعم", "كافيه", "قهوة", "كوفي", "حلويات", "طعام", "مخبز", "اكل", "أكل", "مأكولات", "بيتزا", "برجر", "عصير", "شيف", "restaurant", "cafe", "coffee", "food", "bakery", "pizza", "burger", "kitchen"],
  tech: ["تقنية", "برمجة", "تطبيق", "ذكاء", "برمجيات", "موقع", "ويب", "رقمي", "سوفت", "software", "app", "tech", "digital", "web", "ai", "saas", "dev", "code"],
  shop: ["متجر", "تجارة", "بيع", "شراء", "ستور", "أونلاين", "اونلاين", "store", "shop", "ecommerce", "market", "mart"],
  fashion: ["أزياء", "ازياء", "ملابس", "موضة", "بوتيك", "عباية", "عبايات", "اكسسوار", "إكسسوار", "حقائب", "fashion", "boutique", "wear", "style"],
  beauty: ["تجميل", "مكياج", "صالون", "عناية", "بشرة", "شعر", "عطور", "عطر", "حلاقة", "beauty", "salon", "spa", "makeup", "perfume"],
  health: ["صحة", "طب", "عيادة", "دكتور", "صيدلية", "علاج", "اسنان", "أسنان", "مستشفى", "تغذية", "health", "clinic", "medical", "dental", "pharmacy", "care"],
  edu: ["تعليم", "مدرسة", "أكاديمية", "اكاديمية", "كورس", "دورات", "تدريب", "تعلم", "مدرس", "مركز", "education", "academy", "school", "course", "training", "learn"],
  realestate: ["عقار", "عقارات", "مقاولات", "بناء", "تشطيب", "هندسة", "ديكور", "تطوير عقاري", "real estate", "construction", "property", "homes", "decor"],
  finance: ["محاسبة", "مالية", "استثمار", "بنك", "تمويل", "تأمين", "ضرائب", "finance", "invest", "accounting", "bank", "capital", "crypto", "fund"],
  kids: ["أطفال", "اطفال", "طفل", "حضانة", "ألعاب", "العاب", "kids", "toys", "baby", "nursery"],
  travel: ["سياحة", "سفر", "رحلات", "فندق", "طيران", "حج", "عمرة", "travel", "tours", "hotel", "trip", "flight"],
  media: ["تصوير", "إعلام", "اعلام", "فيديو", "استوديو", "ستوديو", "مونتاج", "بودكاست", "دعاية", "إعلان", "اعلان", "photo", "studio", "media", "production", "podcast", "agency", "marketing", "تسويق"],
  nature: ["زراعة", "نباتات", "عضوي", "طبيعة", "بيئة", "مزرعة", "organic", "farm", "green", "eco", "plant"],
  auto: ["سيارات", "سيارة", "قطع غيار", "شحن", "نقل", "توصيل", "لوجستيات", "ورشة", "car", "auto", "logistics", "delivery", "motor", "garage", "transport"],
  sports: ["رياضة", "جيم", "لياقة", "نادي", "كمال أجسام", "gym", "fitness", "sport", "training club"],
  business: ["استشارات", "محاماة", "شركة", "أعمال", "اعمال", "خدمات", "consulting", "law", "business", "solutions", "group", "services"],
  luxury: ["فاخر", "فخم", "راقي", "luxury", "premium", "vip", "royal"],
};

const stripAr = (w) => w.replace(/^(ال|وال|بال|لل|و|ل|ب)(?=.{3,})/, "");

/** كشف المجال بالكلمة الكاملة (مش جزء من كلمة): «تطبيقات» ما تتحسبش «طب» */
export function detectTags(text = "") {
  const low = String(text).toLowerCase();
  const tokens = low.split(/[^\u0600-\u06FFa-z0-9]+/).filter(Boolean).map(stripAr);
  const found = [];
  for (const [tag, words] of Object.entries(FIELD_WORDS)) {
    const hit = words.some((raw) => {
      const w = raw.toLowerCase();
      if (w.includes(" ")) return low.includes(w);
      const ww = stripAr(w);
      return tokens.some((tk) => tk === ww || (ww.length >= 4 && tk.startsWith(ww)) || (/^[a-z]+$/.test(ww) && ww.length >= 4 && tk.startsWith(ww)));
    });
    if (hit) found.push(tag);
  }
  return found;
}

// ───────────── أدوات صغيرة ─────────────
export function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const isArabic = (s = "") => /[؀-ۿ]/.test(s);
const isHex = (h) => /^#[0-9a-f]{6}$/i.test(h || "");

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

export function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

/** لون مقروء فوق لون تاني */
export const onColor = (hex) => (luminance(hex) > 0.5 ? "#111827" : "#ffffff");

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const getPalette = (id) => PALETTES.find((p) => p.id === id) || PALETTES[0];
export const getFont = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
export const getSymbol = (id) => SYMBOLS.find((s) => s.id === id) || SYMBOLS[0];

/** ألوان التصميم الفعلية (لو اتعدّلت يدوياً بتتغلّب على اللوحة الجاهزة) */
export function resolveColors(cfg) {
  const base = getPalette(cfg.palette);
  const c = cfg.custom || {};
  const pick = (k) => (isHex(c[k]) ? c[k] : base[k]);
  return { c1: pick("c1"), c2: pick("c2"), c3: pick("c3"), ink: isHex(c.ink) ? c.ink : base.ink };
}

/** ألوان تناسب خلفية غامقة: لو لون أساسي غامق بنفتحه عشان يبان */
export function adaptForDark(col) {
  const lift = (h) => (luminance(h) < 0.2 ? mix(h, "#ffffff", 0.62) : h);
  return { c1: lift(col.c1), c2: lift(col.c2), c3: col.c3, ink: "#ffffff" };
}

/** ألوان الرمز فوق خلفية بلون العلامة نفسه: رمز أبيض بتفاصيل بلون التمييز */
export function brandTileColors(col) {
  const accent = luminance(col.c3) > 0.78 ? mix(col.c3, col.c1, 0.5) : col.c3;
  return { c1: "#ffffff", c2: mix(col.c1, "#ffffff", 0.72), c3: accent, ink: "#ffffff", on: col.c1 };
}

// ───────────── قياس النص ─────────────
// القياس الحقيقي بيجي من المتصفح (canvas). ده تقدير للسيرفر والاختبار.
export function estimateWidth(text) {
  let w = 0;
  for (const ch of String(text)) {
    if (ch === " ") w += 0.28;
    else if (/[؀-ۿ]/.test(ch)) w += 0.5;
    else if (/[A-Z]/.test(ch)) w += 0.68;
    else if (/[0-9]/.test(ch)) w += 0.58;
    else w += 0.55;
  }
  return w;
}

// ───────────── بناء اللوجو ─────────────
const stack = (font) => `'${font.family}','Cairo','Tajawal',Tahoma,Arial,sans-serif`;

function symbolSvg(cfg, colors, fam) {
  const sym = getSymbol(cfg.symbol);
  const on = colors.on || onColor(colors.c1);
  const letter = (cfg.letter || (cfg.name || "").trim().replace(/^(ال)/, "").charAt(0) || "A").toUpperCase();
  return sym.draw({ c1: colors.c1, c2: colors.c2, c3: colors.c3, on, letter, fam });
}

/**
 * يبني اللوجو كامل. بيرجّع {inner, w, h} (داخل SVG) وممكن تغلّفه بـ wrapSvg.
 * opts: measure(text, font) = العرض بوحدة em، dark = خلفية غامقة، colors = ألوان جاهزة تتغلب (ممكن فيها on)، layout = تركيب تاني
 */
export function buildLogo(cfg, opts = {}) {
  const font = getFont(cfg.font);
  const measure = opts.measure || ((t) => estimateWidth(t));
  const layout = opts.layout || cfg.layout || "stacked";
  let colors = opts.colors || resolveColors(cfg);
  if (opts.dark && !opts.colors) colors = adaptForDark(colors);
  const fam = stack(font);
  const name = (cfg.name || "").trim() || "اسم علامتك";
  const latin = cfg.showLatin ? (cfg.latin || "").trim() : "";
  const sub = (cfg.sub || "").trim();
  const sizeK = clampN(cfg.nameScale ?? 1, 0.6, 1.5);
  const iconK = clampN(cfg.iconScale ?? 1, 0.5, 1.6);
  const gapK = clampN(cfg.gap ?? 1, 0.4, 2);
  const pad = 36;
  const rtl = isArabic(name);

  const mName = measure(name, font) || 1;
  const text = (t, x, y, size, o = {}) => {
    const ar = isArabic(t);
    const spacing = !ar && o.spacing ? ` letter-spacing="${o.spacing}"` : "";
    return `<text x="${r1(x)}" y="${r1(y)}" text-anchor="middle" direction="${ar ? "rtl" : "ltr"}" font-family="${fam}" font-weight="${o.weight || font.weight}" font-size="${r1(size)}" fill="${o.fill || colors.ink}"${o.opacity ? ` fill-opacity="${o.opacity}"` : ""}${spacing}>${esc(t)}</text>`;
  };

  const icon = (S, x, y) => {
    return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r2(S / 100)})">${symbolSvg(cfg, colors, fam)}</g>`;
  };

  // السطور الصغيرة (الاسم اللاتيني ثم الشعار)
  const mkSmall = (fs) => {
    const lines = [];
    if (latin) {
      const t = isArabic(latin) ? latin : latin.toUpperCase();
      const w = (measure(t, font) || 1) * fs * 0.74 + (isArabic(t) ? 0 : t.length * fs * 0.1);
      lines.push({ t, fs: fs * 0.74, w, o: { spacing: r1(fs * 0.1), weight: 600, opacity: 0.9 }, lh: fs * 1.15 });
    }
    if (sub) {
      const f2 = fs * 0.6;
      const w = (measure(sub, font) || 1) * f2;
      lines.push({ t: sub, fs: f2, w, o: { weight: 500, opacity: 0.75 }, lh: fs * 0.95 });
    }
    return lines;
  };

  if (layout === "icon") {
    const S = 200;
    const W = S + pad * 2;
    return { inner: icon(S, pad, pad), w: W, h: W };
  }

  if (layout === "wordmark") {
    const fs = clampN(Math.min(96, 460 / mName), 30, 96) * sizeK;
    const nameW = mName * fs;
    const small = mkSmall(fs * 0.5);
    const contentW = Math.max(nameW, ...small.map((l) => l.w));
    const W = contentW + pad * 2;
    let y = pad + fs * 0.92;
    const parts = [text(name, W / 2, y, fs)];
    y += fs * 0.34;
    const barW = Math.max(40, nameW * 0.22);
    parts.push(`<rect x="${r1(W / 2 - barW / 2)}" y="${r1(y)}" width="${r1(barW)}" height="${r1(Math.max(5, fs * 0.07))}" rx="3" fill="${colors.c3}"/>`);
    y += fs * 0.07 + fs * 0.16;
    for (const l of small) {
      y += l.fs * 0.85;
      parts.push(text(l.t, W / 2, y, l.fs, l.o));
      y += l.lh - l.fs * 0.85 + l.fs * 0.12;
    }
    return { inner: parts.join(""), w: W, h: y + pad * 0.6 };
  }

  if (layout === "horizontal") {
    const fs = clampN(Math.min(84, 330 / mName), 30, 84) * sizeK;
    const small = mkSmall(fs * 0.5);
    const nameW = mName * fs;
    const textW = Math.max(nameW, ...small.map((l) => l.w));
    let blockH = fs * 1.12;
    for (const l of small) blockH += l.lh;
    const S = Math.max(100, blockH * 1.15) * iconK;
    const gap = S * 0.22 * gapK;
    const H = Math.max(S, blockH) + pad * 2;
    const W = S + gap + textW + pad * 2;
    const iconX = rtl ? W - pad - S : pad;
    const textEdgeX = rtl ? iconX - gap : iconX + S + gap; // الحافة اللي النص بيلتصق بيها
    const centerOf = (w) => (rtl ? textEdgeX - w / 2 : textEdgeX + w / 2);
    let y = (H - blockH) / 2 + fs * 0.9;
    const parts = [icon(S, iconX, (H - S) / 2), text(name, centerOf(nameW), y, fs)];
    y += fs * 0.32;
    for (const l of small) {
      y += l.fs * 0.85;
      parts.push(text(l.t, centerOf(l.w), y, l.fs, l.o));
      y += l.lh - l.fs * 0.85;
    }
    return { inner: parts.join(""), w: W, h: H };
  }

  // stacked
  const S = 150 * iconK;
  const fs = clampN(Math.min(88, 420 / mName), 30, 88) * sizeK;
  const nameW = mName * fs;
  const small = mkSmall(fs * 0.5);
  const contentW = Math.max(S, nameW, ...small.map((l) => l.w));
  const W = contentW + pad * 2;
  const gap = S * 0.14 * gapK;
  const parts = [icon(S, (W - S) / 2, pad)];
  let y = pad + S + gap + fs * 0.9;
  parts.push(text(name, W / 2, y, fs));
  y += fs * 0.3;
  for (const l of small) {
    y += l.fs * 0.9;
    parts.push(text(l.t, W / 2, y, l.fs, l.o));
    y += l.lh - l.fs * 0.9 + l.fs * 0.1;
  }
  return { inner: parts.join(""), w: W, h: y + pad * 0.8 };
}

const clampN = (v, a, b) => Math.min(b, Math.max(a, Number(v) || a));
const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;

/** يغلّف اللوجو في ملف SVG كامل. fontCss = تعريفات @font-face مضمّنة (للتصدير) */
export function wrapSvg({ inner, w, h }, { bg = null, fontCss = "", size = null, radius = 0 } = {}) {
  const W = Math.round(w), H = Math.round(h);
  const dim = size ? ` width="${size[0]}" height="${size[1]}"` : ` width="${W}" height="${H}"`;
  const back = bg ? `<rect width="${W}" height="${H}" fill="${bg}"${radius ? ` rx="${radius}"` : ""}/>` : "";
  const defs = fontCss ? `<defs><style>${fontCss}</style></defs>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"${dim}>${defs}${back}${inner}</svg>`;
}

/** رمز لوحده جوه مربع (أيقونة تطبيق، صورة بروفايل). tile: light | brand | dark */
export function buildIconTile(cfg, { tile = "light", shape = "squircle", measure } = {}) {
  const col = resolveColors(cfg);
  const S = 512;
  let bg, colors;
  if (tile === "brand") { bg = col.c1; colors = brandTileColors(col); }
  else if (tile === "dark") { bg = "#0f172a"; colors = adaptForDark(col); }
  else { bg = "#ffffff"; colors = col; }
  const f = buildLogo({ ...cfg, layout: "icon" }, { measure, colors });
  const k = (S * 0.64) / 200;
  const off = (S - 200 * k) / 2 - 36 * k; // الرمز 200 جوه هوامش 36
  const shapeEl = shape === "circle" ? `<circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="${bg}"/>` : `<rect width="${S}" height="${S}" rx="${Math.round(S * 0.22)}" fill="${bg}"/>`;
  const inner = `${shapeEl}<g transform="translate(${r1(off)} ${r1(off)}) scale(${r2(k)})">${f.inner}</g>`;
  return { inner, w: S, h: S };
}

// ───────────── توليد المقترحات ─────────────
const LAYOUT_ROTATION = ["stacked", "horizontal", "stacked", "horizontal", "stacked", "horizontal", "wordmark", "stacked"];

function scoreSymbol(sym, tags, rand) {
  let sc = 0;
  for (const t of sym.tags) if (tags.includes(t)) sc += 4 / Math.sqrt(sym.tags.length) + 1;
  if (sym.tags.includes("general")) sc += 0.8;
  return sc + rand() * 1.4;
}

function paletteScore(p, tags, mood, rand) {
  let sc = 0;
  for (const m of p.moods) {
    if (tags.includes(m)) sc += 2.5;
    if (mood && m === mood) sc += 3;
  }
  return sc + rand() * 1.5;
}

/**
 * يولّد حتى n تصميم مقترح من اسم العلامة ووصف النشاط.
 * hints (اختياري، من الذكاء الاصطناعي): { tags, concepts: [{symbol,palette,font,layout,idea}] }
 */
export function generateConcepts({ name = "", latin = "", sub = "", desc = "", style = "modern", mood = "", seed = 0, n = 8, hints = null }) {
  const cleanName = String(name).trim();
  const tags = [...new Set([...detectTags(`${desc} ${cleanName}`), ...((hints && hints.tags) || [])])];
  if (style === "luxury") tags.push("luxury");
  const rand = rng(hashStr(`${cleanName}|${desc}|${style}|${seed}`));
  const st = STYLES.find((s) => s.id === style) || STYLES[0];
  const showLatin = !!(latin && isArabic(cleanName));
  const base = { name: cleanName, latin, sub, showLatin, iconScale: 1, gap: 1, nameScale: 1, custom: null };

  const out = [];
  const used = new Set();
  const push = (c) => {
    if (!SYMBOLS.some((s) => s.id === c.symbol) || !PALETTES.some((p) => p.id === c.palette) || !FONTS.some((f) => f.id === c.font)) return;
    const key = `${c.symbol}|${c.palette}`;
    if (used.has(key) || used.size >= n) return;
    used.add(key);
    out.push({ ...base, layout: LAYOUTS.some((l) => l[0] === c.layout) ? c.layout : "stacked", ...c });
  };

  // اقتراحات الذكاء الاصطناعي أولاً (لو وصلت)
  for (const h of (hints && hints.concepts) || []) {
    const font = FONTS.some((f) => f.id === h.font) ? h.font : st.fonts[0];
    push({ symbol: h.symbol, palette: h.palette, font, layout: h.layout, idea: h.idea || "", ai: true });
  }

  const symbols = SYMBOLS.map((s) => ({ s, sc: scoreSymbol(s, tags, rand) })).sort((a, b) => b.sc - a.sc).map((x) => x.s);
  const palettes = PALETTES.map((p) => ({ p, sc: paletteScore(p, [...tags, ...(st.palettes.includes(p.id) ? [p.id] : [])], mood, rand) + (st.palettes.includes(p.id) ? 2 : 0) }))
    .sort((a, b) => b.sc - a.sc).map((x) => x.p);

  let i = 0;
  const usedSym = new Set(out.map((c) => c.symbol));
  while (out.length < n && i < 200) {
    const sym = symbols.find((s) => !usedSym.has(s.id)) || symbols[i % symbols.length];
    usedSym.add(sym.id);
    const pal = palettes[(i * 3 + Math.floor(rand() * 3)) % palettes.length];
    const font = st.fonts[(i + Math.floor(rand() * st.fonts.length)) % st.fonts.length];
    push({ symbol: sym.id, palette: pal.id, font, layout: LAYOUT_ROTATION[out.length % LAYOUT_ROTATION.length] });
    i++;
  }
  // تنويع التركيب (بعض اللي جاي من الذكاء الاصطناعي ممكن يبقى كله stacked)
  out.forEach((c, k) => { if (!c.layout) c.layout = LAYOUT_ROTATION[k % LAYOUT_ROTATION.length]; });
  return out.slice(0, n);
}

/** يتأكد من رد الذكاء الاصطناعي ويرجّع بس المعرّفات الصحيحة */
export function cleanAiHints(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  const tagSet = new Set(Object.keys(FIELD_WORDS));
  const str = (v, max) => (typeof v === "string" ? v.replace(/[<>"]/g, "").trim().slice(0, max) : "");
  const concepts = (Array.isArray(o.concepts) ? o.concepts : [])
    .map((c) => ({
      symbol: SYMBOLS.some((s) => s.id === c?.symbol) ? c.symbol : null,
      palette: PALETTES.some((p) => p.id === c?.palette) ? c.palette : null,
      font: FONTS.some((f) => f.id === c?.font) ? c.font : null,
      layout: ["stacked", "horizontal", "wordmark"].includes(c?.layout) ? c.layout : "stacked",
      idea: str(c?.idea, 90),
    }))
    .filter((c) => c.symbol && c.palette)
    .slice(0, 6);
  return {
    tags: (Array.isArray(o.tags) ? o.tags : []).filter((t) => tagSet.has(t)).slice(0, 4),
    latin: str(o.latin, 40),
    taglines: (Array.isArray(o.taglines) ? o.taglines : []).map((t) => str(t, 40)).filter(Boolean).slice(0, 4),
    concepts,
  };
}

// ───────────── معاينات إضافية (موك أب) ─────────────
/** كارت شخصي: وجه أبيض بلوجو كامل ووجه بلون العلامة بالرمز */
export function buildCardMockup(cfg, { measure, fontCss = "" } = {}) {
  const col = resolveColors(cfg);
  const front = buildLogo({ ...cfg, layout: cfg.layout === "wordmark" ? "wordmark" : "stacked", sub: cfg.sub }, { measure });
  const k = Math.min(420 / front.w, 380 / front.h);
  const fx = 340 - (front.w * k) / 2, fy = 300 - (front.h * k) / 2;
  const frontCard = `<rect width="680" height="600" fill="#ffffff"/><g transform="translate(${r1(fx)} ${r1(fy)}) scale(${r2(k)})">${front.inner}</g>`;
  const back = buildLogo({ ...cfg, layout: "icon" }, { measure, colors: brandTileColors(col) });
  const k2 = 230 / back.w;
  const backCard = `<rect x="680" width="370" height="600" fill="${col.c1}"/><g transform="translate(${r1(865 - (back.w * k2) / 2)} ${r1(300 - (back.h * k2) / 2)}) scale(${r2(k2)})">${back.inner}</g>`;
  return { inner: frontCard + backCard, w: 1050, h: 600 };
}

export const SYMBOL_IDS = SYMBOLS.map((s) => s.id);
export const PALETTE_IDS = PALETTES.map((p) => p.id);
export const FONT_IDS = FONTS.map((f) => f.id);
export const TAG_IDS = Object.keys(FIELD_WORDS);

// ───────────── الخطوط: روابط التحميل ─────────────
export const FONT_RANGES = {
  arabic: "U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF,U+200C-200E,U+2010-2011,U+204F,U+2E41",
  latin: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
};
export function fontUrls(font, subset) {
  const file = `${subset}-${font.weight}-normal.woff2`;
  return [
    `https://cdn.jsdelivr.net/fontsource/fonts/${font.slug}@latest/${file}`,
    `https://cdn.jsdelivr.net/npm/@fontsource/${font.slug}/files/${font.slug}-${file}`,
  ];
}
