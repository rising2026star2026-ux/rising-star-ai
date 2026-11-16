# 🤖 تقرير الروبوت · الاتنين 16 نوفمبر 2026

فحصت **117** صفحة وأداة في 4 دقيقة.

✅ **108** شغالين  ·  ❌ **9** بايظين  ·  ⚠️ **0** محتاجين نظرة

🎉 **اتصلح من آخر تقرير:** 9 (`/tool/landing-page`، `/tool/marketing-plan`، `/tool/email-writer`، `/tool/email-reply`، `/tool/image-prompt`، `/tool/logo-ideas` …)

## ❌ بايظ (المستخدم مش هيعرف يستخدمه)
1. **اختبر إعلانك على 100 زبون**: وقفت عند «بدء الاختبار»: ما حصلش اللي متوقع في الوقت المسموح  
   [افتح](https://rising-star-ai.vercel.app/test-ad) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/features-test-ad_test-ad.jpg)
2. **أمازون: كاتب الليستنج**: كتابة الليستنج طلّعت خطأ: حصلت مشكلة. جرّب تاني.  
   [افتح](https://rising-star-ai.vercel.app/amazon/listing) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/features-amazon-listing_amazon_listing.jpg)
3. **صانع البرومبتات**: التوليد طلّع خطأ: حصلت مشكلة. جرّب تاني.  
   [افتح](https://rising-star-ai.vercel.app/prompts/builder) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/features-prompt-builder_prompts_builder.jpg)
4. **نص إعلاني** 🆕: الأداة طلّعت خطأ: حصلت مشكلة مؤقتة. جرّب تاني.  
   [افتح](https://rising-star-ai.vercel.app/tool/ad-copy) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/ai-ad-copy_tool_ad-copy.jpg)
5. **5 صفحة** فيها نفس العطل (4 جديد 🆕): الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.  
   زي: [Adspy عربي: جاسوس الإعلانات](https://rising-star-ai.vercel.app/tool/adspy)، [سكريبت فيديو قصير](https://rising-star-ai.vercel.app/tool/tiktok-script)، [جدول محتوى 30 يوم](https://rising-star-ai.vercel.app/tool/content-calendar)، [خطة عمل مختصرة](https://rising-star-ai.vercel.app/tool/business-plan) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/ai-adspy_tool_adspy.jpg)

## 🧪 الروبوت جرّب إيه النهارده
- فتح **105** صفحة على مقاس موبايل.
- استخدم فعلياً **14** أداة من أدوات الاستوديو و**12** ميزة أساسية.
- جرّب **12** أداة كتابة بالذكاء الاصطناعي من 22 (الباقي في الأيام الجاية، عشان ما نستهلكش حصة Groq).
- فحص 4 سيرفر خارجي و42 رابط لمواقع تانية.

<details><summary>تفاصيل تقنية (لـ Claude وهو بيصلّح)</summary>

- `feature:test-ad` [broken] وقفت عند «بدء الاختبار»: ما حصلش اللي متوقع في الوقت المسموح
  - locator.click: Timeout 30000ms exceeded. Call log: - waiting for getByRole('button', { name: 'اعرض إعلاني على 100 زبون' })
- `feature:amazon-listing` [broken] كتابة الليستنج طلّعت خطأ: حصلت مشكلة. جرّب تاني.
  - api: 504 POST https://rising-star-ai.vercel.app/api/amazon/listing
- `feature:prompt-builder` [broken] التوليد طلّع خطأ: حصلت مشكلة. جرّب تاني.
  - api: 504 POST https://rising-star-ai.vercel.app/api/prompt-gen
- `/tool/ad-copy` [broken] الأداة طلّعت خطأ: حصلت مشكلة مؤقتة. جرّب تاني.
  - api: 502 POST https://rising-star-ai.vercel.app/api/run
- `/tool/adspy` [broken] الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.
- `/tool/tiktok-script` [broken] الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.
- `/tool/content-calendar` [broken] الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.
- `/tool/business-plan` [broken] الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.
- `/tool/business-ideas` [broken] الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.

النتايج كاملة: `ci-results/robot/latest/results.json`
</details>