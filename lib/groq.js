// الاتصال بالموديلات — بيستخدمه الشات والأدوات (على السيرفر بس)
// المزود الأساسي Groq، ومعاه طبقة احتياطية اختيارية من OpenRouter (انظر lib/models.js)
import { GROQ_IDS, OPENROUTER_FALLBACK_IDS, GEMINI_STRONG, GEMINI_FAST } from "@/lib/models";
import { SITE_URL, BRAND } from "@/lib/site";
import { credsFor, coolDown, countShared, hasAnyKey, currentSection as currentSectionName } from "@/lib/sectionkeys";

const PROVIDER_URL = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  // واجهة جوجل المتوافقة مع OpenAI (مفتاح من Google AI Studio)
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  // DeepInfra: نفس موديلات Llama بسعر أرخص من Groq (مفتاح DEEPINFRA_API_KEY)، متوافق مع OpenAI
  deepinfra: "https://api.deepinfra.com/v1/openai/chat/completions",
  // طبقة أخيرة مجانية بدون مفتاح خالص (API مفتوح من Pollinations)
  pollinations: "https://text.pollinations.ai/openai",
};
// جوجل بتقفل الموديلات القديمة للمفاتيح الجديدة (gemini-2.5-flash اتقفل)، فبنستخدم الأسماء المتجددة (-latest) من lib/models.js
const DEEPINFRA_IDS = (process.env.DEEPINFRA_MODELS || "meta-llama/Llama-3.3-70B-Instruct-Turbo,meta-llama/Llama-3.3-70B-Instruct").split(",").map((x) => x.trim()).filter(Boolean);
const POLLINATIONS_MODEL = process.env.POLLINATIONS_MODEL || "openai";

const keyFor = (provider) =>
  provider === "openrouter" ? process.env.OPENROUTER_API_KEY
  : provider === "gemini" ? process.env.GEMINI_API_KEY
  : provider === "deepinfra" ? process.env.DEEPINFRA_API_KEY
  : provider === "pollinations" ? "anon" // مفيش مفتاح مطلوب، دايماً متاح
  : process.env.GROQ_API_KEY;

// مفاتيح المزود للقسم الحالي (مفاتيح القسم أولاً ثم العام). Pollinations من غير مفتاح
const credsOf = (provider) => (provider === "pollinations" ? [{ key: "anon", label: "pollinations", shared: false }] : credsFor(provider));

function headersFor(provider, key = keyFor(provider)) {
  if (provider === "openrouter") {
    return {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      // OpenRouter بيطلبهم عشان يعرف مين بيستخدم المفتاح (مش إجباري لكن منصوح بيه)
      "HTTP-Referer": SITE_URL,
      "X-Title": BRAND,
    };
  }
  if (provider === "pollinations") return { "Content-Type": "application/json" }; // بدون مفتاح
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export const fail = (error, status) => Response.json({ error }, { status });

/** عنوان الزائر لحماية الحد في الساعة */
export function clientIp(req) {
  return (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
}

/** حد بسيط لكل زائر في الساعة (لحد ما نضيف تسجيل الدخول) */
export function rateLimiter(limitPerHour) {
  const hits = new Map();
  return function tooMany(ip) {
    const now = Date.now();
    const list = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
    if (list.length >= limitPerHour) return true;
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 5000) hits.delete(hits.keys().next().value); // منع امتلاء الذاكرة
    return false;
  };
}

/** الطبقات الاحتياطية المشتركة في آخر أي سلسلة: OpenRouter (لو مفعّل)، Gemini (لو مفعّل)، وPollinations آخر طبقة دايماً شغالة. */
export function fallbackTail() {
  const tail = [];
  // DeepInfra أول الطبقات الاحتياطية (بعد Groq) لو المفتاح موجود: Llama 70B بسعر أرخص. لو فشل بنكمل على اللي بعده
  if (hasAnyKey("deepinfra")) tail.push(...DEEPINFRA_IDS.map((id) => ({ id, effort: null, provider: "deepinfra" })));
  if (hasAnyKey("openrouter")) tail.push(...OPENROUTER_FALLBACK_IDS.map((id) => ({ id, effort: null, provider: "openrouter" })));
  if (hasAnyKey("gemini")) tail.push({ id: GEMINI_STRONG, effort: null, provider: "gemini" }, { id: GEMINI_FAST, effort: null, provider: "gemini" });
  tail.push({ id: POLLINATIONS_MODEL, effort: null, provider: "pollinations" });
  return tail;
}

// نفس الموديل عند نفس المزود ما يتجربش مرتين في السلسلة
const dedupe = (chain) => {
  const seen = new Set();
  return chain.filter((m) => {
    const k = `${m.provider}|${m.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/** سلسلة سريعة للمهام الصغيرة (جملة بحث، برومبت صورة، ملخص قصير): Gemini Lite الأول، وبعده Groq، وبعدها الاحتياطي */
export function quickChain() {
  return dedupe([
    { id: GEMINI_FAST, effort: null, provider: "gemini" },
    ...["llama-3.3-70b-versatile", "moonshotai/kimi-k2-instruct-0905", "llama-3.1-8b-instant"].map((id) => ({ id, effort: "low", provider: "groq" })),
    ...fallbackTail(),
  ]);
}

/** سلسلة موديلات قراءة الصور (Groq شال موديلات Llama 4 البصرية). مجربة في 2026-10-29. */
export function visionChain() {
  return [
    { id: process.env.GEMINI_VISION_MODEL || "gemini-flash-lite-latest", effort: null, provider: "gemini" },
    { id: "qwen/qwen3.8-27b", effort: null, provider: "groq" },
    { id: "gemini-flash-latest", effort: null, provider: "gemini" },
  ];
}

/** ترتيب الموديلات: موديلات الاختيار الأول (Gemini عادةً)، وبعده Groq، وآخرهم الطبقات الاحتياطية المشتركة */
export function chainFor(mode) {
  // GROQ_MODEL في Vercel بيغيّر موديل Groq الأساسي لـ«متوازن» من غير ما تعدّل الكود
  const first = mode.key === "balanced" && process.env.GROQ_MODEL ? process.env.GROQ_MODEL : mode.id;
  const groq = [first, ...GROQ_IDS].filter(Boolean).map((id) => ({ id, effort: mode.effort || "low", provider: "groq" }));
  return dedupe([...(mode.lead || []), ...groq, ...fallbackTail()]);
}

function requestBody({ id, effort, provider }, { messages, temperature, maxTokens }) {
  // موديلات Gemini بتفكر قبل الرد والتفكير بيتحسب من max_tokens، فبنديها مساحة أكبر عشان الرد ما يتقطعش
  const max = provider === "gemini" ? Math.max(maxTokens || 0, 4096) : maxTokens;
  const body = { model: id, stream: true, temperature, max_tokens: max, messages };
  return body;
}

/** طلب واحد من غير تدفق (بيستخدمه دمج النماذج). بيرجّع النص أو null لو فشل */
export async function completeOnce({ id, effort, provider = "groq" }, { messages, temperature = 0.5, maxTokens = 1400, signal }) {
  const body = { ...requestBody({ id, effort, provider }, { messages, temperature, maxTokens }), stream: false };
  for (const c of credsOf(provider)) {
    try {
      if (c.shared) countShared(currentSectionName());
      const res = await fetch(PROVIDER_URL[provider], { method: "POST", headers: headersFor(provider, c.key), body: JSON.stringify(body), signal });
      if (res.status === 429 || res.status === 401 || res.status === 403) { coolDown(c.label, res.status === 429 ? 60_000 : 600_000); continue; }
      if (!res.ok) return null;
      const data = await res.json();
      const text = String(data?.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      return text || null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * يبعت الطلب (Groq، وبعده OpenRouter لو مفعّل) ويرجّع رد نصي بيوصل كلمة بكلمة.
 * لو موديل فشل أو اتزحم، بيجرب اللي بعده في السلسلة — المستخدم مش بيحس بأي حاجة من ده.
 */
// سبب فشل الموديل بشكل مختصر للتشخيص (من غير أي مفتاح)
// بنشيل الروابط والأكواد الطويلة (زي رقم المفتاح في لوحة OpenRouter) عشان السبب بيظهر للزوار
const scrub = (t) => String(t || "")
  .replace(/(AIza|sk-|gsk_|fta_)[\w-]{6,}/g, "***")
  .replace(/https?:\/\/\S+/g, "")
  .replace(/\b[0-9a-f]{20,}\b/gi, "")
  .replace(/\s+/g, " ").trim().slice(0, 160);
async function failReason(model, res, note) {
  let msg = note || "";
  if (res) {
    try {
      const raw = await res.text();
      try {
        const j = JSON.parse(raw);
        const e = Array.isArray(j) ? j[0]?.error : j.error;
        msg = (typeof e === "string" ? e : e?.message || e?.status) || raw;
      } catch { msg = raw; }
    } catch {}
  }
  return `${model.provider}/${model.id} → ${res ? res.status : "no response"}${msg ? `: ${scrub(msg)}` : ""}`;
}

export async function streamFromGroq({ chain, messages, temperature, maxTokens, signal, headers = {} }) {
  let busy = false;
  let held = false; // في مفاتيح بس موقوفة مؤقتاً (سقف يومي أو راحة بعد 429)
  let tried = false;
  let why = "";
  for (const model of chain) {
    const creds = credsOf(model.provider);
    if (!creds.length) { if (hasAnyKey(model.provider)) { held = true; } continue; } // مفيش مفتاح متاح للمزود ده في القسم الحالي (غير موجود أو وصل سقفه أو في راحة) — نعدّي عليه
    tried = true;
    for (const c of creds) {
      let res;
      // مهلة لوصول بداية الرد: موديل معلّق ما يوقفش الطلب كله (الملفات الطويلة عند Gemini أبطأ فمهلتها أطول)
      const ctl = new AbortController();
      const onAbort = () => ctl.abort();
      signal?.addEventListener("abort", onAbort);
      const timer = setTimeout(() => ctl.abort(), model.timeoutMs || 25000);
      try {
        if (c.shared) countShared(currentSectionName());
        res = await fetch(PROVIDER_URL[model.provider], {
          method: "POST",
          headers: headersFor(model.provider, c.key),
          // موديل في السلسلة ممكن يكون له رسائل خاصة بيه (مثلاً Gemini بياخد الملف كله والباقي أجزاء منه)
          body: JSON.stringify(requestBody(model, { messages: model.messages || messages, temperature, maxTokens })),
          signal: ctl.signal,
        });
      } catch {
        if (signal?.aborted) return fail("اتلغى الطلب.", 499);
        why = await failReason(model, null, ctl.signal.aborted ? "timeout" : "network error");
        break; // نجرب الموديل اللي بعده
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      }
      // 429 أو مفتاح مرفوض: نجرب المفتاح اللي بعده لنفس الموديل (مفتاح القسم ثم العام)
      if (res.status === 429 || res.status === 401 || res.status === 403) {
        if (res.status === 429) busy = true;
        coolDown(c.label, res.status === 429 ? 60_000 : 600_000);
        why = await failReason(model, res);
        continue;
      }
      // غير كده = الموديل مش متاح: نجرب الموديل اللي بعده بدل ما نوقف كله
      if (!res.ok || !res.body) { why = await failReason(model, res); break; }
      return new Response(toTextStream(res.body), {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "x-model": `${model.provider}/${model.id}`, ...headers },
      });
    }
  }
  if (!tried && held) return fail("الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.", 429);
  if (!tried) return fail("مفيش مفتاح API صالح. حط GROQ_API_KEY في إعدادات Vercel.", 500);
  const error = busy ? "الخدمة مشغولة دلوقتي. جرّب بعد دقيقة." : "حصلت مشكلة مؤقتة. جرّب تاني.";
  // why: سبب آخر فشل (للتشخيص في صفحة المقارنة). مفيهوش مفاتيح
  return Response.json({ error, why }, { status: busy ? 429 : 502 });
}

// نحوّل رد Groq (SSE) لنص صافي، ونشيل أي تفكير داخلي بين <think> و</think>
function toTextStream(upstream) {
  const reader = upstream.getReader();
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const think = thinkFilter();
  let buf = "";
  return new ReadableStream({
    async start(controller) {
      const send = (t) => { if (t) controller.enqueue(enc.encode(t)); };
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop();
          for (const line of lines) {
            const l = line.trim();
            if (!l.startsWith("data:")) continue;
            const data = l.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const piece = JSON.parse(data)?.choices?.[0]?.delta?.content;
              if (piece) send(think.push(piece));
            } catch {
              // سطر ناقص، نتجاهله
            }
          }
        }
        send(think.flush());
      } catch {
        try { send("\n\n⚠️ الاتصال اتقطع. اضغط إعادة التوليد."); } catch {}
      }
      try { controller.close(); } catch {}
    },
    cancel() {
      // المستخدم ضغط «إيقاف» أو قفل الصفحة: نوقف الطلب عند Groq كمان
      reader.cancel().catch(() => {});
    },
  });
}

/** فلتر بيشيل <think>...</think> حتى لو الوسم اتقسم على أكتر من جزء */
export function thinkFilter() {
  const OPEN = "<think>";
  const CLOSE = "</think>";
  let inside = false;
  let hold = "";
  let trimLead = false;

  const tail = (s, tag) => {
    for (let n = Math.min(tag.length - 1, s.length); n > 0; n--) {
      if (tag.startsWith(s.slice(-n))) return s.slice(-n);
    }
    return "";
  };
  const emit = (t) => {
    if (!trimLead) return t;
    const out = t.replace(/^\s+/, "");
    if (out) trimLead = false;
    return out;
  };

  return {
    push(chunk) {
      let s = hold + chunk;
      hold = "";
      let out = "";
      while (s) {
        if (inside) {
          const i = s.indexOf(CLOSE);
          if (i === -1) { hold = tail(s, CLOSE); return out; }
          s = s.slice(i + CLOSE.length);
          inside = false;
          trimLead = true;
        } else {
          const i = s.indexOf(OPEN);
          if (i === -1) {
            const t = tail(s, OPEN);
            out += emit(s.slice(0, s.length - t.length));
            hold = t;
            return out;
          }
          out += emit(s.slice(0, i));
          s = s.slice(i + OPEN.length);
          inside = true;
        }
      }
      return out;
    },
    flush() {
      const rest = inside ? "" : emit(hold);
      hold = "";
      return rest;
    },
  };
}
