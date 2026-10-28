// مولّد صور احتياطي على السيرفر: بيشتغل بس لو حصة الزائر المجانية على Hugging Face خلصت أو الموديل مشغول.
// الترتيب: Cloudflare Workers AI (لو المفاتيح موجودة) ← Together (لو المفتاح موجود) ← Pollinations بدون مفتاح.
// كل المصادر مجانية. المفاتيح في Vercel:
//   CF_ACCOUNT_ID + CF_API_TOKEN  (حساب Cloudflare مجاني: 10,000 وحدة يومياً ≈ 170 صورة)
//   TOGETHER_API_KEY              (موديل FLUX.1-schnell-Free)
import { fail, clientIp, rateLimiter } from "@/lib/groq";

const tooMany = rateLimiter(15); // 15 صورة احتياطية في الساعة لكل زائر، عشان الحصة المشتركة تكفي الكل
export const maxDuration = 60;

const SIZES = { "1024x1024": [1024, 1024], "768x1024": [768, 1024], "1024x768": [1024, 768] };

const b64ToBytes = (b64) => Buffer.from(b64, "base64");

async function cloudflare(prompt, _size, signal) { // flux-1-schnell على Cloudflare بيطلع 1024×1024 دايماً
  const id = process.env.CF_ACCOUNT_ID, token = process.env.CF_API_TOKEN;
  if (!id || !token) return null;
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${id}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, steps: 4 }),
    signal,
  });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  const img = j?.result?.image;
  return img ? { bytes: b64ToBytes(img), type: "image/jpeg" } : null;
}

async function together(prompt, [width, height], signal) {
  const key = process.env.TOGETHER_API_KEY;
  if (!key) return null;
  const r = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "black-forest-labs/FLUX.1-schnell-Free", prompt, width, height, steps: 4, n: 1, response_format: "b64_json" }),
    signal,
  });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  const img = j?.data?.[0]?.b64_json;
  return img ? { bytes: b64ToBytes(img), type: "image/jpeg" } : null;
}

async function pollinations(prompt, [width, height], signal) {
  const seed = Math.floor(Math.random() * 1e6);
  const r = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`, { signal });
  const type = r.headers.get("content-type") || "";
  if (!r.ok || !type.startsWith("image/")) return null;
  const bytes = Buffer.from(await r.arrayBuffer());
  return bytes.length > 2000 ? { bytes, type } : null;
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 1200) : "";
  const size = SIZES[body.size] || SIZES["1024x1024"];
  if (!prompt) return fail("مفيش وصف.", 400);
  if (tooMany(clientIp(req))) return fail("وصلت لحد الصور الساعة دي. جرّب بعد شوية.", 429);

  for (const run of [cloudflare, together, pollinations]) {
    try {
      const out = await run(prompt, size, req.signal);
      if (out) return new Response(out.bytes, { headers: { "Content-Type": out.type, "Cache-Control": "no-store" } });
    } catch {}
  }
  return fail("كل المولّدات مشغولة دلوقتي. جرّب بعد دقيقة.", 503);
}
