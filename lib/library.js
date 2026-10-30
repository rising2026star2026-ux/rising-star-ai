// «مكتبة الأدوات»: أدوات بتفتح جوه الموقع بواجهة الشركة الأصلية (iframe)
// كل أداة هنا اتجربت في إطار فعلي واتصورت، واتراجعت رخصتها/شروطها قبل الإضافة:
// مجانية بالكامل، ومفيش مانع تجاري معروف (مفتوحة المصدر، أو الشركة نفسها بتسمح بالتضمين).
// اللي محتاج تسجيل دخول أو رخصته غير تجارية اتشال.

export const LIB_CATS = [
  { id: "ai-img", name: "توليد صور بالذكاء الاصطناعي", icon: "✨", desc: "اكتب وصف وخد صورة" },
  { id: "ai-edit", name: "تعديل صور بالذكاء الاصطناعي", icon: "🪄", desc: "إزالة خلفية، تكبير جودة، تعديل بالكلام" },
  { id: "ai-audio", name: "صوت بالذكاء الاصطناعي", icon: "🎙️", desc: "نص لصوت، وصوت لنص" },
  { id: "ai-chat", name: "شات وقراءة صور وملفات", icon: "💬", desc: "موديلات مفتوحة، OCR، وصف صور" },
  { id: "ai-3d", name: "فيديو وثلاثي الأبعاد", icon: "🎬", desc: "أفاتار متكلم، صورة لمجسم 3D" },
  { id: "img", name: "صور وتصميم", icon: "🎨", desc: "محررات صور وأيقونات وأشكال" },
  { id: "draw", name: "رسم ومخططات", icon: "✏️", desc: "سبورة، مخططات، خرائط ذهنية" },
  { id: "code", name: "برمجة", icon: "💻", desc: "شغّل كود وأدوات مطورين" },
  { id: "kids", name: "تعلّم البرمجة باللعب", icon: "🧩", desc: "للأطفال والمبتدئين" },
  { id: "text", name: "كتابة ومعرفة", icon: "📝", desc: "محررات نصوص ومراجع عربية" },
  { id: "math", name: "رياضيات وعلوم", icon: "🧮", desc: "آلات حاسبة ومحاكاة تفاعلية" },
  { id: "audio", name: "موسيقى وصوت", icon: "🎵", desc: "تحرير صوت وتأليف موسيقى" },
  { id: "files", name: "ملفات وبيانات", icon: "🗂️", desc: "ضغط وتحويل ورسوم بيانية" },
  { id: "map", name: "خرائط وطقس", icon: "🗺️", desc: "خرائط مفتوحة وطقس مباشر" },
];

const HF_NOTE = "مجانية على Hugging Face بحصة يومية لكل زائر؛ لو خلصت، سجّل دخول مجاني في Hugging Face من جوه الأداة تاخد حصة أكبر.";

// T(slug, cat, name, ar, desc, url, lic, extra)
const T = (slug, cat, name, ar, desc, url, lic, extra = {}) => ({
  slug, cat, name, ar, desc, url, lic,
  hf: url.includes(".hf.space"),
  ...extra,
});

export const LIBRARY = [
  // ✨ توليد صور
  T("flux-schnell", "ai-img", "FLUX.1 schnell", "فلَكس السريع", "من أسرع موديلات الصور وأحسنها: اكتب وصف بالإنجليزي وخد صورة في ثواني.", "https://black-forest-labs-flux-1-schnell.hf.space/", "Apache 2.0: مسموح تجارياً", { top: 1 }),
  T("flux-dev", "ai-img", "FLUX.1 dev", "فلَكس بجودة أعلى", "نسخة أبطأ من FLUX بتفاصيل أدق. الصور الناتجة مسموح استخدامها تجارياً حسب رخصة الشركة.", "https://black-forest-labs-flux-1-dev.hf.space/", "رخصة BFL: الموديل غير تجاري لكن الصور الناتجة مسموحة"),
  T("qwen-image", "ai-img", "Qwen-Image", "كوين إيمدج", "موديل علي بابا للصور، ممتاز في كتابة النصوص جوه الصورة والبوسترات.", "https://qwen-qwen-image.hf.space/", "Apache 2.0: مسموح تجارياً", { top: 1 }),
  T("qwen-image-2512", "ai-img", "Qwen-Image 2512", "كوين إيمدج (أحدث)", "إصدار أحدث من Qwen-Image بواقعية أعلى في الوشوش والتفاصيل.", "https://qwen-qwen-image-2512.hf.space/", "Apache 2.0: مسموح تجارياً"),
  T("sd35-large", "ai-img", "Stable Diffusion 3.5 Large", "ستيبل ديفيوجن 3.5", "موديل Stability AI الكبير، متنوع في الأساليب الفنية.", "https://stabilityai-stable-diffusion-3-5-large.hf.space/", "رخصة Stability المجتمعية: مجاني تجارياً تحت مليون دولار إيراد"),
  T("sd35-turbo", "ai-img", "SD 3.5 Large Turbo", "ستيبل ديفيوجن السريع", "نسخة سريعة من SD 3.5 بخطوات أقل.", "https://stabilityai-stable-diffusion-3-5-large-turbo.hf.space/", "رخصة Stability المجتمعية: مجاني تجارياً تحت مليون دولار إيراد"),
  T("realtime-flux", "ai-img", "Realtime FLUX", "صور لحظية", "الصورة بتتغير وانت بتكتب الوصف، ممتاز للتجريب السريع.", "https://kingnish-realtime-flux.hf.space/", "مبني على FLUX schnell (Apache 2.0)"),
  T("janus-pro", "ai-img", "Janus-Pro 7B", "جانوس برو من DeepSeek", "موديل DeepSeek بيولّد صور وكمان يفهم الصور ويوصفها.", "https://deepseek-ai-janus-pro-7b.hf.space/", "رخصة DeepSeek: مسموح تجارياً"),
  T("logo-in-context", "ai-img", "Logo in Context", "شعارك على منتج", "ارفع شعارك واكتب المكان (تيشيرت، كوباية، لافتة) ويحطه عليه بشكل واقعي.", "https://multimodalart-logo-in-context.hf.space/", "مبني على FLUX: الصور الناتجة مسموحة"),
  T("story-diffusion", "ai-img", "StoryDiffusion", "قصة مصورة بنفس الشخصية", "اعمل كوميكس أو قصة مصورة والشخصية ثابتة في كل الصور.", "https://yupengzhou-storydiffusion.hf.space/", "Apache 2.0: مسموح تجارياً"),
  T("flux-prompt", "ai-img", "FLUX Prompt Generator", "مولّد أوصاف الصور", "بيكتبلك وصف احترافي بالإنجليزي تستخدمه في أي مولّد صور.", "https://gokaygokay-flux-prompt-generator.hf.space/", "أداة مفتوحة المصدر"),

  // 🪄 تعديل صور
  T("kontext", "ai-edit", "FLUX.1 Kontext", "عدّل الصورة بالكلام", "ارفع صورة واكتب التعديل (غيّر الخلفية، لبّسه بدلة، خليها ليل) وينفّذه.", "https://black-forest-labs-flux-1-kontext-dev.hf.space/", "رخصة BFL: الصور الناتجة مسموحة تجارياً", { top: 1 }),
  T("qwen-edit", "ai-edit", "Qwen-Image-Edit", "تعديل صور بالكلام", "تعديل دقيق بالأوامر، وبيعرف يعدّل الكلام المكتوب جوه الصورة.", "https://qwen-qwen-image-edit.hf.space/", "Apache 2.0: مسموح تجارياً"),
  T("qwen-edit-2511", "ai-edit", "Qwen-Image-Edit 2511", "تعديل صور (أحدث)", "إصدار أحدث بثبات أعلى للوشوش والشخصيات بعد التعديل.", "https://qwen-qwen-image-edit-2511.hf.space/", "Apache 2.0: مسموح تجارياً"),
  T("qwen-layered", "ai-edit", "Qwen-Image-Layered", "فصل الصورة لطبقات", "بيفكّك الصورة لطبقات منفصلة تقدر تعدّل كل واحدة لوحدها.", "https://qwen-qwen-image-layered.hf.space/", "Apache 2.0: مسموح تجارياً"),
  T("remove-bg", "ai-edit", "Background Removal", "إزالة الخلفية", "شيل خلفية أي صورة في ثانية وخدها PNG شفافة.", "https://not-lain-background-removal.hf.space/", "BiRefNet (MIT): مسموح تجارياً", { top: 1 }),
  T("remove-bg-dis", "ai-edit", "DIS Background Removal", "إزالة خلفية دقيقة", "قص دقيق للحواف الصعبة زي الشعر والتفاصيل الرفيعة.", "https://eccv2022-dis-background-removal.hf.space/", "Apache 2.0: مسموح تجارياً"),
  T("remove-object", "ai-edit", "Remove Photo Object", "مسح عنصر من الصورة", "لوّن على أي حاجة مش عايزها في الصورة وهتختفي.", "https://aryadytm-remove-photo-object.hf.space/", "LaMa (Apache 2.0): مسموح تجارياً"),
  T("outpaint", "ai-edit", "FLUX Fill Outpaint", "توسيع الصورة", "كبّر إطار الصورة والذكاء الاصطناعي يكمّل الأطراف (مثلاً تحويلها لمقاس ريلز).", "https://multimodalart-flux-fill-outpaint.hf.space/", "مبني على FLUX: الصور الناتجة مسموحة"),
  T("upscaler", "ai-edit", "Upscaler", "تكبير جودة الصورة", "كبّر الصورة ×2 و×4 من غير ما تبوظ.", "https://phips-upscaler.hf.space/", "موديلات مفتوحة المصدر", { top: 1 }),
  T("tile-upscaler", "ai-edit", "Tile Upscaler", "تكبير بتفاصيل جديدة", "بيكبّر الصورة ويضيف تفاصيل حادة، مناسب للطباعة.", "https://gokaygokay-tile-upscaler.hf.space/", "أداة مفتوحة المصدر"),
  T("face-restore", "ai-edit", "Face Real-ESRGAN", "تحسين الوشوش والصور القديمة", "صلّح الصور القديمة أو المهزوزة ووضّح الوشوش.", "https://doevent-face-real-esrgan.hf.space/", "Real-ESRGAN (BSD): مسموح تجارياً"),
  T("multi-angle", "ai-edit", "Qwen Multiple Angles", "صوّر المنتج من زوايا تانية", "ارفع صورة منتج أو شخص وخد نفس الصورة من زوايا كاميرا مختلفة.", "https://multimodalart-qwen-image-multiple-angles-3d-camera.hf.space/", "مبني على Qwen (Apache 2.0)"),

  // 🎙️ صوت
  T("whisper", "ai-audio", "Whisper Large v3", "تفريغ صوت لنص", "ارفع تسجيل أو فيديو وخد الكلام مكتوب، بيفهم العربي واللهجات كويس.", "https://hf-audio-whisper-large-v3.hf.space/", "MIT: مسموح تجارياً", { top: 1, arabic: 1 }),
  T("whisper-turbo", "ai-audio", "Whisper Turbo", "تفريغ سريع من المايك", "اتكلم في المايك وشوف الكلام بيتكتب على طول.", "https://kingnish-realtime-whisper-large-v3-turbo.hf.space/", "MIT: مسموح تجارياً", { arabic: 1 }),
  T("chatterbox", "ai-audio", "Chatterbox Multilingual", "تحويل نص لصوت بالعربي", "نطق طبيعي بأكتر من 20 لغة منهم العربي، وتقدر تقلّد صوت من تسجيل قصير.", "https://resembleai-chatterbox-multilingual-tts.hf.space/", "MIT: مسموح تجارياً", { top: 1, arabic: 1 }),
  T("elevenlabs", "ai-audio", "ElevenLabs TTS", "إيليفن لابز (تجربة رسمية)", "تجربة مجانية رسمية من ElevenLabs لأشهر أصوات الذكاء الاصطناعي.", "https://elevenlabs-tts.hf.space/", "صفحة رسمية من الشركة على Hugging Face", { arabic: 1 }),
  T("kokoro", "ai-audio", "Kokoro TTS", "كوكورو للنطق", "موديل صغير وسريع بأصوات إنجليزي طبيعية جداً.", "https://remsky-kokoro-tts-zero.hf.space/", "Apache 2.0: مسموح تجارياً"),
  T("qwen-tts", "ai-audio", "Qwen3-TTS", "كوين للنطق", "أصوات معبّرة بلغات كتير، وتقدر توصف نبرة الصوت اللي عايزها.", "https://qwen-qwen3-tts.hf.space/", "Apache 2.0: مسموح تجارياً"),
  T("parler", "ai-audio", "Parler TTS", "صوت بالوصف", "اوصف الصوت (راجل هادي، ست بحماس) واكتب النص.", "https://parler-tts-parler-tts.hf.space/", "Apache 2.0: مسموح تجارياً"),
  T("orpheus", "ai-audio", "Orpheus TTS", "أورفيوس بمشاعر", "نطق إنجليزي بمشاعر زي الضحك والتنهيد.", "https://mohamedrashad-orpheus-tts.hf.space/", "Apache 2.0: مسموح تجارياً"),
  T("k2-tts", "ai-audio", "Next-gen Kaldi TTS", "نطق بلغات كتير", "مجموعة كبيرة من موديلات النطق المفتوحة بلغات مختلفة.", "https://k2-fsa-text-to-speech.hf.space/", "Apache 2.0: مسموح تجارياً"),

  // 💬 شات وقراءة
  T("qwen3", "ai-chat", "Qwen3 Chat", "شات كوين 3", "شات قوي بيفهم العربي، بديل مجاني ومفتوح.", "https://qwen-qwen3-demo.hf.space/", "Apache 2.0: مسموح تجارياً", { arabic: 1 }),
  T("qwen3-vl", "ai-chat", "Qwen3-VL", "اسأل عن صورة", "ارفع صورة أو مستند واسأل عنه: يقرا ويوصف ويحلل.", "https://qwen-qwen3-vl-demo.hf.space/", "Apache 2.0: مسموح تجارياً", { top: 1, arabic: 1 }),
  T("qwen-webdev", "ai-chat", "Qwen3-Coder WebDev", "اعمل صفحة ويب بالكلام", "اوصف الصفحة اللي عايزها وشوفها بتتبني قدامك.", "https://qwen-qwen3-coder-webdev.hf.space/", "Apache 2.0: مسموح تجارياً", { top: 1 }),
  T("deepseek-ocr", "ai-chat", "DeepSeek-OCR", "استخراج نص من صورة", "حوّل صورة مستند أو جدول لنص تقدر تنسخه.", "https://merterbak-deepseek-ocr-demo.hf.space/", "MIT: مسموح تجارياً"),
  T("multimodal-ocr", "ai-chat", "Multimodal OCR", "قراءة مستندات", "أكتر من موديل لقراءة الصور والمستندات في مكان واحد.", "https://prithivmlmods-multimodal-ocr.hf.space/", "موديلات مفتوحة المصدر"),
  T("florence2", "ai-chat", "Florence-2 Caption", "وصف الصورة", "بيكتب وصف تفصيلي لأي صورة (مفيد لكتابة ALT أو أوصاف).", "https://prithivmlmods-florence-2-image-caption.hf.space/", "MIT: مسموح تجارياً"),
  T("deepseek-vl2", "ai-chat", "DeepSeek-VL2", "DeepSeek يفهم الصور", "اسأل DeepSeek عن صورة أو رسم بياني.", "https://deepseek-ai-deepseek-vl2-small.hf.space/", "رخصة DeepSeek: مسموح تجارياً"),

  // 🎬 فيديو و3D
  T("longcat-avatar", "ai-3d", "LongCat Video Avatar", "أفاتار بيتكلم", "ارفع صورة شخص وتسجيل صوت، وخد فيديو الشخص بيتكلم.", "https://victor-longcat-video-avatar-1-5.hf.space/", "MIT: مسموح تجارياً", { top: 1 }),
  T("video-bg", "ai-3d", "Video Background Removal", "إزالة خلفية الفيديو", "شيل خلفية فيديو قصير من غير جرين سكرين.", "https://innova-ai-video-background-removal.hf.space/", "BiRefNet (MIT): مسموح تجارياً"),
  T("fast-3d", "ai-3d", "Stable Fast 3D", "صورة لمجسم 3D", "حوّل صورة منتج لمجسم ثلاثي الأبعاد في ثواني.", "https://stabilityai-stable-fast-3d.hf.space/", "رخصة Stability المجتمعية: مجاني تحت مليون دولار إيراد"),
  T("step1x-3d", "ai-3d", "Step1X-3D", "مجسم 3D بجودة عالية", "مجسمات 3D بتفاصيل وخامات أدق.", "https://stepfun-ai-step1x-3d.hf.space/", "Apache 2.0: مسموح تجارياً"),
  T("threejs", "ai-3d", "Three.js Editor", "محرر مشاهد 3D", "ابني مشهد ثلاثي الأبعاد وصدّره، من غير برامج.", "https://threejs.org/editor/", "MIT: مفتوح المصدر"),
  T("ffmpeg", "ai-3d", "FFmpeg WASM", "تحويل فيديو في المتصفح", "حوّل صيغ الفيديو والصوت جوه جهازك من غير رفع لأي سيرفر.", "https://ffmpegwasm.netlify.app/", "MIT: مفتوح المصدر"),

  // 🎨 صور وتصميم
  T("photopea", "img", "Photopea", "فوتوبيا (شبيه فوتوشوب)", "محرر صور كامل زي فوتوشوب، بيفتح ملفات PSD وفيجما. فيه إعلانات في النسخة المجانية.", "https://www.photopea.com/#%7B%22files%22:[]%7D", "مجاني بإعلانات، والشركة بتسمح بالتضمين رسمياً", { top: 1 }),
  T("squoosh", "img", "Squoosh", "ضغط الصور", "صغّر حجم الصور وحوّلها WebP/AVIF وشوف الفرق قبل وبعد. من جوجل.", "https://squoosh.app/", "Apache 2.0: مفتوح المصدر", { top: 1 }),
  T("minipaint", "img", "miniPaint", "ميني بينت", "محرر صور خفيف بطبقات وفلاتر، يشتغل حتى على الموبايل.", "https://viliusle.github.io/miniPaint/", "MIT: مفتوح المصدر"),
  T("jspaint", "img", "JS Paint", "الرسام الكلاسيكي", "نسخة من برنامج الرسام بتاع ويندوز، للأطفال والرسم السريع.", "https://jspaint.app/", "MIT: مفتوح المصدر"),
  T("method-draw", "img", "Method Draw", "رسم فيكتور SVG", "ارسم أشكال وشعارات فيكتور بسيطة وصدّرها SVG.", "https://editor.method.ac/", "MIT: مفتوح المصدر"),
  T("blobmaker", "img", "Blobmaker", "أشكال عضوية", "اعمل أشكال ناعمة عشوائية لخلفيات التصميم.", "https://www.blobmaker.app/", "MIT: مفتوح المصدر"),
  T("lucide", "img", "Lucide Icons", "أيقونات Lucide", "أكتر من 1500 أيقونة مجانية تنزلها SVG أو PNG.", "https://lucide.dev/icons/", "ISC: مسموح تجارياً"),
  T("iconoir", "img", "Iconoir", "أيقونات Iconoir", "مكتبة أيقونات أنيقة مجانية بالكامل.", "https://iconoir.com/", "MIT: مسموح تجارياً"),
  T("icones", "img", "Icônes", "بحث في 200 ألف أيقونة", "دوّر في كل مكتبات الأيقونات المفتوحة مرة واحدة.", "https://icones.js.org/", "MIT (والأيقونات برخصة كل مكتبة)"),
  T("rayso", "img", "Ray.so", "صور كود شيك", "حوّل أي كود لصورة جميلة للنشر على السوشيال.", "https://www.ray.so/", "مفتوح المصدر من Raycast"),

  // ✏️ رسم ومخططات
  T("excalidraw", "draw", "Excalidraw", "سبورة رسم حر", "سبورة بخط اليد للشرح والأفكار، وتقدر تشاركها مع فريقك.", "https://excalidraw.com/", "MIT: مفتوح المصدر", { top: 1 }),
  T("drawio", "draw", "draw.io", "مخططات احترافية", "مخططات انسيابية وهياكل تنظيمية وشبكات، بديل Visio.", "https://app.diagrams.net/?splash=0&ui=min", "Apache 2.0: والشركة عاملة وضع تضمين رسمي", { top: 1 }),
  T("mermaid", "draw", "Mermaid Live", "مخطط من نص", "اكتب المخطط كنص بسيط ويترسم لوحده.", "https://mermaid.live/", "MIT: مفتوح المصدر"),
  T("markmap", "draw", "Markmap", "خريطة ذهنية من نقاط", "اكتب نقاط وعناوين وتتحول لخريطة ذهنية تفاعلية.", "https://markmap.js.org/repl", "MIT: مفتوح المصدر"),
  T("kroki", "draw", "Kroki", "مخططات بكل الصيغ", "يحوّل أكتر من 20 لغة مخططات لصور.", "https://kroki.io/", "MIT: مفتوح المصدر"),

  // 💻 برمجة
  T("onecompiler", "code", "OneCompiler", "شغّل كود بأي لغة", "اكتب وشغّل بايثون وجافا وC++ وأكتر من 60 لغة.", "https://onecompiler.com/python", "الشركة بتوفر تضمين مجاني", { top: 1 }),
  T("pyodide", "code", "Pyodide", "بايثون في المتصفح", "كونسول بايثون كامل شغال جوه جهازك.", "https://pyodide.org/en/stable/console.html", "MPL 2.0: مفتوح المصدر"),
  T("tailwind-play", "code", "Tailwind Play", "جرّب Tailwind CSS", "صمّم واجهات بـTailwind وشوف النتيجة فوراً.", "https://play.tailwindcss.com/", "أداة رسمية مجانية"),
  T("cyberchef", "code", "CyberChef", "سكينة المطورين السويسري", "تشفير وفك Base64 وهاش وتحويلات بيانات كتير.", "https://gchq.github.io/CyberChef/", "Apache 2.0: مفتوح المصدر"),
  T("jsoncrack", "code", "JSON Crack", "عرض JSON كرسمة", "حوّل ملفات JSON لمخطط مرئي سهل القراءة.", "https://jsoncrack.com/editor", "Apache 2.0: مفتوح المصدر"),
  T("transform", "code", "Transform Tools", "محوّل صيغ كود", "حوّل JSON لـTypeScript وHTML لـJSX وأكتر.", "https://transform.tools/", "MIT: مفتوح المصدر"),
  T("devdocs", "code", "DevDocs", "توثيق كل اللغات", "توثيق مئات اللغات والمكتبات في مكان واحد.", "https://devdocs.io/", "MPL 2.0: مفتوح المصدر"),
  T("ts-play", "code", "TypeScript Playground", "ملعب TypeScript", "جرّب TypeScript وشوف الـJavaScript الناتج.", "https://www.typescriptlang.org/play", "Apache 2.0: من مايكروسوفت"),
  T("babel", "code", "Babel REPL", "محوّل JavaScript", "حوّل JavaScript الحديث لكود يشتغل في المتصفحات القديمة.", "https://babeljs.io/repl", "MIT: مفتوح المصدر"),
  T("rust-play", "code", "Rust Playground", "ملعب Rust", "اكتب وشغّل كود Rust من غير تثبيت.", "https://play.rust-lang.org/", "MIT/Apache: مفتوح المصدر"),
  T("sqlime", "code", "SQLime", "تجربة SQL", "قاعدة بيانات SQLite في المتصفح لتعلّم وتجربة الاستعلامات.", "https://sqlime.org/", "MIT: مفتوح المصدر"),
  T("lightningcss", "code", "Lightning CSS", "ضغط وتحويل CSS", "صغّر ملفات CSS وحوّلها لصيغ متوافقة.", "https://lightningcss.dev/playground/", "MPL 2.0: مفتوح المصدر"),
  T("css-grid", "code", "CSS Grid Generator", "مولّد CSS Grid", "ارسم التقسيمة بالماوس وخد كود CSS جاهز.", "https://cssgrid-generator.netlify.app/", "MIT: مفتوح المصدر"),

  // 🧩 تعلّم البرمجة باللعب
  T("makecode", "kids", "MakeCode Arcade", "اعمل لعبتك", "اعمل ألعاب فيديو بالبلوكات أو JavaScript، من مايكروسوفت.", "https://arcade.makecode.com/", "MIT: مفتوح المصدر"),
  T("blockly-games", "kids", "Blockly Games", "ألعاب بلوكلي", "ألغاز بتعلّم أساسيات البرمجة خطوة خطوة، فيها عربي.", "https://blockly.games/?lang=ar", "Apache 2.0: من جوجل", { arabic: 1 }),

  // 📝 كتابة ومعرفة
  T("stackedit", "text", "StackEdit", "محرر ماركداون", "اكتب بالماركداون وشوف المعاينة جنبك، وصدّر HTML أو PDF.", "https://stackedit.io/app", "Apache 2.0: مفتوح المصدر"),
  T("dillinger", "text", "Dillinger", "محرر ماركداون بسيط", "محرر نظيف للمقالات والملاحظات مع تصدير.", "https://dillinger.io/", "MIT: مفتوح المصدر"),
  T("wikipedia", "text", "ويكيبيديا العربية", "ويكيبيديا", "الموسوعة الحرة بالعربي.", "https://ar.wikipedia.org/", "CC BY-SA: محتوى حر", { arabic: 1 }),
  T("wiktionary", "text", "ويكاموس", "قاموس عربي حر", "معاني الكلمات وتصريفها وترجماتها.", "https://ar.wiktionary.org/", "CC BY-SA: محتوى حر", { arabic: 1 }),
  T("quran", "text", "Quran.com", "القرآن الكريم", "المصحف بالتلاوات والتفاسير والترجمات.", "https://quran.com/ar", "منصة وقفية مجانية بدون إعلانات", { arabic: 1, top: 1 }),

  // 🧮 رياضيات وعلوم
  T("desmos", "math", "Desmos", "آلة رسم بياني", "ارسم أي دالة ومعادلة وشوفها بتتحرك. الأشهر في المدارس.", "https://www.desmos.com/calculator?lang=ar", "Desmos بتسمح بالتضمين حتى تجارياً مع ذكر اسمها", { top: 1, arabic: 1 }),
  T("desmos-sci", "math", "Desmos Scientific", "آلة حاسبة علمية", "آلة حاسبة علمية كاملة وسهلة.", "https://www.desmos.com/scientific?lang=ar", "Desmos بتسمح بالتضمين مع ذكر اسمها", { arabic: 1 }),
  T("numbat", "math", "Numbat", "حاسبة بالوحدات", "احسب وحوّل وحدات (كيلو، ميل، جنيه...) في معادلة واحدة.", "https://numbat.dev/", "MIT/Apache: مفتوح المصدر"),
  ...[
    ["projectile-motion", "حركة المقذوفات", "اضرب قذيفة وغيّر الزاوية والسرعة وشوف المسار."],
    ["circuit-construction-kit-dc", "دوائر كهربائية", "ابني دايرة ببطاريات ولمبات ومقاومات."],
    ["fractions-intro", "الكسور", "افهم الكسور بالرسم والأشكال."],
    ["gravity-force-lab", "قوة الجاذبية", "شوف قوة الجذب بين جسمين."],
    ["wave-on-a-string", "الموجات", "موجة على حبل: التردد والسعة."],
    ["ph-scale", "مقياس pH", "حمضي ولا قاعدي؟ جرّب بنفسك."],
    ["build-an-atom", "ابني ذرة", "بروتونات ونيوترونات وإلكترونات."],
    ["molecule-shapes", "أشكال الجزيئات", "شوف الجزيئات ثلاثية الأبعاد."],
    ["energy-skate-park", "حفظ الطاقة", "متزلج على منحدر: طاقة حركة ووضع."],
    ["pendulum-lab", "البندول", "زمن الذبذبة وطول الخيط."],
    ["graphing-lines", "رسم المستقيمات", "الميل والجزء المقطوع."],
    ["equality-explorer", "المعادلات", "حل المعادلات بالميزان."],
    ["area-builder", "المساحة", "ابني أشكال واحسب مساحتها."],
    ["balloons-and-static-electricity", "الكهرباء الساكنة", "بالونة وشعر وشحنات."],
  ].map(([id, ar, desc]) => T(`phet-${id}`, "math", `PhET: ${ar}`, `محاكاة ${ar}`, `${desc} محاكاة تفاعلية من جامعة كولورادو بالعربي.`, `https://phet.colorado.edu/sims/html/${id}/latest/${id}_all.html?locale=ar`, "CC BY 4.0: مسموح تجارياً مع ذكر المصدر", { arabic: 1 })),

  // 🎵 موسيقى وصوت
  T("audiomass", "audio", "AudioMass", "محرر صوت", "قص ودمج وفلاتر للصوت زي Audacity، جوه المتصفح.", "https://audiomass.co/", "MIT: مفتوح المصدر", { top: 1 }),
  T("beepbox", "audio", "BeepBox", "تأليف ألحان", "ألّف لحن بسيط بالنقر وصدّره WAV أو MP3.", "https://www.beepbox.co/", "MIT: مفتوح المصدر"),
  T("music-lab", "audio", "Chrome Music Lab", "معمل الموسيقى", "تجارب موسيقية ممتعة للأطفال والمبتدئين من جوجل.", "https://musiclab.chromeexperiments.com/", "Apache 2.0: من جوجل"),
  T("strudel", "audio", "Strudel", "موسيقى بالكود", "اعمل إيقاعات وموسيقى إلكترونية بكتابة كود بسيط.", "https://strudel.cc/", "AGPL: مفتوح المصدر"),

  // 🗂️ ملفات وبيانات
  T("rawgraphs", "files", "RAWGraphs", "رسوم بيانية من جدول", "الصق بيانات Excel وخد رسم بياني شيك SVG.", "https://app.rawgraphs.io/", "Apache 2.0: مفتوح المصدر", { top: 1 }),

  // 🗺️ خرائط وطقس
  T("osm", "map", "OpenStreetMap", "خريطة مفتوحة", "خريطة العالم المفتوحة، بديل حر لخرائط جوجل.", "https://www.openstreetmap.org/export/embed.html?bbox=31.1,29.9,31.4,30.2&layer=mapnik", "ODbL: مسموح مع ذكر المصدر"),
  T("windy", "map", "Windy", "طقس مباشر", "خريطة الرياح والأمطار والحرارة لحظة بلحظة.", "https://embed.windy.com/embed2.html?lat=30.04&lon=31.23&zoom=5", "ويدجت تضمين رسمي مجاني من Windy", { top: 1 }),

  // من جوجل
  T("autodraw", "draw", "AutoDraw", "رسم ذكي", "ارسم شخبطة والذكاء الاصطناعي يحوّلها لرسمة نضيفة.", "https://www.autodraw.com/", "تجربة مجانية من جوجل"),
  T("tf-playground", "ai-chat", "TensorFlow Playground", "افهم الشبكات العصبية", "شوف بعينك الشبكة العصبية بتتعلم إزاي.", "https://playground.tensorflow.org/", "Apache 2.0: مفتوح المصدر"),
];

export const getLibTool = (slug) => LIBRARY.find((t) => t.slug === slug);
export const libByCat = (cat) => LIBRARY.filter((t) => t.cat === cat);
export const LIB_HF_NOTE = HF_NOTE;

// برامج مشهورة بتمنع الفتح جوه أي موقع تاني، والبديل اللي بيفتح عندنا
// strength: قريب جداً / كويس / أضعف
export const BLOCKED = [
  { name: "Adobe Photoshop / Express", url: "https://www.adobe.com/express/", alt: ["photopea", "remove-bg"], strength: "قريب جداً", why: "Photopea بيفتح ملفات PSD وفيه طبقات وفلاتر وأدوات فوتوشوب الأساسية؛ الناقص: فلاتر Adobe الذكية والخطوط المدفوعة." },
  { name: "Canva", url: "https://www.canva.com/", alt: ["photopea", "qwen-image", "logo-in-context"], strength: "كويس", why: "مفيش قوالب جاهزة بالآلاف زي Canva، لكن Photopea بيعمل نفس التصميم، وQwen-Image بيولّد بوستر بالكلام." },
  { name: "Figma", url: "https://www.figma.com/", alt: ["photopea", "excalidraw", "tailwind-play"], strength: "أضعف", why: "مفيش بديل مجاني بيفتح جوه المواقع بنفس قوة Figma للتصميم الجماعي؛ Photopea بيفتح ملفات Figma للتعديل البسيط." },
  { name: "Miro", url: "https://miro.com/", alt: ["excalidraw", "drawio"], strength: "قريب جداً", why: "Excalidraw سبورة جماعية بنفس الفكرة، وdraw.io للمخططات المنظمة." },
  { name: "Microsoft Visio / Lucidchart", url: "https://www.lucidchart.com/", alt: ["drawio", "mermaid"], strength: "قريب جداً", why: "draw.io بيعمل كل أنواع المخططات تقريباً ومجاني بالكامل." },
  { name: "ChatGPT / Claude / Gemini", url: "https://chatgpt.com/", alt: ["qwen3", "qwen3-vl"], strength: "كويس", why: "الشات بتاع موقعنا نفسه بيوصلك لموديلات قوية، وQwen3 بيفتح هنا بواجهته. الموديلات المغلقة الكبيرة لسه أقوى في المهام الصعبة." },
  { name: "Google Docs / Notion", url: "https://docs.google.com/", alt: ["stackedit", "dillinger"], strength: "أضعف", why: "المحررات البديلة كويسة للكتابة والتصدير، لكن مفيهاش تعاون لحظي زي Google Docs." },
  { name: "Grammarly", url: "https://www.grammarly.com/", alt: [], site: "/tools", strength: "كويس", why: "أدوات التدقيق والصياغة جوه موقعنا بتشتغل على العربي، وده اللي Grammarly ما بيدعموش." },
  { name: "Scratch", url: "https://scratch.mit.edu/", alt: ["makecode", "blockly-games"], strength: "كويس", why: "MakeCode بنفس فكرة البلوكات وبيعمل ألعاب حقيقية، وBlockly Games بتعلّم الأساسيات بالعربي؛ لكن مجتمع ومشاريع سكراتش مش موجودة."},
  { name: "GeoGebra", url: "https://www.geogebra.org/", alt: ["desmos", "desmos-sci"], strength: "قريب جداً", why: "GeoGebra رخصته بتمنع الاستخدام التجاري المجاني؛ Desmos بيعمل نفس الرسم البياني وبيسمح بالتضمين." },
  { name: "remove.bg", url: "https://www.remove.bg/", alt: ["remove-bg", "remove-bg-dis"], strength: "قريب جداً", why: "نفس النتيجة تقريباً ومن غير حد للتحميل بجودة كاملة." },
  { name: "ElevenLabs (الموقع الكامل)", url: "https://elevenlabs.io/", alt: ["chatterbox", "elevenlabs"], strength: "كويس", why: "Chatterbox بينطق عربي مجاناً ويقلّد الصوت؛ ElevenLabs الأصلي لسه أطبع في بعض الأصوات." },
  { name: "Kapwing / CapCut", url: "https://www.capcut.com/", alt: ["ffmpeg", "video-bg"], site: "/tool/reel-pro", strength: "أضعف", why: "مفيش محرر فيديو مجاني كامل بيفتح جوه المواقع؛ عندنا أداة الريلز الاحترافية + إزالة خلفية الفيديو." },
  { name: "Smallpdf / Convertio", url: "https://smallpdf.com/", alt: ["squoosh", "ffmpeg"], strength: "أضعف", why: "تحويل الصور والفيديو متاح هنا، لكن أدوات PDF الكاملة لسه بتفتح في تبويب." },
];
