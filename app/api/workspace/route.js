// مساحة العمل على الحساب: حالة الحسابات، الأنشطة، نقل بيانات الجهاز، حفظ الملف، حذف البيانات.
// مقفول (enabled:false) لحد ما DATABASE_URL ومتغيرات الحسابات تتضاف في Vercel.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { dbEnabled, getSql } from "@/lib/server/db";
import { authEnabled, currentUser } from "@/lib/server/auth";
import { myBusinesses, createBusiness, saveProfile, importDevice, deleteMine, summary, HttpError } from "@/lib/server/workspace";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const tooMany = rateLimiter(60);
const MAX_BODY = 1_500_000;

const enabled = () => dbEnabled() && authEnabled();

export async function GET(req) {
  if (!enabled()) return Response.json({ enabled: false });
  const user = await currentUser();
  if (!user) return Response.json({ enabled: true, user: null });
  try {
    const sql = await getSql();
    const businesses = await myBusinesses(sql, user.id);
    const first = businesses[0];
    const counts = first ? await summary(sql, user.id, first.id) : null;
    return Response.json({ enabled: true, user, businesses, counts });
  } catch {
    return fail("مش قادرين نجيب بيانات حسابك دلوقتي. جرّب تاني.", 502);
  }
}

export async function POST(req) {
  if (!enabled()) return fail("الحسابات لسه مش متفعّلة.", 503);
  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي. جرّب بعد شوية.", 429);
  const user = await currentUser();
  if (!user) return fail("سجّل دخولك الأول.", 401);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return fail("البيانات أكبر من المسموح.", 413);
  let body;
  try { body = JSON.parse(raw); } catch { return fail("الطلب مش مفهوم.", 400); }
  const bid = typeof body?.businessId === "string" && /^[0-9a-f-]{36}$/i.test(body.businessId) ? body.businessId : null;
  try {
    const sql = await getSql();
    switch (body?.action) {
      case "createBusiness": return Response.json(await createBusiness(sql, user.id, body.profile));
      case "saveProfile":
        if (!bid) return fail("النشاط مش محدد.", 400);
        return Response.json(await saveProfile(sql, user.id, bid, body.profile));
      case "import": return Response.json(await importDevice(sql, user.id, body.payload, bid));
      case "deleteMine":
        if (body.confirm !== "DELETE") return fail("لازم تأكيد الحذف.", 400);
        return Response.json(await deleteMine(sql, user.id));
      default: return fail("العملية مش معروفة.", 400);
    }
  } catch (e) {
    if (e instanceof HttpError) return fail(e.message, e.status);
    return fail("حصلت مشكلة في الحفظ. جرّب تاني.", 502);
  }
}
