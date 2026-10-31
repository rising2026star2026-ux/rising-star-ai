// عرض «وفّر فاتورتك مع Rising StarAi»: بنقارن اشتراكاتك بباقة الموقع (250 ج/شهر).
// قاعدة صارمة: الاشتراك بيتحسب «بيتغطى» بس لو الموقع فعلاً بيعمل شغله (الكتابة، البحث، تلخيص PDF، المشاريع، الصور...).
// مفيش حاجة بتتحسب لو الموقع مش بيقدمها (موسيقى، فيديو بمقدّم، تفريغ اجتماعات).
import { toolById } from "@/lib/receipt";

export const SITE_PLAN_EGP = 250;
export const SITE_PLAN_NAME = "الباقة المتكاملة";

// اللي بنقول إنه «بديل» لاشتراك: الشات والكتابة والبحث وتلخيص الملفات والمشاريع بس.
// الصور والفيديو والتصميم والصوت في الموقع شغالين، لكن مش بنقول إنهم بديل لـ Midjourney أو CapCut أو غيرهم لأن الجودة والإمكانيات مختلفة.
export const SITE_NEEDS = {
  chat: "شات وكتابة بالعربي، وتلخيص ملفاتك ومشاريعك",
  writing: "كتابة وتدقيق لغوي بالعربي",
  research: "بحث بالمصادر، وتلخيص PDF وWord",
  translate: "ترجمة",
  code: "مساعدة في الكود داخل الشات",
};

// الأدوات اللي باقة Toolsurf بتفتحها حسب ما اتحدد مبدئياً، وبنسميها «وصول مشترك» بصراحة.
// مهم: القايمة دي لازم تتأكد من صفحة Toolsurf نفسها قبل ما نعتمد عليها في الإعلان.
export const TOOLSURF = {
  name: "Toolsurf",
  usd: 49,
  label: "وصول مشترك عن طريق Toolsurf",
  tools: ["canva", "grammarly", "quillbot", "jasper", "midjourney"],
  verified: false,
};

const primary = (covers) => Object.entries(covers || {}).sort((a, b) => b[1] - a[1])[0]?.[0];

/**
 * @param res نتيجة analyze() من lib/receipt.js
 * @returns { covered, uncovered, total, saveMonthly, saveYear, ... } أو null لو مفيش اشتراكات تتغطى
 */
export function siteOffer(res) {
  const covered = [];
  const tooled = [];
  const uncovered = [];
  for (const l of res.lines) {
    if (l.egp <= 0) continue;
    const tool = toolById[l.toolId];
    const plan = tool?.plans.find((p) => p.name === l.plan);
    const needs = Object.keys(plan?.covers || {});
    const main = primary(plan?.covers);
    // «بيتغطى» لو احتياجه الأساسي من اللي فوق، ومستوى استخدامه مش «كثيف» (خطط 100 و200 دولار بحدود الموقع مش بيطابقها)
    const heavy = needs.filter((k) => (plan.covers[k] || 0) >= 2);
    const level3 = needs.some((k) => plan.covers[k] >= 3);
    const ok = !level3 && SITE_NEEDS[main] && heavy.every((k) => SITE_NEEDS[k] || k === "image");
    if (ok) covered.push({ ...l, by: SITE_NEEDS[main] });
    else if (TOOLSURF.tools.includes(l.toolId)) tooled.push(l);
    else uncovered.push(l);
  }
  if (!covered.length && !tooled.length) return null;

  const coveredSum = covered.reduce((a, l) => a + l.egp, 0);
  const tooledSum = tooled.reduce((a, l) => a + l.egp, 0);
  const saveSite = coveredSum - SITE_PLAN_EGP;
  return {
    plan: SITE_PLAN_EGP,
    covered, tooled, uncovered,
    coveredSum, tooledSum,
    // التوفير الأساسي: اللي الموقع بيغطيه فعلاً، بعد خصم 250
    saveMonthly: Math.max(0, saveSite),
    saveYear: Math.max(0, saveSite) * 12,
    worth: saveSite > 0,
    // حالة كل الاشتراكات اللي مش عند الموقع، وتفضل زي ما هي
    remains: uncovered.reduce((a, l) => a + l.egp, 0),
  };
}
