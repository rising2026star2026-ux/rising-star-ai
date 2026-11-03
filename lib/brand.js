// شعار الشركة/الموديل لكل أداة في المكتبة. بنجيب الأيقونة من دومين الشركة (مش بنخزن صور).
// الترتيب: تخصيص بالـslug ← اسم الموديل ← صاحب الـSpace على Hugging Face ← دومين الأداة نفسها.
const BFL = "blackforestlabs.ai";
const QWEN = "qwen.ai";
const STAB = "stability.ai";
const DS = "deepseek.com";
const HF = "huggingface.co";

const BY_SLUG = {
  "flux-prompt": HF, "logo-in-context": BFL, "story-diffusion": HF,
  whisper: "openai.com", "whisper-turbo": "openai.com",
  chatterbox: "resemble.ai", elevenlabs: "elevenlabs.io", orpheus: "canopylabs.ai",
  florence2: "microsoft.com", "multimodal-ocr": HF,
  "step1x-3d": "stepfun.com", "fast-3d": STAB,
  "remove-bg": HF, upscaler: HF, "tile-upscaler": HF, "face-restore": HF, "remove-object": HF,
  wikipedia: "wikipedia.org", wiktionary: "wikipedia.org",
  cyberchef: "github.com", currency: "x-rates.com",
};

const BY_NAME = [
  [/flux/i, BFL],
  [/qwen/i, QWEN],
  [/stable|sd ?3/i, STAB],
  [/deepseek|janus/i, DS],
];

export function brandDomain(t) {
  if (BY_SLUG[t.slug]) return BY_SLUG[t.slug];
  for (const [re, d] of BY_NAME) if (re.test(t.name)) return d;
  try {
    const h = new URL(t.url).hostname.replace(/^www\./, "");
    if (h.endsWith(".hf.space")) return HF;
    return h;
  } catch {
    return "";
  }
}

export const logoSrc = (domain, size = 64) =>
  domain ? `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=${size}` : "";
