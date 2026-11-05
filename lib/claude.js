// Claude API (على السيرفر بس): استدعاء بأدوات (Tool Use) لحد ما النموذج يخلّص، وحساب تكلفة كل طلب.
// بيشتغل بس لو ANTHROPIC_API_KEY موجود في Vercel. لو مش موجود، المسارات بترجع للنماذج الحالية (lib/groq).
// الأسعار بالدولار لكل مليون توكن (نوفمبر 2026)، وتتغيّر من متغيرات البيئة لو الأسعار اتغيّرت.

const ENDPOINT = "https://api.anthropic.com/v1/messages";

export const CLAUDE_MODELS = {
  strong: process.env.CLAUDE_MODEL_STRONG || "claude-sonnet-5-5",
  fast: process.env.CLAUDE_MODEL_FAST || "claude-haiku-5-5",
};

const PRICE = {
  "claude-sonnet-5-5": { in: 2, out: 10 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5 },
};

export const hasClaude = () => !!process.env.ANTHROPIC_API_KEY;

export function costUsd(model, usage = {}) {
  const p = PRICE[model] || PRICE["claude-sonnet-5-5"];
  const inTok = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) * 1.25 + (usage.cache_read_input_tokens || 0) * 0.1;
  return (inTok * p.in + (usage.output_tokens || 0) * p.out) / 1e6;
}

// سقف تكلفة يومي للموقع كله (في ذاكرة السيرفر، تقريبي): لما يخلص، المسارات بترجع للنماذج الحالية
let day = "";
let spent = 0;
const dailyCap = () => Number(process.env.REALESTATE_DAILY_USD) || 5;
export function underDailyCap() {
  const d = new Date().toISOString().slice(0, 10);
  if (d !== day) { day = d; spent = 0; }
  return spent < dailyCap();
}
function addSpend(usd) { underDailyCap(); spent += usd; }

async function call(body, signal) {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(50000)]) : AbortSignal.timeout(50000),
  });
  if (!r.ok) throw new Error(`claude ${r.status}`);
  return r.json();
}

/**
 * حوار بأدوات: Claude بيطلب أداة، الكود بينفّذها ويرجّع النتيجة، لحد ما يكتب الرد النهائي.
 * tools = [{ name, description, input_schema }], handlers = { name: async (input) => result }
 * بيرجّع { text, model, usd, toolLog } أو null لو فشل (والمسار يرجع للنماذج الحالية).
 */
export async function claudeWithTools({ system, messages, tools = [], handlers = {}, model = CLAUDE_MODELS.strong, maxTokens = 2000, maxTurns = 4, signal }) {
  if (!hasClaude() || !underDailyCap()) return null;
  const convo = messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "") }));
  let usd = 0;
  const toolLog = [];
  try {
    for (let turn = 0; turn < maxTurns; turn++) {
      const res = await call({
        model,
        max_tokens: maxTokens,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: convo,
        ...(tools.length ? { tools } : {}),
      }, signal);
      usd += costUsd(model, res.usage);
      const blocks = res.content || [];
      const uses = blocks.filter((b) => b.type === "tool_use");
      if (res.stop_reason !== "tool_use" || !uses.length) {
        addSpend(usd);
        const text = blocks.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
        return text ? { text, model, usd, toolLog } : null;
      }
      convo.push({ role: "assistant", content: blocks });
      const results = [];
      for (const u of uses) {
        let out;
        try {
          const h = handlers[u.name];
          out = h ? await h(u.input || {}) : { error: "أداة غير معروفة" };
        } catch (e) {
          out = { error: String(e?.message || e).slice(0, 200) };
        }
        toolLog.push({ name: u.name, input: u.input });
        results.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(out).slice(0, 12000) });
      }
      convo.push({ role: "user", content: results });
    }
  } catch {
    addSpend(usd);
    return null;
  }
  addSpend(usd);
  return null;
}

/** نص كامل كرد متدفق (عشان الواجهة تقرا رد Claude بنفس طريقة الردود المتدفقة) */
export function textStream(text, headers = {}) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    start(c) {
      // على دفعات صغيرة عشان الواجهة تعرضه بالتدريج
      const parts = String(text).match(/[\s\S]{1,120}/g) || [];
      for (const p of parts) c.enqueue(enc.encode(p));
      c.close();
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...headers } });
}
