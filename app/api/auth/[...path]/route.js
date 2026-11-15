// بوابة الحسابات: بتعدّي طلبات تسجيل الدخول والخروج لـ Managed Better Auth (lib/server/auth.js).
import { proxy } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

const pass = async (req, ctx) => proxy(req, (await ctx?.params)?.path);

export const GET = pass;
export const POST = pass;
export const PUT = pass;
export const PATCH = pass;
export const DELETE = pass;
