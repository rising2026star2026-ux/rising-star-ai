// اتصال قاعدة البيانات (Neon Postgres). مقفول لحد ما DATABASE_URL يتضاف في Vercel.
// الكود اللي بيستخدمه بيستقبل دالة sql (tagged template)، فالاختبارات بتديله دالة وهمية.
let cached = null;

export const dbEnabled = () => !!process.env.DATABASE_URL;

export async function getSql() {
  if (!dbEnabled()) return null;
  if (cached) return cached;
  const { neon } = await import("@neondatabase/serverless");
  cached = neon(process.env.DATABASE_URL);
  return cached;
}
