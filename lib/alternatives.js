// بدائل مجانية لأشهر الأدوات المدفوعة (صفحة في دليل «أدوات عالمية»، والكلمة «مجاني» مسموحة هنا بس)
// اتراجعت يدوياً في 4 نوفمبر 2026. الأسعار بالدولار في الشهر لو الدفع شهري، ومن مصادر منشورة؛ لو السعر مش مؤكد مش بنكتبه.
// kind: free = ببلاش بالكامل · freemium = خطة مجانية بحدود · credits = رصيد مجاني محدود · open = مفتوح المصدر
// inSite = نفس الشغل جوه Rising StarAi

export const ALT_UPDATED_AR = "4 نوفمبر 2026";

export const KIND = {
  free: "مجاني بالكامل",
  freemium: "خطة مجانية بحدود",
  credits: "رصيد مجاني محدود",
  open: "مفتوح المصدر ومجاني",
};

export const ALTERNATIVES = [
  {
    id: "graphics", cat: "تصميم الجرافيك والشعارات", icon: "✏️",
    paid: { name: "Adobe Illustrator", url: "https://www.adobe.com/products/illustrator.html" },
    free: [
      { name: "Inkscape", url: "https://inkscape.org", kind: "open", note: "برنامج كمبيوتر للتصميم المتجه (لوجوهات وأيقونات)" },
      { name: "Canva", url: "https://www.canva.com", kind: "freemium", note: "تصميم سوشيال ميديا وبوسترات من المتصفح" },
    ],
    inSite: { href: "/tool/logo-maker", label: "مولد اللوجو" },
  },
  {
    id: "ideas", cat: "أفكار المحتوى", icon: "💡",
    paid: { name: "BuzzSumo", url: "https://buzzsumo.com", usd: 199 },
    free: [
      { name: "Answer Socrates", url: "https://answersocrates.com", kind: "freemium", note: "الأسئلة اللي الناس بتدوّر عليها في جوجل" },
      { name: "Google Trends", url: "https://trends.google.com", kind: "free", note: "إيه اللي الناس بتدوّر عليه دلوقتي في مصر" },
    ],
    inSite: { href: "/tool/post-ideas", label: "أفكار منشورات" },
  },
  {
    id: "video", cat: "مونتاج الفيديو", icon: "🎬",
    paid: { name: "Adobe Premiere Pro", url: "https://www.adobe.com/products/premiere.html" },
    free: [
      { name: "DaVinci Resolve", url: "https://www.blackmagicdesign.com/products/davinciresolve", kind: "free", note: "نسخة مجانية قوية جداً على الكمبيوتر" },
      { name: "CapCut", url: "https://www.capcut.com", kind: "freemium", note: "مونتاج سريع للموبايل والريلز" },
    ],
    inSite: { href: "/tool/photo-video", label: "فيديو من الصور" },
  },
  {
    id: "projects", cat: "إدارة المشاريع والمهام", icon: "📋",
    paid: { name: "ClickUp", url: "https://clickup.com" },
    free: [
      { name: "Trello", url: "https://trello.com", kind: "freemium", note: "لوحات مهام سهلة لفريق صغير" },
    ],
    inSite: { href: "/tool/daily-plan", label: "خطة اليوم" },
  },
  {
    id: "email", cat: "التسويق بالإيميل", icon: "✉️",
    paid: { name: "Mailchimp", url: "https://mailchimp.com" },
    free: [
      { name: "Sender", url: "https://www.sender.net", kind: "freemium", note: "لحد 2,500 مشترك و15,000 إيميل في الشهر ببلاش" },
    ],
    inSite: { href: "/tool/email-campaign", label: "حملة بريدية" },
    srcs: ["https://www.sender.net/pricing"],
  },
  {
    id: "text-video", cat: "فيديو من نص", icon: "🎞️",
    paid: { name: "Pictory", url: "https://pictory.ai", usd: 29, note: "مفيش خطة مجانية، تجربة 14 يوم بس" },
    free: [
      { name: "CapCut", url: "https://www.capcut.com", kind: "freemium", note: "فيه تحويل نص لفيديو بقوالب" },
      { name: "Runway", url: "https://runwayml.com", kind: "credits", note: "رصيد تجربة لمرة واحدة" },
    ],
    srcs: ["https://knowlify.com/articles/pictory-pricing"],
  },
  {
    id: "image-ai", cat: "توليد الصور بالذكاء الاصطناعي", icon: "🖼️",
    paid: { name: "Midjourney", url: "https://www.midjourney.com", usd: 10, note: "مفيش خطة مجانية" },
    free: [
      { name: "Ideogram", url: "https://ideogram.ai", kind: "freemium", note: "ممتاز في الصور اللي فيها كلام" },
      { name: "Leonardo AI", url: "https://leonardo.ai", kind: "freemium", note: "رصيد يومي مجاني" },
      { name: "Adobe Firefly", url: "https://firefly.adobe.com", kind: "credits", note: "رصيد مجاني محدود في الشهر" },
    ],
  },
  {
    id: "chat", cat: "شات ذكاء اصطناعي", icon: "💬",
    paid: { name: "ChatGPT Plus", url: "https://chatgpt.com/pricing", usd: 20 },
    free: [
      { name: "HuggingChat", url: "https://huggingface.co/chat", kind: "freemium", note: "أكتر من 100 نموذج مفتوح المصدر بحد يومي" },
      { name: "ChatGPT (الخطة المجانية)", url: "https://chatgpt.com", kind: "freemium", note: "نفس الشات بحدود استخدام" },
    ],
    inSite: { href: "/chat", label: "شات Rising" },
    srcs: ["https://huggingface.co/spaces/huggingchat/chat-ui/discussions/764"],
  },
  {
    id: "translate", cat: "الترجمة", icon: "🌐",
    paid: { name: "DeepL Pro", url: "https://www.deepl.com/pro", usd: 8.74 },
    free: [
      { name: "Google Translate", url: "https://translate.google.com", kind: "free", note: "نصوص وصور ومستندات" },
      { name: "DeepL (المجاني)", url: "https://www.deepl.com/translator", kind: "freemium", note: "بحد للنص والملفات" },
    ],
    inSite: { href: "/tool/translate", label: "المترجم" },
  },
  {
    id: "social", cat: "جدولة وتسويق السوشيال ميديا", icon: "📣",
    paid: { name: "HubSpot Marketing Hub", url: "https://www.hubspot.com/products/marketing" },
    free: [
      { name: "Meta Business Suite", url: "https://business.facebook.com", kind: "free", note: "جدولة بوستات فيس بوك وإنستجرام من مكان واحد" },
    ],
    inSite: { href: "/seller", label: "استوديو البائع" },
  },
  {
    id: "website", cat: "عمل موقع", icon: "🌍",
    paid: { name: "Webflow", url: "https://webflow.com" },
    free: [
      { name: "WordPress.org", url: "https://wordpress.org", kind: "open", note: "البرنامج مجاني، بس محتاج استضافة ودومين بفلوس" },
      { name: "Google Sites", url: "https://sites.google.com", kind: "free", note: "موقع بسيط ببلاش على رابط جوجل" },
    ],
    inSite: { href: "/tool/landing-page", label: "صفحة هبوط" },
  },
  {
    id: "seo", cat: "تحسين محركات البحث (SEO)", icon: "🔍",
    paid: { name: "SE Ranking", url: "https://seranking.com" },
    free: [
      { name: "Google Search Console", url: "https://search.google.com/search-console", kind: "free", note: "كلمات البحث اللي جابت زوار لموقعك فعلاً" },
      { name: "Ubersuggest", url: "https://neilpatel.com/ubersuggest/", kind: "freemium", note: "عدد بحث محدود في اليوم" },
    ],
    inSite: { href: "/tool/seo-article", label: "مقال SEO" },
  },
  {
    id: "voice", cat: "التعليق الصوتي", icon: "🎙️",
    paid: { name: "Murf AI", url: "https://murf.ai", usd: 29 },
    free: [
      { name: "ElevenLabs (المجاني)", url: "https://elevenlabs.io", kind: "freemium", note: "رصيد شهري صغير ومنسوب ليهم" },
    ],
    inSite: { href: "/tool/voice-studio", label: "مولد الأصوات بالمصري والسعودي" },
    srcs: ["https://www.roborhythms.com/?p=30873"],
  },
  {
    id: "writing", cat: "التدقيق والكتابة", icon: "✍️",
    paid: { name: "Grammarly Pro", url: "https://www.grammarly.com/plans", usd: 30 },
    free: [
      { name: "QuillBot", url: "https://quillbot.com", kind: "freemium", note: "إعادة صياغة وتدقيق بحدود" },
      { name: "LanguageTool", url: "https://languagetool.org", kind: "freemium", note: "تدقيق لأكتر من 30 لغة منها العربي" },
    ],
    inSite: { href: "/tool/proofread", label: "المدقق اللغوي" },
  },
  {
    id: "finance", cat: "الحسابات والميزانية", icon: "💰",
    paid: { name: "Quicken", url: "https://www.quicken.com" },
    free: [
      { name: "Google Sheets", url: "https://docs.google.com/spreadsheets", kind: "free", note: "قوالب ميزانية جاهزة جوه Sheets" },
    ],
    inSite: { href: "/tool/budget", label: "الميزانية الشهرية" },
    fix: "Mint اللي بيتقال عليه بديل اتقفل في مارس 2024.",
    srcs: ["https://www.nerdwallet.com/article/finance/mint-app-closing-what-it-means-how-to-pick-a-new-budget-service"],
  },
  {
    id: "notes", cat: "الملاحظات والإنتاجية", icon: "🗂️",
    paid: { name: "Notion (الخطط المدفوعة)", url: "https://www.notion.com/pricing" },
    free: [
      { name: "Notion (المجاني)", url: "https://www.notion.com", kind: "freemium", note: "كفاية لشخص واحد" },
      { name: "Obsidian", url: "https://obsidian.md", kind: "free", note: "ملاحظات على جهازك ببلاش للاستخدام الشخصي" },
    ],
    inSite: { href: "/projects", label: "المشاريع" },
  },
  {
    id: "crm", cat: "المبيعات وإدارة العملاء (CRM)", icon: "🤝",
    paid: { name: "Salesforce", url: "https://www.salesforce.com" },
    free: [
      { name: "HubSpot CRM", url: "https://www.hubspot.com/products/crm", kind: "freemium", note: "إدارة العملاء والصفقات ببلاش بحدود" },
    ],
    inSite: { href: "/tool/whatsapp-sales", label: "رسائل بيع واتساب" },
  },
  {
    id: "photo", cat: "تعديل الصور", icon: "🖌️",
    paid: { name: "Adobe Photoshop", url: "https://www.adobe.com/products/photoshop.html" },
    free: [
      { name: "GIMP", url: "https://www.gimp.org", kind: "open", note: "برنامج كمبيوتر قريب من فوتوشوب" },
      { name: "Photopea", url: "https://www.photopea.com", kind: "free", note: "شبه فوتوشوب من المتصفح (بإعلانات)" },
    ],
    inSite: { href: "/tool/photo-editor", label: "محرر الصور وإزالة الخلفية" },
  },
  {
    id: "analytics", cat: "تحليل زوار الموقع", icon: "📊",
    paid: { name: "Hotjar", url: "https://www.hotjar.com" },
    free: [
      { name: "Microsoft Clarity", url: "https://clarity.microsoft.com", kind: "free", note: "خرائط حرارية وتسجيل جلسات الزوار" },
      { name: "Google Analytics", url: "https://analytics.google.com", kind: "free", note: "أعداد الزوار ومصادرهم" },
    ],
    fix: "Google Analytics نفسه مجاني، فـ Clarity مكمّل ليه مش بديل عنه.",
  },
  {
    id: "slides", cat: "العروض التقديمية", icon: "📽️",
    paid: { name: "PowerPoint (Microsoft 365)", url: "https://www.microsoft.com/microsoft-365" },
    free: [
      { name: "Google Slides", url: "https://slides.google.com", kind: "free", note: "عروض من المتصفح ومشاركة سهلة" },
      { name: "Gamma", url: "https://gamma.app", kind: "freemium", note: "عرض كامل من وصف بالذكاء الاصطناعي" },
    ],
    inSite: { href: "/tool/presentation-outline", label: "هيكل العرض التقديمي" },
  },
];
