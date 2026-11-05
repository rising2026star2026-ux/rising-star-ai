// خريطة المصادر في الباحث الأكاديمي: بتحوّل قايمة المصادر لشبكة مترابطة.
// النقط: المصادر نفسها، والمؤلفين اللي ظهروا في أكتر من مصدر، والمواضيع المشتركة.
// الروابط: مصدر بيستشهد بمصدر تاني في القايمة، أو مصدرين بيستشهدوا بنفس المراجع (ارتباط ببليوغرافي)،
// أو مصدر ومؤلفه، أو مصدر وموضوعه. كله بيتحسب في المتصفح من البيانات اللي جت من المكتبات.

const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();

// اسم المؤلف: «J. Smith» و«John Smith» نفس الشخص في الغالب: اسم العيلة + أول حرف
function authorKey(name) {
  const parts = norm(name).split(" ").filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[parts.length - 1]} ${parts[0][0]}`;
}

/**
 * sources: [{ n, title, authors, year, cites, kind, lib, oaid?, refs?, topics? }]
 * بيرجّع { nodes, links, stats }
 *   node: { id, type: "source"|"author"|"topic", label, n?, size, src? }
 *   link: { a, b, type: "cites"|"shared"|"author"|"topic", w }
 */
export function buildMap(sources, { minShared = 2 } = {}) {
  const nodes = [];
  const links = [];
  const list = (sources || []).filter((s) => s && s.n && s.title);
  const byOa = {};
  for (const s of list) {
    nodes.push({ id: `s${s.n}`, type: "source", label: s.title, n: s.n, size: 6 + Math.min(10, Math.log10((s.cites || 0) + 1) * 3.2), kind: s.kind || "paper", year: s.year || null });
    if (s.oaid) byOa[s.oaid] = s;
  }

  // استشهاد مباشر جوه القايمة
  let cites = 0;
  for (const s of list) for (const r of s.refs || []) {
    const t = byOa[r];
    if (t && t.n !== s.n) { links.push({ a: `s${s.n}`, b: `s${t.n}`, type: "cites", w: 3 }); cites++; }
  }

  // ارتباط ببليوغرافي: مصدرين بيستشهدوا بنفس المراجع
  // بنعرض لكل مصدر أقوى رابطين بس عشان الخريطة تفضل مقروءة (الإجمالي بيتحسب كله)
  let shared = 0;
  const pairs = [];
  const direct = new Set(links.map((l) => [l.a, l.b].sort().join("|")));
  for (let i = 0; i < list.length; i++) {
    const A = new Set(list[i].refs || []);
    if (!A.size) continue;
    for (let j = i + 1; j < list.length; j++) {
      const B = list[j].refs || [];
      let k = 0;
      for (const r of B) if (A.has(r)) k++;
      if (k >= minShared) { shared++; pairs.push({ a: `s${list[i].n}`, b: `s${list[j].n}`, k }); }
    }
  }
  pairs.sort((x, y) => y.k - x.k);
  const used = {};
  for (const p of pairs) {
    if (direct.has([p.a, p.b].sort().join("|"))) continue;
    if ((used[p.a] || 0) >= 2 && (used[p.b] || 0) >= 2) continue;
    used[p.a] = (used[p.a] || 0) + 1; used[p.b] = (used[p.b] || 0) + 1;
    links.push({ a: p.a, b: p.b, type: "shared", w: Math.min(2.5, 1 + p.k / 6), k: p.k });
  }

  // مؤلفين مشتركين (ظهروا في مصدرين أو أكتر)
  const authors = {};
  for (const s of list) for (const a of s.authors || []) {
    const key = authorKey(a);
    if (!key) continue;
    (authors[key] ||= { label: a, src: new Set() }).src.add(s.n);
  }
  let authorCount = 0;
  for (const [key, v] of Object.entries(authors)) {
    if (v.src.size < 2) continue;
    authorCount++;
    const id = `a:${key}`;
    nodes.push({ id, type: "author", label: v.label, size: 4 + v.src.size, src: [...v.src] });
    for (const n of v.src) links.push({ a: `s${n}`, b: id, type: "author", w: 1.5 });
  }

  // مواضيع مشتركة
  const topics = {};
  for (const s of list) for (const t of s.topics || []) {
    const key = norm(t);
    if (!key) continue;
    (topics[key] ||= { label: t, src: new Set() }).src.add(s.n);
  }
  const topicList = Object.entries(topics).filter(([, v]) => v.src.size >= 2).sort((a, b) => b[1].src.size - a[1].src.size).slice(0, 14);
  for (const [key, v] of topicList) {
    const id = `t:${key}`;
    nodes.push({ id, type: "topic", label: v.label, size: 5 + v.src.size * 1.3, src: [...v.src] });
    for (const n of v.src) links.push({ a: `s${n}`, b: id, type: "topic", w: 1 });
  }

  // درجة كل مصدر (عدد روابطه) عشان نعرف المصدر المحوري
  const deg = {};
  for (const l of links) { deg[l.a] = (deg[l.a] || 0) + l.w; deg[l.b] = (deg[l.b] || 0) + l.w; }
  for (const nd of nodes) nd.deg = deg[nd.id] || 0;
  const srcNodes = nodes.filter((x) => x.type === "source");
  const hub = [...srcNodes].sort((a, b) => b.deg - a.deg)[0];
  const isolated = srcNodes.filter((x) => !x.deg).map((x) => x.n);

  return {
    nodes,
    links,
    stats: {
      sources: srcNodes.length,
      cites,
      shared,
      authors: authorCount,
      topics: topicList.length,
      hub: hub && hub.deg ? hub.n : null,
      isolated,
      hasRefs: list.some((s) => (s.refs || []).length),
      topicNames: topicList.map(([, v]) => v.label),
    },
  };
}

/** توزيع النقط بقوى بسيطة (تنافر بين كل النقط + شد على الروابط + جذب للمركز). ثابت لنفس البيانات. */
export function layout(map, { width = 800, height = 520, iterations = 320 } = {}) {
  const N = map.nodes.map((nd, i) => {
    const a = (i / Math.max(1, map.nodes.length)) * Math.PI * 2 * 3.7;
    const r = 60 + (i % 7) * 22;
    return { ...nd, x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0 };
  });
  const idx = Object.fromEntries(N.map((n, i) => [n.id, i]));
  const L = map.links.map((l) => [idx[l.a], idx[l.b], l]).filter(([a, b]) => a != null && b != null);
  const ideal = Math.max(46, Math.min(110, Math.sqrt((width * height) / Math.max(1, N.length)) * (width < 600 ? 0.95 : 0.7)));
  for (let it = 0; it < iterations; it++) {
    const t = 1 - it / iterations;
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const A = N[i], B = N[j];
      const dx = A.x - B.x, dy = A.y - B.y;
      const d2 = Math.max(16, dx * dx + dy * dy);
      const f = (ideal * ideal) / d2 * 0.9;
      const d = Math.sqrt(d2);
      A.vx += (dx / d) * f; A.vy += (dy / d) * f; B.vx -= (dx / d) * f; B.vy -= (dy / d) * f;
    }
    for (const [a, b, l] of L) {
      const A = N[a], B = N[b];
      const dx = B.x - A.x, dy = B.y - A.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const want = l.type === "topic" ? ideal * 1.1 : l.type === "author" ? ideal * 0.8 : ideal * 0.9;
      const f = ((d - want) / d) * 0.06 * l.w;
      A.vx += dx * f; A.vy += dy * f; B.vx -= dx * f; B.vy -= dy * f;
    }
    for (const n of N) {
      n.vx -= n.x * 0.01; n.vy -= n.y * 0.012;
      const cap = 18 * t + 1;
      n.x += Math.max(-cap, Math.min(cap, n.vx)); n.y += Math.max(-cap, Math.min(cap, n.vy));
      n.vx *= 0.5; n.vy *= 0.5;
    }
  }
  // تحجيم على قد المساحة
  const padX = Math.min(90, width * 0.16), padY = 34;
  const xs = N.map((n) => n.x), ys = N.map((n) => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = Math.min((width - padX * 2) / Math.max(1, maxX - minX), (height - padY * 2) / Math.max(1, maxY - minY), 2.4);
  const ox = (width - (maxX - minX) * k) / 2, oy = (height - (maxY - minY) * k) / 2;
  for (const n of N) { n.x = ox + (n.x - minX) * k; n.y = oy + (n.y - minY) * k; delete n.vx; delete n.vy; }
  return { nodes: N, links: L.map(([a, b, l]) => ({ ...l, A: N[a], B: N[b] })) };
}

/** وصف نصي للخريطة يتبعت للنموذج عشان يطلّع المحاور والفجوات */
export function mapText(sources, map) {
  const lines = (sources || []).map((s) => `[${s.n}] ${s.title}${s.year ? ` (${s.year})` : ""}${(s.topics || []).length ? ` — مواضيع: ${s.topics.join(", ")}` : ""}`);
  const rel = map.links.filter((l) => l.type === "cites" || l.type === "shared").map((l) => `${l.a.slice(1)} ${l.type === "cites" ? "يستشهد بـ" : "يشترك في مراجع مع"} ${l.b.slice(1)}`);
  return `${lines.join("\n")}${rel.length ? `\n\nعلاقات:\n${rel.join("\n")}` : ""}`;
}
