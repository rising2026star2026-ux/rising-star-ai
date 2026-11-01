// منطق أدوات أمازون اللي بيستخدم الموديل: البرومبتات + تنظيف المخرجات + التحقق منها بالكود.
// الملف ده من غير أي اتصال بالشبكة: الموديل بيتبعت له كدالة `ask` من الـ API route، فنقدر نختبره بموديل وهمي.
// القاعدة: الموديل بيقترح، والكود بيراجع. أي رقم جديد أو اقتباس مش موجود في نص التاجر بيتشال أو بيتعلّم.
import { checkListing, trimToBytes, newNumbers, normAr, MARKETS, LIMITS, FIELD_LABEL } from "./amazon.js";

const clean = (v, max = 400) => String(v ?? "").replace(/[ \t]+\n/g, "\n").trim().slice(0, max);
const arr = (v, max, fn) => (Array.isArray(v) ? v.map(fn).filter(Boolean).slice(0, max) : []);

const marketLine = (m) => `${MARKETS[m]?.label || MARKETS.eg.label} (${MARKETS[m]?.domain || "amazon.eg"})`;

const SHAPE_LISTING = `{
  "title": "...",
  "bullets": ["...", "...", "...", "...", "..."],
  "description": "...",
  "backend": "كلمات بحث مفصولة بمسافات"
}`;

const COMMON_RULES = [
  "قواعد الكتابة لأمازون (مهمة جداً):",
  "- ممنوع أي سعر أو عرض أو خصم أو شحن مجاني أو «الأكثر مبيعاً» أو «الأفضل» أو «رقم 1» أو ضمان استرجاع أو «اشتري الآن».",
  "- ممنوع أي رقم موبايل أو واتساب أو رابط أو إيميل أو إيموجي أو رموز زي ! $ ? _ { } ^ ™ ® ©.",
  "- ممنوع ادعاءات علاجية أو صحية (يعالج، مضاد للبكتيريا...) وادعاءات بيئة (صديق للبيئة) وادعاءات أصالة (100% أصلي) إلا لو التاجر كاتبها بنفسه.",
  "- العنوان: نوع المنتج وأهم ميزة وخامة أو مقاس أو عدد القطع في أول 80 حرف. نفس الكلمة متتكررش أكتر من مرتين. الإنجليزي بصيغة Title Case.",
  "- كل نقطة بتبدأ بحرف كبير (للإنجليزي) وبفايدة للمشتري وبعدها التفصيلة، وكل نقطة مختلفة عن التانية.",
  "- ممنوع تخترع أي معلومة: رقم، مقاس، خامة، لون، ضمان، شهادة، موديل، براند. اكتب بس اللي موجود في كلام التاجر. لو معلومة ناقصة سيبها وما تكتبهاش.",
];

/* ====================== فاحص الرفض ====================== */

export function fixSystemPrompt({ market, titleMax }) {
  return [
    `انت محرر ليستنج محترف على ${marketLine(market)}، شغلك تصلّح الليستنج عشان ما يترفضش ويظهر في البحث، من غير ما تغيّر معلومات المنتج.`,
    "",
    ...COMMON_RULES,
    `- العنوان لا يزيد عن ${titleMax} حرف. كل نقطة لا تزيد عن 230 حرف. الوصف لا يزيد عن 1800 حرف.`,
    "- كلمات البحث الخلفية: كلمات جديدة مش موجودة في العنوان (مرادفات، أسماء تانية، لهجات)، مفصولة بمسافات من غير فواصل، وبحد أقصى 110 حرف لو عربي أو 240 حرف لو إنجليزي.",
    "- خلّي كل حقل بنفس لغته الأصلية (عربي يفضل عربي، وإنجليزي يفضل إنجليزي). لو الحقل فاضي ومفيش معلومات تكفي، سيبه فاضي.",
    "- لو الحقل سليم ومفيهوش مشكلة، رجّعه زي ما هو بالظبط من غير تحسينات ملهاش لازمة.",
    "",
    "مهمتك:",
    "1) extraIssues: مشاكل إضافية ما اكتشفهاش الفحص الآلي (ادعاءات مش مثبتة بصيغة تانية، ادعاء طبي مبطّن، اسم براند تاني، مقارنة بمنافس، معلومات متناقضة). لكل مشكلة اكتب اقتباس حرفي قصير من النص في quote. لو مفيش مشاكل رجّع [].",
    "2) fixed: النسخة المصلّحة كاملة.",
    "",
    "رجّع JSON بس بالشكل ده بالظبط، من غير أي كلام قبله أو بعده:",
    `{ "extraIssues": [{"field": "title|bullet|description|backend", "index": 0, "text": "المشكلة في جملة", "quote": "جزء حرفي من النص"}], "fixed": ${SHAPE_LISTING} }`,
  ].join("\n");
}

function listingBlock(input) {
  return [
    `العنوان:\n${input.title || "(فاضي)"}`,
    ...input.bullets.map((b, i) => `النقطة ${i + 1}:\n${b}`).filter((_, i) => input.bullets[i]),
    `الوصف:\n${input.description || "(فاضي)"}`,
    `كلمات البحث الخلفية:\n${input.backend || "(فاضي)"}`,
  ].join("\n\n");
}

function issuesBlock(issues) {
  if (!issues.length) return "الفحص الآلي ما لقاش مشاكل واضحة.";
  return issues
    .filter((i) => i.level !== "tip")
    .slice(0, 25)
    .map((i) => `- ${FIELD_LABEL[i.field]}${i.index != null ? " " + (i.index + 1) : ""}: ${i.text}${i.match ? ` («${i.match}»)` : ""}`)
    .join("\n") || "الفحص الآلي ما لقاش مشاكل واضحة (فيه تحسينات بسيطة بس).";
}

/** تنظيف نتيجة الإصلاح. extraIssues بتتشال لو الاقتباس مش موجود فعلاً في الحقل */
export function normalizeFix(o, input) {
  const f = o && typeof o === "object" ? o.fixed : null;
  if (!f || typeof f !== "object") return null;
  const fixed = {
    title: clean(f.title, 600),
    bullets: arr(f.bullets, 10, (b) => clean(b, 600)),
    description: clean(f.description, 4000),
    backend: clean(f.backend, 1000),
  };
  if (!fixed.title && input.title) return null;
  if (input.bullets.some(Boolean) && !fixed.bullets.length) return null;

  const fieldText = (field, index) =>
    normAr(field === "title" ? input.title : field === "bullet" ? input.bullets[index] || "" : field === "description" ? input.description : input.backend).toLowerCase();
  const extra = arr(o.extraIssues, 6, (x) => {
    const field = ["title", "bullet", "description", "backend"].includes(x?.field) ? x.field : null;
    const quote = clean(x?.quote, 160);
    const text = clean(x?.text, 220);
    if (!field || !text || quote.length < 3) return null;
    const index = field === "bullet" ? Math.max(0, Math.min(9, Number(x.index) || 0)) : undefined;
    // الاقتباس لازم يبقى موجود فعلاً في الحقل، وإلا الموديل بيهلوس
    const hay = field === "bullet" && index == null ? "" : fieldText(field, index);
    if (!hay.includes(normAr(quote).toLowerCase())) return null;
    return { field, index, level: "warn", code: "ai", text, match: quote };
  });
  return { fixed, extra };
}

/**
 * الفحص الكامل: كود ← موديل ← كود تاني على الناتج ← محاولة إصلاح واحدة لو لسه فيه أخطاء.
 * ask({ messages, normalize, temperature, maxTokens }) ← النتيجة المنظّفة أو null
 */
export async function runCheck({ input, opts, ask }) {
  const before = checkListing(input, opts);
  const titleMax = before.stats.titleMax;
  const userMsg = (extra = "") =>
    [`ليستنج التاجر:\n${listingBlock(input)}`, `\nمشاكل الفحص الآلي:\n${issuesBlock(before.issues)}`, extra].filter(Boolean).join("\n");
  const normalize = (o) => normalizeFix(o, input);

  let res = await ask({
    messages: [{ role: "system", content: fixSystemPrompt({ market: opts.market, titleMax }) }, { role: "user", content: userMsg() }],
    normalize,
    temperature: 0.3,
    maxTokens: 3200,
  });
  if (!res) return { ok: false, before, after: null, fixed: null, extra: [], invented: [] };

  const finish = (r) => {
    const fixed = { ...r.fixed, backend: trimToBytes(r.fixed.backend, LIMITS.backendBytes - 10) };
    return { fixed, after: checkListing(fixed, opts) };
  };
  let { fixed, after } = finish(res);

  // محاولة إصلاح تانية لو النسخة المصلّحة لسه فيها أخطاء واضحة
  if (after.stats.errors > 0) {
    const again = await ask({
      messages: [
        { role: "system", content: fixSystemPrompt({ market: opts.market, titleMax }) },
        { role: "user", content: `${userMsg()}\n\nمحاولتك السابقة لسه فيها مشاكل لازم تتصلح:\n${issuesBlock(after.issues)}\n\nالنسخة السابقة:\n${listingBlock({ ...fixed, bullets: fixed.bullets })}\n\nصلّحها وارجع بنفس الـJSON.` },
      ],
      normalize,
      temperature: 0.2,
      maxTokens: 3200,
    });
    if (again) {
      const f2 = finish(again);
      if (f2.after.stats.errors <= after.stats.errors) { res = again; ({ fixed, after } = f2); }
    }
  }

  const original = [input.title, ...input.bullets, input.description, input.backend].join(" ");
  const invented = newNumbers(original, [fixed.title, ...fixed.bullets, fixed.description].join(" "));
  return { ok: true, before, after, fixed, extra: res.extra, invented };
}

/* ====================== ليستنج من وصف عامي ====================== */

export function listingSystemPrompt({ market, langs, titleMax = 150 }) {
  const both = langs === "both";
  const shape = `{
  "understood": "فهمت المنتج إزاي في جملة",
  "missing": ["معلومة ناقصة بتفرق في البيع، مثلاً الخامة أو المقاس أو عدد القطع"],
  ${langs !== "ar" ? `"en": ${SHAPE_LISTING},` : ""}
  ${langs !== "en" ? `"ar": ${SHAPE_LISTING}` : ""}
}`;
  return [
    `انت كاتب ليستنج محترف على ${marketLine(market)}. التاجر هيوصفلك منتجه بالعامية المصرية أو بجمل متقطعة، وانت بتحوّله لليستنج جاهز للنشر${both ? " بالإنجليزي وبالعربي" : langs === "en" ? " بالإنجليزي" : " بالعربي"}.`,
    "",
    ...COMMON_RULES,
    `- العنوان لا يزيد عن ${titleMax} حرف. كل نقطة من 80 لـ 220 حرف، و5 نقاط بالظبط. الوصف من 400 لـ 1500 حرف في فقرات قصيرة.`,
    "- كلمات البحث الخلفية: كلمات مش موجودة في العنوان (مرادفات وأسماء تانية وصيغ لهجة)، من غير فواصل، حد أقصى 240 حرف إنجليزي أو 110 حرف عربي.",
    "- النسخة العربية مش ترجمة حرفية: اكتبها بالطريقة اللي المشتري المصري/الخليجي بيدوّر بيها (مثلاً «طقم حلل» مش «مجموعة أواني طبخ»)، بفصحى مبسطة.",
    "- missing: لو المنتج ينقصه معلومات أساسية (الخامة، المقاس، عدد القطع، اللون، البراند، الضمان، مناسب لإيه)، اكتبها كأسئلة قصيرة في missing بدل ما تخترعها. من 0 لـ 5 عناصر.",
    "",
    "رجّع JSON بس بالشكل ده، من غير أي كلام قبله أو بعده:",
    shape,
  ].join("\n");
}

export function normalizeListingGen(o, langs) {
  if (!o || typeof o !== "object") return null;
  const one = (x) => {
    if (!x || typeof x !== "object") return null;
    const v = {
      title: clean(x.title, 400),
      bullets: arr(x.bullets, 6, (b) => clean(b, 600)),
      description: clean(x.description, 3500),
      backend: clean(x.backend, 800),
    };
    return v.title && v.bullets.length >= 3 ? v : null;
  };
  const en = langs !== "ar" ? one(o.en) : null;
  const ar = langs !== "en" ? one(o.ar) : null;
  if ((langs !== "ar" && !en) || (langs !== "en" && !ar)) return null;
  return { understood: clean(o.understood, 300), missing: arr(o.missing, 5, (m) => clean(m, 120)), en, ar };
}

/**
 * توليد ← فحص بالكود ← لو فيه أخطاء، تصحيح تلقائي مرة واحدة ← فحص تاني.
 * ask بتتنادى مرتين بالكتير لكل لغة (توليد + تصليح).
 */
export async function runListing({ desc, photo, brand, market, langs, ask }) {
  const user = [
    `وصف التاجر لمنتجه:\n${desc}`,
    brand ? `البراند: ${brand}` : "",
    photo ? `وصف الصورة اللي رفعها (من مراجع بصري، اعتمد على اللي مكتوب في الوصف أولاً):\n${photo}` : "",
  ].filter(Boolean).join("\n\n");

  const gen = await ask({
    messages: [{ role: "system", content: listingSystemPrompt({ market, langs }) }, { role: "user", content: user }],
    normalize: (o) => normalizeListingGen(o, langs),
    temperature: 0.55,
    maxTokens: 4200,
  });
  if (!gen) return null;

  const out = { understood: gen.understood, missing: gen.missing };
  const opts = { market, brand };
  // اللغتين بيتصلحوا بالتوازي عشان الوقت (الـAPI عنده حد زمني)
  await Promise.all(["en", "ar"].filter((lang) => gen[lang]).map(async (lang) => {
    let listing = { ...gen[lang], backend: trimToBytes(gen[lang].backend, LIMITS.backendBytes - 10) };
    let check = checkListing(listing, opts);
    let repaired = false;
    if (check.stats.errors > 0) {
      const r = await runCheck({ input: listing, opts, ask });
      if (r.ok && r.after.stats.errors < check.stats.errors) {
        listing = r.fixed; check = r.after; repaired = true;
      }
    }
    out[lang] = { listing, check, repaired };
  }));
  // أرقام ظهرت في الناتج ومش في كلام التاجر
  const all = Object.values({ en: out.en, ar: out.ar }).filter(Boolean).flatMap((x) => [x.listing.title, ...x.listing.bullets, x.listing.description]).join(" ");
  out.invented = newNumbers(`${desc} ${photo || ""} ${brand || ""}`, all);
  return out;
}

/* ====================== تحليل المنافس ====================== */

export function competitorSystemPrompt({ market, hasMine }) {
  return [
    `انت محلل منافسين على ${marketLine(market)}. التاجر لصق لك ليستنج منافس وتقييمات عملائه${hasMine ? "، ومعاهم ليستنج منتجه هو" : ""}. شغلك تقوله نقاط ضعف المنافس اللي يقدر يتفوق بيها، بدليل من التقييمات نفسها.`,
    "",
    "القواعد:",
    "- اعتمد على النص الملصوق بس. ممنوع تخمّن أرقام مبيعات أو ترتيب أو مواصفات مش مكتوبة.",
    "- painPoints: من 3 لـ 6 شكاوى متكررة أو مهمة. لكل واحدة quote اقتباس حرفي قصير (لحد 20 كلمة) منسوخ كما هو من التقييمات (ممنوع تغيّر فيه حرف)، وfrequency: «كتير» لو اتكررت في أكتر من تقييم، «أحياناً»، «نادر». وhowToWin: إزاي منتجي يستغل الشكوى دي بصدق.",
    "- strengths: من 2 لـ 4 حاجات المنافس شاطر فيها وعملاؤه بيمدحوها، وإزاي تعادلها.",
    "- angles: من 3 لـ 5 زوايا بيع واضحة ومختلفة.",
    hasMine ? "- keywordGaps: كلمات أو عبارات موجودة في ليستنج المنافس وناقصة من ليستنج التاجر (حرفياً من النص، من 3 لـ 10)." : "- keywordGaps: رجّع [].",
    "- bullets: 5 نقاط مقترحة لليستنج التاجر تعالج الشكاوى دي، بنفس لغة ليستنجه (أو إنجليزي لو مفيش). ممنوع تدّعي حاجة عن منتج التاجر مش مكتوبة في كلامه. ممنوع سعر أو عرض أو «الأفضل» أو ضمان أو ادعاءات صحية. لو مفيش معلومات كفاية عن منتج التاجر، رجّع [].",
    "- summary: جملتين أو تلاتة: أهم فرصة للتفوق.",
    "",
    "رجّع JSON بس:",
    `{ "summary": "...", "painPoints": [{"issue": "الشكوى", "frequency": "كتير|أحياناً|نادر", "quote": "اقتباس حرفي", "howToWin": "..."}], "strengths": [{"point": "...", "answer": "..."}], "angles": ["..."], "keywordGaps": ["..."], "bullets": ["..."] }`,
  ].join("\n");
}

const squash = (s) => normAr(s).toLowerCase().replace(/\s+/g, " ").trim();

export function normalizeCompetitor(o, { listing, reviews, mine }) {
  if (!o || typeof o !== "object") return null;
  const revSq = squash(reviews);
  const listSq = squash(listing);
  const mineSq = squash(mine);
  let unverified = 0;
  const painPoints = arr(o.painPoints, 6, (p) => {
    const issue = clean(p?.issue, 200);
    if (!issue) return null;
    let quote = clean(p?.quote, 300);
    const found = quote.length >= 4 && revSq.includes(squash(quote));
    if (quote && !found) { quote = ""; unverified++; } // اقتباس مش موجود فعلاً في التقييمات = هلوسة
    const freq = ["كتير", "أحياناً", "نادر"].includes(p?.frequency) ? p.frequency : "أحياناً";
    return { issue, frequency: freq, quote, howToWin: clean(p?.howToWin, 260) };
  });
  if (!painPoints.length) return null;
  const keywordGaps = arr(o.keywordGaps, 10, (k) => {
    const w = clean(k, 60);
    if (!w || !mine) return null;
    const sq = squash(w);
    return listSq.includes(sq) && !mineSq.includes(sq) ? w : null; // لازم عند المنافس وناقصة عندك فعلاً
  });
  return {
    summary: clean(o.summary, 500),
    painPoints,
    unverifiedQuotes: unverified,
    strengths: arr(o.strengths, 4, (s) => (clean(s?.point, 160) ? { point: clean(s.point, 160), answer: clean(s?.answer, 220) } : null)),
    angles: arr(o.angles, 5, (a) => clean(a, 200)),
    keywordGaps,
    bullets: arr(o.bullets, 5, (b) => clean(b, 400)),
  };
}

export async function runCompetitor({ listing, reviews, mine, market, ask }) {
  const user = [
    `ليستنج المنافس:\n${listing}`,
    `تقييمات عملاء المنافس:\n${reviews}`,
    mine ? `ليستنج التاجر (منتجي):\n${mine}` : "",
  ].filter(Boolean).join("\n\n");
  const res = await ask({
    messages: [{ role: "system", content: competitorSystemPrompt({ market, hasMine: !!mine }) }, { role: "user", content: user }],
    normalize: (o) => normalizeCompetitor(o, { listing, reviews, mine }),
    temperature: 0.35,
    maxTokens: 3500,
  });
  if (!res) return null;
  // النقاط المقترحة تعدّي على نفس الفحص: اللي فيها مخالفة واضحة بتتشال
  const kept = [];
  let removed = 0;
  for (const b of res.bullets) {
    if (checkListing({ title: "x".repeat(25), bullets: [b] }).issues.some((i) => i.field === "bullet" && i.level === "error")) removed++;
    else kept.push(b);
  }
  return { ...res, bullets: kept, removedBullets: removed };
}
