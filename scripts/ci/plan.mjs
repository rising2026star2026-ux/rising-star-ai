// خطة التجارب: الصفحات والتجارب الفعلية اللي check.mjs بيشغلها
import fs from "node:fs/promises";
import path from "node:path";

const FIX = path.join(path.dirname(new URL(import.meta.url).pathname), "fixtures");
const post = async (BASE, route, body) => {
  const t0 = Date.now();
  const r = await fetch(BASE + route, { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` }, body: JSON.stringify(body) });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text.slice(0, 2000); }
  return { status: r.status, ms: Date.now() - t0, data };
};
const dataUrl = async (file) => `data:image/jpeg;base64,${(await fs.readFile(path.join(FIX, file))).toString("base64")}`;


// معمل إزالة الخلفية: بيجرب موديلات وطرق تشغيل مختلفة جوه المتصفح ويقيس اللي بيشتغل (من غير GPU، وبـ WebGPU برمجي)
const CUTOUT_LAB = async ({ page, note, FIXDIR }) => {
  const img = `data:image/jpeg;base64,${(await fs.readFile(path.join(FIXDIR, "product.jpg"))).toString("base64")}`;
  const trials = [
    ["onnx-community/BiRefNet_lite-ONNX", "wasm", "q8"],
    ["onnx-community/BiRefNet_lite-ONNX", "wasm", "fp32"],
    ["onnx-community/BiRefNet_lite-ONNX", "wasm", "fp16"],
    ["onnx-community/BiRefNet_lite-ONNX", "webgpu", "fp16"],
    ["onnx-community/BiRefNet_lite-ONNX", "webgpu", "fp32"],
    ["onnx-community/ormbg-ONNX", "wasm", "fp32"],
    ["onnx-community/ISNet-ONNX", "wasm", "fp32"],
    ["onnx-community/BEN2-ONNX", "wasm", "fp32"],
  ];
  for (const [model, device, dtype] of trials) {
    const r = await page.evaluate(async ({ model, device, dtype, img }) => {
      const t0 = performance.now();
      let bytes = 0;
      try {
        const T = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.1");
        T.env.allowLocalModels = false;
        if (device === "webgpu" && !navigator.gpu) return "no navigator.gpu";
        const seg = await T.pipeline("image-segmentation", model, { device, dtype, progress_callback: (p) => { if (p.status === "done" && p.total) bytes += p.total; else if (p.status === "progress" && p.total && p.loaded === p.total) bytes += 0; } });
        const t1 = performance.now();
        const out = await seg(await T.RawImage.fromURL(img));
        const mask = (Array.isArray(out) ? out[0] : out)?.mask;
        if (!mask) return "no mask";
        const d = mask.data; let on = 0; for (let i = 0; i < d.length; i++) if (d[i] > 127) on++;
        await seg.dispose?.();
        return `OK load ${Math.round(t1 - t0)}ms run ${Math.round(performance.now() - t1)}ms mask ${mask.width}x${mask.height} fg ${Math.round((on / d.length) * 100)}%`;
      } catch (e) {
        return `FAIL after ${Math.round(performance.now() - t0)}ms: ${String(e?.message || e).slice(0, 160)}`;
      }
    }, { model, device, dtype, img });
    note(`${model} ${device} ${dtype}: ${r}`);
  }
};

// معمل 2: إزالة الخلفية على Hugging Face Space (BiRefNet) بحصة الزائر
const SPACE_LAB = async ({ page, note, FIXDIR, save }) => {
  const b64 = (await fs.readFile(path.join(FIXDIR, "product.jpg"))).toString("base64");
  const out = await page.evaluate(async ({ b64 }) => {
    const log = [];
    const spaces = ["https://not-lain-background-removal.hf.space", "https://zhengpeng7-birefnet-demo.hf.space", "https://eccv2022-dis-background-removal.hf.space"];
    for (const host of spaces) {
      for (const pre of ["/gradio_api", ""]) {
        try {
          const r = await fetch(`${host}${pre}/info`);
          const t = await r.text();
          log.push(`${host}${pre}/info ${r.status} ${t.slice(0, 1500)}`);
          if (r.ok) break;
        } catch (e) { log.push(`${host}${pre}/info ERR ${e.message}`); }
      }
    }
    // تجربة فعلية على أول Space
    try {
      const host = spaces[0], pre = "/gradio_api";
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const fd = new FormData();
      fd.append("files", new Blob([bin], { type: "image/jpeg" }), "p.jpg");
      const t0 = performance.now();
      const up = await fetch(`${host}${pre}/upload`, { method: "POST", body: fd });
      const paths = await up.json();
      log.push(`upload ${up.status} ${JSON.stringify(paths).slice(0, 200)}`);
      const info = await (await fetch(`${host}${pre}/info`)).json();
      const names = Object.keys(info.named_endpoints || {});
      log.push(`endpoints ${names.join(" ")}`);
      for (const name of names) {
        const ep = info.named_endpoints[name];
        const params = ep.parameters || [];
        const data = params.map((p) => (/image|file/i.test(JSON.stringify(p.python_type || p.type || p.component)) ? { path: paths[0], meta: { _type: "gradio.FileData" } } : p.parameter_default ?? null));
        const c = await fetch(`${host}${pre}/call${name}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
        const cj = await c.json().catch(() => ({}));
        log.push(`call ${name} ${c.status} ${JSON.stringify(cj).slice(0, 200)} params=${JSON.stringify(params.map((p) => [p.parameter_name, p.component, p.python_type?.type])).slice(0, 300)}`);
        if (!cj.event_id) continue;
        const sres = await fetch(`${host}${pre}/call${name}/${cj.event_id}`);
        const txt = await sres.text();
        log.push(`result ${name} ${sres.status} in ${Math.round(performance.now() - t0)}ms ${txt.slice(0, 900)}`);
      }
    } catch (e) { log.push(`call ERR ${e.message}`); }
    return log;
  }, { b64 });
  for (const l of out) note(l.slice(0, 1600));
  await save("space-lab", out);
};

export const CHECKS = [
  { name: "home", path: "/", max: 4 },
  { name: "seller", path: "/seller", max: 5 },
  {
    name: "test-ad", path: "/test-ad",
    async run({ page, shot, screens, note }) {
      await shot("form");
      await page.getByRole("button", { name: "جرّب بمثال" }).click();
      await page.getByRole("button", { name: "اعرض إعلاني على 100 زبون" }).click();
      await page.waitForTimeout(1200);
      await shot("running");
      await page.getByRole("button", { name: /اعرض النتيجة على طول/ }).waitFor({ timeout: 75000 });
      await page.waitForTimeout(4500);
      await shot("comments");
      await page.getByRole("button", { name: /اعرض النتيجة على طول/ }).click();
      await page.waitForTimeout(2500);
      await screens("result", 9);
      const dl = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
      await page.getByRole("button", { name: /شارك نتيجتك/ }).click();
      const d = await dl;
      if (d) { await d.saveAs(`ci-out/test-ad-story-${page.viewportSize().width}.png`); note("story saved"); } else note("no story download");
      // إعادة الاختبار بالنسخة المحسّنة
      await page.getByRole("button", { name: /اختبر النسخة دي/ }).click();
      await page.getByRole("button", { name: /اعرض النتيجة على طول/ }).waitFor({ timeout: 75000 });
      await page.getByRole("button", { name: /اعرض النتيجة على طول/ }).click();
      await page.waitForTimeout(2500);
      await shot("retest");
    },
  },
  {
    name: "photo-ad", path: "/photo-ad",
    async run({ page, shot, screens, note }) {
      await shot("start");
      await page.locator("input[type=file]").nth(1).setInputFiles(path.join(FIX, "product.jpg"));
      await page.getByText(/الخلفية اتشالت|صورتك هتتحط في إطار/).first().waitFor({ timeout: 240000 });
      note(await page.getByText(/الخلفية اتشالت|صورتك هتتحط في إطار/).first().textContent());
      await page.waitForTimeout(4000);
      await page.getByPlaceholder("450 ج").fill("1850 ج");
      await page.getByPlaceholder("900 ج").fill("2600 ج");
      await page.getByPlaceholder("01012345678").fill("01012345678");
      await page.waitForTimeout(1800);
      await screens("shots", 4);
      await page.getByRole("button", { name: /اكتبلي الإعلان كامل/ }).click();
      await page.getByText("فهمنا كده:").waitFor({ timeout: 70000 }).catch(() => note("pack timeout"));
      await page.waitForTimeout(800);
      await screens("pack", 5);
      await page.getByRole("button", { name: /اعمل الفيديو/ }).click().catch(() => note("no video button"));
      await page.waitForTimeout(7000);
      await shot("video");
    },
  },
  {
    name: "voice-post", path: "/voice-post",
    async run({ page, shot, screens, note, BASE }) {
      await shot("idle");
      await page.getByRole("button", { name: "ابدأ التسجيل" }).click();
      await page.waitForTimeout(2500);
      await shot("rec");
      await page.getByRole("button", { name: "خلصت ✓" }).click();
      await page.waitForTimeout(6000);
      await shot("after-fake-mic");
      // فويس حقيقي بالعربي (متولد بالـ TTS) مرفوع زي فويس واتساب
      await page.goto(BASE + "/voice-post", { waitUntil: "load" });
      const file = "ci-out/voice-sample.mp3";
      try { await fs.access(file); } catch { note("no voice sample"); return; }
      await page.locator("input[type=file]").setInputFiles(file);
      await page.getByText("ده كلامك مكتوب").waitFor({ timeout: 60000 });
      note("transcript: " + (await page.locator("textarea").inputValue()).slice(0, 200));
      await shot("transcript");
      await page.getByRole("button", { name: /حوّله لبوستات/ }).click();
      await page.getByText("البوستات جاهزة").waitFor({ timeout: 70000 });
      await page.waitForTimeout(800);
      await screens("pack", 4);
    },
  },
  {
    name: "catalog", path: "/catalog",
    async run({ page, shot, screens, note }) {
      await shot("empty");
      await page.getByLabel("اسم المحل").fill("بوتيك ليلى");
      await page.getByLabel("رقم الواتساب").fill("01012345678");
      await page.locator("input[type=file][multiple]").setInputFiles([0, 1, 2, 3, 4].map((i) => path.join(FIX, `p${i}.jpg`)));
      await page.waitForTimeout(1200);
      await page.getByRole("button", { name: /سمّي المنتجات/ }).click();
      await page.waitForFunction(() => !document.body.innerText.includes("بنتعرّف على المنتجات"), null, { timeout: 90000 }).catch(() => note("naming slow"));
      for (const [i, pr] of [[1, "650 ج"], [2, "420 ج"], [3, "380 ج"], [4, "299 ج"], [5, "510 ج"]]) await page.getByLabel(`سعر المنتج ${i}`).fill(pr);
      await page.getByLabel("السعر قبل الخصم 1").fill("900 ج");
      await page.getByRole("button", { name: /اكتب الأوصاف/ }).click();
      await page.waitForFunction(() => !document.body.innerText.includes("بنكتب الأوصاف"), null, { timeout: 60000 }).catch(() => note("descs slow"));
      await page.getByRole("button", { name: /شيل الخلفيات/ }).click();
      await page.waitForFunction(() => !document.body.innerText.includes("بنشيل الخلفيات") && !document.body.innerText.includes("بنشيل خلفيات"), null, { timeout: 180000 }).catch(() => note("bg slow"));
      note("after bg: " + ((await page.locator("[role=alert]").allInnerTexts()).join(" | ") || "no error"));
      await page.waitForTimeout(2500);
      await screens("built", 7);
      const dl = page.waitForEvent("download", { timeout: 30000 }).catch(() => null);
      await page.getByRole("button", { name: /حمّل الكتالوج PDF/ }).click();
      const d = await dl;
      if (d) { await d.saveAs(`ci-out/catalog-${page.viewportSize().width}.pdf`); note("pdf saved"); } else note("no pdf");
      const imgs = [];
      page.on("download", (x) => imgs.push(x));
      await page.getByRole("button", { name: /صور للحالة/ }).click();
      await page.waitForTimeout(4000);
      for (let i = 0; i < imgs.length; i++) await imgs[i].saveAs(`ci-out/catalog-page-${page.viewportSize().width}-${i + 1}.jpg`);
      note(`page images ${imgs.length}`);
    },
  },
  {
    name: "chat-pdf", path: "/chat", viewports: ["mobile"],
    async run({ page, shot, note, FIXDIR }) {
      await page.setInputFiles('[data-testid="chat-file"]', [path.join(FIXDIR, "guide-ar.pdf"), path.join(FIXDIR, "policy-ar.docx")]);
      await page.waitForFunction(() => !document.querySelector('[class*="filePending"]'), null, { timeout: 40000 });
      await shot("ready");
      await page.fill("#chat-in", "كام تكلفة فيسبوك الشهرية وكام أوردر جابت؟ وإيه مصاريف الشحن للقاهرة؟");
      await page.click('button[aria-label="إرسال"]');
      await page.waitForFunction(() => document.body.innerText.includes("3000") || document.body.innerText.includes("٣٠٠٠"), null, { timeout: 60000 }).catch(() => note("answer lacked 3000"));
      await page.waitForTimeout(6000);
      await shot("answer");
      const txt = await page.evaluate(() => document.body.innerText);
      note(`has 3000=${/3000|3,000/.test(txt)} has 45=${/45/.test(txt)} has 50=${/50/.test(txt)}`);
    },
  },
  // معامل التجارب (بتشتغل بس لو اسمها مكتوب في scripts/ci/ONLY)
  { name: "cutout-lab", lab: true, path: "/tool/remove-bg", viewports: ["desktop"], run: CUTOUT_LAB },
  { name: "space-lab", lab: true, path: "/tool/remove-bg", viewports: ["desktop"], run: SPACE_LAB },
  {
    name: "cutout-lab-gpu", lab: true, path: "/tool/remove-bg", viewports: ["desktop"], run: CUTOUT_LAB,
    launchArgs: ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--use-vulkan=swiftshader", "--use-webgpu-adapter=swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
  },
  {
    name: "remove-bg", path: "/tool/remove-bg",
    async run({ page, shot, note }) {
      await page.locator("input[type=file]").first().setInputFiles(path.join(FIX, "product.jpg"));
      const done = page.getByText(/الخلفية اتشالت/).first();
      const failed = page.getByRole("button", { name: /شيلها على سيرفر/ });
      await Promise.race([done.waitFor({ timeout: 240000 }), failed.waitFor({ timeout: 240000 })]).catch(() => note("remove-bg timeout"));
      if (await failed.isVisible().catch(() => false)) {
        note("device failed → trying cloud button");
        await shot("device-failed");
        await failed.click();
        await done.waitFor({ timeout: 90000 }).catch(() => note("cloud timeout"));
      }
      note((await done.isVisible().catch(() => false)) ? "background removed" : "NOT removed");
      await shot("result");
    },
  },
  {
    name: "receipt", path: "/subscriptions/receipt",
    async run({ page, shot, screens, note }) {
      await shot("start");
      for (const n of ["ChatGPT", "Claude", "Google AI (Gemini)", "Canva", "Midjourney", "CapCut"]) await page.getByRole("button", { name: n, exact: true }).first().click();
      const segs = page.getByRole("group", { name: "بتستخدمه قد إيه" });
      await segs.nth(2).getByRole("button", { name: "نادراً" }).click();
      await segs.nth(4).getByRole("button", { name: "كل أسبوع" }).click();
      await screens("items", 4);
      await page.getByRole("button", { name: /اطبع كشف الحساب/ }).click();
      await page.waitForTimeout(3500);
      await screens("paper", 6);
      const dl = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
      await page.getByRole("button", { name: /شارك الكشف/ }).click();
      const d = await dl;
      if (d) { await d.saveAs(`ci-out/receipt-story-${page.viewportSize().width}.png`); note("story saved"); } else note("no story");
    },
  },
];

export const API_CHECKS_FIRST = [
  {
    name: "voice-tts-transcribe",
    async run({ BASE, OUT }) {
      const say = "عندي طقم حلل جرانيت تركي عشر قطع، سعره ألف وتمنمية وخمسين جنيه، وفيه منه لونين رمادي وبيج، والشحن لكل محافظات مصر والدفع عند الاستلام.";
      const t = await fetch(BASE + "/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: say, voice: "ar-EG-ShakirNeural" }) });
      if (!t.ok) return { ok: false, notes: [`tts ${t.status}`] };
      const buf = Buffer.from(await t.arrayBuffer());
      await fs.mkdir(OUT, { recursive: true });
      await fs.writeFile(path.join(OUT, "voice-sample.mp3"), buf);
      const fd = new FormData();
      fd.append("audio", new Blob([buf], { type: "audio/mpeg" }), "voice.mp3");
      const t0 = Date.now();
      const r = await fetch(BASE + "/api/transcribe", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok && (j.text || "").length > 20, notes: [`transcribe ${r.status} in ${Date.now() - t0}ms`, `said: ${say}`, `got: ${j.text || j.error}`], data: j };
    },
  },
];

export const API_CHECKS = [
  {
    name: "chat-research",
    async run({ BASE }) {
      const r = await fetch(BASE + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": `10.1.${Math.floor(Math.random() * 250)}.7` }, body: JSON.stringify({ messages: [{ role: "user", content: "إيه آخر أخبار سعر الدولار في مصر النهارده؟" }], model: "balanced", web: true }) });
      const text = await r.text();
      let src = []; try { src = JSON.parse(decodeURIComponent(r.headers.get("x-sources") || "[]")); } catch {}
      return { ok: r.ok && r.headers.get("x-search") === "ok" && src.length > 0 && text.length > 80, notes: [`status ${r.status} search=${r.headers.get("x-search")} sources=${src.length}`, `domains: ${src.map((x) => x.d || x.u).slice(0, 5).join(", ")}`, text.slice(0, 400)] };
    },
  },
  {
    name: "chat-long-doc",
    async run({ BASE }) {
      // ملف طويل (حوالي 60 ألف حرف) فيه معلومة واحدة مدفونة في النص
      const filler = (i) => `الفقرة ${i}: تقرير دوري عن حركة المبيعات والمخزون في الفرع الرئيسي، ومعدلات الشحن والتسليم، وملاحظات عامة لا تحتوي على قرارات.`;
      const lines = Array.from({ length: 500 }, (_, i) => filler(i));
      lines[311] = "قرار مهم: تم الاتفاق على أن سعر الجملة لمنتج «مصباح نور» هو 187 جنيه للقطعة بداية من الشهر القادم.";
      const text = lines.join("\n\n");
      const r = await fetch(BASE + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": `10.2.${Math.floor(Math.random() * 250)}.9` }, body: JSON.stringify({ messages: [{ role: "user", content: "سعر الجملة لمصباح نور كام؟" }], model: "balanced", docs: [{ name: "report.txt", text }] }) });
      const out = await r.text();
      return { ok: r.ok && /187/.test(out), notes: [`status ${r.status} x-docs=${r.headers.get("x-docs")} chars=${text.length}`, out.slice(0, 300)] };
    },
  },
  {
    name: "chat-summarize-long",
    async run({ BASE }) {
      const parts = ["الفصل الأول: بيتكلم عن اختيار الجمهور المستهدف.", "الفصل الثاني: بيتكلم عن الإعلانات الممولة وتكلفتها.", "الفصل الثالث: بيتكلم عن صناعة المحتوى والريلز.", "الفصل الرابع: بيتكلم عن قياس النتايج."];
      const text = parts.map((p, i) => `${p}\n\n` + Array.from({ length: 120 }, (_, k) => `تفاصيل ${k} في الفصل ${i + 1} مع أمثلة وأرقام وتوصيات متكررة للتوضيح.`).join("\n\n")).join("\n\n");
      const r = await fetch(BASE + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": `10.3.${Math.floor(Math.random() * 250)}.5` }, body: JSON.stringify({ messages: [{ role: "user", content: "لخّصلي الملف في 4 نقاط" }], model: "balanced", docs: [{ name: "guide.txt", text }], instructions: "اكتب بالفصحى فقط" }) });
      const out = await r.text();
      const hits = ["الجمهور", "الإعلانات", "المحتوى", "قياس"].filter((w) => out.includes(w)).length;
      return { ok: r.ok && hits >= 3, notes: [`status ${r.status} x-docs=${r.headers.get("x-docs")} covered=${hits}/4`, out.slice(0, 500)] };
    },
  },
  {
    name: "test-ad",
    async run({ BASE }) {
      const r = await post(BASE, "/api/test-ad", { text: "عرض الأسبوع 🔥 شنطة جلد طبيعي حريمي، 3 ألوان، بـ 650 جنيه بدل 900. الشحن لكل المحافظات والدفع عند الاستلام. اطلبي واتساب 01012345678", platform: "facebook", audience: "women" });
      const ok = r.status === 200 && r.data.personas?.length >= 6 && r.data.tally && r.data.rewrite;
      return { ok, notes: [`status ${r.status} in ${r.ms}ms`, ok ? `score ${r.data.score} tally ${JSON.stringify(r.data.tally)}` : JSON.stringify(r.data).slice(0, 300)], data: r.data };
    },
  },
  {
    name: "test-ad-image",
    async run({ BASE }) {
      const r = await post(BASE, "/api/test-ad", { text: "عطر فرنساوي أصلي بـ 450 بس! اطلب دلوقتي", image: await dataUrl("product.jpg"), platform: "instagram", audience: "all" });
      const ok = r.status === 200 && r.data.personas?.length >= 6;
      return { ok, notes: [`status ${r.status} in ${r.ms}ms`, `sawImage=${r.data.sawImage}`, `photo=${JSON.stringify(r.data.photo || r.data).slice(0, 300)}`], data: r.data };
    },
  },
  {
    name: "product-eye",
    async run({ BASE }) {
      const r = await post(BASE, "/api/product-eye", { image: await dataUrl("product.jpg") });
      return { ok: r.status === 200 && !!r.data.name, notes: [`status ${r.status} in ${r.ms}ms`, JSON.stringify(r.data).slice(0, 400)], data: r.data };
    },
  },
  {
    name: "catalog-copy",
    async run({ BASE }) {
      const r = await post(BASE, "/api/catalog-copy", { shop: "بوتيك ليلى", products: [{ name: "شنطة يد جلد طبيعي", price: "650 ج" }, { name: "شنطة كروس صغيرة", price: "420 ج" }, { name: "محفظة حريمي", price: "199 ج" }] });
      return { ok: r.status === 200 && r.data.descs?.length === 3, notes: [`status ${r.status} in ${r.ms}ms`, JSON.stringify(r.data).slice(0, 400)], data: r.data };
    },
  },
  {
    name: "ad-pack-voice",
    async run({ BASE }) {
      const r = await post(BASE, "/api/ad-pack", { source: "voice", info: "بص يا سيدي عندي يعني طقم حلل جرانيت تركي عشر قطع بيتباع بألف وتمنمية وخمسين جنيه وفيه منه رمادي وبيج والشحن لكل مصر والدفع عند الاستلام" });
      const ok = r.status === 200 && !!r.data.facebook && !!r.data.whatsapp;
      return { ok, notes: [`status ${r.status} in ${r.ms}ms`, ok ? `missing=${JSON.stringify(r.data.missing)} tags=${r.data.hashtags?.length}` : JSON.stringify(r.data).slice(0, 300)], data: r.data };
    },
  },
];
