// التقرير بالعربي: مكتوب عشان يتقري على الموبايل في دقيقة. البايظ الأول، وبعده السيرفرات الواقعة،
// وبعده الحاجات اللي محتاجة نظرة متجمّعة حسب نوع المشكلة، وفي الآخر تفاصيل تقنية مقفولة (لـ Claude).

const DAYS = ["الأحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة", "السبت"];
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
export function arDate(d = new Date()) {
  const c = new Date(new Date(d).getTime() + 2 * 3600e3); // توقيت القاهرة
  return `${DAYS[c.getUTCDay()]} ${c.getUTCDate()} ${MONTHS[c.getUTCMonth()]} ${c.getUTCFullYear()}`;
}

const CATS = [
  [/بطيئة|أخد \d+ ثانية|ما خلصتش تحميل/, "⏱️ بطء"],
  [/أعرض من شاشة/, "📱 صفحات أعرض من شاشة الموبايل"],
  [/صورة مكسورة/, "🖼️ صور مكسورة"],
  [/كلام بايظ/, "🔣 كلام بايظ ظاهر للمستخدم"],
  [/إنجليزي|التنسيق مكسور|كلام داخلي|رفض أو اعتذر/, "✍️ جودة ردود الذكاء الاصطناعي"],
  [/ملفات ناقصة|طلبات من الصفحة/, "📁 ملفات أو طلبات فاشلة"],
  [/خطأ في كود/, "🐞 أخطاء في الكود"],
];
const catOf = (text) => (CATS.find(([re]) => re.test(text)) || [null, "📌 حاجات تانية"])[1];

const GROUP_ORDER = { features: 0, tools: 1, ai: 2, pages: 3 };

/** يجمّع نتايج الجولة والتجارب لكل صفحة في عنصر واحد */
export function mergeItems(all) {
  const map = new Map();
  for (const r of all) {
    const key = r.path;
    const cur = map.get(key) || { path: key, name: r.name || key, group: r.group, problems: [], tech: [], shots: [], ms: r.ms, notes: [] };
    if (r.group !== "pages" && GROUP_ORDER[r.group] < GROUP_ORDER[cur.group]) cur.group = r.group;
    if (r.name && (cur.name === key || r.group !== "pages")) cur.name = r.name;
    for (const p of r.problems || []) if (!cur.problems.some((x) => x.text === p.text)) cur.problems.push(p);
    cur.tech.push(...(r.tech || []));
    if (r.shot) cur.shots.push(r.shot);
    if (r.note) cur.notes.push(r.note);
    map.set(key, cur);
  }
  for (const it of map.values()) it.status = it.problems.some((p) => p.level === "broken") ? "broken" : it.problems.length ? "warn" : "ok";
  return [...map.values()];
}

export function buildReport({ items, spaces, links, meta, prev }) {
  const B = meta.base;
  const shotUrl = (s) => `https://github.com/${meta.repo}/blob/ci-results/robot/latest/${encodeURI(s)}`;
  const brokenItems = items.filter((i) => i.status === "broken").sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group]);
  const warnItems = items.filter((i) => i.status === "warn");
  const okCount = items.filter((i) => i.status === "ok").length;
  const downCritical = spaces.filter((s) => !s.up && s.feature);
  const downOther = spaces.filter((s) => !s.up && !s.feature);
  const deadLinks = links.filter((l) => l.level === "broken");
  const prevBroken = new Set(prev?.broken || []);
  const nowBroken = new Set(brokenItems.map((i) => i.path));
  const fixed = [...prevBroken].filter((p) => !nowBroken.has(p));

  const L = [];
  L.push(`# 🤖 تقرير الروبوت · ${arDate(meta.started)}`);
  L.push("");
  const mins = Math.round(meta.durationMs / 60000);
  L.push(`فحصت **${items.length}** صفحة وأداة في ${mins >= 1 ? `${mins} دقيقة` : `${Math.round(meta.durationMs / 1000)} ثانية`}.`);
  L.push("");
  L.push(`✅ **${okCount}** شغالين  ·  ❌ **${brokenItems.length}** بايظين  ·  ⚠️ **${warnItems.length}** محتاجين نظرة${downCritical.length ? `  ·  🛰️ **${downCritical.length}** سيرفر واقع` : ""}`);
  if (prev && fixed.length) L.push("", `🎉 **اتصلح من آخر تقرير:** ${fixed.length} (${fixed.slice(0, 6).map((p) => `\`${p}\``).join("، ")}${fixed.length > 6 ? " …" : ""})`);
  L.push("");

  if (brokenItems.length) {
    L.push("## ❌ بايظ (المستخدم مش هيعرف يستخدمه)");
    brokenItems.forEach((it, i) => {
      const isNew = prev && !prevBroken.has(it.path) ? " 🆕" : "";
      const why = it.problems.filter((p) => p.level === "broken").map((p) => p.text).join("، ");
      const pic = it.shots[0] ? ` · [📷 صورة](${shotUrl(it.shots[0])})` : "";
      L.push(`${i + 1}. **${it.name}**${isNew}: ${why}  `);
      L.push(`   [افتح](${B}${it.path})${pic}`);
    });
    L.push("");
  } else {
    L.push("## ✅ مفيش حاجة بايظة النهارده");
    L.push("");
  }

  if (downCritical.length || downOther.length) {
    L.push("## 🛰️ سيرفرات مجانية واقعة (مش عيب في كودنا)");
    for (const s of downCritical) L.push(`- **${s.feature}** واقف دلوقتي (${s.status || s.error || "مش بيرد"})`);
    if (downOther.length) L.push(`- ${downOther.length} سيرفر من اللي في «المكتبة» واقفين: ${downOther.slice(0, 6).map((s) => `\`${s.sub}\``).join("، ")}${downOther.length > 6 ? " …" : ""}`);
    L.push("");
  }

  if (warnItems.length || deadLinks.length) {
    L.push("## ⚠️ شغال بس محتاج نظرة");
    const groups = new Map();
    for (const it of warnItems.concat(brokenItems)) for (const p of it.problems.filter((x) => x.level === "warn")) {
      const c = catOf(p.text);
      if (!groups.has(c)) groups.set(c, []);
      groups.get(c).push({ it, p });
    }
    for (const [c, list] of groups) {
      L.push(`**${c}** (${list.length})`);
      const show = list.slice(0, 8);
      for (const { it, p } of show) L.push(`- [${it.name}](${B}${it.path}): ${p.text}`);
      if (list.length > show.length) L.push(`- و ${list.length - show.length} كمان`);
      L.push("");
    }
    if (deadLinks.length) {
      L.push(`**🔗 روابط لمواقع تانية مش شغالة** (${deadLinks.length})`);
      for (const l of deadLinks.slice(0, 10)) L.push(`- ${l.why}: ${l.url} (في \`${l.pages[0]}\`)`);
      if (deadLinks.length > 10) L.push(`- و ${deadLinks.length - 10} كمان`);
      L.push("");
    }
  }

  L.push("## 🧪 الروبوت جرّب إيه النهارده");
  L.push(`- فتح **${meta.pagesChecked}** صفحة على مقاس موبايل${meta.dirTotal ? ` (منهم ${meta.dirChecked} من ${meta.dirTotal} صفحة في دليل «أدوات عالمية»، والباقي بالتناوب)` : ""}.`);
  L.push(`- استخدم فعلياً **${meta.toolsRun}** أداة من أدوات الاستوديو و**${meta.featuresRun}** ميزة أساسية.`);
  L.push(`- جرّب **${meta.aiRun}** أداة كتابة بالذكاء الاصطناعي من ${meta.aiTotal} (الباقي في الأيام الجاية، عشان ما نستهلكش حصة Groq).`);
  if (meta.pageOnly?.length) L.push(`- أدوات الفيديو (${meta.pageOnly.length}) اتفحص إنها بتفتح بس، من غير تصدير فيديو.`);
  L.push(`- فحص ${spaces.length} سيرفر خارجي و${links.length} رابط لمواقع تانية.`);
  L.push("");

  // تفاصيل تقنية: مقفولة، وبتتقصّ لو التقرير طويل
  const tech = [];
  for (const it of brokenItems.concat(warnItems)) {
    const lines = [...new Set(it.tech)].filter(Boolean).slice(0, 4).map((t) => t.replace(/\s+/g, " ").slice(0, 300));
    tech.push(`- \`${it.path}\` [${it.status}] ${it.problems.map((p) => p.text).join(" | ")}${lines.length ? `\n  - ${lines.join("\n  - ")}` : ""}`);
  }
  for (const s of spaces.filter((x) => !x.up)) tech.push(`- space \`${s.sub}\` status=${s.status} ${s.error} (${s.files.join(", ")})`);
  let techText = tech.join("\n");
  if (techText.length > 30000) techText = techText.slice(0, 30000) + "\n…(اتقصّ، الباقي في results.json)";
  L.push("<details><summary>تفاصيل تقنية (لـ Claude وهو بيصلّح)</summary>", "", techText || "مفيش", "", `النتايج كاملة: \`ci-results/robot/latest/results.json\``, "</details>");
  return L.join("\n");
}

/** ملخص صغير بيتحفظ عشان تقرير بكرة يقارن بيه */
export function summaryOf({ items, spaces, meta }) {
  return {
    date: new Date(meta.started).toISOString(),
    total: items.length,
    ok: items.filter((i) => i.status === "ok").length,
    broken: items.filter((i) => i.status === "broken").map((i) => i.path),
    warn: items.filter((i) => i.status === "warn").length,
    spacesDown: spaces.filter((s) => !s.up).map((s) => s.sub),
    aiTested: meta.aiTested || [],
  };
}
