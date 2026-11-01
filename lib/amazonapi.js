// مساعدات مشتركة لـ API أدوات أمازون (على السيرفر بس)
import { askJson } from "@/lib/llmjson";
import { MARKETS } from "@/lib/amazon";

export const marketKey = (v) => (MARKETS[v] ? v : "eg");

/**
 * دالة ask بميزانية وقت: أول نداء دايماً بيتنفذ، والنداءات اللي بعده (تصليح/إعادة) بتتخطى لو الوقت قرب يخلص.
 * ده بيمنع إن الطلب يتقفل بـtimeout وكل اللي اتعمل يضيع.
 */
export function timedAsk(req, { budgetMs = 52_000, reserveMs = 16_000 } = {}) {
  const start = Date.now();
  let calls = 0;
  return (args) => {
    if (calls > 0 && Date.now() - start > budgetMs - reserveMs) return Promise.resolve(null);
    calls++;
    return askJson({ ...args, mode: "balanced", signal: req.signal });
  };
}

export const cleanText = (v, max) => String(v ?? "").replace(/\r/g, "").trim().slice(0, max);
