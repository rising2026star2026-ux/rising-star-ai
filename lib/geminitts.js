// الصوت المعبّر: Gemini TTS من جوجل بيقبل تعليمات إحساس ونبرة بكلام عادي (style) بدل ما يكتفي بتغيير السرعة والدرجة.
// الملف ده بيبني الطلب ويقرا الرد. كل تعليمات الإحساس بتتبني هنا من قوائم ثابتة، ونص الزائر بيروح كنص منطوق بس.
import { pcmToWav, parseWav } from "@/lib/wav";

export const PRO_MODEL = "gemini-3.8-flash-lite-tts"; // يتغيّر من متغير البيئة GEMINI_TTS_MODEL
export const MAX_PRO_CHARS = 500;

/** أصوات Gemini الجاهزة لكل نوع: صوتين لكل نوع عشان الزائر يختار اللي يريّحه */
export const PRO_VOICES = { f: ["Kore", "Aoede"], m: ["Charon", "Puck"] };

export function proVoice(gender, variant = 0) {
  const list = PRO_VOICES[gender === "m" ? "m" : "f"];
  return list[variant === 1 ? 1 : 0];
}

const DIALECT_STYLE = {
  eg: "Speak Arabic with a natural Egyptian (Cairene) accent, the way a real Egyptian person talks.",
  sa: "Speak Arabic with a natural Saudi (Gulf) accent, the way a real Saudi person talks.",
};

// الإحساس نفسه، بالإنجليزي عشان النموذج بيفهمه أدق
const TONE_STYLE = {
  normal: "Natural, warm and conversational.",
  calm: "Calm, soothing and relaxed, with a slow, gentle pace.",
  narrator: "Like a storyteller narrating a tale: expressive, measured pace, with meaningful pauses.",
  strong: "Strong, confident and authoritative, with a deep, powerful voice.",
  sharp: "Sharp, urgent and intense, with crisp articulation and high energy.",
  excited: "Excited, joyful and enthusiastic, upbeat and bright.",
  sad: "Sad and heavy-hearted, slow and soft, with a slightly trembling, emotional voice.",
  child: "Like a cheerful young child: playful, high-pitched and curious.",
};

export function proStyle(dialect, tone) {
  return `${DIALECT_STYLE[dialect] || DIALECT_STYLE.eg} ${TONE_STYLE[tone] || TONE_STYLE.normal}`;
}

/** جسم طلب واجهة Interactions في Gemini API (نفس شكل المثال في توثيق جوجل) */
export function buildInteractionBody({ model, text, style, voice }) {
  return {
    model,
    input: [{ type: "user_input", content: [{ type: "text", text, annotations: [{ type: "speech_metadata", style }] }] }],
    response_format: { type: "audio" },
    generation_config: { speech_config: [{ voice }] },
  };
}

const b64 = (s) => Uint8Array.from(Buffer.from(String(s), "base64"));

/**
 * بيطلّع ملف WAV من رد Gemini. بيفهم شكل Interactions (steps → content → audio) وشكل generateContent (inlineData)،
 * ولو الصوت جه PCM خام من غير هيدر بيلفّه على أنه 24 كيلوهرتز، 16 بت، قناة واحدة.
 */
export function extractWav(json) {
  let data = null;
  let mime = "";
  for (const st of json?.steps || []) {
    if (st?.type !== "model_output") continue;
    for (const c of st.content || []) if (c?.type === "audio" && c.data) { data = c.data; mime = c.mime_type || ""; }
  }
  if (!data) {
    for (const cand of json?.candidates || []) {
      for (const p of cand?.content?.parts || []) if (p?.inlineData?.data) { data = p.inlineData.data; mime = p.inlineData.mimeType || ""; }
    }
  }
  if (!data) return null;
  const bytes = b64(data);
  if (parseWav(bytes)) return bytes;
  const rate = Number(/rate=(\d+)/i.exec(mime)?.[1]) || 24000;
  return bytes.length > 200 ? pcmToWav(bytes, rate, 1, 16) : null;
}
