// «مكتبة البرومبتات»: أوامر جاهزة تنسخها وتحطها في أي أداة. إضافة برومبت = إضافة سطر P(...) هنا بس.
// الأقواس [زي كده] مكان اللي تغيّره بكلامك. برومبتات الصور والفيديو إنجليزي لأن الموديلات بتفهمه أدق.

export const PROMPT_CATS = [
  { id: "image", name: "صور واقعية وفنية", icon: "🖼️", desc: "بورتريه، طبيعة، أكل، عقارات" },
  { id: "product", name: "منتجات وإعلانات", icon: "🛍️", desc: "صور منتجات وبوسترات جاهزة للبيع" },
  { id: "brand", name: "شعارات وهوية", icon: "🔰", desc: "لوجو، أيقونات، ستيكرات" },
  { id: "edit", name: "تعديل صور بالكلام", icon: "🪄", desc: "أوامر لـKontext وQwen-Edit" },
  { id: "video", name: "فيديو سينمائي", icon: "🎬", desc: "مشاهد ولقطات لمولدات الفيديو" },
  { id: "camera", name: "حركات كاميرا", icon: "🎥", desc: "جمل جاهزة تضيفها لأي برومبت فيديو" },
  { id: "reels", name: "ريلز وتيك توك", icon: "📱", desc: "هوكات وسكريبتات قصيرة" },
  { id: "thumb", name: "صور مصغرة وأغلفة", icon: "▶️", desc: "يوتيوب، بودكاست، أغلفة كتب" },
  { id: "text", name: "تسويق وكتابة بالعربي", icon: "✍️", desc: "بوستات، إعلانات، ردود عملاء" },
  { id: "voice", name: "تعليق صوتي وسيناريو", icon: "🎙️", desc: "نصوص لمصنع الفيديو والأصوات" },
];

const LINK = {
  img: { href: "/library/flux-schnell", label: "افتح مولّد الصور" },
  edit: { href: "/library/kontext", label: "افتح أداة التعديل" },
  vid: { href: "/maker", label: "افتح صانع الصور والفيديو" },
  chat: { href: "/chat", label: "جرّبه في الشات" },
  fac: { href: "/tool/video-factory", label: "افتح مصنع الفيديو" },
};

// P(id, cat, title, text, link, tip)
const P = (id, cat, title, text, link, tip = "") => ({ id, cat, title, text, link: LINK[link], tip });

export const PROMPTS = [
  // 🖼️ صور
  P("portrait-studio", "image", "بورتريه استوديو", "Studio portrait of a [age] [man/woman] with [hair/features], soft key light with gentle rim light, 85mm lens, shallow depth of field, neutral gray backdrop, natural skin texture, sharp eyes, high detail, photorealistic", "img", "غيّر الأقواس بوصف الشخص. مناسب لصور البروفايل."),
  P("portrait-street", "image", "بورتريه في الشارع", "Candid street portrait of a [person description] in [city] at golden hour, warm backlight, bokeh city lights, 50mm lens, film grain, natural expression, photorealistic", "img"),
  P("landscape-epic", "image", "منظر طبيعي ملحمي", "Epic wide landscape of [mountains/desert/sea] at sunrise, volumetric light rays, layered mist, rich colors, ultra detailed, 24mm wide angle, cinematic composition", "img"),
  P("desert-night", "image", "صحراء بالليل", "Quiet desert at night under a dense Milky Way, silhouette of a lone camel and a small campfire, long exposure look, deep blue and warm orange contrast, ultra detailed", "img"),
  P("old-cairo", "image", "القاهرة القديمة", "Narrow alley of old Islamic Cairo at late afternoon, carved mashrabiya windows, hanging lanterns, warm dusty light, people walking in the distance, documentary photography, 35mm", "img"),
  P("food-closeup", "image", "أكل بتصوير مطاعم", "Overhead close-up of [dish] on a rustic ceramic plate, steam rising, fresh herbs, natural window light from the left, wooden table, shallow depth of field, professional food photography, appetizing", "img", "ممتاز لمنيو المطاعم والسوشيال."),
  P("coffee-moody", "image", "قهوة بجو دافي", "A cup of [coffee/tea] on a wooden table beside an open book, rain on the window behind, warm cozy light, soft haze, cinematic still life, 50mm", "img"),
  P("interior-modern", "image", "ديكور داخلي", "Modern [living room/bedroom] interior, [neutral/earth/dark] color palette, large window with natural light, textured fabrics, minimal furniture, architectural photography, wide angle, realistic", "img"),
  P("realestate", "image", "عقار للإعلان", "Bright photo of a luxury [apartment/villa] exterior at golden hour, clean modern architecture, landscaped entrance, clear sky, real estate photography, wide angle, sharp", "img"),
  P("anime-scene", "image", "مشهد أنمي أصلي", "Original anime-style illustration of a [character description] standing on a rooftop at sunset, wind in hair, detailed clouds, soft cel shading, vibrant colors, cinematic framing", "img", "اكتب شخصية من تأليفك، مش شخصية معروفة."),
  P("fantasy-city", "image", "مدينة خيالية", "Floating fantasy city with domes and bridges among clouds, waterfalls falling into the sky, golden hour, intricate architecture, matte painting, ultra detailed", "img"),
  P("kids-book", "image", "رسمة لكتاب أطفال", "Children's book illustration of a [animal] [doing an activity] in a [setting], soft watercolor and pencil texture, warm friendly colors, rounded shapes, gentle lighting, cute and calm", "img"),
  P("isometric", "image", "أيقونة أيزومترية 3D", "Isometric 3D illustration of a tiny [scene: coffee shop/office/farm], clean pastel colors, soft shadows, smooth plastic look, white background, high detail", "img"),
  P("pattern", "image", "نقش متكرر", "Seamless pattern of [flowers/geometric Islamic stars/leaves], [color palette], flat vector style, evenly spaced, no background clutter", "img"),

  // 🛍️ منتجات
  P("product-white", "product", "منتج على خلفية بيضا", "Product photo of [product] centered on a pure white background, soft studio lighting, subtle natural shadow beneath, sharp focus, e-commerce style, high resolution", "img", "مناسب لمتاجر سلة وزد وأمازون."),
  P("product-lifestyle", "product", "منتج في استخدام حقيقي", "Lifestyle photo of [product] on a [kitchen counter/desk/bathroom shelf], natural morning light, props that match the product, shallow depth of field, premium advertising look", "img"),
  P("product-floating", "product", "منتج طايرة بإضاءة درامية", "[Product] floating in mid-air with splashes of [water/powder/petals], dramatic rim light, dark gradient background, high-speed photography look, ultra sharp", "img"),
  P("perfume", "product", "برفان فاخر", "Luxury perfume bottle on black marble with soft golden reflections, smoke wisps, dramatic spotlight, elegant minimal composition, advertising photography, 100mm macro", "img"),
  P("clothing-flat", "product", "هدوم (فلات لاي)", "Flat lay of [clothing item] with matching accessories on a neutral linen background, top-down view, soft diffused light, clean styling, fashion catalog photo", "img"),
  P("poster-sale", "product", "بوستر عرض وتخفيضات", "Bold advertising poster for a [product] sale, large empty area on the top for headline text, vibrant [color] gradient background, product centered, confetti and light streaks, modern graphic design", "img", "سيب مكان فاضي للنص وضيفه بعدين في أي محرر."),
  P("ad-banner", "product", "بانر سوشيال ميديا", "Clean social media banner showing [product] on the right and empty space on the left for text, [brand color] background, soft shadows, minimal modern style, 16:9", "img"),
  P("packaging", "product", "تصميم عبوة", "Mockup of premium [box/bottle/pouch] packaging for [product], minimal design with [colors], soft studio light, on a neutral surface, realistic materials, high detail", "img"),
  P("food-delivery", "product", "إعلان أكل ديليفري", "Hero shot of a [burger/pizza/shawarma] with melting cheese and rising steam, dark moody background, dramatic side light, crumbs and ingredients flying, advertising photography", "img"),

  // 🔰 شعارات
  P("logo-minimal", "brand", "شعار مينيمال", "Minimalist vector logo for a [business type] called [name], simple geometric icon, [two colors], flat design, white background, centered, clean lines", "img", "اكتب الاسم بالإنجليزي؛ موديلات الصور بتغلط في الحروف العربية."),
  P("logo-emblem", "brand", "شعار دائري (إمبلم)", "Circular emblem logo for [business], bold icon in the center, ring with space for text, [colors], vintage badge style, flat vector, white background", "img"),
  P("icon-set", "brand", "مجموعة أيقونات", "Set of 6 flat app icons: [list of 6 items], consistent rounded style, [color palette], white background, evenly spaced grid", "img"),
  P("sticker", "brand", "ستيكر للواتساب", "Cute sticker of a [character/animal] [doing an expression/action], thick white outline, flat vibrant colors, simple shading, transparent-style plain background", "img", "بعد التوليد شيل الخلفية من «إزالة الخلفية» في المكتبة."),
  P("mascot", "brand", "تميمة لبراند", "Friendly original mascot character for a [business], [animal/object] with simple shapes and [colors], smiling, 3D soft render style, plain background, front view", "img"),
  P("brand-board", "brand", "لوحة هوية بصرية", "Brand identity moodboard for [business]: logo, color palette swatches, typography samples, business card and packaging mockups, clean layout, soft neutral background", "img"),

  // 🪄 تعديل
  P("edit-bg", "edit", "غيّر الخلفية", "Replace the background with [a clean white studio / a beach at sunset / a modern office]. Keep the subject, pose, and lighting unchanged.", "edit"),
  P("edit-outfit", "edit", "غيّر اللبس", "Change the outfit to [a navy business suit]. Keep the face, hair, pose, and background exactly the same.", "edit"),
  P("edit-light", "edit", "حسّن الإضاءة", "Improve the lighting to soft warm natural light, increase clarity and color balance slightly, keep everything else unchanged.", "edit"),
  P("edit-time", "edit", "حوّل النهار لليل", "Turn this scene into night with warm lit windows and street lights. Keep the composition and objects unchanged.", "edit"),
  P("edit-object", "edit", "امسح عنصر", "Remove [the object/person] from the image and fill the area naturally to match the surroundings.", "edit"),
  P("edit-text", "edit", "عدّل النص في الصورة", "Change the text that says \"[old text]\" to \"[new text]\", keeping the same font style, color, and position.", "edit"),
  P("edit-style", "edit", "حوّلها لأسلوب فني", "Convert this photo to [watercolor painting / pencil sketch / 3D animation style], keep the composition and the person's identity recognizable.", "edit"),
  P("edit-old", "edit", "رمّم صورة قديمة", "Restore this old photo: remove scratches and noise, sharpen faces, add natural color, keep the original look and people unchanged.", "edit"),

  // 🎬 فيديو
  P("vid-nature", "video", "طبيعة سينمائية", "Cinematic drone shot flying slowly over [misty mountains/turquoise sea/golden dunes] at sunrise, soft volumetric light, birds in the distance, smooth motion, 4K, natural colors", "vid"),
  P("vid-city", "video", "مدينة بالليل", "Night city street after rain, neon reflections on the wet asphalt, slow tracking shot following a person walking with an umbrella, shallow depth of field, cinematic, moody", "vid"),
  P("vid-product", "video", "فيديو منتج", "Slow rotating shot of [product] on a reflective surface, soft studio lights sweeping across it, subtle particles in the air, premium commercial look, smooth 360 motion", "vid"),
  P("vid-food", "video", "فيديو أكل", "Macro shot of [dish] being served, sauce slowly pouring, steam rising, slow motion, warm light, shallow depth of field, mouth-watering commercial look", "vid"),
  P("vid-people", "video", "لقطة ناس طبيعية", "A [person description] laughing while drinking coffee at a sunny cafe table, natural handheld camera, soft focus background, warm tones, authentic lifestyle video", "vid"),
  P("vid-timelapse", "video", "تايم لابس", "Time-lapse of [clouds moving over a city skyline / a flower blooming / stars rotating over a desert], steady camera, smooth transition from day to night, ultra detailed", "vid"),
  P("vid-explainer", "video", "لقطة تشرح فكرة", "Clean 3D animation explaining [concept]: simple objects moving step by step on a light background, smooth easing, soft shadows, friendly colors, no text", "vid"),
  P("vid-fantasy", "video", "مشهد خيالي", "A glowing [creature/ship/city] slowly emerging from clouds at dawn, particles of light drifting, epic scale, camera slowly pulling back, cinematic fantasy, painterly", "vid"),
  P("vid-i2v", "video", "تحريك صورة", "Animate this image: subtle natural motion only, [wind moving hair and fabric / gentle waves / drifting clouds], camera slowly pushes in, keep the subject unchanged", "vid", "للأدوات اللي بتحرّك صورة جاهزة."),

  // 🎥 كاميرا
  P("cam-push", "camera", "تقريب بطيء", "slow push-in toward the subject, smooth stabilized motion", "vid", "ضيفها في آخر أي برومبت فيديو."),
  P("cam-pull", "camera", "ابتعاد وكشف", "slow pull-back revealing the whole scene, smooth gimbal motion", "vid"),
  P("cam-orbit", "camera", "دوران حوالين الموضوع", "camera orbits 180 degrees around the subject, steady speed, subject stays centered", "vid"),
  P("cam-drone", "camera", "درون من فوق", "high drone shot descending slowly while tilting down, wide landscape view", "vid"),
  P("cam-track", "camera", "تتبّع ماشي", "tracking shot following the subject from behind at walking pace, slight handheld feel", "vid"),
  P("cam-handheld", "camera", "كاميرا محمولة واقعية", "handheld camera with natural small shake, documentary feel, quick focus adjustments", "vid"),
  P("cam-macro", "camera", "ماكرو قريب جداً", "extreme close-up macro shot, slow slide to the side, very shallow depth of field", "vid"),
  P("cam-slowmo", "camera", "سلو موشن", "ultra slow motion at 240fps look, fine details frozen in the air, smooth", "vid"),

  // 📱 ريلز
  P("reel-hook-q", "reels", "هوك بسؤال", "اكتب 10 جمل افتتاحية لأول 3 ثواني في ريل عن [الموضوع]، كل جملة سؤال بيخلي المشاهد يكمّل. لغة مصرية بسيطة، أقل من 10 كلمات.", "chat"),
  P("reel-hook-shock", "reels", "هوك صادم", "اكتب 10 هوكات صادمة أو غير متوقعة لفيديو قصير عن [الموضوع] من غير مبالغة كدابة. كل هوك سطر واحد بالمصري.", "chat"),
  P("reel-script-30", "reels", "سكريبت ريل 30 ثانية", "اكتب سكريبت ريل 30 ثانية عن [الموضوع] لجمهور [الجمهور]: هوك 3 ثواني، 3 نقاط سريعة، وخاتمة بدعوة للتفاعل. اكتب كل جملة في سطر منفصل مع اقتراح لقطة جنبها.", "chat", "تقدر تلصق الناتج في مصنع الفيديو."),
  P("reel-listicle", "reels", "ريل «5 أخطاء»", "اكتب سكريبت ريل «5 أخطاء بيعملها [الجمهور] في [المجال]» بصيغة سريعة: كل خطأ في جملة، وبعدها الحل في جملة. ختمها بسؤال للتعليقات.", "chat"),
  P("reel-story", "reels", "ريل حكاية", "اكتب سكريبت ريل بصيغة حكاية قصيرة عن [الموقف]: بداية بتشد، تصاعد، مفاجأة في الآخر، ودرس في سطر. مصري عفوي، 35 ثانية.", "chat"),
  P("reel-captions", "reels", "كابشن وهاشتاجات", "اكتب 3 كابشنز مختلفة لريل عن [الموضوع] + 10 هاشتاجات مناسبة (5 عربي و5 إنجليزي) من غير هاشتاجات عامة زي #explore.", "chat"),
  P("reel-calendar", "reels", "خطة محتوى أسبوع", "اعمل خطة محتوى 7 أيام لحساب [المجال] على [المنصة]: لكل يوم فكرة، نوع المحتوى، والهوك. نوّع بين تعليمي وترفيهي وبيعي.", "chat"),

  // ▶️ صور مصغرة
  P("thumb-youtube", "thumb", "صورة مصغرة يوتيوب", "YouTube thumbnail background: bold high-contrast scene about [topic], one clear focal subject on the right with expressive emotion, large empty space on the left for text, saturated colors, rim light, 16:9", "img", "ضيف النص بعدين من أي محرر."),
  P("thumb-podcast", "thumb", "غلاف بودكاست", "Square podcast cover art about [topic], bold simple illustration, [two colors], strong central shape, modern flat style, room for a title at the top", "img"),
  P("thumb-book", "thumb", "غلاف كتاب", "Book cover illustration for a [genre] book about [theme], atmospheric composition, [color palette], space reserved at the top and bottom for title and author text, professional design", "img"),
  P("thumb-course", "thumb", "غلاف كورس", "Online course cover image for [topic]: clean modern illustration of [key objects], bright gradient background, friendly style, large empty area for the title", "img"),
  P("thumb-story", "thumb", "خلفية ستوري", "Vertical 9:16 Instagram story background in [color palette] with soft gradients and subtle shapes, empty center for text, modern minimal", "img"),

  // ✍️ تسويق
  P("txt-post", "text", "بوست فيسبوك للبيع", "اكتب بوست فيسبوك لبيع [المنتج] لـ[الجمهور]. ابدأ بمشكلة بيعيشها العميل، اعرض الحل، اذكر ميزتين وسعر [السعر]، وختمه بطريقة الطلب. مصري ودود، 80 كلمة بالكتير.", "chat"),
  P("txt-ad", "text", "إعلان بـ3 صيغ", "اكتب 3 نسخ إعلان مختلفة لـ[المنتج]: واحدة تركز على الفايدة، واحدة على العرض، وواحدة على قصة عميل. كل نسخة عنوان + نص + زرار دعوة.", "chat"),
  P("txt-reply", "text", "رد على عميل غاضب", "اكتب رد محترم على عميل غاضب بسبب [المشكلة]: اعتذار مختصر، توضيح، حل واضح، وتعويض بسيط لو مناسب. نبرة هادية، من غير وعود مش هنقدر نوفيها.", "chat"),
  P("txt-faq", "text", "أسئلة شائعة", "اكتب 10 أسئلة شائعة بإجاباتها لعملاء [نوع النشاط] تغطي الأسعار والتوصيل والاسترجاع والضمان. إجابات قصيرة ومباشرة.", "chat"),
  P("txt-bio", "text", "بايو إنستجرام", "اكتب 5 اختيارات لبايو إنستجرام لـ[نوع النشاط]: أقل من 150 حرف، سطر يوضح اللي بنقدمه، وسطر دعوة للتواصل، وإيموجي مناسب.", "chat"),
  P("txt-whatsapp", "text", "رسالة واتساب للمتابعة", "اكتب رسالة واتساب قصيرة لمتابعة عميل سأل عن [الخدمة] ومردش من يومين. من غير إلحاح، وفيها سؤال واحد سهل يرد عليه.", "chat"),
  P("txt-desc", "text", "وصف منتج للمتجر", "اكتب وصف منتج لـ[المنتج] لمتجر إلكتروني: عنوان جذاب، 3 مميزات بنقاط، فقرة قصيرة عن الاستخدام، وكلمات مفتاحية للـSEO في الآخر.", "chat"),
  P("txt-prompt-improve", "text", "حسّن برومبت", "حسّن البرومبت ده عشان يطلّع نتيجة أدق من مولّد صور: [البرومبت]. أضف تفاصيل الإضاءة والكاميرا والأسلوب من غير ما تغيّر الفكرة، وارجّعه بالإنجليزي في فقرة واحدة.", "chat"),

  // 🎙️ تعليق صوتي
  P("voice-ad", "voice", "تعليق إعلان 30 ثانية", "اكتب تعليق صوتي لإعلان 30 ثانية عن [المنتج]: 6 جمل قصيرة، كل جملة تتقرأ في 4-5 ثواني، لغة مصرية دافية، وآخر جملة دعوة للتصرف. من غير علامات أو رموز.", "fac", "الجمل القصيرة بتطلع صوت أحسن في مصنع الفيديو."),
  P("voice-explain", "voice", "تعليق شرح معلومة", "اكتب تعليق صوتي لفيديو معلومة سريعة عن [الموضوع]: 6 مشاهد، كل مشهد جملتين، أسلوب شيّق ومبسّط، وفي الآخر خلاصة في جملة.", "fac"),
  P("voice-story", "voice", "حكاية بصوت هادي", "اكتب حكاية قصيرة بصوت راوي هادي عن [الفكرة] في 6 مشاهد، كل مشهد جملتين وصفيتين، بإيقاع بطيء ومناسب للتعليق الصوتي.", "fac"),
  P("voice-promo", "voice", "ترويج لمحل أو خدمة", "اكتب تعليق صوتي ترويجي لـ[اسم المحل] في [المنطقة] بيبيع [الخدمة]: ابدأ بسؤال، اذكر أهم ميزتين وعرض واحد، واختم بالعنوان وطريقة التواصل.", "fac"),
  P("voice-shots", "voice", "مشاهد وكلمات بحث", "قسّم الموضوع ده [الموضوع] لـ6 مشاهد. لكل مشهد اكتب: الجملة المنطوقة (عربي) | 3 كلمات بحث إنجليزية لفيديو ستوك مناسب.", "fac", "نفس صيغة «جملة | كلمات» اللي مصنع الفيديو بيستخدمها."),
];

export const getPromptCat = (id) => PROMPT_CATS.find((c) => c.id === id);
