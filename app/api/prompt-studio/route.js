// استوديو البرومبتات: فيديو، صورة، شات، هوك، إعلان. الموديل بيكتب والكود بيراجع (lib/promptstudio.js).
// حد لكل زائر في الساعة، وكاش للطلبات المتكررة عشان نفس الطلب ما يتحسبش مرتين.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { askJson } from "@/lib/llmjson";
import { parseRequest, systemPrompt, userMessage, normalizeItems, cacheKey } from "@/lib/promptstudio";
import { withSection } from "@/lib/sectionkeys";

export const maxDuration = 60;
const tooMany = rateLimiter(20);

const CACHE_TTL = 30 * 60_000;
const CACHE_MAX = 300;
const cache = new Map();
const cached = (k) => {
  const hit = cache.get(k);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL) { cache.delete(k); return null; }
  return hit.items;
};
const remember = (k, items) => {
  cache.set(k, { at: Date.now(), items });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
};

async function handlePost(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const parsed = parseRequest(body);
  if (parsed.error) return fail(parsed.error, 400);
  const r = parsed.req;
  const avoid = (Array.isArray(body.avoid) ? body.avoid : []).slice(-20).map((a) => String(a).slice(0, 300));

  // الكاش بيتجاهل لو المستخدم طلب «غيّر» (avoid موجود) عشان ياخد نسخ جديدة
  const key = cacheKey(r);
  if (!avoid.length) {
    const hit = cached(key);
    if (hit) return Response.json({ items: hit, cached: true });
  }

  if (tooMany(clientIp(req))) return fail("وصلت للحد الساعة دي. استنى شوية وارجع تاني.", 429);

  const res = await askJson({
    messages: [{ role: "system", content: systemPrompt(r) }, { role: "user", content: userMessage(r, avoid) }],
    normalize: (o) => normalizeItems(o, r, { avoid }),
    mode: "strong",
    temperature: r.kind === "hook" || r.kind === "ad" ? 0.9 : 0.75,
    maxTokens: Math.min(6500, 900 + r.count * (r.kind === "chat" ? 520 : r.kind === "ad" ? 640 : 420)),
    signal: req.signal,
  });
  if (!res) return fail("الاستوديو مشغول دلوقتي. جرّب تاني بعد دقيقة.", 503);
  if (!avoid.length) remember(key, res.items);
  return Response.json({ items: res.items });
}

export const POST = withSection("aiwork", handlePost);
