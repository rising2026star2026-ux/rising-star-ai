// الحسابات عن طريق Managed Better Auth من Neon. مقفولة لحد ما المتغيرين يتضافوا في Vercel:
// NEON_AUTH_BASE_URL و NEON_AUTH_COOKIE_SECRET (32 حرف أو أكتر).
let cached = null;

export const authEnabled = () =>
  !!process.env.NEON_AUTH_BASE_URL && (process.env.NEON_AUTH_COOKIE_SECRET || "").length >= 32;

export async function getAuth() {
  if (!authEnabled()) return null;
  if (cached) return cached;
  const { createNeonAuth } = await import("@neondatabase/auth/next/server");
  cached = createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL,
    cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET },
  });
  return cached;
}

/** المستخدم الحالي من الجلسة، أو null */
export async function currentUser() {
  const auth = await getAuth();
  if (!auth) return null;
  try {
    const { data } = await auth.getSession();
    const u = data?.user;
    return u?.id ? { id: String(u.id), email: u.email || "", name: u.name || "" } : null;
  } catch {
    return null;
  }
}
