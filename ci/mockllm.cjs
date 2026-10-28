// نموذج وهمي للاختبار: بيرجّع صفحة عربي ثابتة عشان نختبر الزحف والشعار والحفظ من غير مفتاح
const http = require("http");
const cats = ["chatbots", "image-gen", "video-gen", "writing", "coding", "voice", "productivity", "design"];
let i = 0;
http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const u = JSON.parse(body).messages[1].content;
    const name = (u.match(/Listed name: (.*)/) || [])[1] || "Tool";
    const out = {
      is_ai_tool: true, name, company: "Example Inc", category: cats[i++ % cats.length],
      summary: `أداة ${name} بتساعدك تخلّص شغلك أسرع بالذكاء الاصطناعي`,
      intro: `دي فقرة تجريبية عن ${name}. الكلام ده من نموذج وهمي للاختبار بس، والصفحة الحقيقية هتتكتب من كلام موقع الأداة.`,
      what: "بتاخد طلبك وبترجعلك النتيجة في ثواني. ده نص اختبار.",
      features: ["ميزة أولى للاختبار هنا", "ميزة تانية للاختبار هنا", "ميزة تالتة للاختبار هنا"],
      audience: ["صناع المحتوى والمسوقين", "الطلاب والمدرسين"],
      steps: ["افتح موقع الأداة واعمل حساب", "اكتب طلبك في الخانة", "نزّل النتيجة"],
      pricing: { type: "freemium", plans: [{ name: "Free", price: "$0", note: "حدود يومية" }, { name: "Pro", price: "$12/شهر", note: "استخدام أكتر" }] },
      pricing_text: "فيها خطة مجانية وخطة مدفوعة (نص اختبار).",
      faq: [{ q: "هل الأداة بتدعم العربي؟", a: "ده سؤال اختبار والإجابة اختبار." }],
    };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(out) } }] }));
  });
}).listen(4010);
