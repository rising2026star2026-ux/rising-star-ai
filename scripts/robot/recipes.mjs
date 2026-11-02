// التجارب الفعلية: الروبوت بيستخدم كل أداة زي المستخدم بالظبط (يرفع ملف، يكتب، يضغط الزرار)
// ويتأكد إن النتيجة طلعت فعلاً: ملف نزل ومش فاضي، أو نتيجة مكتوبة بالعربي من غير أخطاء.
// كل تجربة بترمي broken(...) أو warn(...) لو فيه مشكلة، والرسالة دي هي اللي بتظهر في التقرير.
import fs from "node:fs/promises";
import path from "node:path";
import { broken, warn, step, fix, sleep, clickDownload, visibleError, waitForResult, textLength, textProblems } from "./lib.mjs";

const local = (page) => page.locator(".local-tool");
const upload = (page, files, scope) => step("رفع الملف", () => (scope || local(page)).locator("input[type=file]").first().setInputFiles(files));
const see = (page, text, name, timeout = 30000) => step(name, () => page.getByText(text).first().waitFor({ state: "visible", timeout }));

/** يستنى واحدة من كذا حاجة تظهر، ويرجع رقمها (أو -1 لو الوقت خلص) */
async function firstOf(page, locators, timeout) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    for (let i = 0; i < locators.length; i++) if (await locators[i].first().isVisible().catch(() => false)) return i;
    const err = await visibleError(page);
    if (err) return { error: err };
    await sleep(700);
  }
  return -1;
}

async function noJunk(page, where = ".local-tool") {
  const t = await page.locator(where).first().innerText().catch(() => "");
  const j = t.match(/\bNaN\b|\bundefined\b|\bInfinity\b|\[object Object\]/);
  if (j) throw broken(`النتيجة فيها كلام بايظ: ${j[0]}`);
  return t;
}

// ===================== أدوات الاستوديو (بتشتغل على جهاز المستخدم) =====================
const L = (id, run, extra = {}) => ({ id, path: `/tool/${id}`, group: "tools", run, ...extra });

const CALC = (id) => L(id, async ({ page }) => {
  await step("فتح الحاسبة", () => local(page).waitFor({ timeout: 20000 }));
  if (id !== "hijri-date") {
    const nums = local(page).locator("input[inputmode=decimal]");
    for (let i = 0; i < (await nums.count()); i++) if (!(await nums.nth(i).inputValue())) await nums.nth(i).fill("1250");
    const areas = local(page).locator("textarea:not([readonly])");
    for (let i = 0; i < (await areas.count()); i++) await areas.nth(i).fill("السلام  عليكم   ورحمة الله.. ده نص  تجربة فيه مسافات زيادة وكلام مكرر مكرر.");
  }
  await sleep(800);
  const outs = await local(page).locator('[role="status"], textarea[readonly]').evaluateAll((els) => els.map((e) => (e.value ?? e.innerText ?? "").trim()));
  const shown = outs.filter(Boolean);
  if (!shown.length) {
    // مولد كلمات المرور بيعرض النتيجة في خانة أو كود
    const any = (await local(page).innerText()).trim();
    if (any.length < 40) throw broken("الحاسبة ما طلّعتش أي نتيجة");
  }
  await noJunk(page);
});

export const TOOL_RECIPES = [
  L("photo-editor", async ({ page }) => { await upload(page, fix("product.jpg")); await clickDownload(page, /^تحميل الصورة/); }),
  L("poster-maker", async ({ page }) => { await clickDownload(page, /^تحميل التصميم/); }),
  L("image-resize", async ({ page }) => { await upload(page, fix("product.jpg")); await clickDownload(page, /^تحميل الصورة/); }),
  L("image-compress", async ({ page }) => {
    await upload(page, [fix("p0.jpg"), fix("p1.jpg")]);
    await step("ضغط الصور", () => page.getByRole("button", { name: "اضغط الصور" }).click());
    await clickDownload(page, page.getByRole("button", { name: "تحميل", exact: true }).first());
  }),
  L("image-convert", async ({ page }) => {
    await upload(page, [fix("p0.jpg")]);
    await step("تحويل الصور", () => page.getByRole("button", { name: "حوّل الصور" }).click());
    await clickDownload(page, page.getByRole("button", { name: "تحميل", exact: true }).first());
  }),
  L("watermark", async ({ page }) => { await upload(page, fix("product.jpg")); await clickDownload(page, /^تحميل/); }),
  L("color-extract", async ({ page }) => { await upload(page, fix("product.jpg")); await see(page, "انسخ كل الأكواد", "استخراج الألوان", 20000); }),
  L("images-to-pdf", async ({ page }) => { await upload(page, [fix("p0.jpg"), fix("p1.jpg")]); await clickDownload(page, /^اعمل PDF/); }),
  L("pdf-merge", async ({ page }) => { await upload(page, [fix("guide-ar.pdf"), fix("guide-ar.pdf")]); await clickDownload(page, /^ادمج/); }),
  L("pdf-split", async ({ page }) => {
    await upload(page, fix("guide-ar.pdf"));
    await step("كتابة رقم الصفحة", () => page.getByLabel("الصفحات", { exact: true }).fill("1"));
    await clickDownload(page, local(page).getByRole("button", { name: "نفّذ", exact: true }));
  }),
  L("pdf-delete-pages", async ({ page }) => {
    await upload(page, fix("guide-ar.pdf"));
    await step("كتابة رقم الصفحة", () => page.getByLabel("الصفحات اللي هتتحذف").fill("2"));
    await clickDownload(page, /احذف ونزّل/);
  }),
  L("image-to-text", async ({ page }) => {
    await upload(page, fix("ocr-text.png"));
    const box = page.getByLabel("النص المستخرج");
    await step("قراية النص من الصورة", () => box.waitFor({ state: "visible", timeout: 150000 }));
    const t = await box.inputValue().catch(async () => box.innerText());
    if (t.trim().length < 15) throw broken(`النص اللي اتقرا من الصورة فاضي تقريباً (${t.trim().length} حرف)`);
    if (!/[؀-ۿ]/.test(t)) throw warn("قرا الصورة بس ما طلّعش أي كلام عربي");
  }),
  L("video-frame", async ({ page }) => {
    await upload(page, fix("clip.webm"));
    await step("تشغيل الفيديو", () => page.getByRole("button", { name: "التقط الصورة" }).waitFor({ timeout: 20000 }));
    await sleep(1500);
    await page.getByRole("button", { name: "التقط الصورة" }).click();
    await clickDownload(page, page.getByRole("button", { name: "تحميل", exact: true }).first());
  }),
  L("design-apps", async ({ page }) => {
    const n = await local(page).locator("a[href^='http']").count();
    if (n < 5) throw broken(`القايمة فيها ${n} برامج بس (المفروض أكتر)`);
  }),
  L("qr-code", async ({ page }) => {
    await step("كتابة الرابط", () => page.getByLabel("الرابط").fill("example.com"));
    await clickDownload(page, "نزّل PNG");
  }),
  L("image-enhance", async ({ page }) => { await upload(page, fix("product.jpg")); await clickDownload(page, "نزّل الصورة المحسّنة", { timeout: 90000 }); }),
  L("voice-studio", async ({ page }) => {
    const box = local(page).locator("textarea").first();
    await step("كتابة النص", () => box.fill("أهلاً بيك. ده اختبار سريع لمولد الأصوات في رايزنج ستار."));
    await clickDownload(page, /^نزّل الصوت/, { timeout: 90000, minBytes: 3000 });
  }),
  L("remove-bg", async ({ page }) => {
    await upload(page, fix("product.jpg"));
    const done = page.getByText(/الخلفية اتشالت/);
    const cloudBtn = page.getByRole("button", { name: /شيلها على سيرفر/ });
    let r = await firstOf(page, [done, cloudBtn], 180000);
    if (r === 1) { await cloudBtn.click(); r = await firstOf(page, [done], 100000); }
    if (r?.error) throw broken(`إزالة الخلفية طلّعت خطأ: ${r.error}`);
    if (r !== 0) throw broken("إزالة الخلفية ما اشتغلتش، لا على الجهاز ولا على السيرفر");
    await clickDownload(page, /^تحميل/);
  }, { slow: true }),
  CALC("percent-calc"), CALC("freelance-rate"), CALC("number-words"), CALC("zakat-calc"),
  CALC("hijri-date"), CALC("word-count"), CALC("text-clean"), CALC("password-gen"),
];

// أدوات الفيديو تقيلة (تصدير فيديو جوه المتصفح)، فبنفحص إن الصفحة بتفتح وأدواتها ظاهرة بس
export const PAGE_ONLY = new Set(["reel-pro", "product-ad", "video-factory", "ai-video", "text-video", "photo-video"]);

// ===================== أدوات الذكاء الاصطناعي (الكتابة) =====================
const NOT_ARABIC = new Set(["code-gen", "debug", "code-explain", "excel-formula", "translate", "english-correct", "image-prompt", "video-prompt"]);
const SAMPLE = "مشروع صغير لبيع العسل الطبيعي أونلاين في مصر، المنتج الأساسي عسل سدر وعسل موالح، والعملاء ستات بيوت وشباب مهتمين بالأكل الصحي.";

export async function runAiTool({ page }, id) {
  const ex = page.getByRole("button", { name: "جرّب مثالاً" });
  if (await ex.isVisible().catch(() => false)) await ex.click();
  else await page.locator("textarea#in").fill(SAMPLE);
  await sleep(300);
  if (!(await page.locator("textarea#in").inputValue()).trim()) await page.locator("textarea#in").fill(SAMPLE);
  const t0 = Date.now();
  await step("الضغط على نفّذ", () => page.getByRole("button", { name: "نفّذ", exact: true }).click());
  const done = page.getByRole("button", { name: "إعادة التوليد" });
  const r = await firstOf(page, [done], 120000);
  if (r?.error) throw broken(`الأداة طلّعت خطأ: ${r.error}`);
  if (r !== 0) throw broken("الأداة ما خلصتش الرد في دقيقتين");
  const text = await page.locator(".result .md").first().innerText();
  const probs = textProblems(text, { arabic: !NOT_ARABIC.has(id) });
  const secs = (Date.now() - t0) / 1000;
  if (secs > 60) probs.push(["warn", `الرد أخد ${Math.round(secs)} ثانية`]);
  return { probs, note: `${text.trim().length} حرف في ${secs.toFixed(0)} ثانية`, sample: text.trim().slice(0, 160) };
}

// ===================== مميزات الموقع الأساسية =====================
const F = (id, name, pathname, run, extra = {}) => ({ id, name, path: pathname, group: "features", run, ...extra });

async function voiceSample(BASE, OUT) {
  const r = await fetch(`${BASE}/api/speak`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "عندي محل هدوم أطفال في المعادي، وعامل عرض خصم عشرين في المية على كل الطقم الشتوي لحد آخر الشهر، والتوصيل مجاني.", voice: "ar-EG-SalmaNeural" }), signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw broken(`مولد الصوت على السيرفر رجّع خطأ ${r.status}`);
  const file = path.join(OUT, "voice-sample.mp3");
  await fs.writeFile(file, Buffer.from(await r.arrayBuffer()));
  return file;
}

export const FEATURE_RECIPES = [
  F("chat", "الشات الرئيسي", "/chat", async ({ page }) => {
    await step("كتابة السؤال", () => page.locator("#chat-in").fill("اكتبلي 3 أفكار بوستات قصيرة لصفحة بتبيع عسل طبيعي"));
    const before = await textLength(page);
    await step("إرسال", () => page.click('button[aria-label="إرسال"]'));
    const r = await waitForResult(page, before, { minGrowth: 150, timeout: 90000, busy: () => page.locator('button[aria-label="إيقاف"]').isVisible().catch(() => false) });
    if (r.error) throw broken(`الشات طلّع خطأ: ${r.error}`);
    if (r.timedOut) throw broken("الشات ما ردّش في دقيقة ونص");
  }),
  F("chat-search", "الشات مع البحث على الإنترنت", "/chat", async ({ page }) => {
    const btn = page.locator('button[title="بحث على الإنترنت"]');
    await step("تشغيل البحث", async () => { if ((await btn.getAttribute("aria-pressed")) !== "true") await btn.click(); });
    await page.locator("#chat-in").fill("إيه آخر أخبار الذكاء الاصطناعي الأسبوع ده؟");
    const before = await textLength(page);
    await page.click('button[aria-label="إرسال"]');
    const r = await waitForResult(page, before, { minGrowth: 200, timeout: 120000, busy: () => page.locator('button[aria-label="إيقاف"]').isVisible().catch(() => false) });
    if (r.error) throw broken(`البحث طلّع خطأ: ${r.error}`);
    if (r.timedOut) throw broken("الشات مع البحث ما ردّش في دقيقتين");
    const body = await page.locator("main").innerText();
    if (/البحث على الإنترنت مش متفعّل/.test(body)) throw warn("البحث على الإنترنت مش شغال (مفتاح البحث مش موجود في Vercel)، والرد طلع من غير بحث");
  }),
  F("test-ad", "اختبر إعلانك على 100 زبون", "/test-ad", async ({ page }) => {
    await step("جرّب بمثال", () => page.getByRole("button", { name: "جرّب بمثال" }).click());
    await step("بدء الاختبار", () => page.getByRole("button", { name: "اعرض إعلاني على 100 زبون" }).click());
    const skip = page.getByRole("button", { name: /اعرض النتيجة على طول/ });
    const r = await firstOf(page, [skip], 100000);
    if (r?.error) throw broken(`الاختبار طلّع خطأ: ${r.error}`);
    if (r !== 0) throw broken("الاختبار ما طلّعش نتيجة في دقيقة ونص");
    await skip.click();
    await see(page, /اختبر النسخة دي/, "عرض النتيجة", 20000);
  }),
  F("photo-ad", "صوّرها بموبايلك (إعلان من صورة)", "/photo-ad", async ({ page }) => {
    await step("رفع صورة المنتج", () => page.locator("input[type=file]").nth(1).setInputFiles(fix("product.jpg")));
    const ok = page.getByText(/الخلفية اتشالت/), framed = page.getByText(/صورتك هتتحط في إطار/);
    const r = await firstOf(page, [ok, framed], 170000);
    const cutoutFailed = r === 1;
    if (r === -1) throw broken("إزالة الخلفية علّقت أكتر من 3 دقايق");
    await page.getByPlaceholder("450 ج").fill("1850 ج").catch(() => {});
    await page.getByPlaceholder("01012345678").fill("01012345678").catch(() => {});
    await step("كتابة الإعلان", () => page.getByRole("button", { name: /اكتبلي الإعلان كامل/ }).click());
    const r2 = await firstOf(page, [page.getByText("فهمنا كده:")], 100000);
    if (r2?.error) throw broken(`كتابة الإعلان طلّعت خطأ: ${r2.error}`);
    if (r2 !== 0) throw broken("كتابة الإعلان ما خلصتش في دقيقة ونص");
    if (cutoutFailed) throw warn("الإعلان اتعمل، بس إزالة الخلفية ما اشتغلتش (السيرفرات المجانية واقعة)، فالصورة اتحطت في إطار");
  }, { slow: true }),
  F("voice-post", "فويس نوت لبوستات", "/voice-post", async ({ page, BASE, OUT }) => {
    const file = await voiceSample(BASE, OUT);
    await step("رفع الفويس", () => page.locator("input[type=file]").first().setInputFiles(file));
    const r = await firstOf(page, [page.getByRole("heading", { name: "ده كلامك مكتوب" })], 90000);
    if (r?.error) throw broken(`تحويل الفويس لكلام طلّع خطأ: ${r.error}`);
    if (r !== 0) throw broken("تحويل الفويس لكلام ما خلصش في دقيقة ونص");
    await step("تحويل لبوستات", () => page.getByRole("button", { name: /حوّله لبوستات/ }).click());
    const r2 = await firstOf(page, [page.getByRole("heading", { name: "البوستات جاهزة" })], 100000);
    if (r2?.error) throw broken(`كتابة البوستات طلّعت خطأ: ${r2.error}`);
    if (r2 !== 0) throw broken("كتابة البوستات ما خلصتش في دقيقة ونص");
  }),
  F("catalog", "كتالوج في دقيقة", "/catalog", async ({ page }) => {
    await page.getByLabel("اسم المحل").fill("بوتيك ليلى");
    await page.getByLabel("رقم الواتساب").fill("01012345678");
    await step("رفع صور المنتجات", () => page.locator("input[type=file][multiple]").setInputFiles([0, 1, 2].map((i) => fix(`p${i}.jpg`))));
    await sleep(1200);
    await step("تسمية المنتجات", () => page.getByRole("button", { name: /سمّي المنتجات/ }).click());
    await step("التعرف على المنتجات", () => page.waitForFunction(() => !document.body.innerText.includes("بنتعرّف على المنتجات"), null, { timeout: 100000 }));
    let err = await visibleError(page);
    if (err) throw broken(`التعرف على المنتجات طلّع خطأ: ${err}`);
    for (const [i, pr] of [[1, "650 ج"], [2, "420 ج"], [3, "380 ج"]]) await page.getByLabel(`سعر المنتج ${i}`).fill(pr).catch(() => {});
    await step("كتابة الأوصاف", () => page.getByRole("button", { name: /اكتب الأوصاف/ }).click());
    await step("كتابة الأوصاف", () => page.waitForFunction(() => !document.body.innerText.includes("بنكتب الأوصاف"), null, { timeout: 90000 }));
    err = await visibleError(page);
    if (err) throw broken(`كتابة الأوصاف طلّعت خطأ: ${err}`);
    await clickDownload(page, /حمّل الكتالوج PDF/, { timeout: 60000, minBytes: 5000 });
  }, { slow: true }),
  F("receipt", "كشف حساب الاشتراكات", "/subscriptions/receipt", async ({ page }) => {
    for (const n of ["ChatGPT", "Canva", "CapCut"]) await step(`اختيار ${n}`, () => page.getByRole("button", { name: n, exact: true }).first().click());
    await step("طباعة الكشف", () => page.getByRole("button", { name: /اطبع كشف الحساب/ }).click());
    await sleep(3500);
    await noJunk(page, "main");
    await clickDownload(page, /شارك الكشف/, { timeout: 30000 });
  }),
  F("amazon-check", "أمازون: فاحص رفض الليستنج", "/amazon/check", async ({ page }) => {
    await step("جرّب بمثال", () => page.getByRole("button", { name: "جرّب بمثال" }).click());
    await step("الفحص الفوري", () => page.locator("#ck-live").waitFor({ timeout: 15000 }));
    await step("التصليح الذكي", () => page.getByRole("button", { name: /صلّحلي الليستنج/ }).click());
    const r = await firstOf(page, [page.locator("#ck-fixed"), page.getByRole("heading", { name: "التصليح الذكي مش متاح دلوقتي" })], 100000);
    if (r === 1) throw broken("التصليح الذكي ظهر «مش متاح دلوقتي»");
    if (r?.error) throw broken(`التصليح طلّع خطأ: ${r.error}`);
    if (r !== 0) throw broken("التصليح ما خلصش في دقيقة ونص");
  }),
  F("amazon-listing", "أمازون: كاتب الليستنج", "/amazon/listing", async ({ page }) => {
    await step("جرّب بمثال", () => page.getByRole("button", { name: "جرّب بمثال" }).click());
    await step("كتابة الليستنج", () => page.getByRole("button", { name: "اكتبلي الليستنج" }).click());
    const r = await firstOf(page, [page.locator("#ls-r")], 100000);
    if (r?.error) throw broken(`كتابة الليستنج طلّعت خطأ: ${r.error}`);
    if (r !== 0) throw broken("كتابة الليستنج ما خلصتش في دقيقة ونص");
  }),
  F("amazon-competitor", "أمازون: تحليل المنافس", "/amazon/competitor", async ({ page }) => {
    await page.locator("#cp-l").fill("سماعة بلوتوث لاسلكية بعزل ضوضاء، بطارية 30 ساعة، مقاومة للماء IPX5، شحن سريع USB-C، لون أسود. مناسبة للرياضة والمكالمات.");
    await page.locator("#cp-r").fill("الصوت حلو جداً والبطارية بتعيش فعلاً. / بعد شهر الشمال فصل خالص. / العزل كويس في المواصلات. / مقاسها كبير على ودني ووجعتني. / التوصيل سريع والتغليف محترم. / المايك في المكالمات ضعيف والناس مش سامعاني. / سعرها مناسب بالنسبة للمميزات.");
    await step("تحليل المنافس", () => page.getByRole("button", { name: "حلّل المنافس" }).click());
    const r = await firstOf(page, [page.locator("#cp-r-h")], 100000);
    if (r?.error) throw broken(`التحليل طلّع خطأ: ${r.error}`);
    if (r !== 0) throw broken("التحليل ما خلصش في دقيقة ونص");
  }),
  F("amazon-profit", "أمازون: حاسبة الربح الصافي", "/amazon/profit", async ({ page }) => {
    await step("جرّب بمثال", () => page.getByRole("button", { name: "جرّب بمثال" }).click());
    await see(page, /ربحك الصافي في الوحدة|خسارتك في الوحدة/, "حساب الربح", 10000);
    await noJunk(page, "main");
  }),
  F("scam-check", "فاحص النصب", "/scam-check", async ({ page }) => {
    await page.getByPlaceholder("example.com").fill("example.com");
    await page.getByPlaceholder(/متجر النور/).fill("متجر تجربة").catch(() => {});
    await page.getByPlaceholder(/اشتراك مدى الحياة/).fill("اشتراك نتفليكس سنة كاملة بـ 150 جنيه، التحويل على فودافون كاش قبل التفعيل.").catch(() => {});
    const before = await textLength(page);
    await step("فحص البائع", () => page.getByRole("button", { name: "افحص البائع" }).click());
    const r = await firstOf(page, [page.getByRole("heading", { name: "تعمل إيه دلوقتي" })], 150000);
    if (r?.error) throw broken(`الفحص طلّع خطأ: ${r.error}`);
    if (r !== 0 && (await textLength(page)) - before < 200) throw broken("الفحص ما طلّعش نتيجة في دقيقتين ونص");
  }),
  F("prompt-builder", "صانع البرومبتات", "/prompts/builder", async ({ page }) => {
    await step("فتح «ولّد لي أفكار»", () => page.getByRole("tab", { name: "ولّد لي أفكار" }).click());
    await step("كتابة الموضوع", () => page.locator("#pb-topic").fill("متجر عسل طبيعي أونلاين"));
    await step("توليد", () => page.getByRole("button", { name: "ولّد", exact: true }).click());
    const r = await firstOf(page, [page.getByRole("button", { name: /^ولّد \d+ كمان$/ })], 100000);
    if (r?.error) throw broken(`التوليد طلّع خطأ: ${r.error}`);
    if (r !== 0) throw broken("التوليد ما طلّعش برومبتات في دقيقة ونص");
  }),
  F("image-maker", "صانع الصور", "/maker/create", async ({ page }) => {
    await step("كتابة فكرة الصورة", () => page.getByLabel("فكرة الصورة").fill("فنجان قهوة عربي على ترابيزة خشب جنب شباك، إضاءة دافية"));
    await step("توليد الصورة", () => page.getByRole("button", { name: "ولّد الصورة" }).click());
    const img = page.locator("img[alt^='فنجان قهوة']").first();
    const r = await firstOf(page, [img], 150000);
    if (r?.error) throw broken(`توليد الصورة طلّع خطأ: ${r.error}`);
    if (r !== 0) throw broken("الصورة ما اتولدتش في دقيقتين ونص");
    const w = await img.evaluate((i) => i.naturalWidth).catch(() => 0);
    if (!w) throw broken("الصورة اتولدت بس مش ظاهرة (مكسورة)");
  }, { slow: true }),
  F("image-reader", "قارئ الصور", "/tool/image-reader", async ({ page }) => {
    await step("رفع الصورة", () => page.locator("input[type=file]").first().setInputFiles(fix("ocr-text.png")));
    const before = await textLength(page);
    await step("نفّذ", () => page.getByRole("button", { name: "نفّذ", exact: true }).click());
    const r = await waitForResult(page, before, { minGrowth: 80, timeout: 90000, busy: () => page.getByRole("button", { name: /بنقرا الصورة/ }).isVisible().catch(() => false) });
    if (r.error) throw broken(`قراية الصورة طلّعت خطأ: ${r.error}`);
    if (r.timedOut) throw broken("قراية الصورة ما خلصتش في دقيقة ونص");
  }),
  F("voice-pro", "الصوت المعبّر (Gemini)", "/tool/voice-studio", async ({ BASE }) => {
    const g = await fetch(`${BASE}/api/speak-pro`, { signal: AbortSignal.timeout(20000) }).then((r) => r.json()).catch(() => null);
    if (!g) throw broken("خدمة الصوت المعبّر مش بترد");
    if (!g.enabled) throw warn("الصوت المعبّر مقفول (مفتاح Gemini مش متفعّل للخدمة دي)");
    const r = await fetch(`${BASE}/api/speak-pro`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "أهلاً، ده اختبار للصوت المعبّر.", dialect: "eg", gender: "f", tone: "normal" }), signal: AbortSignal.timeout(90000) });
    if (r.status === 429) throw warn("الصوت المعبّر وصل للحد (الحصة خلصت النهارده)");
    if (!r.ok) throw broken(`الصوت المعبّر رجّع خطأ ${r.status}: ${(await r.text()).slice(0, 120)}`);
    const size = (await r.arrayBuffer()).byteLength;
    if (size < 5000) throw broken(`الصوت المعبّر رجّع ملف صوت فاضي (${size} بايت)`);
  }, { api: true }),
];
