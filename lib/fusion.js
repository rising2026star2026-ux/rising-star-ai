// «دمج 4 نماذج»: نفس السؤال بيروح لـ 4 نماذج قوية في نفس الوقت، وبعدين محرر نهائي
// بيكتب منهم إجابة واحدة هي الأدق، ومعاها تدقيق لغوي كامل (على السيرفر بس).
//
// النماذج بتتختار لوحدها من اللي متاح على Groq دلوقتي (بالترتيب اللي تحت).
// تقدر تحدد نماذج بنفسك من Vercel بمتغيّر FUSION_MODELS، مثال:
//   FUSION_MODELS=groq:openai/gpt-oss-120b,openrouter:anthropic/claude-sonnet-5.5,openrouter:google/gemini-3.8-flash,groq:moonshotai/kimi-k2-instruct-0905
// (موديلات openrouter محتاجة OPENROUTER_API_KEY وبتتحاسب على كل رسالة)
//
// مهم للتكلفة: كل سؤال = 5 طلبات (4 مسودات + المحرر). على خطة Groq المجانية ده بيخلّص الحد اليومي أسرع.
import { BOTS } from "@/lib/bots";
import { groqModels } from "@/lib/botcatalog";
import { completeOnce, streamFromGroq, fallbackTail } from "@/lib/groq";

const CANDIDATES = [
  "openai/gpt-oss-120b",
  "moonshotai/kimi-k2-instruct-0905",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "qwen/qwen3-32b",
  "llama-3.3-70b-versatile",
  "qwen/qwen3.8-27b",
  "minimaxai/minimax-m2.7",
  "openai/gpt-oss-20b",
];

const DRAFT_TIMEOUT_MS = 26000;

const EDITOR = [
  "أنت المحرر النهائي في منصة Rising StarAi.",
  "وصلتك مسودات إجابة من أكتر من نموذج ذكاء اصطناعي على نفس سؤال المستخدم.",
  "اكتب إجابة واحدة نهائية هي الأفضل: خد أدق المعلومات وأوضح شرح وأحسن أمثلة من المسودات، وصحّح أي معلومة غلط، ولو المسودات اختلفت في معلومة رجّح الأصح واذكر لو فيه شك.",
  "احذف التكرار، وخلّي الإجابة منظمة ومختصرة على قد السؤال.",
  "ما تذكرش المسودات ولا أسماء النماذج ولا إنك دمجت إجابات.",
  "التدقيق اللغوي إلزامي قبل ما ترد: راجع الإملاء والنحو وعلامات الترقيم والهمزات والتاء المربوطة والألف المقصورة، ومن غير أخطاء كتابة.",
  "لو المستخدم كاتب بالعامية رد بنفس اللهجة، مع إملاء سليم.",
].join(" ");

function labelFor({ id, provider }) {
  const b = BOTS.find((x) => x.id === id || x.fallbackId === id);
  if (b) return { name: b.name, logo: b.logo || null };
  const short = id.split("/").pop().replace(/[-_]/g, " ");
  return { name: short, logo: null, provider };
}

export async function pickFusionModels() {
  const env = (process.env.FUSION_MODELS || "").trim();
  if (env) {
    return env.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 4).map((x) => {
      const m = x.match(/^(groq|openrouter):(.+)$/);
      return m ? { provider: m[1], id: m[2] } : { provider: "groq", id: x };
    });
  }
  const live = await groqModels();
  const ids = live ? CANDIDATES.filter((id) => live.has(id)) : CANDIDATES;
  return ids.slice(0, 4).map((id) => ({ provider: "groq", id }));
}

/** معلومات النماذج اللي هتشارك (للعرض في الواجهة) */
export async function fusionLineup() {
  return (await pickFusionModels()).map(labelFor);
}

/**
 * الرد المدمج: بيرجّع Response نصي متدفق زي باقي الشات.
 * الهيدر x-fusion فيه أسماء النماذج اللي اشتغلت، عشان الواجهة تعرضها.
 */
export async function fusionResponse({ system, messages, temperature = 0.6, signal, headers = {} }) {
  const models = await pickFusionModels();
  const info = models.map(labelFor);
  const enc = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const send = (t) => { try { if (t) controller.enqueue(enc.encode(t)); } catch {} };
      const pipe = async (res) => {
        const reader = res.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      };

      try {
        const timeout = AbortSignal.timeout(DRAFT_TIMEOUT_MS);
        const sig = signal ? AbortSignal.any([signal, timeout]) : timeout;
        const base = [{ role: "system", content: system }, ...messages];
        const drafts = await Promise.all(
          models.map((m) => completeOnce({ ...m, effort: "low" }, { messages: base, temperature, maxTokens: 1500, signal: sig }))
        );
        const good = drafts.map((t, i) => ({ t, name: info[i].name })).filter((d) => d.t);
        if (signal?.aborted) return controller.close();

        // ولا نموذج رد: نرجع لرد عادي بنموذج واحد
        if (!good.length) {
          const res = await streamFromGroq({
            chain: [{ id: "openai/gpt-oss-120b", effort: "low", provider: "groq" }, { id: "openai/gpt-oss-20b", effort: "low", provider: "groq" }, ...fallbackTail()],
            messages: base, temperature, maxTokens: 3200, signal,
          });
          if (res.ok && res.body) await pipe(res);
          else send("الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.");
          return controller.close();
        }

        const last = messages[messages.length - 1]?.content || "";
        const draftsText = good.map((d, i) => `### المسودة ${i + 1}\n${d.t.slice(0, 6000)}`).join("\n\n");
        const editorMsgs = [
          { role: "system", content: `${EDITOR}\n\n${system}` },
          ...messages.slice(0, -1),
          { role: "user", content: `سؤال المستخدم:\n${last}\n\nالمسودات (${good.length}):\n\n${draftsText}\n\nاكتب الإجابة النهائية دلوقتي.` },
        ];
        const res = await streamFromGroq({
          chain: [{ id: "openai/gpt-oss-120b", effort: "low", provider: "groq" }, { id: "openai/gpt-oss-20b", effort: "low", provider: "groq" }, ...fallbackTail()],
          messages: editorMsgs, temperature: 0.4, maxTokens: 3600, signal,
        });
        if (res.ok && res.body) await pipe(res);
        else send(good.sort((a, b) => b.t.length - a.t.length)[0].t); // المحرر مشغول: أطول مسودة
      } catch {
        send("\n\n⚠️ الاتصال اتقطع. اضغط إعادة المحاولة.");
      }
      try { controller.close(); } catch {}
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "x-fusion": encodeURIComponent(JSON.stringify(info)),
      ...headers,
    },
  });
}
