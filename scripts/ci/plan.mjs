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

export const CHECKS = [
  { name: "home", path: "/", max: 3 },
  {
    name: "test-ad", path: "/test-ad",
    async run({ page, shot, screens, note }) {
      await shot("form");
      await page.getByRole("button", { name: "جرّب بمثال" }).click();
      await page.getByRole("button", { name: "اعرض إعلاني على 100 زبون" }).click();
      await page.waitForTimeout(1500);
      await shot("running");
      await page.getByRole("button", { name: /اعرض النتيجة على طول/ }).waitFor({ timeout: 75000 });
      await page.waitForTimeout(4000);
      await shot("comments");
      await page.getByRole("button", { name: /اعرض النتيجة على طول/ }).click();
      await page.waitForTimeout(2500);
      await screens("result", 9);
      // صورة المشاركة
      const dl = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
      await page.getByRole("button", { name: /شارك نتيجتك/ }).click();
      const d = await dl;
      if (d) { await d.saveAs(`ci-out/test-ad-story-${page.viewportSize().width}.png`); note("story saved"); } else note("no story download");
    },
  },
  {
    name: "photo-ad", path: "/photo-ad",
    async run({ page, shot, screens, note }) {
      await shot("start");
      await page.locator('input[type=file]').nth(1).setInputFiles(path.join(FIX, "product.jpg"));
      await page.getByText(/الخلفية اتشالت|صورتك هتتحط في إطار/).waitFor({ timeout: 180000 });
      note(await page.getByText(/الخلفية اتشالت|صورتك هتتحط في إطار/).first().textContent());
      await page.waitForTimeout(3500);
      await page.getByPlaceholder("450 ج").fill("1850 ج");
      await page.getByPlaceholder("900 ج").fill("2600 ج");
      await page.getByPlaceholder("01012345678").fill("01012345678");
      await page.waitForTimeout(1500);
      await screens("shots", 4);
      await page.getByRole("button", { name: /اكتبلي الإعلان كامل/ }).click();
      await page.getByText("فهمنا كده:").waitFor({ timeout: 70000 }).catch(() => note("pack timeout"));
      await page.waitForTimeout(800);
      await screens("pack", 5);
      await page.getByRole("button", { name: /اعمل الفيديو/ }).click().catch(() => note("no video button"));
      await page.waitForTimeout(6000);
      await shot("video");
    },
  },
];

export const API_CHECKS = [
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
    name: "ad-pack-voice",
    async run({ BASE }) {
      const r = await post(BASE, "/api/ad-pack", { source: "voice", info: "بص يا سيدي عندي يعني طقم حلل جرانيت تركي عشر قطع بيتباع بألف وتمنمية وخمسين جنيه وفيه منه رمادي وبيج والشحن لكل مصر والدفع عند الاستلام" });
      const ok = r.status === 200 && !!r.data.facebook && !!r.data.whatsapp;
      return { ok, notes: [`status ${r.status} in ${r.ms}ms`, ok ? `missing=${JSON.stringify(r.data.missing)} tags=${r.data.hashtags?.length}` : JSON.stringify(r.data).slice(0, 300)], data: r.data };
    },
  },
];
