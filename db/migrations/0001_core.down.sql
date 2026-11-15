-- الرجوع عن 0001_core: بيمسح سكيمة rb كلها. نزّل نسخة احتياطية (Neon branch أو snapshot) قبل التشغيل.
BEGIN;
DROP SCHEMA IF EXISTS rb CASCADE;
COMMIT;
