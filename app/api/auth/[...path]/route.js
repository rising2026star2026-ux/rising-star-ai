// بوابة الحسابات: بتعدّي طلبات تسجيل الدخول والخروج لـ Managed Better Auth.
import { getAuth } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const off = () => Response.json({ error: "الحسابات لسه مش متفعّلة." }, { status: 503 });

async function pass(method, req, ctx) {
  const auth = await getAuth();
  if (!auth) return off();
  return auth.handler()[method](req, ctx);
}

export const GET = (req, ctx) => pass("GET", req, ctx);
export const POST = (req, ctx) => pass("POST", req, ctx);
export const PUT = (req, ctx) => pass("PUT", req, ctx);
export const PATCH = (req, ctx) => pass("PATCH", req, ctx);
export const DELETE = (req, ctx) => pass("DELETE", req, ctx);
