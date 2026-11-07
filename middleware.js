// حماية الـ API من الاستخدام من مواقع تانية:
// أي طلب بيغيّر حاجة أو بيصرف (POST وغيره) جاي من متصفح على دومين تاني بيترفض.
// كده محدش يقدر يبني موقع بيستخدم موديلات Rising StarAi على حسابنا من متصفحات زواره.
// الطلبات اللي من غير Origin (سكربتات الفحص اليومي مثلاً) بتعدي، وبيحميها حد الطلبات لكل IP وحدود الصرف عند المزوّدين.
import { NextResponse } from "next/server";

export const config = { matcher: "/api/:path*" };

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

const hostOf = (u) => {
  try {
    return new URL(u).host.toLowerCase();
  } catch {
    return "";
  }
};

export function middleware(req) {
  if (SAFE.has(req.method)) return NextResponse.next();
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").toLowerCase();
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  // المتصفح بيقول صراحة إن الطلب من موقع تاني
  if (site === "cross-site") return deny();
  if (origin && origin !== "null" && hostOf(origin) !== host) return deny();
  return NextResponse.next();
}

function deny() {
  return NextResponse.json({ error: "الطلب ده مش مسموح." }, { status: 403 });
}
