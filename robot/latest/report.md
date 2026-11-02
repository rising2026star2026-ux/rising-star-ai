# 🤖 تقرير الروبوت · الاتنين 2 نوفمبر 2026

فحصت **488** صفحة وأداة في 10 دقيقة.

✅ **478** شغالين  ·  ❌ **4** بايظين  ·  ⚠️ **6** محتاجين نظرة

## ❌ بايظ (المستخدم مش هيعرف يستخدمه)
1. **الشات مع البحث على الإنترنت**: الشات ما ردّش (ظهر زرار «إعادة المحاولة»)  
   [افتح](https://rising-star-ai.vercel.app/chat) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/features_chat.jpg)
2. **صانع البرومبتات**: وقفت عند «توليد»: ما حصلش اللي متوقع في الوقت المسموح  
   [افتح](https://rising-star-ai.vercel.app/prompts/builder) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/features_prompts_builder.jpg)
3. **مكتشف الأخطاء**: النتيجة فيها كلام بايظ (undefined / NaN)  
   [افتح](https://rising-star-ai.vercel.app/tool/debug) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/page_tool_debug.jpg)
4. **تحويل فيديو في المتصفح**: الأداة اللي جوه الصفحة (إطار من موقع تاني) مش راضية تفتح  
   [افتح](https://rising-star-ai.vercel.app/library/ffmpeg) · [📷 صورة](https://github.com/rising2026star2026-ux/rising-star-ai/blob/ci-results/robot/latest/shots/page_library_ffmpeg.jpg)

## 🛰️ سيرفرات مجانية واقعة (مش عيب في كودنا)
- 4 سيرفر من اللي في «المكتبة» واقفين: `multimodalart-logo-in-context`، `eccv2022-dis-background-removal`، `doevent-face-real-esrgan`، `stepfun-ai-step1x-3d`

## ⚠️ شغال بس محتاج نظرة
**📌 حاجات تانية** (1)
- [تعلّم الذكاء الاصطناعي](https://rising-star-ai.vercel.app/learn): رابط لموقع تاني مش شغال: www.maharah.net

**🐞 أخطاء في الكود** (5)
- [أفاتار بيتكلم](https://rising-star-ai.vercel.app/library/longcat-avatar): خطأ في كود الصفحة: Cannot read properties of undefined (reading '0')
- [محرر مشاهد 3D](https://rising-star-ai.vercel.app/library/threejs): خطأ في كود الصفحة: Failed to execute 'isSessionSupported' on 'XRSystem': Access to the feature "xr" is disallowed by permissions policy.
- [رسم فيكتور SVG](https://rising-star-ai.vercel.app/library/method-draw): خطأ في كود الصفحة: Failed to execute 'getStartPositionOfChar' on 'SVGTextContentElement': The charnum provided (0) is greater than or equal
- [سبورة رسم حر](https://rising-star-ai.vercel.app/library/excalidraw): خطأ في كود الصفحة: action is not defined
- [عدّاد الكلمات](https://rising-star-ai.vercel.app/library/wordcounter): خطأ في كود الصفحة: url.indexOf is not a function

**🔣 كلام بايظ ظاهر للمستخدم** (1)
- [مكتشف الأخطاء](https://rising-star-ai.vercel.app/tool/debug): فيه كلام بايظ ظاهر للمستخدم: undefined

**🔗 روابط لمواقع تانية مش شغالة** (1)
- الموقع مش موجود خالص (الدومين مش شغال): https://www.maharah.net/ (في `/learn`)

## 🧪 الروبوت جرّب إيه النهارده
- فتح **488** صفحة على مقاس موبايل (منهم 40 من 591 صفحة في دليل «أدوات عالمية»، والباقي بالتناوب).
- استخدم فعلياً **26** أداة من أدوات الاستوديو و**16** ميزة أساسية.
- جرّب **12** أداة كتابة بالذكاء الاصطناعي من 53 (الباقي في الأيام الجاية، عشان ما نستهلكش حصة Groq).
- أدوات الفيديو (6) اتفحص إنها بتفتح بس، من غير تصدير فيديو.
- فحص 44 سيرفر خارجي و368 رابط لمواقع تانية.

<details><summary>تفاصيل تقنية (لـ Claude وهو بيصلّح)</summary>

- `/chat` [broken] الشات ما ردّش (ظهر زرار «إعادة المحاولة»)
- `/prompts/builder` [broken] وقفت عند «توليد»: ما حصلش اللي متوقع في الوقت المسموح
  - locator.click: Timeout 30000ms exceeded. Call log: - waiting for getByRole('button', { name: 'ولّد', exact: true })
- `/tool/debug` [broken] فيه كلام بايظ ظاهر للمستخدم: undefined | النتيجة فيها كلام بايظ (undefined / NaN)
  - sample: سبب الخطأ: استخدام الشرط i <= items.length يجعل المتغيّر i يصل إلى قيمة items.length، وعند هذه القيمة يصبح items[i] غير معرف (undefined) وبالتالي محاولة الوصول 
- `/library/ffmpeg` [broken] الأداة اللي جوه الصفحة (إطار من موقع تاني) مش راضية تفتح
  - https://ffmpegwasm.netlify.app/
- `/learn` [warn] رابط لموقع تاني مش شغال: www.maharah.net
  - dead link https://www.maharah.net/ 0 EAI_AGAIN
- `/library/longcat-avatar` [warn] خطأ في كود الصفحة: Cannot read properties of undefined (reading '0')
  - Cannot read properties of undefined (reading '0') | Cannot read properties of undefined (reading '0') | Cannot read properties of undefined (reading '0') | Cannot read properties of undefined (reading '1')
- `/library/threejs` [warn] خطأ في كود الصفحة: Failed to execute 'isSessionSupported' on 'XRSystem': Access to the feature "xr" is disallowed by permissions policy.
  - Failed to execute 'isSessionSupported' on 'XRSystem': Access to the feature "xr" is disallowed by permissions policy.
  - console: Permissions policy violation: xr-spatial-tracking is not allowed in this document.
- `/library/method-draw` [warn] خطأ في كود الصفحة: Failed to execute 'getStartPositionOfChar' on 'SVGTextContentElement': The charnum provided (0) is greater than or equal
  - Failed to execute 'getStartPositionOfChar' on 'SVGTextContentElement': The charnum provided (0) is greater than or equal to the maximum bound (0).
  - console: Failed to load resource: the server responded with a status of 404 () | Failed to load resource: the server responded with a status of 404 ()
- `/library/excalidraw` [warn] خطأ في كود الصفحة: action is not defined
  - action is not defined
- `/library/wordcounter` [warn] خطأ في كود الصفحة: url.indexOf is not a function
  - url.indexOf is not a function
- space `multimodalart-logo-in-context` status=206  (lib/library.js)
- space `eccv2022-dis-background-removal` status=206  (lib/library.js)
- space `doevent-face-real-esrgan` status=206  (lib/library.js)
- space `stepfun-ai-step1x-3d` status=206  (lib/library.js)

النتايج كاملة: `ci-results/robot/latest/results.json`
</details>