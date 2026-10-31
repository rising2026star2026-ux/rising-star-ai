// «كشف حساب اشتراكاتك»: بيحسب اللي بتدفعه فعلاً، وفين الفلوس اللي بتضيع، بقواعد واضحة وقابلة للشرح.
// القواعد (كل اشتراك بياخد أكبر توفير واحد بس):
//   1) تكرار: اشتراكين بيعملوا نفس الشغل ← خلي الأكتر استخداماً، والتاني يتلغى
//   2) استخدام نادر ← الخطة اللي من غير فلوس لو موجودة، وإلا يتلغى مع بدائل بـ 0 جنيه
//   3) استخدام أسبوعي ← أرخص خطة من نفس الأداة بتغطي نفس الاحتياج
//   4) استخدام يومي بدفع شهري ← الدفع السنوي لو أرخص
import { SUB_TOOLS, ALL_OPTIONS, NEEDS, USD_EGP, toEgp } from "@/lib/subscriptions";

export const USAGE = { daily: "كل يوم", weekly: "كل أسبوع", rarely: "نادراً" };
const RANK = { daily: 3, weekly: 2, rarely: 1 };
const needName = Object.fromEntries(NEEDS.map((n) => [n.id, n.name]));
export const toolById = Object.fromEntries(SUB_TOOLS.map((t) => [t.id, t]));

// الأشهر الأول في الاختيار
export const POPULAR = ["chatgpt", "claude", "gemini", "canva", "capcut", "midjourney", "perplexity", "grok", "elevenlabs", "suno", "cursor", "notion", "copilot", "runway", "kling", "heygen", "grammarly", "gamma", "deepl", "ideogram"];

export const paidPlans = (tool) => tool.plans.filter((p) => p.usd > 0);

/** الخطة المقترحة أول ما يختار الأداة: أقرب خطة مدفوعة لـ 20 دولار (الأشهر عادة) */
export function defaultPlan(tool) {
  const paid = paidPlans(tool);
  if (!paid.length) return tool.plans[0]?.name;
  return paid.reduce((a, b) => (Math.abs(b.usd - 20) < Math.abs(a.usd - 20) ? b : a)).name;
}

const planOf = (item) => toolById[item.toolId]?.plans.find((p) => p.name === item.plan);
export const monthlyUsd = (item) => {
  const p = planOf(item);
  if (!p) return 0;
  return item.billing === "yearly" && p.usdYear ? p.usdYear : p.usd;
};
const covers = (item) => planOf(item)?.covers || {};
const primaryNeed = (c) => Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0];

/** الخطة أ بتغطي كل احتياجات الخطة ب بنفس المستوى أو أعلى؟ */
function coversAll(a, b) {
  return Object.entries(b).every(([k, lvl]) => (a[k] || 0) >= lvl);
}

function freeAlternatives(need, excludeTool, n = 2) {
  return ALL_OPTIONS.filter((o) => o.usd === 0 && o.toolId !== excludeTool && (o.covers[need] || 0) >= 1).slice(0, n).map((o) => o.tool);
}

export function analyze(items, feePct = 0) {
  const fee = 1 + Math.max(0, Math.min(30, Number(feePct) || 0)) / 100;
  const rows = items.filter((it) => planOf(it)).map((it) => ({ ...it, tool: toolById[it.toolId], planObj: planOf(it), usd: monthlyUsd(it) }));
  const tips = new Map(); // toolId → {save, text, kind}

  // 1) التكرار
  const sorted = [...rows].sort((a, b) => RANK[b.usage] - RANK[a.usage] || Object.keys(covers(b)).length - Object.keys(covers(a)).length || b.usd - a.usd);
  const kept = [];
  for (const r of sorted) {
    const over = kept.find((k) => primaryNeed(covers(k)) === primaryNeed(covers(r)) && coversAll(covers(k), covers(r)));
    if (over && r.usd > 0) tips.set(r.toolId, { save: r.usd, kind: "cancel", text: `ممكن تستغنى عنه: ${over.tool.name} بيغطي نفس الشغل (${needName[primaryNeed(covers(r))] || "نفس الاحتياج"})` });
    else kept.push(r);
  }

  for (const r of rows) {
    if (tips.has(r.toolId)) continue;
    const cands = [];
    const c = covers(r);
    if (r.usage === "rarely") {
      const free = r.tool.plans.find((p) => p.usd === 0);
      if (free) cands.push({ save: r.usd, kind: "free", text: `انزل للخطة Free (بـ 0 ج): بتستخدمه نادراً` });
      else {
        const alts = freeAlternatives(primaryNeed(c), r.toolId);
        cands.push({ save: r.usd, kind: "cancel", text: `ألغيه: بتستخدمه نادراً${alts.length ? `، وفيه بدائل بـ 0 ج زي ${alts.join(" و")}` : ""}` });
      }
    }
    if (r.usage === "weekly") {
      const need = Object.fromEntries(Object.keys(c).map((k) => [k, 1]));
      const cheaper = r.tool.plans.filter((p) => p.usd < r.usd && coversAll(p.covers, need)).sort((a, b) => a.usd - b.usd)[0];
      if (cheaper) cands.push({ save: r.usd - cheaper.usd, kind: "down", text: `انزل لخطة ${cheaper.name}${cheaper.usd === 0 ? " (بـ 0 ج)" : ""}: استخدامك الأسبوعي تكفيه` });
    }
    if (r.usage !== "rarely" && r.billing !== "yearly" && r.planObj.usdYear && r.planObj.usdYear < r.planObj.usd) {
      cands.push({ save: r.planObj.usd - r.planObj.usdYear, kind: "year", text: `ادفع سنوي بدل شهري` });
    }
    const best = cands.sort((a, b) => b.save - a.save)[0];
    if (best && best.save > 0) tips.set(r.toolId, best);
  }

  const lines = rows.map((r) => ({ toolId: r.toolId, name: r.tool.name, plan: r.plan, usage: r.usage, billing: r.billing, logo: r.tool.logo, tint: r.tool.tint, mono: r.tool.mono, egp: toEgp(r.usd * fee), usd: r.usd }));
  const savings = [...tips.entries()].map(([toolId, t]) => ({ toolId, name: toolById[toolId].name, egp: toEgp(t.save * fee), kind: t.kind, text: t.text }))
    .sort((a, b) => b.egp - a.egp);
  const monthly = lines.reduce((a, l) => a + l.egp, 0);
  const save = savings.reduce((a, l) => a + l.egp, 0);
  const ratio = monthly ? save / monthly : 0;
  const needs = [...new Set(rows.flatMap((r) => Object.keys(covers(r))))];
  return {
    lines, savings, needs,
    monthly, yearly: monthly * 12,
    save, saveYear: save * 12,
    after: monthly - save,
    score: Math.round(100 - ratio * 100),
    verdict: ratio >= 0.5 ? { t: "بتصرف كتير على الفاضي", k: "fire" } : ratio >= 0.2 ? { t: "فيه فلوس بتضيع كل شهر", k: "warn" } : ratio > 0 ? { t: "معقول، وفيه توفير بسيط", k: "ok" } : { t: "اشتراكاتك مظبوطة", k: "great" },
    rate: USD_EGP,
    feePct: Math.round((fee - 1) * 1000) / 10,
  };
}

// اللي ممكن يتعمل جوه Rising StarAi لكل احتياج (اقتراح، مش محسوب في التوفير)
export const SITE_FOR = {
  chat: { href: "/chat", label: "شات بأقوى الموديلات ودمج 4 نماذج" },
  writing: { href: "/tools?cat=writing", label: "أدوات كتابة وتدقيق بالعربي" },
  research: { href: "/chat", label: "بحث على الإنترنت بالمصادر جوه الشات" },
  image: { href: "/maker", label: "صانع الصور والفيديو" },
  design: { href: "/tools?cat=studio", label: "استوديو التصميم (بوسترات وإزالة خلفية)" },
  video: { href: "/photo-ad", label: "فيديو إعلان من صورة منتجك" },
  voice: { href: "/tool/video-factory", label: "تعليق صوتي مصري في الفيديو" },
  translate: { href: "/tool/translate", label: "ترجمة بالعربي والمصري" },
  slides: { href: "/tools", label: "أدوات العروض والتقارير" },
};
