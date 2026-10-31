"use client";
// المشاريع: مساحة لكل شغلانة فيها ملفات وتعليمات ثابتة ومحادثات كتير، كلهم فاكرين الملفات والتعليمات.
// محفوظة على جهاز الزائر (IndexedDB) لحد ما نضيف الحسابات.
import { idbGet, idbSet, idbDel } from "@/lib/idb";

const INDEX = "projects:index";
const pKey = (id) => `project:${id}`;
const tKey = (pid, tid) => `thread:${pid}:${tid}`;
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const ICONS = ["📚", "🎓", "💼", "🛍️", "✍️", "⚖️", "🧪", "💡", "🏗️", "🩺", "📊", "🎬"];

export const TEMPLATES = [
  {
    key: "study",
    icon: "📚",
    name: "مذاكرة مادة",
    desc: "ارفع المحاضرات والملخصات، وخد شرح وأسئلة مراجعة من نفس المنهج.",
    files: "المحاضرات، الملازم، الامتحانات القديمة",
    instructions: "أنا طالب وبذاكر المادة دي من الملفات المرفوعة. اشرحلي بالمصري البسيط وبأمثلة من الواقع، وخليك ملتزم بالمنهج اللي في الملفات قبل أي معلومة من برّه، واذكر رقم الصفحة. لما أطلب مراجعة اعملي أسئلة شبه الامتحان ومعاها الإجابات النموذجية.",
    starters: ["لخّصلي أول محاضرة في نقاط", "اعملي جدول مذاكرة للمادة دي على أسبوعين", "امتحني في 10 أسئلة من المنهج"],
  },
  {
    key: "research",
    icon: "🎓",
    name: "بحث أو رسالة",
    desc: "ملفات المراجع وخطة البحث في مكان واحد، وكل محادثة فاكرة موضوعك.",
    files: "خطة البحث، المراجع PDF، فصول كتبتها",
    instructions: "أنا شغال على بحث علمي. ساعدني أنظّم الأفكار وأكتب بالعربي الفصحى الأكاديمي الواضح. اعتمد على المراجع المرفوعة واذكر اسم الملف ورقم الصفحة لأي معلومة منها. ممنوع تخترع مراجع أو اقتباسات أو أرقام، ولو محتاج مرجع مش موجود قول إيه اللي يتدور عليه.",
    starters: ["اقترح عناوين للفصول من المراجع دي", "قارنلي بين المرجعين في جدول", "راجع الفصل ده لغوياً وأكاديمياً"],
  },
  {
    key: "business",
    icon: "💼",
    name: "شغلي وعملائي",
    desc: "الأسعار والخدمات وطريقة شغلك، والمحادثات بتكتب ردود وعروض بنفس كلامك.",
    files: "قائمة الأسعار، عروض قديمة، شروط التعامل",
    instructions: "دي معلومات شغلي: الخدمات والأسعار وشروط التعامل في الملفات. لما أطلب رد على عميل أو عرض سعر اكتبه بلهجة محترمة وودودة ومختصرة، والأسعار والشروط زي ما هي في الملفات بالظبط، ومن غير ما تَعِد بحاجة مش مكتوبة فيها.",
    starters: ["اكتب عرض سعر لعميل جديد", "رد على عميل بيقول السعر غالي", "اعملي رسالة متابعة لعميل ما ردش"],
  },
  {
    key: "store",
    icon: "🛍️",
    name: "متجري أونلاين",
    desc: "منتجاتك وسياسة الشحن والاسترجاع، وخد ردود للزباين وبوستات ووصف منتجات.",
    files: "قائمة المنتجات والأسعار، سياسة الشحن والاسترجاع",
    instructions: "أنا عندي متجر أونلاين. الملفات فيها المنتجات والأسعار وسياسة الشحن والاسترجاع. ساعدني أرد على الزباين بالمصري بأدب وسرعة، وأكتب بوستات ووصف منتجات بيبيع. الأسعار والمقاسات والسياسات زي ما هي في الملفات بالظبط، ولو حاجة مش موجودة قول إني لازم أأكدها.",
    starters: ["زبون بيسأل عن الشحن لأسوان، أرد أقول إيه؟", "اكتبلي وصف لأغلى 3 منتجات", "اعملي بوستات الأسبوع الجاي"],
  },
  {
    key: "content",
    icon: "✍️",
    name: "صناعة محتوى",
    desc: "ارفع أمثلة من بوستاتك واسكريبتاتك، والكتابة الجديدة تطلع بأسلوبك.",
    files: "أحسن بوستاتك، اسكريبتات قديمة، معلومات عن جمهورك",
    instructions: "أنا صانع محتوى. الملفات فيها أمثلة من كتابتي وجمهوري. اكتب بنفس أسلوبي ولهجتي وطول جملي اللي في الأمثلة، وابدأ أي بوست أو اسكريبت بجملة تشد في أول ثانيتين، ومن غير كلام عام أو مكرر.",
    starters: ["اكتب اسكريبت ريل 30 ثانية بأسلوبي", "اقترح 10 أفكار محتوى للشهر ده", "حلّل أسلوبي في الكتابة"],
  },
  {
    key: "blank",
    icon: "💡",
    name: "مشروع فاضي",
    desc: "ابدأ من الصفر: سمّيه، وارفع ملفاتك، واكتب تعليماتك بنفسك.",
    files: "",
    instructions: "",
    starters: [],
  },
];

export const templateOf = (key) => TEMPLATES.find((t) => t.key === key) || TEMPLATES[TEMPLATES.length - 1];

const meta = (p) => ({
  id: p.id,
  name: p.name,
  icon: p.icon,
  template: p.template,
  updated: p.updated,
  files: (p.docs || []).length,
  chats: (p.threads || []).length,
});

export async function listProjects() {
  const list = await idbGet(INDEX);
  return Array.isArray(list) ? [...list].sort((a, b) => b.updated - a.updated) : [];
}

async function writeIndex(p, remove = false) {
  const list = (await idbGet(INDEX)) || [];
  const rest = list.filter((x) => x.id !== p.id);
  await idbSet(INDEX, remove ? rest : [meta(p), ...rest]);
}

export async function createProject({ template = "blank", name, icon, instructions } = {}) {
  const t = templateOf(template);
  const now = Date.now();
  const p = {
    id: uid(),
    name: (name || (t.key === "blank" ? "مشروع جديد" : t.name)).slice(0, 80),
    icon: icon || t.icon,
    template: t.key,
    instructions: instructions ?? t.instructions,
    docs: [],
    threads: [],
    created: now,
    updated: now,
  };
  await idbSet(pKey(p.id), p);
  await writeIndex(p);
  return p;
}

export const getProject = (id) => idbGet(pKey(id));

export async function saveProject(p) {
  const next = { ...p, updated: Date.now() };
  await idbSet(pKey(p.id), next);
  await writeIndex(next);
  return next;
}

export async function deleteProject(p) {
  await Promise.all((p.threads || []).map((t) => idbDel(tKey(p.id, t.id))));
  await idbDel(pKey(p.id));
  await writeIndex(p, true);
}

export const getThread = (pid, tid) => idbGet(tKey(pid, tid)).then((m) => (Array.isArray(m) ? m : []));

const titleOf = (messages) => {
  const first = messages.find((m) => m.role === "user")?.content || "محادثة";
  const line = first.replace(/\s+/g, " ").trim();
  return line.length > 60 ? `${line.slice(0, 58)}…` : line;
};

/** بيحفظ المحادثة ويحدّث قايمة المحادثات في المشروع. بيرجّع المشروع بعد التحديث */
export async function saveThread(p, tid, messages) {
  await idbSet(tKey(p.id, tid), messages.slice(-60));
  const now = Date.now();
  const threads = p.threads || [];
  const has = threads.some((t) => t.id === tid);
  const entry = { id: tid, title: has ? threads.find((t) => t.id === tid).title : titleOf(messages), updated: now, count: messages.length };
  const next = { ...p, threads: [entry, ...threads.filter((t) => t.id !== tid)], updated: now };
  await idbSet(pKey(p.id), next);
  await writeIndex(next);
  return next;
}

export async function deleteThread(p, tid) {
  await idbDel(tKey(p.id, tid));
  return saveProject({ ...p, threads: (p.threads || []).filter((t) => t.id !== tid) });
}
