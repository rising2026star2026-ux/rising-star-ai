// بيانات الاشتراكات: أسعار خطط أشهر أدوات الذكاء الاصطناعي.
// الأسعار بالدولار شهرياً كما هي منشورة في أكتوبر 2026 (مصادر منشورة، مش من صفحات الشركات نفسها).
// لتحديث الأسعار: عدّل الرقم هنا وزوّد DATA_VERSION، وبعدها أي مستخدم متابع للأداة هيتنبه لتغيّر السعر.
// الجنيه المصري تقريبي، ومش بيشمل رسوم البنك والضرائب.

export const USD_EGP = 54.5;
export const PRICES_UPDATED = "2026-10-26";
export const PRICES_UPDATED_AR = "26 أكتوبر 2026";
export const DATA_VERSION = 1;

/** احتياجات المستخدم: المفتاح، الاسم، وصف قصير */
export const NEEDS = [
  { id: "chat", name: "كتابة ومحادثة", desc: "ردود وكتابة ومساعدة يومية" },
  { id: "research", name: "بحث ومذاكرة", desc: "بحث بالمصادر وشرح ومذاكرة" },
  { id: "image", name: "صور", desc: "توليد وتعديل الصور" },
  { id: "video", name: "فيديو", desc: "فيديو من نص أو صورة" },
  { id: "voice", name: "صوت وتعليق", desc: "تعليق صوتي وتحويل نص لكلام" },
  { id: "music", name: "موسيقى وأغاني", desc: "أغاني كاملة من وصف" },
  { id: "code", name: "برمجة", desc: "كتابة وتعديل الكود" },
  { id: "design", name: "تصميم", desc: "بوسترات وسوشيال ميديا" },
];

/** مستويات الاستخدام: 1 تجربة وخفيف، 2 منتظم، 3 كثيف واحترافي */
export const LEVELS = [
  { id: 1, name: "خفيف", desc: "كام مرة في الأسبوع" },
  { id: 2, name: "منتظم", desc: "كل يوم تقريباً" },
  { id: 3, name: "كثيف", desc: "شغل يومي طويل أو احترافي" },
];

// plans: usd = السعر الشهري، usdYear = السعر الشهري لو الدفع سنوي (لو معروف)، covers = {الاحتياج: أعلى مستوى بيغطيه}
const P = (name, usd, covers, extra = {}) => ({ name, usd, covers, ...extra });

export const SUB_TOOLS = [
  {
    id: "chatgpt", name: "ChatGPT", maker: "OpenAI", logo: "/logos/openai.webp", url: "https://chatgpt.com/pricing",
    sources: [{ t: "AI Toolbox: ChatGPT pricing (5 أكتوبر 2026)", u: "https://www.ai-toolbox.co/chatgpt-models/chatgpt-pricing" }],
    plans: [
      P("Free", 0, { chat: 1, research: 1, image: 1, code: 1 }, { note: "حدود يومية على الصور والبحث العميق" }),
      P("Go", 8, { chat: 2, research: 1, image: 1 }, { note: "سعره بيختلف حسب الدولة، وده السعر المنشور عالمياً. ثبّت سعر مصر من التطبيق" }),
      P("Plus", 20, { chat: 2, research: 2, image: 2, code: 2 }, { note: "أشهر خطة. صور وبحث عميق وبرمجة" }),
      P("Pro 100", 100, { chat: 3, research: 3, image: 3, code: 3 }, { note: "استخدام أعلى بكتير، للشغل الاحترافي" }),
      P("Pro 200", 200, { chat: 3, research: 3, image: 3, code: 3 }, { note: "ضعف حدود Pro 100" }),
    ],
  },
  {
    id: "claude", name: "Claude", maker: "Anthropic", logo: "/logos/claude.webp", url: "https://claude.com/pricing",
    sources: [{ t: "AI Toolbox: Claude pricing (12 أكتوبر 2026)", u: "https://www.ai-toolbox.co/claude-models/claude-pricing-plans-2026" }],
    plans: [
      P("Free", 0, { chat: 1, research: 1, code: 1 }, { note: "حدود يومية" }),
      P("Pro", 20, { chat: 2, research: 2, code: 2 }, { usdYear: 17, note: "كتابة وتحليل وبرمجة" }),
      P("Max", 100, { chat: 3, research: 3, code: 3 }, { note: "استخدام أعلى من Pro بمرات (السعر ابتداءً من 100 دولار)" }),
    ],
  },
  {
    id: "gemini", name: "Google AI (Gemini)", maker: "Google", logo: "/logos/gemini.webp", url: "https://one.google.com/about/google-ai-plans/",
    sources: [{ t: "The Decoder: خطط Google AI الجديدة (19 مايو 2026)", u: "https://the-decoder.com/google-overhauls-its-ai-subscriptions-at-i-o-2026-with-three-tiers-starting-at-10-a-month/" }],
    plans: [
      P("Free", 0, { chat: 1, research: 1, image: 1 }, { note: "حدود يومية" }),
      P("AI Plus", 7.99, { chat: 2, research: 1, image: 1 }, { note: "200 جيجا تخزين وحدود مضاعفة" }),
      P("AI Pro", 19.99, { chat: 2, research: 2, image: 2, video: 1 }, { note: "5 تيرا تخزين، وفيديو بـ Gemini Omni، ومعاها يوتيوب بريميوم لايت" }),
      P("AI Ultra", 99.99, { chat: 3, research: 3, image: 3, video: 3 }, { note: "ابتداءً من 99.99 دولار. استخدام أعلى 20 ضعف" }),
    ],
  },
  {
    id: "perplexity", name: "Perplexity", maker: "Perplexity", logo: "/logos/perplexity.webp", url: "https://www.perplexity.ai/pro",
    sources: [{ t: "Krater: Perplexity pricing (27 سبتمبر 2026)", u: "https://krater.ai/blog/perplexity-pricing" }],
    plans: [
      P("Free", 0, { research: 1, chat: 1 }, { note: "بحث بالمصادر بحد أسبوعي" }),
      P("Pro", 20, { research: 3, chat: 2 }, { usdYear: 17, note: "بحث عميق وكل الموديلات الكبيرة" }),
      P("Max", 200, { research: 3, chat: 3, video: 2 }, { note: "أعلى استخدام وكريدت شهري كبير" }),
    ],
  },
  {
    id: "grok", name: "Grok", maker: "xAI", logo: "/logos/grok.webp", url: "https://grok.com",
    sources: [{ t: "AI Toolbox: Grok pricing (25 أكتوبر 2026)", u: "https://ai-toolbox.co/grok-models/grok-pricing-plans-api-2026" }],
    plans: [
      P("Free", 0, { chat: 1, image: 1 }, { note: "استخدام محدود" }),
      P("Plus", 8, { chat: 2, image: 1 }, { note: "اشتراك X: استخدام أساسي" }),
      P("Premium", 30, { chat: 2, image: 2, video: 2 }, { note: "4 أضعاف Plus، وتوليد فيديو" }),
      P("Super", 100, { chat: 3, image: 3, video: 3 }, { note: "فيديو 1080p وأولوية وقت الزحمة" }),
    ],
  },
  {
    id: "midjourney", name: "Midjourney", maker: "Midjourney", logo: "/logos/midjourney.webp", url: "https://www.midjourney.com",
    sources: [{ t: "Krater: Midjourney pricing (27 سبتمبر 2026)", u: "https://krater.ai/blog/midjourney-pricing" }],
    plans: [
      P("Basic", 10, { image: 2 }, { usdYear: 8, note: "200 دقيقة سريعة في الشهر، من غير وضع Relax" }),
      P("Standard", 30, { image: 3, video: 1 }, { usdYear: 24, note: "15 ساعة سريعة وصور غير محدودة في Relax" }),
      P("Pro", 60, { image: 3, video: 2 }, { usdYear: 48, note: "30 ساعة سريعة وفيديو SD غير محدود في Relax" }),
      P("Mega", 120, { image: 3, video: 3 }, { usdYear: 96, note: "60 ساعة سريعة" }),
    ],
  },
  {
    id: "runway", name: "Runway", maker: "Runway", logo: "/logos/runway.webp", url: "https://runwayml.com/pricing",
    sources: [{ t: "Creatify: Runway pricing 2026", u: "https://creatify.ai/blog/runway-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay" }],
    plans: [
      P("Free", 0, { video: 1 }, { note: "125 كريدت مرة واحدة بس" }),
      P("Standard", 15, { video: 2 }, { note: "السعر لو الدفع سنوي. رصيد الكريدت لازم تتأكد منه من الموقع" }),
      P("Pro", 35, { video: 3 }, { note: "رصيد أكبر. تأكد من الكريدت من الموقع" }),
    ],
  },
  {
    id: "elevenlabs", name: "ElevenLabs", maker: "ElevenLabs", logo: "/logos/elevenlabs.webp", url: "https://elevenlabs.io/pricing",
    sources: [{ t: "Smallest.ai: ElevenLabs pricing (5 أكتوبر 2026)", u: "https://smallest.ai/blog/elevenlabs-pricing-plans-cost-what-you-get-in-2026" }],
    plans: [
      P("Free", 0, { voice: 1 }, { note: "10 آلاف كريدت، ومن غير ترخيص تجاري" }),
      P("Starter", 6, { voice: 1 }, { note: "30 ألف كريدت مع ترخيص تجاري" }),
      P("Creator", 22, { voice: 2 }, { note: "121 ألف كريدت" }),
      P("Pro", 99, { voice: 3 }, { note: "600 ألف كريدت" }),
    ],
  },
  {
    id: "suno", name: "Suno", maker: "Suno", logo: "/logos/suno.webp", url: "https://suno.com",
    sources: [{ t: "Krater: Suno pricing (أكتوبر 2026)", u: "https://krater.ai/pricing/suno" }],
    plans: [
      P("Free", 0, { music: 1 }, { note: "50 كريدت يومياً (حوالي 10 أغاني) ومن غير استخدام تجاري" }),
      P("Pro", 10, { music: 2 }, { usdYear: 8, note: "2,500 كريدت في الشهر مع استخدام تجاري" }),
      P("Premier", 30, { music: 3 }, { usdYear: 24, note: "10,000 كريدت في الشهر" }),
    ],
  },
  {
    id: "cursor", name: "Cursor", maker: "Anysphere", logo: "/logos/cursor.webp", url: "https://cursor.com/pricing",
    sources: [{ t: "Krater: Cursor pricing (3 أكتوبر 2026)", u: "https://krater.ai/blog/cursor-pricing" }],
    plans: [
      P("Hobby", 0, { code: 1 }, { note: "مجاني ومحدود" }),
      P("Pro", 20, { code: 2 }, { note: "حوالي 20 دولار استخدام موديلات خارجية" }),
      P("Pro+", 60, { code: 3 }, { note: "حوالي 70 دولار استخدام" }),
      P("Ultra", 200, { code: 3 }, { note: "حوالي 400 دولار استخدام" }),
    ],
  },
  {
    id: "canva", name: "Canva", maker: "Canva", logo: null, tint: "#00a3ad", mono: "Ca", url: "https://www.canva.com/pricing",
    sources: [{ t: "Piktochart: Canva pricing (25 أغسطس 2026)", u: "https://piktochart.com/blog/canva-pricing-2026-costs-raised/" }],
    plans: [
      P("Free", 0, { design: 2 }, { note: "قوالب كتير ومجانية" }),
      P("Pro", 18, { design: 3, image: 1 }, { usdYear: 15, note: "قوالب وأدوات بريميوم وأدوات ذكاء اصطناعي" }),
    ],
  },
];

/** سجل تغيّرات الأسعار الموثّقة (الأحدث أولاً) */
export const PRICE_CHANGES = [
  { date: "2026-10-25", tool: "Grok", text: "xAI دمجت SuperGrok في اشتراكات X: Plus بـ 8 دولار، Premium بـ 30، Super بـ 100، Ultra بـ 200. الخطط القديمة مقفولة قدام العملاء الجداد.", href: "https://ai-toolbox.co/grok-models/grok-pricing-plans-api-2026" },
  { date: "2026-10-05", tool: "ChatGPT", text: "خطة Pro بقت 3 مستويات: 100 و200 و500 دولار، وفي خطة Go رخيصة سعرها بيختلف حسب الدولة.", href: "https://www.ai-toolbox.co/chatgpt-models/chatgpt-pricing" },
  { date: "2026-05-19", tool: "Google AI", text: "جوجل أعادت تنظيم الخطط: AI Plus بـ 7.99، وAI Pro بـ 19.99، وAI Ultra ابتداءً من 99.99 دولار (كانت الخطة العليا 250 وبقت 200).", href: "https://the-decoder.com/google-overhauls-its-ai-subscriptions-at-i-o-2026-with-three-tiers-starting-at-10-a-month/" },
];

export const toEgp = (usd) => Math.round(usd * USD_EGP);
export const fmtEgp = (usd) => (usd === 0 ? "مجاني" : `${toEgp(usd).toLocaleString("en-US")} ج`);
export const fmtUsd = (usd) => (usd === 0 ? "0" : `$${Number.isInteger(usd) ? usd : usd.toFixed(2)}`);

/** كل الخيارات في قايمة واحدة للحاسبة: {tool, plan, usd, covers} */
export const ALL_OPTIONS = SUB_TOOLS.flatMap((t) => t.plans.map((p) => ({ toolId: t.id, tool: t.name, logo: t.logo, plan: p.name, usd: p.usd, covers: p.covers })));

/** صورة الأسعار الحالية للمتابعة: {toolId: {planName: usd}} */
export function priceSnapshot() {
  const o = {};
  for (const t of SUB_TOOLS) { o[t.id] = {}; for (const p of t.plans) o[t.id][p.name] = p.usd; }
  return o;
}

/** أقل تكلفة لمجموعة اشتراكات تغطي الاحتياجات بالمستوى المطلوب (حل exact بالـ DP على الأقنعة) */
export function cheapestBundle(needIds, level) {
  const idx = needIds.map((n) => n);
  const full = (1 << idx.length) - 1;
  if (!full) return { picks: [], total: 0, uncovered: [] };
  const maskOf = (o) => idx.reduce((m, n, i) => (o.covers[n] >= level ? m | (1 << i) : m), 0);
  const opts = ALL_OPTIONS.map((o) => ({ o, m: maskOf(o) })).filter((x) => x.m);
  const INF = Infinity;
  const best = Array(full + 1).fill(INF);
  const from = Array(full + 1).fill(null);
  best[0] = 0;
  // مرور على كل الأقنعة مرتين كفاية لأن التكلفة موجبة، ونمنع اختيار أكتر من خطة من نفس الأداة
  for (let m = 0; m <= full; m++) {
    if (best[m] === INF) continue;
    for (const x of opts) {
      const nm = m | x.m;
      if (nm === m) continue;
      let used = false;
      for (let cur = from[m]; cur; cur = cur.prev) if (cur.opt.toolId === x.o.toolId) { used = true; break; }
      if (used) continue;
      const c = best[m] + x.o.usd;
      if (c < best[nm]) { best[nm] = c; from[nm] = { opt: x.o, prev: from[m] }; }
    }
  }
  const picks = [];
  if (best[full] === INF) {
    // مفيش خطة بتغطي كل الاحتياجات بالمستوى ده: نرجّع أحسن تغطية جزئية
    let bm = 0, bc = INF;
    for (let m = 0; m <= full; m++) {
      if (best[m] === INF) continue;
      const pc = popcount(m);
      if (pc > popcount(bm) || (pc === popcount(bm) && best[m] < bc)) { bm = m; bc = best[m]; }
    }
    for (let cur = from[bm]; cur; cur = cur.prev) picks.push(cur.opt);
    const uncovered = idx.filter((_, i) => !(bm & (1 << i)));
    return { picks: picks.reverse(), total: bc === INF ? 0 : bc, uncovered };
  }
  for (let cur = from[full]; cur; cur = cur.prev) picks.push(cur.opt);
  return { picks: picks.reverse(), total: best[full], uncovered: [] };
}

function popcount(n) { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; }

/** أرخص 3 خيارات لاحتياج واحد بمستوى معين (للبدائل) */
export function alternativesFor(need, level, limit = 3) {
  return ALL_OPTIONS.filter((o) => o.covers[need] >= level).sort((a, b) => a.usd - b.usd).slice(0, limit);
}
