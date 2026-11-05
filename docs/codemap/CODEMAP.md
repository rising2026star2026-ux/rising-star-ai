# خريطة كود Rising StarAi

اتعملت أوتوماتيك بـ `node scripts/codemap/build.mjs`. 358 ملف، 768 علاقة استيراد، 58 صفحة، 34 مسار API.
الخريطة التفاعلية: افتح `docs/codemap/graph.html` في المتصفح. ولمعرفة أثر تعديل أي ملف: `node scripts/codemap/query.mjs lib/groq.js`.

## أكتر الملفات اللي المشروع معتمد عليها
لو عدّلت ملف من دول، راجع الملفات اللي بتستخدمه (العمود الأخير = كل اللي بيتأثر بشكل مباشر أو غير مباشر).

| الملف | بيستخدمه مباشرةً | بيتأثر بيه إجمالاً | وصفه |
|---|---|---|---|
| `lib/store.js` | 54 | 95 | تخزين بسيط على جهاز الزائر (المفضلة، السجل، الإعدادات). لو المتصفح منعه، الموقع يكمل عادي. |
| `lib/groq.js` | 42 | 44 | الاتصال بالموديلات — بيستخدمه الشات والأدوات (على السيرفر بس) المزود الأساسي Groq، ومعاه طبقة احتياطية اختياري |
| `components/studio/ui.js` | 22 | 31 | عناصر الواجهة المشتركة لأدوات الاستوديو |
| `components/studio/util.js` | 21 | 31 | أدوات مشتركة لكل أدوات الاستوديو. كله بيشتغل جوه المتصفح، ومفيش أي ملف بيترفع لأي سيرفر. |
| `lib/models.js` | 19 | 52 | الاختيارات الـ6 اللي المستخدم بيختار منها في الشات (وبتستخدمها الأدوات كمان). نوفمبر 2026: شلنا GPT-OSS (120B  |
| `lib/llmjson.js` | 18 | 21 | طلب من الموديل يرجّع JSON منظم (على السيرفر بس). بيجرب الموديلات بالترتيب لحد ما يرجع JSON سليم ويعدّي التحقق، |
| `components/BotIcon.js` | 17 | 31 | أيقونة الموديل أو البرنامج: 1) لو فيه لوجو رسمي في public/logos → بيظهر هو 2) مساعد أو برنامج → أيقونة خطية مو |
| `lib/imagefile.js` | 17 | 42 | تجهيز صور العميل في المتصفح قبل أي حاجة: تصغير، وتحويل لـ JPG/WebP خفيف، أو لرابط data. |
| `lib/tools.js` | 16 | 22 | كل أداة هنا سطر واحد. عشان تضيف أداة جديدة: انسخ سطر وعدّل فيه. T(المعرّف, التصنيف, الاسم, الوصف, مهمة النموذج |
| `components/seller/SellerHero.js` | 12 | 12 | رأس صفحات «ستوديو البيّاع»: سما ليل بعرض الشاشة، عنوان كبير، وخطوات قصيرة |
| `lib/bots.js` | 11 | 16 | صفحة «الموديلات» (زي Poe): كل موديل كارت بأيقونة، مقسمين على أقسام. provider: "site" معناه إن الموديل ده (المس |
| `components/Md.js` | 10 | 23 | عرض Markdown موحّد لكل ردود الموقع. الفرق عن العرض العادي: الجداول بتتلف في غلاف بيتحكم في عرضها (جدول بتمرير  |
| `lib/websearch.js` | 9 | 13 |  |
| `components/ShareBar.js` | 8 | 17 |  |
| `components/ToolIcon.js` | 8 | 15 |  |
| `lib/apps.js` | 8 | 14 | برامج الذكاء الاصطناعي المشهورة (70 برنامج): كل برنامج بلوجو شركته واسمه، وليه صفحة عربي جوه الموقع /program/[ |
| `lib/site.js` | 8 | 52 | رابط الموقع الأساسي: بيستخدم في جوجل وخريطة الموقع وتوقيع المشاركة. على Vercel ضيف NEXT_PUBLIC_SITE_URL بالدوم |
| `components/amazon/icons.js` | 7 | 15 | أيقونات خطية بسيطة (SVG) لأدوات أمازون. بدل الإيموجي عشان الشكل يبقى ثابت على كل الأجهزة. |
| `lib/brandprofile.js` | 7 | 10 | «هوية نشاطي»: بيانات النشاط اللي العميل بيكتبها مرة واحدة وبتتحفظ على جهازه، والأدوات بتبعتها مع الطلب (لو الع |
| `lib/settings.js` | 7 | 14 | خيارات لوحة التحكم — نفس الملف بيستخدمه المتصفح والسيرفر عشان نتأكد إن القيم سليمة |
| `components/lab/ReelComp.js` | 6 | 12 | ريلز بـ Remotion: 6 تصاميم (layouts) × ألوان. التصدير بيتم في متصفح العميل. المُصدّر بيدعم مجموعة محدودة من HT |
| `lib/botcatalog.js` | 6 | 6 | بيعرف أنهي موديلات متاحة فعلاً دلوقتي (على السيرفر بس). بيسأل OpenRouter وGroq عن قايمتهم، والنتيجة بتتحفظ 6 س |
| `lib/hfspace.js` | 6 | 19 | تشغيل موديل على Hugging Face Space من متصفح الزائر نفسه (مش من السيرفر). الفكرة: حصة الـ GPU المجانية (ZeroGPU |
| `lib/realestate.js` | 6 | 10 | الباحث العقاري: محرك الحسابات (بيشتغل في المتصفح والسيرفر). كل الأرقام هنا بتتحسب بالكود، مش بالنموذج. الحاسبا |
| `lib/subscriptions.js` | 6 | 9 | بيانات الاشتراكات: أسعار خطط أشهر أدوات الذكاء الاصطناعي. الأسعار بالدولار شهرياً كما هي منشورة في أكتوبر 2026 |

## مسارات API
| المسار | المفاتيح | خدمات خارجية | مكتبات المشروع |
|---|---|---|---|
| `/api/ad-pack` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، llmjson، brandprofile |
| `/api/adcopy` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | models، groq |
| `/api/agent` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY، SERPER_API_KEY، TAVILY_API_KEY | api.groq.com، api.tavily.com، generativelanguage.googleapis.com، google.serper.dev، openrouter.ai | agents، models، groq، websearch |
| `/api/amazon/check` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، amazonprompts، amazonapi |
| `/api/amazon/competitor` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، amazonprompts، amazonapi |
| `/api/amazon/listing` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، llmjson، amazonprompts، amazonapi |
| `/api/brand-fill` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، llmjson، brandprofile |
| `/api/catalog-copy` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، llmjson |
| `/api/chat` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY، SERPER_API_KEY، TAVILY_API_KEY | api.groq.com، api.tavily.com، generativelanguage.googleapis.com، google.serper.dev، openrouter.ai | answerstyle، models، settings، groq، websearch، bots، botcatalog، fusion، doccontext، brandprofile، answeropts، imagesearch |
| `/api/feasibility` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY، SERPER_API_KEY، TAVILY_API_KEY، YOUTUBE_API_KEY | api.groq.com، api.tavily.com، generativelanguage.googleapis.com، google.serper.dev، itunes.apple.com | groq، models، llmjson، fieldmedia، marketdata، feasibility |
| `/api/image` | CF_API_TOKEN، GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY، TOGETHER_API_KEY | api.cloudflare.com، api.groq.com، api.together.xyz، generativelanguage.googleapis.com، openrouter.ai | groq |
| `/api/logo-gen` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | models، groq، logostudio |
| `/api/pexels` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY، PEXELS_API_KEY | api.groq.com، api.pexels.com، generativelanguage.googleapis.com، openrouter.ai | groq |
| `/api/podcast` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، llmjson، geminitts، podcast |
| `/api/pro` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | botcatalog، groq |
| `/api/product-eye` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، llmjson |
| `/api/prompt-en` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq |
| `/api/prompt-gen` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، llmjson، promptgen |
| `/api/proofread` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، models |
| `/api/realestate` | ANTHROPIC_API_KEY، GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY، SERPER_API_KEY، SUPABASE_SERVICE_ROLE_KEY، TAVILY_API_KEY | api.anthropic.com، api.groq.com، api.tavily.com، generativelanguage.googleapis.com، google.serper.dev | groq، models، llmjson، realdata، realestate، claude، supa |
| `/api/reel` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | models، groq |
| `/api/research` | CORE_API_KEY، GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY، SERPER_API_KEY، TAVILY_API_KEY | api.core.ac.uk، api.groq.com، api.openalex.org، api.semanticscholar.org، api.tavily.com | groq، models، llmjson، scholar |
| `/api/run` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | tools، settings، quality، models، groq، brandprofile |
| `/api/scam-scan` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY، SERPER_API_KEY، TAVILY_API_KEY | api.groq.com، api.tavily.com، generativelanguage.googleapis.com، google.serper.dev، openrouter.ai | groq، scamscan |
| `/api/source-chat` | ANTHROPIC_API_KEY، CORE_API_KEY، GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY، SERPER_API_KEY، SUPABASE_SERVICE_ROLE_KEY، TAVILY_API_KEY | api.anthropic.com، api.core.ac.uk، api.groq.com، api.openalex.org، api.semanticscholar.org | groq، models، llmjson، scholar، websearch، claude، supa، realestate |
| `/api/speak` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، speech |
| `/api/speak-pro` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، speech، geminitts |
| `/api/test-ad` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، llmjson، testad |
| `/api/transcribe` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq |
| `/api/transcribe-long` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، llmjson، longaudio |
| `/api/tts` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq، voices |
| `/api/verify` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY، SERPER_API_KEY، TAVILY_API_KEY | api.groq.com، api.tavily.com، generativelanguage.googleapis.com، google.serper.dev، openrouter.ai | groq، llmjson، websearch |
| `/api/vision` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | groq |
| `/api/vscript` | GEMINI_API_KEY، GROQ_API_KEY، OPENROUTER_API_KEY | api.groq.com، generativelanguage.googleapis.com، openrouter.ai | models، groq |

## مفاتيح البيئة ومين بيستخدمها
أسماء المفاتيح بس، من غير أي قيم.

| المفتاح | عدد الملفات | أمثلة |
|---|---|---|
| `GEMINI_API_KEY` | 8 | `app/api/podcast/route.js`، `app/api/speak-pro/route.js`، `app/api/transcribe-long/route.js` |
| `GROQ_API_KEY` | 7 | `app/api/chat/route.js`، `app/api/proofread/route.js`، `app/api/reel/route.js` |
| `SERPER_API_KEY` | 4 | `lib/imagesearch.js`، `lib/marketdata.js`، `lib/realdata.js` |
| `GEMINI_TTS_MODEL` | 2 | `app/api/podcast/route.js`، `app/api/speak-pro/route.js` |
| `GEMINI_AUDIO_MODEL` | 2 | `app/api/transcribe-long/route.js`، `app/api/transcribe/route.js` |
| `NEXT_PUBLIC_SITE_URL` | 2 | `components/ShareBar.js`، `lib/site.js` |
| `OPENROUTER_API_KEY` | 2 | `lib/botcatalog.js`، `lib/groq.js` |
| `GEMINI_CHAT_MODEL` | 2 | `lib/fieldmedia.js`، `lib/models.js` |
| `CF_ACCOUNT_ID` | 1 | `app/api/image/route.js` |
| `CF_API_TOKEN` | 1 | `app/api/image/route.js` |
| `TOGETHER_API_KEY` | 1 | `app/api/image/route.js` |
| `PEXELS_API_KEY` | 1 | `app/api/pexels/route.js` |
| `PODCAST_AUDIO_LIMIT` | 1 | `app/api/podcast/route.js` |
| `PODCAST_SCRIPT_LIMIT` | 1 | `app/api/podcast/route.js` |
| `SPEAK_PRO_LIMIT` | 1 | `app/api/speak-pro/route.js` |
| `LONG_TRANSCRIBE_LIMIT` | 1 | `app/api/transcribe-long/route.js` |
| `PRO_CODES` | 1 | `lib/botcatalog.js` |
| `PRO_OPEN` | 1 | `lib/botcatalog.js` |
| `ANTHROPIC_API_KEY` | 1 | `lib/claude.js` |
| `CLAUDE_MODEL_FAST` | 1 | `lib/claude.js` |
| `CLAUDE_MODEL_STRONG` | 1 | `lib/claude.js` |
| `REALESTATE_DAILY_USD` | 1 | `lib/claude.js` |
| `GEMINI_LONG_MODEL` | 1 | `lib/doccontext.js` |
| `YOUTUBE_API_KEY` | 1 | `lib/fieldmedia.js` |
| `FUSION_MODELS` | 1 | `lib/fusion.js` |
| `GEMINI_VISION_MODEL` | 1 | `lib/groq.js` |
| `GROQ_MODEL` | 1 | `lib/groq.js` |
| `POLLINATIONS_MODEL` | 1 | `lib/groq.js` |
| `GEMINI_MODEL` | 1 | `lib/models.js` |
| `CORE_API_KEY` | 1 | `lib/scholar.js` |
| `VERCEL_PROJECT_PRODUCTION_URL` | 1 | `lib/site.js` |
| `SUPABASE_SERVICE_ROLE_KEY` | 1 | `lib/supa.js` |
| `SUPABASE_URL` | 1 | `lib/supa.js` |
| `GEMINI_SEARCH_MODEL` | 1 | `lib/websearch.js` |
| `TAVILY_API_KEY` | 1 | `lib/websearch.js` |

## الصفحات
- `/` ← Home.js
- `/agents` ← agents.module.css
- `/agents/[id]` ← AgentRunner.js، agents.module.css
- `/ai/[slug]` ← BotIcon.js، directory.module.css
- `/amazon` ← seller/SellerHero.js، amazon/Hub.js، amazon/icons.js، seller/seller.module.css
- `/amazon/check` ← seller/SellerHero.js، amazon/CheckTool.js
- `/amazon/competitor` ← seller/SellerHero.js، amazon/CompetitorTool.js
- `/amazon/listing` ← seller/SellerHero.js، amazon/ListingTool.js
- `/amazon/profit` ← seller/SellerHero.js، amazon/ProfitTool.js
- `/brand` ← BrandProfile.js
- `/catalog` ← seller/SellerHero.js، seller/Catalog.js
- `/chat` ← MainChat.js
- `/compare` ← ModelCompare.js
- `/creators` ← CreatorAvatar.js، creators.module.css
- `/creators/[slug]` ← CreatorAvatar.js، creators.module.css
- `/feasibility` ← Feasibility.js
- `/feasibility/chat` ← SourceChat.js
- `/flow/[id]` ← FlowRunner.js، flow.module.css
- `/flows` ← FlowCards.js
- `/global-tools` ← DirSearch.js، directory.module.css
- `/global-tools/[cat]` ← DirTools.js، directory.module.css
- `/global-tools/alternatives` ← alternatives.module.css
- `/history` ← ToolIcon.js
- `/lab/remotion` ← lab/RemotionLoader.js، directory.module.css
- `/learn` ← learn.module.css
- `/library` ← BrandLogo.js، LibraryGrid.js، library.module.css
- `/library/[slug]` ← BrandLogo.js، LibraryFrame.js، library.module.css
- `/maker` ← BotIcon.js، directory.module.css، maker.module.css
- `/maker/[slug]` ← BotIcon.js، MakerPrompt.js، MakerImageGen.js، MakerFrame.js، directory.module.css، maker.module.css
- `/maker/create` ← MakerFluxGen.js، directory.module.css
- `/models` ← ModelsGallery.js
- `/my-tools` ← MyTools.js
- `/news` ← NewsList.js، learn.module.css
- `/photo-ad` ← seller/SellerHero.js، seller/PhotoAd.js
- `/plans` ← —
- `/program/[key]` ← BotIcon.js، AskAbout.js، program.module.css
- `/projects` ← seller/SellerHero.js، projects/ProjectsHome.js
- `/projects/[id]` ← projects/ProjectWorkspace.js
- `/prompts` ← PromptsGrid.js، prompts.module.css
- `/prompts/builder` ← prompts/Builder.js
- `/realestate` ← RealEstate.js
- `/realestate/chat` ← SourceChat.js
- `/research` ← Research.js
- `/research/chat` ← SourceChat.js
- `/resources` ← directory.module.css
- `/resources/[cat]` ← directory.module.css
- `/scam-check` ← SubsNav.js، ScamChecker.js
- `/seller` ← seller/SellerHero.js، seller/Showcase.js، seller/seller.module.css
- `/subscriptions` ← SubsNav.js، SubsHub.js
- `/subscriptions/calculator` ← SubsNav.js، SubsCalculator.js
- `/subscriptions/receipt` ← seller/SellerHero.js، SubsNav.js، seller/Receipt.js
- `/survey` ← SurveyForm.js
- `/task/[slug]` ← ToolIcon.js، DirTools.js، directory.module.css
- `/tasks` ← directory.module.css
- `/test-ad` ← seller/SellerHero.js، seller/TestAd.js
- `/tool/[id]` ← ToolPitch.js، ToolRunner.js، studio/LocalTool.js، studio/AdLibrary.js، VisionRunner.js، ToolIcon.js، ToolGuide.js
- `/tools` ← Catalog.js، ExternalLinks.js، ProgramsGrid.js
- `/voice-post` ← seller/SellerHero.js، seller/VoicePost.js

## أدوات الاستوديو ومكوّناتها
- `reel-pro` (ريلز بحركة احترافية) ← `components/lab/RemotionReel.js`
- `product-ad` (فيديو إعلان من صورة المنتج) ← `components/lab/ProductAd.js`
- `video-factory` (مصنع الفيديو بالصوت) ← `components/lab/VideoFactory.js`
- `ai-video` (صانع الريلز بالذكاء الاصطناعي) ← `components/studio/VideoMaker.js`
- `text-video` (فيديو كلام متحرك) ← `components/studio/VideoMaker.js`
- `photo-video` (فيديو من الصور) ← `components/studio/VideoMaker.js`
- `photo-editor` (محرر الصور) ← `components/studio/PhotoEditor.js`
- `poster-maker` (مصمم البوستات) ← `components/studio/Poster.js`
- `remove-bg` (إزالة الخلفية) ← `removebg`
- `image-resize` (تغيير مقاس الصور) ← `components/studio/Resize.js`
- `image-compress` (ضغط الصور) ← `components/studio/Batch.js`
- `image-convert` (تحويل صيغة الصور) ← `components/studio/Batch.js`
- `watermark` (العلامة المائية) ← `components/studio/Watermark.js`
- `color-extract` (ألوان من صورة) ← `components/studio/Colors.js`
- `images-to-pdf` (صور إلى PDF) ← `components/studio/Pdf.js`
- `pdf-merge` (دمج ملفات PDF) ← `components/studio/Pdf.js`
- `pdf-split` (تقسيم PDF) ← `components/studio/Pdf.js`
- `video-frame` (صورة من الفيديو) ← `components/studio/VideoFrame.js`
- `design-apps` (برامج تصميم أونلاين) ← `components/studio/Apps.js`
- `image-to-text` (استخراج نص من صورة) ← `components/studio/Ocr.js`
- `pdf-delete-pages` (حذف صفحات من PDF) ← `components/studio/Pdf.js`
- `logo-maker` (مولد اللوجو) ← `components/studio/LogoStudio.js`
- `qr-code` (مولد QR كود) ← `components/studio/QrStudio.js`
- `image-enhance` (تحسين الصور وتكبيرها) ← `components/studio/Enhance.js`
- `voice-studio` (مولد الأصوات والكتاب المسموع) ← `components/studio/Speak.js`
- `podcast` (بودكاست بصوتين) ← `components/studio/Podcast.js`
- `long-transcribe` (تفريغ التسجيلات الطويلة) ← `components/studio/LongTranscribe.js`

## مكتبات خارجية
- `react`: 89 ملف
- `next`: 71 ملف
- `@remotion/player`: 4 ملف
- `@remotion/web-renderer`: 4 ملف
- `remotion`: 3 ملف
- `msedge-tts`: 2 ملف
- `@remotion/media`: 2 ملف
- `pdf-lib`: 2 ملف
- `react-markdown`: 1 ملف
- `remark-gfm`: 1 ملف

## ملفات محدش بيستوردها
مش لازم تكون زيادة (ممكن تكون سكربتات أو بتتحمّل بطريقة تانية)، لكن تستاهل مراجعة قبل الحذف.
- `components/ProCode.js`
