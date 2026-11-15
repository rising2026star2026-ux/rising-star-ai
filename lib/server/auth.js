// الحسابات عن طريق Managed Better Auth من Neon، من غير مكتبة Neon (اللي بتشترط Next.js 16).
// /api/auth/* بيتنقل كما هو لـ NEON_AUTH_BASE_URL، والكوكيز بترجع مربوطة بدومين الموقع.
// مقفولة لحد ما NEON_AUTH_BASE_URL يتضاف في Vercel. دومين الموقع لازم يتضاف في Trusted domains في Neon Auth.

export const authEnabled = () => /^https:\/\//.test(process.env.NEON_AUTH_BASE_URL || "");
const base = () => (process.env.NEON_AUTH_BASE_URL || "").replace(/\/+$/, "");

const FORWARD = ["content-type", "cookie", "origin", "user-agent", "accept", "accept-language", "x-forwarded-for"];

/** الكوكي بيرجع لدومين الموقع: بنشيل Domain= عشان المتصفح يربطه بالموقع نفسه */
export const localCookie = (c) => c.replace(/;\s*Domain=[^;]*/gi, "");

/** تمرير طلب /api/auth/<path> لخدمة الحسابات */
export async function proxy(req, path) {
  if (!authEnabled()) return Response.json({ error: "الحسابات لسه مش متفعّلة." }, { status: 503 });
  // أجزاء المسار: حروف وأرقام وشرطة ونقطة جوه الاسم بس، ومن غير . أو .. (منع الخروج من مسار الحسابات)
  const parts = Array.isArray(path) ? path : [];
  const okPart = (p) => /^[a-z0-9][a-z0-9._-]*$/i.test(p) && !p.includes("..");
  if (!parts.length || parts.length > 6 || !parts.every(okPart)) return Response.json({ error: "الطلب مش مفهوم." }, { status: 400 });
  const src = new URL(req.url);
  const headers = new Headers();
  for (const h of FORWARD) { const v = req.headers.get(h); if (v) headers.set(h, v); }
  if (!headers.get("origin")) headers.set("origin", src.origin);
  let res;
  try {
    res = await fetch(`${base()}/${parts.join("/")}${src.search}`, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer(),
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return Response.json({ error: "خدمة الحسابات مش بترد دلوقتي." }, { status: 502 });
  }
  const out = new Headers();
  for (const h of ["content-type", "location", "cache-control"]) { const v = res.headers.get(h); if (v) out.set(h, v); }
  for (const c of res.headers.getSetCookie?.() || []) out.append("set-cookie", localCookie(c));
  return new Response(res.status === 204 ? null : await res.arrayBuffer(), { status: res.status, headers: out });
}

/** المستخدم الحالي من كوكيز الطلب، أو null */
export async function currentUser(req) {
  if (!authEnabled()) return null;
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;
  try {
    const res = await fetch(`${base()}/get-session`, {
      headers: { cookie, origin: new URL(req.url).origin, accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const u = (await res.json())?.user;
    return u?.id ? { id: String(u.id), email: u.email || "", name: u.name || "" } : null;
  } catch {
    return null;
  }
}
