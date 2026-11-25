# 🤖 تقرير الروبوت · الأربع 25 نوفمبر 2026

فحصت **117** صفحة وأداة في 5 دقيقة.

✅ **106** شغالين  ·  ❌ **11** بايظين  ·  ⚠️ **0** محتاجين نظرة

🎉 **اتصلح من آخر تقرير:** 6 (`/tool/landing-page`، `/tool/marketing-plan`، `/tool/email-writer`، `/tool/image-prompt`، `/tool/logo-ideas`، `feature:photo-ad`)

## ❌ بايظ (المستخدم مش هيعرف يستخدمه)
1. **اختبر إعلانك على 100 زبون**: وقفت عند «بدء الاختبار»: ما حصلش اللي متوقع في الوقت المسموح  
   [افتح](https://rising-star-ai.vercel.app/test-ad) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/features-test-ad_test-ad.jpg)
2. **فويس نوت لبوستات**: كتابة البوستات طلّعت خطأ: حصلت مشكلة. جرّب تاني.  
   [افتح](https://rising-star-ai.vercel.app/voice-post) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/features-voice-post_voice-post.jpg)
3. **أمازون: فاحص رفض الليستنج**: التصليح طلّع خطأ: حصلت مشكلة. جرّب تاني.  
   [افتح](https://rising-star-ai.vercel.app/amazon/check) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/features-amazon-check_amazon_check.jpg)
4. **صانع البرومبتات** 🆕: التوليد طلّع خطأ: المولّد مشغول دلوقتي 😅 جرّب تاني بعد دقيقة.  
   [افتح](https://rising-star-ai.vercel.app/prompts/builder) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/features-prompt-builder_prompts_builder.jpg)
5. **إزالة الخلفية**: إزالة الخلفية ما اشتغلتش، لا على الجهاز ولا على السيرفر  
   [افتح](https://rising-star-ai.vercel.app/tool/remove-bg) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/tools-remove-bg_tool_remove-bg.jpg)
6. **سكريبت فيديو قصير** 🆕: الأداة طلّعت خطأ: حصلت مشكلة مؤقتة. جرّب تاني.  
   [افتح](https://rising-star-ai.vercel.app/tool/tiktok-script) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/ai-tiktok-script_tool_tiktok-script.jpg)
7. **5 صفحة** فيها نفس العطل (4 جديد 🆕): الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.  
   زي: [خطة عمل مختصرة](https://rising-star-ai.vercel.app/tool/business-plan)، [أفكار مشاريع](https://rising-star-ai.vercel.app/tool/business-ideas)، [رسائل واتساب للبيع](https://rising-star-ai.vercel.app/tool/whatsapp-sales)، [برومبت الفيديو](https://rising-star-ai.vercel.app/tool/video-prompt) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/ai-business-plan_tool_business-plan.jpg)

## 🧪 الروبوت جرّب إيه النهارده
- فتح **105** صفحة على مقاس موبايل.
- استخدم فعلياً **14** أداة من أدوات الاستوديو و**12** ميزة أساسية.
- جرّب **12** أداة كتابة بالذكاء الاصطناعي من 22 (الباقي في الأيام الجاية، عشان ما نستهلكش حصة Groq).
- فحص 4 سيرفر خارجي و42 رابط لمواقع تانية.

<details><summary>تفاصيل تقنية (لـ Claude وهو بيصلّح)</summary>

- `feature:test-ad` [broken] وقفت عند «بدء الاختبار»: ما حصلش اللي متوقع في الوقت المسموح
  - locator.click: Timeout 30000ms exceeded. Call log: - waiting for getByRole('button', { name: 'اعرض إعلاني على 100 زبون' })
- `feature:voice-post` [broken] كتابة البوستات طلّعت خطأ: حصلت مشكلة. جرّب تاني.
  - api: 504 POST https://rising-star-ai.vercel.app/api/ad-pack
- `feature:amazon-check` [broken] التصليح طلّع خطأ: حصلت مشكلة. جرّب تاني.
  - api: 504 POST https://rising-star-ai.vercel.app/api/amazon/check
- `feature:prompt-builder` [broken] التوليد طلّع خطأ: المولّد مشغول دلوقتي 😅 جرّب تاني بعد دقيقة.
  - api: 503 POST https://rising-star-ai.vercel.app/api/prompt-gen
- `/tool/remove-bg` [broken] إزالة الخلفية ما اشتغلتش، لا على الجهاز ولا على السيرفر
- `/tool/tiktok-script` [broken] الأداة طلّعت خطأ: حصلت مشكلة مؤقتة. جرّب تاني.
  - api: 502 POST https://rising-star-ai.vercel.app/api/run
- `/tool/business-plan` [broken] الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.
- `/tool/business-ideas` [broken] الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.
- `/tool/whatsapp-sales` [broken] الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.
- `/tool/video-prompt` [broken] الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.
- `/tool/sheet-analyst` [broken] الأداة طلّعت خطأ: الخدمة مشغولة دلوقتي. جرّب بعد دقيقة.

النتايج كاملة: `ci-results/robot/latest/results.json`
</details>