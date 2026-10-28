// يتأكد إن نية الصورة بتتوصف صح واللينك بيترسم (من غير ما يستدعي LLM حقيقي؛ بيختبر الـ regex والشكل)
const IMAGE_INTENT = /(ارسم|اعمل\s*(لي|لى)?\s*صورة|اصنع\s*(لي|لى)?\s*صورة|صمم\s*(لي|لى)?\s*صورة|ولّد\s*صورة|ولد\s*صورة|وريني\s*صورة|عايز\s*صورة|عاوز\s*صورة|ممكن\s*صورة|اطلعلي\s*صورة|صورة\s*ل|generate\s+(an?\s+)?image|create\s+(an?\s+)?image|draw\s+(me\s+)?(an?\s+)?|picture\s+of|image\s+of)/i;
const cases = [
  ["عاوز صوره الاهرامات", true],
  ["ارسملي قطة بيضا", true],
  ["draw a cat", true],
  ["إيه رأيك في مصر", false],
  ["ممكن صورة شجرة في الصحراء وقت الغروب", true],
];
for (const [t, expect] of cases) {
  const got = IMAGE_INTENT.test(t);
  console.log(got === expect ? "PASS" : "FAIL", JSON.stringify(t), "->", got);
}
