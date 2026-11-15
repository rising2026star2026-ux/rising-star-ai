# قاعدة بيانات Rising Business (Neon Postgres)

## التفعيل
1. مشروع Neon من neon.com (مش من سوق Vercel)، وفعّل Auth من صفحة Auth.
2. في Vercel (Preview الأول): `DATABASE_URL` و`NEON_AUTH_BASE_URL` و`NEON_AUTH_COOKIE_SECRET` (32 حرف أو أكتر). القيم ما تتكتبش في الكود ولا في الشات.
3. شغّل `migrations/0001_core.up.sql` مرة واحدة من SQL Editor في Neon.
4. من غير المتغيرات دي الحسابات مقفولة والموقع بيشتغل على تخزين الجهاز زي ما هو.

## الرجوع
`migrations/0001_core.down.sql` بيمسح سكيمة `rb` كلها. اعمل Neon branch أو snapshot قبله.

## القواعد
- كل جدول تجاري مربوط بـ `business_id`، والوصول بيتحقق من `rb.business_members` في `lib/server/workspace.js`.
- المستخدمين في سكيمة `neon_auth` اللي Neon بيديرها، وإحنا بنخزّن الـ id بتاعهم كنص.
- مفيش حذف تلقائي لبيانات قديمة. الحذف بطلب العميل بس، ومتسجل في `rb.audit_log`.

## الاختبار
- `PG_TEST_PORT=<port> node scripts/test/workspace-db.test.mjs` على Postgres محلي (بيطبّق الملفات بنفسه).
- `node scripts/test/workspace-route.test.mjs` للمسارات بمكتبات Neon بديلة.
