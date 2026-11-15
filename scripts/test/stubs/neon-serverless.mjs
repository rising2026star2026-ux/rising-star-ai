// بديل اختبار لـ @neondatabase/serverless: بيرجّع صفوف من globalThis.__rows حسب أول كلمة
export function neon() {
  const sql = (strings) => Promise.resolve((globalThis.__rows || (() => []))(strings.join("?")));
  sql.transaction = async () => [];
  return sql;
}
