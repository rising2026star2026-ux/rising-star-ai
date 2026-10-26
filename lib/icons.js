// أيقونة خاصة لكل أداة. لو أداة مش موجودة هنا، بتاخد أيقونة التصنيف.
export const ICONS = {
  // استوديو التصميم + Adspy
  adspy: "🕵️", "ai-video": "🎥", "text-video": "📽️", "photo-video": "🌄", "photo-editor": "🖼️", "poster-maker": "🖍️", "remove-bg": "✂️", "image-resize": "📐", "image-compress": "🗜",
  "image-convert": "🔁", watermark: "💧", "color-extract": "🎨", "images-to-pdf": "📄", "pdf-merge": "📚", "pdf-split": "📑",
  "video-frame": "🎞️", "design-apps": "🧰",
  // كتابة ومحتوى
  article: "📝", "blog-intro": "🪝", rewrite: "🔄", summarize: "🗜️", expand: "🌱", proofread: "✔️", titles: "🏷️",
  outline: "🗂️", paragraph: "📃", conclusion: "🏁", simplify: "🪄", formalize: "📜", "press-release": "📰", "faq-writer": "❓",
  // تسويق
  "ad-copy": "📣", slogan: "✨", "landing-page": "🛬", "email-campaign": "📧", "seo-article": "🔎", "meta-desc": "🧾",
  keywords: "🔑", "marketing-plan": "🗺️", persona: "👥", usp: "💎", "offer-ideas": "🏷", "brand-name": "🪧", cta: "👆", "competitor-swot": "🥊",
  // سوشيال
  post: "📱", caption: "📸", hashtags: "#️⃣", "tiktok-script": "🎬", "youtube-title": "▶️", "youtube-desc": "📺",
  "content-calendar": "📅", thread: "🧵", "linkedin-post": "👔", bio: "🪪", "reply-comments": "💭", "post-ideas": "💡", "reel-hooks": "🎣", carousel: "🎠",
  // أعمال
  "business-plan": "📋", swot: "🧭", "business-ideas": "🚀", pitch: "💼", "mission-vision": "🔭", "meeting-agenda": "🕒",
  "meeting-minutes": "🗒️", proposal: "🤝", kpi: "📈", "pricing-strategy": "💲", "risk-analysis": "⚠️", "policy-draft": "🏛️", "feasibility-questions": "❔",
  // تجارة إلكترونية
  "product-desc": "📦", "product-title": "🔖", "product-features": "⭐", "store-name": "🏪", "return-policy": "↩️", "shipping-msg": "🚚",
  "review-reply": "💬", "whatsapp-sales": "💚", upsell: "➕", "abandoned-cart": "🛒", "category-desc": "🗃️", "store-about": "🏬", "product-faq": "🙋",
  // تعليم
  explain: "🧑‍🏫", quiz: "✏️", flashcards: "🃏", "study-plan": "📆", "lesson-plan": "🍎", essay: "🖊️", "research-outline": "🔍",
  examples: "🧷", "mind-map": "🧠", "math-solver": "➗", "lesson-summary": "📒", eli5: "🧸", worksheet: "📐", "exam-tips": "🎓",
  // لغة
  translate: "🌐", "translate-dialect": "🗣️", "grammar-explain": "📏", tashkeel: "✒️", synonyms: "♻️", "english-correct": "🅰️",
  vocab: "🔡", idioms: "🗝️", "word-meaning": "📘", "conversation-practice": "🎧", "sentence-examples": "🧱", "spelling-rules": "✍️", bilingual: "🔀",
  // برمجة
  "code-gen": "💻", "code-explain": "🔦", debug: "🐞", regex: "🔣", sql: "🗄️", "code-review": "👀", "convert-code": "🔃",
  comments: "🗯️", "api-docs": "🔌", "html-css": "🌍", "unit-tests": "🧪", "git-commit": "🌿", "excel-formula": "📗",
  // وظائف
  cv: "📄", "cover-letter": "📨", "interview-qs": "🎙️", "linkedin-about": "👤", "job-desc": "🧑‍💼", "salary-negotiation": "💰",
  resignation: "🚪", "career-path": "🪜", "skills-gap": "🧗", achievements: "🏆", "thank-you-interview": "🙏", "freelance-proposal": "🧑‍💻", "portfolio-desc": "📁",
  // إنتاجية
  todo: "✅", "daily-plan": "☀️", "weekly-plan": "🗓️", goals: "🎯", decision: "⚖️", brainstorm: "🌪️", prioritize: "🔝",
  habits: "🔁", "notes-organize": "📎", checklist: "☑️", procedure: "⚙️", "time-estimate": "⏱️", "problem-solve": "🛠️",
  // رسائل
  "email-writer": "✉️", "email-reply": "↪️", apology: "🙇", congrats: "🎉", invitation: "💌", condolence: "🕊️", complaint: "📮",
  "follow-up": "🔔", decline: "🙅", feedback: "🗨️", speech: "🎤", announcement: "📢", "tone-check": "🎚️",
  // إبداع
  "short-story": "📖", "kids-story": "🧚", poem: "🪶", khawater: "🌙", dialogue: "🎭", characters: "🦸", plot: "🌀",
  jokes: "😂", riddles: "🧩", "names-gen": "👶", "song-original": "🎵", "scene-desc": "🏞️", "story-continue": "➡️",
  // تصميم
  "image-prompt": "🌄", "logo-ideas": "🔷", palette: "🎨", "font-pairing": "🔠", "ui-copy": "📲", "banner-text": "🎌",
  "video-prompt": "🎥", moodboard: "🌈", "brand-identity": "🧬", "presentation-outline": "📽️", infographic: "📊", "thumbnail-ideas": "🖼️", "ux-review": "🧑‍🎨",
  // تحليل
  "text-analyze": "🔬", sentiment: "😊", compare: "🆚", "pros-cons": "🤔", "data-insights": "📉", survey: "🗳️", "survey-analysis": "🧮",
  "extract-info": "🧲", "critical-thinking": "🧐", report: "📑", "table-gen": "🔲", "keywords-extract": "🔆", classify: "🗄", "key-points": "📌",
  // حياة يومية
  recipe: "🍳", "meal-plan": "🥗", "travel-plan": "✈️", "gift-ideas": "🎁", "party-plan": "🥳", "home-organize": "🧺", budget: "👛",
  "kids-activities": "🪁", "book-recs": "📚", "movie-recs": "🍿", hobbies: "🎸", packing: "🧳", motivation: "🌟",
};

// صور اختيارية لأدوات معينة: حط الصورة في مجلد public/logos واكتب اسمها هنا.
// مثال: "linkedin-post": "/logos/linkedin.svg"
// مسؤوليتك تتأكد إن إرشادات العلامة التجارية بتسمح بالاستخدام.
export const LOGOS = {};
