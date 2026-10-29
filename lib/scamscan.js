// كاشف النصب (على السيرفر بس): بيفحص موقع البائع وصفحته فعلياً، وبيطلع أدلة ودرجة خطر.
//
// الدرجة بتتحسب بقواعد ثابتة من الأدلة (مش من الذكاء الاصطناعي)، عشان تبقى ثابتة ومتفسّرة.
// الذكاء الاصطناعي بيكتب الملخص والنصايح بس، من الأدلة اللي اتجمعت.
//
// الفحوصات:
//  1) عمر الدومين من سجل الدومينات الرسمي (RDAP)، والمسجّل وتاريخ الانتهاء
//  2) فتح الموقع نفسه: شهادة الأمان (HTTPS)، التحويلات، ومحتوى الصفحة
//     (بيانات تواصل، سجل تجاري، سياسة استرجاع، طرق دفع، خصومات مبالغ فيها، ضغط وتعجيل)
//  3) انتحال اسم شركة معروفة في الدومين (فودافون، البنك الأهلي، فوري...)، ولينكات فيسبوك مزيفة
//  4) بحث على الإنترنت عن شكاوى باسم الصفحة أو الموقع (محتاج TAVILY_API_KEY أو SERPER_API_KEY)
//  5) قراءة لقطة شاشة «شفافية الصفحة» من فيسبوك (تاريخ الإنشاء وتغيير الاسم)
//  6) علامات النصب في نص العرض لو اتلصق
import dns from "node:dns/promises";
import net from "node:net";
import { FLAGS, detect } from "@/lib/scamflags";
import { webSearch, searchProvider } from "@/lib/websearch";
import { completeOnce, fallbackTail, visionChain } from "@/lib/groq";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const DAY = 864e5;

// ---------- أدوات صغيرة ----------
const clip = (t = "", n = 300) => {
  const s = String(t).replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n)}…` : s;
};
const arDays = (d) => {
  if (d < 1) return "أقل من يوم";
  if (d < 60) return `${d} يوم`;
  if (d < 730) return `${Math.round(d / 30)} شهر`;
  return `${(d / 365).toFixed(1).replace(/\.0$/, "")} سنة`;
};

/** لينك من المستخدم → URL سليم أو null */
export function normalizeUrl(raw) {
  let s = String(raw || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!["http:", "https:"].includes(u.protocol) || !u.hostname.includes(".")) return null;
    if (u.username || u.password) return null;
    return u;
  } catch {
    return null;
  }
}

// لاحقات من جزئين (عشان example.com.eg يبقى هو الدومين، مش com.eg)
const TWO_LEVEL = new Set([
  "com.eg", "net.eg", "org.eg", "edu.eg", "gov.eg", "sci.eg", "info.eg", "name.eg",
  "com.sa", "net.sa", "org.sa", "gov.sa", "edu.sa", "co.uk", "org.uk", "ac.uk", "com.au", "co.jp",
  "com.tr", "com.br", "co.in", "com.ae", "co.ae", "com.kw", "com.qa", "com.jo", "com.lb", "com.ma", "co.za",
]);
export function registrable(host) {
  const parts = host.toLowerCase().replace(/\.$/, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  const last2 = parts.slice(-2).join(".");
  return TWO_LEVEL.has(last2) ? parts.slice(-3).join(".") : last2;
}

// منع فحص عناوين داخلية (حماية السيرفر)
function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const x = ip.toLowerCase();
  return x === "::1" || x === "::" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe80") || x.startsWith("::ffff:127.") || x.startsWith("::ffff:10.") || x.startsWith("::ffff:192.168.");
}
async function safeHost(host) {
  if (net.isIP(host)) return !privateIp(host);
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) return false;
  try {
    const addrs = await dns.lookup(host, { all: true });
    return addrs.length > 0 && addrs.every((a) => !privateIp(a.address));
  } catch {
    return null; // الدومين مش موجود أصلاً
  }
}

// ---------- 1) عمر الدومين (RDAP) ----------
let BOOT = null; // جدول IANA: كل امتداد (com, net, ...) سجله فين
async function rdapBase(tld) {
  try {
    if (!BOOT || Date.now() - BOOT.at > 864e5) {
      const r = await fetch("https://data.iana.org/rdap/dns.json", { signal: AbortSignal.timeout(7000) });
      if (r.ok) BOOT = { at: Date.now(), services: (await r.json()).services || [] };
    }
    const hit = BOOT?.services.find(([tlds]) => tlds.includes(tld));
    return hit ? hit[1][0].replace(/\/?$/, "/") : null;
  } catch {
    return null;
  }
}
async function rdap(domain) {
  const tld = domain.split(".").pop();
  const base = await rdapBase(tld);
  const urls = [base && `${base}domain/${encodeURIComponent(domain)}`, `https://rdap.org/domain/${encodeURIComponent(domain)}`].filter(Boolean);
  let status = 0;
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers: { accept: "application/rdap+json, application/json;q=0.9, */*;q=0.5", "user-agent": "RisingStarAi-ScamCheck/1.0" }, redirect: "follow", signal: AbortSignal.timeout(9000) });
      status = r.status;
      if (!r.ok) continue;
      const j = await r.json();
      const ev = (name) => (j.events || []).find((e) => e.eventAction === name)?.eventDate || null;
      const registrar = (j.entities || []).find((e) => (e.roles || []).includes("registrar"));
      const regName = registrar?.vcardArray?.[1]?.find((v) => v[0] === "fn")?.[3] || null;
      return { ok: true, created: ev("registration"), expires: ev("expiration"), registrar: regName };
    } catch {}
  }
  return { ok: false, status, noRdap: !base };
}

// شهرة الموقع عالمياً (قائمة Tranco البحثية لأشهر مليون موقع)
async function tranco(domain) {
  try {
    const r = await fetch(`https://tranco-list.eu/api/ranks/domain/${encodeURIComponent(domain)}`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    const best = (j.ranks || []).map((x) => x.rank).filter(Number.isFinite);
    return best.length ? Math.min(...best) : null;
  } catch {
    return null;
  }
}

// ---------- 2) فتح الموقع ----------
async function fetchSite(u) {
  const hops = [];
  let cur = new URL(u.href);
  for (let i = 0; i < 5; i++) {
    const safe = await safeHost(cur.hostname);
    if (safe === null) return { ok: false, reason: "nodns", hops };
    if (!safe) return { ok: false, reason: "blocked", hops };
    let r;
    try {
      r = await fetch(cur.href, { headers: { "user-agent": UA, accept: "text/html,*/*", "accept-language": "ar,en;q=0.8" }, redirect: "manual", signal: AbortSignal.timeout(10000) });
    } catch (e) {
      const code = String(e?.cause?.code || e?.code || e?.message || "");
      if (cur.protocol === "https:" && /CERT|SSL|TLS|SELF_SIGNED|UNABLE_TO_VERIFY/i.test(code)) return { ok: false, reason: "tls", hops };
      if (cur.protocol === "https:" && i === 0) {
        // جرّب http لو https مش شغال خالص
        const h = new URL(cur.href); h.protocol = "http:";
        try {
          const r2 = await fetch(h.href, { headers: { "user-agent": UA }, redirect: "manual", signal: AbortSignal.timeout(8000) });
          if (r2.status < 500) return { ok: false, reason: "nohttps", hops };
        } catch {}
      }
      return { ok: false, reason: "down", hops };
    }
    hops.push(cur.href);
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      cur = new URL(r.headers.get("location"), cur);
      continue;
    }
    const type = r.headers.get("content-type") || "";
    let html = "";
    if (/html|text/i.test(type)) {
      const reader = r.body.getReader();
      const chunks = [];
      let size = 0;
      while (size < 1_500_000) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); size += value.length;
      }
      try { reader.cancel(); } catch {}
      html = new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
    }
    return { ok: r.ok, status: r.status, finalUrl: cur.href, https: cur.protocol === "https:", html, hops };
  }
  return { ok: false, reason: "loop", hops };
}

// صفحات الحماية (Cloudflare وغيرها) اللي بتظهر للفحص الآلي بدل محتوى الموقع
const CHALLENGE = /(Just a moment\.\.\.|cf-browser-verification|challenge-platform|_cf_chl_opt|Attention Required! \| Cloudflare|Checking your browser|DDoS protection by|Pardon Our Interruption|Access Denied[\s\S]{0,400}Reference #|Please enable JS and disable any ad blocker|verify you are (a )?human)/i;
export const isChallenge = (html) => CHALLENGE.test(String(html || "").slice(0, 20000));

/** قارئ نصوص خارجي (r.jina.ai) لو الموقع حاجب الفحص المباشر */
async function readerText(url) {
  try {
    const r = await fetch(`https://r.jina.ai/${url}`, { headers: { accept: "text/plain", "x-return-format": "markdown" }, signal: AbortSignal.timeout(14000) });
    if (!r.ok) return null;
    const t = (await r.text()).slice(0, 200000);
    return t.length > 300 && !isChallenge(t) ? t : null;
  } catch {
    return null;
  }
}

function pageText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30000);
}

function analyzePage(html) {
  const text = pageText(html);
  const title = clip((html.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i) || [])[1] || "", 120);
  const hrefs = [
    ...[...html.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1]),
    ...[...html.matchAll(/\]\((https?:[^)\s]+|mailto:[^)\s]+)\)/gi)].map((m) => m[1]),
  ];
  const all = `${text} ${hrefs.join(" ")}`;
  return {
    title,
    words: text.split(" ").length,
    text,
    phone: /(\+?20|0)1[0125]\d{8}\b|\+?\d[\d\s-]{8,}\d/.test(all),
    email: /[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(all) || hrefs.some((h) => /^mailto:/i.test(h)),
    address: /(شارع|عمارة|الدور|محافظة|القاهرة|الجيزة|الإسكندرية|الاسكندرية|مدينة نصر|المعادي|street|st\.|floor|building|cairo|giza|alexandria)/i.test(text),
    registry: /(سجل تجاري|السجل التجاري|بطاقة ضريبية|رقم ضريبي|commercial regist|tax (id|number|registration)|\bvat\b|\bcr\b\s*no)/i.test(text),
    policy: /(سياسة الاسترجاع|الاستبدال والاسترجاع|الاسترجاع والاستبدال|سياسة الإرجاع|refund|return policy|returns)/i.test(all),
    terms: /(الشروط والأحكام|شروط الاستخدام|سياسة الخصوصية|terms|privacy)/i.test(all),
    cod: /(الدفع عند الاستلام|كاش عند الاستلام|cash on delivery|\bcod\b)/i.test(text),
    cards: /(visa|mastercard|فيزا|ماستر ?كارد|paymob|فوري|fawry|accept\.paymob|valu|فاليو|stripe|paypal)/i.test(all),
    wallets: /(فودافون ?كاش|انستا ?باي|إنستا ?باي|instapay|اتصالات ?كاش|اورانج ?كاش|محفظة|حول على رقم|تحويل على رقم)/i.test(text),
    socials: {
      facebook: hrefs.some((h) => /facebook\.com|fb\.com/i.test(h)),
      instagram: hrefs.some((h) => /instagram\.com/i.test(h)),
      whatsapp: hrefs.some((h) => /wa\.me|whatsapp\.com|api\.whatsapp/i.test(h)),
      tiktok: hrefs.some((h) => /tiktok\.com/i.test(h)),
    },
    bigDiscount: /(خصم|off|discount|تخفيض)[^.]{0,30}\b([6-9]\d)\s*%|\b([6-9]\d)\s*%\s*(خصم|off)/i.test(text),
    pressure: /(ينتهي|آخر فرصة|اخر فرصه|اليوم فقط|النهاردة بس|لفترة محدودة|كمية محدودة|متبقي \d|hurry|limited time|only \d+ left)/i.test(text),
  };
}

// ---------- 3) انتحال الأسماء المعروفة ----------
const BRANDS = [
  ["vodafone", ["vodafone.com.eg", "vodafone.com", "vodafone.eg"]],
  ["orange", ["orange.eg", "orange.com"]],
  ["etisalat", ["etisalat.eg", "etisalat.ae"]],
  ["cib", ["cibeg.com"]], ["nbe", ["nbe.com.eg"]], ["ahly", ["nbe.com.eg", "alahlyegypt.com"]],
  ["banquemisr", ["banquemisr.com"]], ["misrbank", ["banquemisr.com"]],
  ["fawry", ["fawry.com", "myfawry.com"]], ["instapay", ["instapay.eg", "ipn.eg"]],
  ["valu", ["valu.com.eg"]], ["paypal", ["paypal.com"]], ["paymob", ["paymob.com"]],
  ["amazon", ["amazon.eg", "amazon.com", "amazon.sa", "amazon.ae"]], ["noon", ["noon.com"]],
  ["jumia", ["jumia.com.eg", "jumia.com"]], ["talabat", ["talabat.com"]], ["aramex", ["aramex.com"]],
  ["apple", ["apple.com", "icloud.com"]], ["netflix", ["netflix.com"]], ["shahid", ["shahid.net", "mbc.net"]],
  ["openai", ["openai.com"]], ["chatgpt", ["chatgpt.com", "openai.com"]], ["gemini", ["google.com"]],
  ["google", ["google.com", "google.com.eg"]], ["facebook", ["facebook.com"]], ["meta", ["meta.com", "facebook.com"]],
  ["whatsapp", ["whatsapp.com"]], ["binance", ["binance.com"]], ["microsoft", ["microsoft.com"]],
  ["playstation", ["playstation.com"]], ["steam", ["steampowered.com", "steamcommunity.com"]],
];
function impersonation(domain) {
  const name = domain.split(".")[0];
  for (const [key, official] of BRANDS) {
    if (official.includes(domain)) return null;
    if (key.length >= 4 ? name.includes(key) : new RegExp(`(^|[-_])${key}([-_]|$)`).test(name)) return { brand: key, official: official[0] };
  }
  return null;
}
const FREE_HOSTS = /\.(wixsite\.com|blogspot\.com|weebly\.com|wordpress\.com|netlify\.app|vercel\.app|github\.io|web\.app|firebaseapp\.com|pages\.dev|carrd\.co|square\.site|godaddysites\.com|myshopify\.com|youcan\.shop|zid\.store|ueniweb\.com|webflow\.io|glitch\.me|replit\.app)$/i;

function checkFacebook(raw) {
  const u = normalizeUrl(raw);
  if (!u) return { valid: false };
  const host = u.hostname.toLowerCase().replace(/^www\.|^m\.|^web\.|^ar-ar\.|^ar\./, "");
  const real = ["facebook.com", "fb.com", "fb.me", "m.me", "business.facebook.com"].some((d) => host === d || host.endsWith(`.${d}`));
  const lookalike = !real && /(face|fb|faceb|meta)/i.test(host);
  const path = u.pathname.replace(/\/+$/, "");
  const id = u.searchParams.get("id") || path.split("/").filter(Boolean).find((p) => !["pages", "people", "profile.php", "groups", "p"].includes(p)) || "";
  return { valid: true, real, lookalike, host, handle: decodeURIComponent(id).replace(/-\d+$/, "").replace(/[-_.]+/g, " ").trim() };
}

// ---------- 4) البحث عن شكاوى ----------
const BAD_WORDS = /(نصب|نصاب|نصابين|حرامي|حرامية|احتيال|محتال|سرقة|سرقوني|نصبوا|اتنصب|scam|scammer|fraud|fake|ripoff|rip-off|بلاغ|شكوى|شكاوى|متنصحش|ما تتعاملش|متتعاملش|حذار|احذر)/i;
async function complaints(term) {
  if (!searchProvider() || !term) return { enabled: !!searchProvider(), results: [] };
  const [a, b] = await Promise.all([webSearch(`"${term}" نصب`), webSearch(`"${term}" تجربتي شكوى رأيكم`)]);
  const seen = new Set();
  const tokens = term.toLowerCase().split(/[\s.\-_/]+/).filter((t) => t.length > 2);
  const results = [];
  for (const r of [...a, ...b]) {
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    const hay = `${r.title} ${r.snippet}`.toLowerCase();
    const mentions = tokens.length ? tokens.some((t) => hay.includes(t)) : false;
    results.push({ ...r, mentions, negative: mentions && BAD_WORDS.test(hay) });
  }
  return { enabled: true, results };
}

// ---------- 5) لقطة شفافية الصفحة ----------
const VISION_RULES = [
  "You read a screenshot of a Facebook Page's 'Page transparency' / 'About' / 'Page history' section. It may be in Arabic or English.",
  "Extract ONLY what is visible. Never guess.",
  'Reply with JSON only: {"pageName":string|null,"created":"YYYY-MM-DD"|null,"createdText":string|null,"nameChanges":number|null,"previousNames":string[],"managerCountries":string[],"runningAds":boolean|null,"followers":string|null,"isTransparency":boolean}',
  "isTransparency=false if the image is not a Facebook page info/transparency screen.",
].join(" ");
async function readTransparency(dataUrl, signal) {
  const messages = [
    { role: "system", content: VISION_RULES },
    { role: "user", content: [{ type: "text", text: "Extract the page transparency details." }, { type: "image_url", image_url: { url: dataUrl } }] },
  ];
  for (const m of visionChain()) {
    const out = await completeOnce(m, { messages, temperature: 0, maxTokens: 600, signal });
    const j = out && parseJson(out);
    if (j) return j;
  }
  return null;
}
function parseJson(t) {
  const m = String(t).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// ---------- التجميع والدرجة ----------
/**
 * input: { url, fb, name, offer, image }
 * بيرجّع: { score, level, confidence, findings[], checks[], meta, summary, advice[] }
 */
export async function scan(input, signal) {
  const findings = [];
  const checks = [];
  let score = 0;
  let crit = false;
  const add = (group, sev, title, detail, w = 0, links) => {
    findings.push({ group, sev, title, detail, links });
    score += w;
  };

  const site = normalizeUrl(input.url);
  const fb = input.fb ? checkFacebook(input.fb) : null;
  const domain = site ? registrable(site.hostname) : null;
  const term = clip(input.name || fb?.handle || (domain ? domain.split(".")[0] : ""), 80);

  const [reg, page, comp, tr, rank] = await Promise.all([
    domain ? rdap(domain) : null,
    site ? fetchSite(site) : null,
    term || domain ? complaints(input.name ? term : domain || term) : { enabled: !!searchProvider(), results: [] },
    input.image ? readTransparency(input.image, signal).catch(() => null) : null,
    domain ? tranco(domain) : null,
  ]);

  const meta = { domain, term };

  // --- الموقع ---
  if (site) {
    const imp = impersonation(domain);
    if (imp) {
      crit = true;
      add("site", "bad", `الدومين بيستخدم اسم «${imp.brand}» ومش الموقع الرسمي`, `الموقع الرسمي هو ${imp.official}. الدومينات اللي بتقلّد أسماء الشركات المعروفة من أشهر طرق النصب وسرقة البيانات.`, 40);
    }
    if (FREE_HOSTS.test(site.hostname)) add("site", "warn", "الموقع على استضافة مجانية أو صفحة جاهزة", `${site.hostname} مش دومين خاص بالبائع. ده مش نصب لوحده، بس المتاجر الحقيقية غالباً بيبقى ليها دومين باسمها.`, 8);

    if (rank) {
      checks.push("rank");
      meta.rank = rank;
      if (rank <= 10000) add("site", "good", `موقع مشهور جداً: ترتيبه ${rank.toLocaleString("en-US")} بين أشهر مواقع العالم`, "حسب قائمة Tranco البحثية. المواقع المشهورة بالشكل ده نادراً ما تكون مواقع نصب، بس اتأكد إنك على الدومين الصح بالظبط.", -20);
      else if (rank <= 200000) add("site", "good", `الموقع معروف: ترتيبه ${rank.toLocaleString("en-US")} عالمياً`, "حسب قائمة Tranco البحثية لأشهر مليون موقع.", -10);
      else add("site", "info", `الموقع موجود في قائمة أشهر مليون موقع (ترتيب ${rank.toLocaleString("en-US")})`, "", -3);
    }
    if (reg?.ok && reg.created) {
      checks.push("domain");
      const age = Math.floor((Date.now() - Date.parse(reg.created)) / DAY);
      meta.created = reg.created; meta.ageDays = age; meta.registrar = reg.registrar; meta.expires = reg.expires;
      const when = new Date(reg.created).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
      if (age < 30) add("site", "bad", `الدومين جديد جداً: اتسجّل من ${arDays(age)}`, `تاريخ التسجيل ${when}. أغلب مواقع النصب بتتعمل قبل الحملة بأيام وبتختفي بعدها.`, 35);
      else if (age < 90) add("site", "bad", `الدومين جديد: عمره ${arDays(age)}`, `تاريخ التسجيل ${when}. موقع عمره أقل من 3 شهور محتاج حذر زيادة.`, 25);
      else if (age < 365) add("site", "warn", `الدومين عمره ${arDays(age)}`, `تاريخ التسجيل ${when}. أقل من سنة، فاتأكد من سمعة البائع.`, 10);
      else add("site", "good", `الدومين قديم: عمره ${arDays(age)}`, `تاريخ التسجيل ${when}. الدومين القديم علامة كويسة، بس مش ضمان لوحده.`, age > 3 * 365 ? -10 : -5);
      if (reg.expires) {
        const left = Math.floor((Date.parse(reg.expires) - Date.now()) / DAY);
        if (left >= 0 && left < 120 && age < 400) add("site", "warn", "الدومين متسجّل لسنة واحدة بس تقريباً", "التسجيل لفترة قصيرة شائع في المواقع المؤقتة.", 4);
      }
    } else if (domain) {
      add("site", "info", "مقدرناش نعرف عمر الدومين", reg?.noRdap ? `سجل امتداد .${domain.split(".").pop()} مش بيتيح تاريخ التسجيل للفحص الآلي.` : "السجل الرسمي ما ردّش. جرّب تاني بعد شوية.", 0);
    }

    if (page) {
      if (page.reason === "nodns") add("site", "bad", "الدومين ده مش شغال أصلاً", "مفيش موقع على العنوان ده. اتأكد من اللينك، ولو البائع باعته لك فده علامة خطر.", 20);
      else if (page.reason === "blocked") add("site", "info", "اللينك ده مش لموقع عام", "مش هنقدر نفحصه.", 0);
      else if (page.reason === "tls") add("site", "bad", "شهادة الأمان (HTTPS) بايظة", "المتصفح هيحذّرك قبل ما تفتحه. متدخلش بيانات دفع في موقع شهادته بايظة.", 18);
      else if (page.reason === "nohttps") add("site", "bad", "الموقع مش مؤمّن (من غير HTTPS)", "أي بيانات تكتبها ممكن تتسرق في الطريق. متدفعش في موقع من غير قفل الأمان.", 15);
      else if (page.reason === "down" || page.reason === "loop") add("site", "warn", "الموقع ما ردّش على الفحص", "ممكن يكون عطل مؤقت، أو الموقع بيمنع الفحص الآلي، أو اتقفل. افتحه بنفسك واتأكد.", 4);
      else {
        meta.finalUrl = page.finalUrl;
        const finalDom = registrable(new URL(page.finalUrl).hostname);
        if (finalDom !== domain) add("site", "warn", "الموقع بيحوّلك لدومين تاني", `اللينك بيودّي على ${finalDom}. اتأكد إنه نفس البائع.`, 8);
        if (!page.https) add("site", "bad", "الموقع مش مؤمّن (من غير HTTPS)", "متدفعش في موقع من غير قفل الأمان.", 15);
        else add("site", "good", "الموقع مؤمّن بشهادة HTTPS", "ده أساسي لأي موقع بيستقبل بيانات، بس مواقع النصب كمان بتعمله.", 0);
        let html = page.html;
        let via = "";
        if (html && (isChallenge(html) || pageText(html).split(" ").length < 80)) {
          const thin = !isChallenge(html);
          const alt = await readerText(page.finalUrl);
          if (alt) { html = alt; via = "reader"; }
          else if (thin) via = "thin";
          else via = "blocked";
        }
        if (via === "blocked") {
          add("site", "info", "الموقع عليه حماية بتمنع الفحص الآلي", "ده شائع في المواقع الكبيرة (زي Cloudflare)، فمقدرناش نقرا محتوى الصفحة. مش علامة نصب لوحده.", 0);
          html = "";
        } else if (via === "thin") {
          add("site", "info", "محتوى الصفحة بيتحمّل بعد الفتح، فمقدرناش نقراه", "ده طبيعي في مواقع كتير. افتح الموقع بنفسك وشوف فيه بيانات تواصل وسياسة استرجاع ولا لأ.", 0);
          html = "";
        } else if (!via && page.status >= 400) {
          add("site", "warn", `الموقع رجّع خطأ ${page.status}`, "الصفحة مش شغالة بشكل طبيعي دلوقتي.", 6);
          html = "";
        }
        if (html) {
          checks.push("page");
          if (via === "reader") meta.via = "reader";
          const a = analyzePage(html);
          meta.title = a.title;
          const contacts = [a.phone && "رقم تليفون", a.email && "إيميل", a.address && "عنوان"].filter(Boolean);
          if (!contacts.length) add("site", "warn", "مالقيناش بيانات تواصل في الصفحة الرئيسية", "مفيش تليفون ولا إيميل ولا عنوان في الصفحة اللي فحصناها. دوّر على صفحة «تواصل معنا»، ولو مش موجودة خالص فده علامة خطر.", 8);
          else add("site", "good", `فيه بيانات تواصل: ${contacts.join("، ")}`, "اتأكد بنفسك إنها شغالة قبل ما تدفع.", -3);
          if (a.registry) add("site", "good", "الموقع ذاكر سجل تجاري أو رقم ضريبي", "تقدر تتأكد منه من مصلحة الضرائب أو الهيئة العامة للاستثمار.", -6);
          if (!a.policy && !a.terms) add("site", "warn", "مفيش سياسة استرجاع ولا شروط مكتوبة", "من غير سياسة مكتوبة صعب ترجع حقك لو حصلت مشكلة.", 6);
          else if (a.policy) add("site", "good", "فيه سياسة استرجاع أو استبدال", "اقراها قبل ما تشتري.", -3);
          if (a.wallets && !a.cards && !a.cod) add("site", "bad", "الدفع بتحويل على محفظة أو إنستاباي بس", "التحويل لرقم شخصي صعب تسترده. اطلب الدفع عند الاستلام أو بكارت.", 12);
          if (a.cod) add("site", "good", "فيه دفع عند الاستلام", "ده أأمن ليك: افحص الحاجة قبل ما تدفع.", -6);
          else if (a.cards) add("site", "good", "فيه دفع بالكارت أو بوابة دفع معروفة", "الدفع بالكارت بيدّيك فرصة تعترض على العملية من البنك.", -3);
          if (a.bigDiscount) add("site", "warn", "خصومات كبيرة جداً (60% أو أكتر)", "الخصومات المبالغ فيها أشهر طُعم في النصب.", 8);
          if (a.pressure) add("site", "warn", "ضغط وتعجيل: «لفترة محدودة» أو «الكمية بتخلص»", "المحتال عايزك تدفع قبل ما تفكر.", 5);
          const soc = Object.entries(a.socials).filter(([, v]) => v).map(([k]) => k);
          if (soc.length === 1 && soc[0] === "whatsapp") add("site", "warn", "التواصل واتساب بس", "مفيش صفحات رسمية تانية مربوطة بالموقع.", 4);
          const flagged = detect(a.text).filter((id) => ["creds", "software", "shared", "lifetime"].includes(id));
          for (const id of flagged) {
            const f = FLAGS.find((x) => x.id === id);
            if (f.crit) crit = true;
            add("site", "bad", f.title, f.why, f.crit ? 20 : 8);
          }
        }
      }
    }
  }

  // --- صفحة الفيسبوك ---
  if (fb) {
    if (!fb.valid) add("page", "warn", "لينك الفيسبوك مش مفهوم", "انسخ لينك الصفحة من المتصفح وجرّب تاني.", 0);
    else if (fb.lookalike) {
      crit = true;
      add("page", "bad", `اللينك شكله فيسبوك بس مش فيسبوك: ${fb.host}`, "ده من أخطر أنواع النصب: صفحة مزيفة بتسرق حسابك أو بيانات الكارت. متدخلش أي بيانات فيها.", 45);
    } else if (!fb.real) add("page", "warn", "اللينك ده مش لصفحة فيسبوك", `العنوان ${fb.host}.`, 0);
    else add("page", "info", "صفحة فيسبوك حقيقية الرابط", "فيسبوك مش بيسمح لأي موقع يقرأ صفحاته آلياً، فارفع لقطة «شفافية الصفحة» عشان نفحص عمرها وتغيير اسمها.", 0);
  }

  if (tr) {
    if (tr.isTransparency === false) add("page", "info", "الصورة مش لقسم شفافية الصفحة", "افتح الصفحة ← «حول» ← «شفافية الصفحة» ← «عرض الكل» وصوّرها.", 0);
    else {
      checks.push("transparency");
      if (tr.created) {
        const age = Math.floor((Date.now() - Date.parse(tr.created)) / DAY);
        if (Number.isFinite(age)) {
          meta.pageCreated = tr.created;
          if (age < 90) add("page", "bad", `الصفحة جديدة: اتعملت من ${arDays(age)}`, "صفحات النصب بتتعمل جديدة لكل حملة.", 25);
          else if (age < 365) add("page", "warn", `الصفحة عمرها ${arDays(age)}`, "أقل من سنة، فاتأكد من التقييمات والتعليقات.", 10);
          else add("page", "good", `الصفحة قديمة: عمرها ${arDays(age)}`, "علامة كويسة، بس الصفحات القديمة ممكن تتسرق وتتباع.", -6);
        }
      } else if (tr.createdText) add("page", "info", `تاريخ إنشاء الصفحة: ${clip(tr.createdText, 60)}`, "", 0);
      if (Number.isFinite(tr.nameChanges)) {
        const n = tr.nameChanges;
        const prev = (tr.previousNames || []).slice(0, 4).join("، ");
        if (n >= 2) add("page", "bad", `الصفحة غيّرت اسمها ${n} مرات`, `${prev ? `أسماء قديمة: ${prev}. ` : ""}تغيير الاسم كتير علامة قوية إن الصفحة اتشترت أو بتتعاد استخدامها في نصب.`, 22);
        else if (n === 1) add("page", "warn", "الصفحة غيّرت اسمها مرة", prev ? `الاسم القديم: ${prev}. شوف هل ليه علاقة بالنشاط الحالي.` : "شوف الاسم القديم ليه علاقة بالنشاط الحالي ولا لأ.", 8);
        else add("page", "good", "الصفحة ما غيّرتش اسمها", "", -3);
      }
      if ((tr.managerCountries || []).length) add("page", "info", `مديرين الصفحة في: ${tr.managerCountries.slice(0, 4).join("، ")}`, "قارنها بالمكان اللي البائع بيقول إنه فيه.", 0);
    }
  } else if (input.image) add("page", "info", "مقدرناش نقرا الصورة", "جرّب صورة أوضح لقسم شفافية الصفحة.", 0);

  // --- الشكاوى ---
  if (comp.enabled) {
    checks.push("search");
    const neg = comp.results.filter((r) => r.negative);
    const mentions = comp.results.filter((r) => r.mentions);
    if (neg.length) add("reviews", "bad", `لقينا ${neg.length} نتيجة فيها شكاوى أو كلام عن نصب`, "اقرا المصادر بنفسك: ممكن يكون نفس الاسم لنشاط تاني.", Math.min(30, neg.length * 10), neg.slice(0, 6).map((r) => ({ t: r.title, u: r.url, s: r.snippet })));
    else if (mentions.length) add("reviews", "good", "مالقيناش شكاوى منشورة", `لقينا ${mentions.length} نتيجة بتتكلم عن الاسم من غير شكاوى واضحة.`, -4, mentions.slice(0, 3).map((r) => ({ t: r.title, u: r.url, s: r.snippet })));
    else add("reviews", "info", "مفيش كلام منشور تقريباً عن الاسم ده", "يا إما جديد، يا إما الاسم مكتوب بشكل مختلف. قلة السمعة نفسها تستاهل حذر.", 4);
  } else {
    add("reviews", "info", "البحث عن الشكاوى مش متفعّل على الموقع دلوقتي", "صاحب الموقع محتاج يضيف مفتاح البحث. لحد ما يتضاف دوّر بنفسك على الاسم مع كلمة «نصب».", 0);
  }

  // --- نص العرض ---
  if (input.offer?.trim()) {
    checks.push("offer");
    for (const id of detect(input.offer)) {
      const f = FLAGS.find((x) => x.id === id);
      if (f.crit) crit = true;
      add("offer", f.crit ? "bad" : "warn", f.title, f.why, f.crit ? 20 : f.w * 3);
    }
    if (!findings.some((x) => x.group === "offer")) add("offer", "good", "مالقيناش علامات نصب واضحة في نص العرض", "ده مش ضمان. اتأكد من طريقة الدفع والفاتورة.", 0);
  }

  // --- الدرجة ---
  score = Math.max(0, Math.min(100, Math.round(score + 15)));
  if (crit) score = Math.max(score, 75);
  const level = score >= 55 ? "high" : score >= 28 ? "mid" : "low";
  const confidence = checks.length >= 3 ? "high" : checks.length === 2 ? "mid" : "low";
  return { score, level, confidence, checks, findings, meta };
}

// ---------- الملخص بالعربي ----------
const SUMMARY_RULES = [
  "أنت محلل مخاطر شراء أونلاين في منصة Rising StarAi المصرية. اكتب بالعامية المصرية المهذبة.",
  "هتوصلك نتيجة فحص آلي فيها درجة خطر وقائمة أدلة. اكتب ملخص من جملتين أو تلاتة، و3 إلى 5 نصايح عملية محددة للحالة دي.",
  "اعتمد على الأدلة المكتوبة بس، ومتضيفش معلومة مش فيها. متقولش إن البائع نصاب أكيد: اتكلم عن علامات خطر واحتمالات.",
  "لو الثقة منخفضة قول إن الفحص محدود ووضّح إيه اللي ناقص.",
  'الرد JSON بس: {"summary":"...","advice":["...","..."]}',
].join(" ");

export async function summarize(result, signal) {
  const payload = {
    score: result.score, level: result.level, confidence: result.confidence,
    evidence: result.findings.map((f) => `[${f.sev}] ${f.title}${f.detail ? `: ${f.detail}` : ""}`),
  };
  const messages = [{ role: "system", content: SUMMARY_RULES }, { role: "user", content: JSON.stringify(payload) }];
  for (const m of [
    { id: "openai/gpt-oss-120b", effort: "low", provider: "groq" },
    { id: "openai/gpt-oss-20b", effort: "low", provider: "groq" },
    ...fallbackTail(),
  ]) {
    const out = await completeOnce(m, { messages, temperature: 0.3, maxTokens: 900, signal });
    const j = out && parseJson(out);
    if (j?.summary) return { summary: clip(j.summary, 700), advice: (j.advice || []).slice(0, 5).map((a) => clip(a, 260)) };
  }
  return null;
}
