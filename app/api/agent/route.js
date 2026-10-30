// تشغيل وكيل: تخطيط ← بحث ← قراءة المصادر ← كتابة. بيرجّع أحداث سطر بسطر (NDJSON):
// {t:"step",m}  خطوة شغالة دلوقتي
// {t:"src",items:[{n,title,url}]}  المصادر
// {t:"x",d}  جزء من الرد النهائي
// {t:"err",m}  مشكلة
import { getAgent } from "@/lib/agents";
import { getModel } from "@/lib/models";
import { fail, clientIp, rateLimiter, chainFor, completeOnce, streamFromGroq } from "@/lib/groq";
import { webSearch, searchProvider } from "@/lib/websearch";

export const maxDuration = 120;
const tooMany = rateLimiter(12); // الوكيل أتقل من الأداة العادية: 12 تشغيل في الساعة لكل زائر

const clip = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);

// قراءة صفحة: نجيب الـHTML ونطلع النص بس (من غير مكتبات عشان الخفة)
async function readPage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RisingStarAi/1.0)", Accept: "text/html" },
      signal: AbortSignal.timeout(6000),
      redirect: "follow",
    });
    if (!res.ok || !/text\/html/.test(res.headers.get("content-type") || "")) return "";
    const html = (await res.text()).slice(0, 400000);
    const text = html
      .replace(/<(script|style|noscript|svg|nav|footer|header|form)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    return clip(text, 3500);
  } catch {
    return "";
  }
}

async function planQueries(agent, inputText, signal) {
  const msg = [
    { role: "system", content: `انت مخطط بحث. ${agent.plan}\nرجّع JSON بس بالشكل ده: {"q":["...","...","..."]} من غير أي كلام تاني.` },
    { role: "user", content: inputText },
  ];
  const models = [
    { id: "openai/gpt-oss-20b", effort: "low", provider: "groq" },
    { id: "gemini-flash-lite-latest", effort: null, provider: "gemini" },
  ];
  for (const m of models) {
    const out = await completeOnce(m, { messages: msg, temperature: 0.3, maxTokens: 500, signal });
    const j = out && out.match(/\{[\s\S]*\}/);
    try {
      const q = JSON.parse(j[0]).q.filter((x) => typeof x === "string" && x.trim()).slice(0, 3);
      if (q.length) return q.map((x) => clip(x.trim(), 150));
    } catch {}
  }
  return [clip(inputText.replace(/\n/g, " "), 150)];
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const agent = getAgent(body.agent);
  if (!agent) return fail("الوكيل غير موجود.", 404);

  const values = {};
  for (const f of agent.fields) {
    const v = String(body.inputs?.[f.key] || f.def || "").trim().slice(0, 1500);
    if (!v) return fail(`اكتب «${f.label}».`, 400);
    values[f.key] = v;
  }
  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي (الوكلاء بياخدوا مجهود أكبر). جرّب بعد شوية.", 429);

  const inputText = agent.fields.map((f) => `${f.label}: ${values[f.key]}`).join("\n");
  const enc = new TextEncoder();
  const signal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (o) => { try { controller.enqueue(enc.encode(JSON.stringify(o) + "\n")); } catch {} };
      try {
        let sources = [];
        let context = "";
        if (searchProvider()) {
          send({ t: "step", m: "بخطط للبحث…" });
          const queries = await planQueries(agent, inputText, signal);
          send({ t: "step", m: `ببحث: ${queries.join(" • ")}` });
          const lists = await Promise.all(queries.map((q) => webSearch(q)));
          const seen = new Set();
          for (let i = 0; i < 6; i++) {
            for (const list of lists) {
              const r = list[i];
              if (r && !seen.has(r.url) && sources.length < 8) { seen.add(r.url); sources.push(r); }
            }
          }
          if (sources.length) {
            send({ t: "step", m: `لقيت ${sources.length} مصدر، بقرا أهمهم…` });
            const texts = await Promise.all(sources.slice(0, 4).map((s) => readPage(s.url)));
            sources = sources.map((s, i) => ({ ...s, body: texts[i] || "" }));
            send({ t: "src", items: sources.map((s, i) => ({ n: i + 1, title: s.title, url: s.url })) });
            context = sources.map((s, i) => `[${i + 1}] ${s.title}${s.date ? ` (${s.date})` : ""}\n${s.url}\n${s.body || s.snippet}`).join("\n\n");
          } else {
            send({ t: "step", m: "البحث ما رجعش نتايج، هكتب من معلوماتي…" });
          }
        } else {
          send({ t: "step", m: "البحث على الإنترنت مش مفعّل لسه، هكتب من معلومات الموديل…" });
        }

        send({ t: "step", m: "بكتب النتيجة…" });
        const today = new Date().toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "full" });
        const system = `انت «${agent.name}» على موقع Rising StarAi. تاريخ النهارده: ${today}.\n${agent.write}\n${
          context ? "اعتمد على المصادر اللي تحت أولاً، وما تخترعش أرقام أو أسعار مش موجودة فيها." : "مفيش بحث في الإنترنت متاح دلوقتي. اكتب في أول سطر بالظبط: «⚠️ البحث في الإنترنت مش متاح دلوقتي، فدي معلومات عامة ممكن تكون مش محدثة.» وما تذكرش اسم أي موديل أو تاريخ تدريب. ممنوع تخترع أسماء محلات أو شركات أو أسعار محددة أو مصادر أو دراسات: اكتب أنواع وفئات ونطاقات تقريبية بس، وقول إنها تقديرية."
        }`;
        const messages = [{ role: "system", content: system }, { role: "user", content: context ? `${inputText}\n\nالمصادر:\n${context}` : inputText }];
        const res = await streamFromGroq({ chain: chainFor(getModel("balanced")), messages, temperature: 0.4, maxTokens: 3500, signal });
        if (!res.ok || !res.body) {
          let m = "حصلت مشكلة مؤقتة. جرّب تاني.";
          try { m = (await res.json()).error || m; } catch {}
          send({ t: "err", m });
        } else {
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const d = dec.decode(value, { stream: true });
            if (d) send({ t: "x", d });
          }
        }
        send({ t: "done" });
      } catch {
        send({ t: "err", m: "الاتصال اتقطع. جرّب تاني." });
      }
      try { controller.close(); } catch {}
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
}
