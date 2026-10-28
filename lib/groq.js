// الاتصال بالموديلات — بيستخدمه الشات والأدوات (على السيرفر بس)
// المزود الأساسي Groq، ومعاه طبقة احتياطية اختيارية من OpenRouter (انظر lib/models.js)
import { FALLBACK_IDS, OPENROUTER_FALLBACK_IDS } from "@/lib/models";
import { SITE_URL, BRAND } from "@/lib/site";

const PROVIDER_URL = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  // واجهة جوجل المتوافقة مع OpenAI (مفتاح من Google AI Studio)
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  // طبقة أخيرة مجانية بدون مفتاح خالص (API مفتوح من Pollinations)
  pollinations: "https://text.pollinations.ai/openai",
};
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const POLLINATIONS_MODEL = process.env.POLLINATIONS_MODEL || "openai";

const keyFor = (provider) =>
  provider === "openrouter" ? process.env.OPENROUTER_API_KEY
  : provider === "gemini" ? process.env.GEMINI_API_KEY
  : provider === "pollinations" ? "anon" // مفيش مفتاح مطلوب، دايماً متاح
  : process.env.GROQ_API_KEY;

function headersFor(provider) {
  if (provider === "openrouter") {
    return {
      Authorization: `Bearer ${keyFor("openrouter")}`,
      "Content-Type": "application/json",
      // OpenRouter بيطلبهم عشان يعرف مين بيستخدم المفتاح (مش إجباري لكن منصوح بيه)
      "HTTP-Referer": SITE_URL,
      "X-Title": BRAND,
    };
  }
  if (provider === "pollinations") return { "Content-Type": "application/json" }; // بدون مفتاح
  return { Authorization: `Bearer ${keyFor(provider)}`, "Content-Type": "application/json" };
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

/** الطبقات الاحتياطية المشتركة بعد Groq: OpenRouter (لو مفعّل)، Gemini (لو مفعّل)، وPollinations آخر طبقة دايماً شغالة.
 *  أي مكان في الموقع بيستخدم سلسلة نماذج (الشات العادي، أو دمج النماذج) لازم ينتهي بالطبقات دي. */
export function fallbackTail() {
  const tail = [];
  if (keyFor("openrouter")) tail.push(...OPENROUTER_FALLBACK_IDS.map((id) => ({ id, effort: null, provider: "openrouter" })));
  if (keyFor("gemini")) tail.push({ id: GEMINI_MODEL, effort: null, provider: "gemini" });
  tail.push({ id: POLLINATIONS_MODEL, effort: null, provider: "pollinations" });
  return tail;
}

/** ترتيب الموديلات: المختار الأول، وبعده بدائل Groq، وآخرهم الطبقات الاحتياطية المشتركة */
export function chainFor(mode) {
  // GROQ_MODEL في Vercel بيغيّر موديل «متوازن» من غير ما تعدّل الكود
  const first = mode.key === "balanced" && process.env.GROQ_MODEL ? process.env.GROQ_MODEL : mode.id;
  const rest = FALLBACK_IDS.filter((id) => id !== first);
  const chain = [first, ...rest].map((id) => ({ id, effort: mode.effort || "low", provider: "groq" }));
  chain.push(...fallbackTail());
  return chain;
}

function requestBody({ id, effort, provider }, { messages, temperature, maxTokens }) {
  const body = { model: id, stream: true, temperature, max_tokens: maxTokens, messages };
  // موديلات gpt-oss على Groq: قد إيه تفكر قبل الرد. التفكير نفسه بيوصل في حقل منفصل ومش بيتعرض
  if (provider === "groq" && /^openai\/gpt-oss/.test(id)) body.reasoning_effort = effort;
  return body;
}

/** طلب واحد من غير تدفق (بيستخدمه دمج النماذج). بيرجّع النص أو null لو فشل */
export async function completeOnce({ id, effort, provider = "groq" }, { messages, temperature = 0.5, maxTokens = 1400, signal }) {
  const apiKey = keyFor(provider);
  if (!apiKey) return null;
  const body = { ...requestBody({ id, effort, provider }, { messages, temperature, maxTokens }), stream: false };
  try {
    const res = await fetch(PROVIDER_URL[provider], { method: "POST", headers: headersFor(provider), body: JSON.stringify(body), signal });
    if (!res.ok) return null;
    const data = await res.json();
    const text = String(data?.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    return text || null;
  } catch {
    return null;
  }
}

/**
 * يبعت الطلب (Groq، وبعده OpenRouter لو مفعّل) ويرجّع رد نصي بيوصل كلمة بكلمة.
 * لو موديل فشل أو اتزحم، بيجرب اللي بعده في السلسلة — المستخدم مش بيحس بأي حاجة من ده.
 */
export async function streamFromGroq({ chain, messages, temperature, maxTokens, signal, headers = {} }) {
  let busy = false;
  let tried = false;
  for (const model of chain) {
    const apiKey = keyFor(model.provider);
    if (!apiKey) continue; // مفيش مفتاح للمزود ده (مثلاً OpenRouter مش مفعّل) — نعدّي عليه
    tried = true;
    let res;
    try {
      res = await fetch(PROVIDER_URL[model.provider], {
        method: "POST",
        headers: headersFor(model.provider),
        body: JSON.stringify(requestBody(model, { messages, temperature, maxTokens })),
        signal,
      });
    } catch {
      if (signal?.aborted) return fail("اتلغى الطلب.", 499);
      continue;
    }
    if (res.status === 429) { busy = true; continue; }
    if (res.status === 401) continue; // مفتاح المزود ده غلط — نجرب المزود/الموديل اللي بعده بدل ما نوقف كله
    if (!res.ok || !res.body) continue;
    return new Response(toTextStream(res.body), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", ...headers },
    });
  }
  if (!tried) return fail("مفيش مفتاح API صالح. حط GROQ_API_KEY في إعدادات Vercel.", 500);
  return busy ? fail("الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.", 429) : fail("حصلت مشكلة مؤقتة. جرّب تاني.", 502);
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
