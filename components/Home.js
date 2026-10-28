"use client";
// الصفحة الرئيسية — مساحة العمل
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tools, categories, getTool as getAnyTool, isListed } from "@/lib/tools";
const getTool = (id) => (isListed(id) ? getAnyTool(id) : undefined);
import { findTools } from "@/lib/search";
import { MODEL_OPTIONS, getModel, DEFAULT_MODEL_KEY } from "@/lib/models";
import { useStored, write, PENDING_KEY } from "@/lib/store";
import { useProofread, ProofIcon } from "@/lib/useProofread";
import FusionStack from "./FusionStack";
import { useModal } from "@/lib/useModal";
import ToolIcon from "./ToolIcon";
import ExternalLinks from "./ExternalLinks";
import FlowCards from "./FlowCards";
import BotIcon from "./BotIcon";
import StarMark from "./StarMark";
import ScrollBands from "./ScrollBands";
import { BOTS } from "@/lib/bots";
import { APPS } from "@/lib/apps";
import ms from "./models.module.css";
import s from "./home.module.css";

// شبكة الاختصارات (4 × 2). أول واحدة عليها علامة «شائع»
const SHORTCUTS = ["article", "post", "translate", "cv", "product-desc", "code-gen", "summarize", "email-writer"];

// شريط الموديلات (زي Poe)
const HOME_APPS = ["chatgpt", "claude", "gemini", "canva", "capcut", "midjourney", "kling", "suno", "elevenlabs", "perplexity"]
  .map((k) => APPS.find((a) => a.key === `app-${k}`))
  .filter(Boolean);
const HOME_BOTS = ["claude-opus", "gpt-astra", "gemini-pro", "grok", "claude-sonnet", "kimi", "gpt-oss-120b", "llama-70b", "search-fast", "deepseek"]
  .map((k) => BOTS.find((b) => b.key === k))
  .filter(Boolean);

// استوديو التصميم (زي أدوبي، وبيشتغل على جهاز المستخدم)
const STUDIO = ["ai-video", "photo-video", "photo-editor", "poster-maker", "remove-bg", "image-resize", "image-compress", "images-to-pdf", "pdf-merge", "watermark", "design-apps"];

// كروت الاقتراحات: كل كارت بيفتح أداة والطلب مكتوب جاهز
const IDEAS = [
  { tool: "ad-copy", text: "إعلان فيسبوك لمطعم مشويات في المعادي، وعرض 20% أول أسبوع" },
  { tool: "cv", text: "سيرة ذاتية لمحاسب خبرة 3 سنين في شركة مقاولات" },
  { tool: "study-plan", text: "خطة مذاكرة لأسبوعين قبل امتحان الفيزياء" },
  { tool: "business-plan", text: "مشروع كافيه صغير جنب جامعة بميزانية 300 ألف جنيه" },
  { tool: "travel-plan", text: "رحلة 4 أيام في إسكندرية لعيلة من 4 أفراد بميزانية 8 آلاف جنيه" },
  { tool: "image-prompt", text: "فنجان قهوة عربي على ترابيزة خشب جنب شباك الصبح" },
  { tool: "adspy", text: "إعلان منافس: عطر فرنسي أصلي بـ 450 جنيه بدل 900، الكمية محدودة والدفع عند الاستلام" },
];

function Row({ title, ids }) {
  const list = ids.map(getTool).filter(Boolean);
  if (!list.length) return null;
  return (
    <section className="shelf">
      {title && <h2>{title}</h2>}
      <div className="shelf-row">
        {list.map((t) => (
          <Link key={t.id} href={`/tool/${t.id}`} className="shelf-item">
            <ToolIcon tool={t} size="sm" />
            <span>{t.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sheet, setSheet] = useState(false);
  const [modelKey, setModelKey] = useStored("model", DEFAULT_MODEL_KEY);
  const [suggestOff, setSuggestOff] = useStored("suggest-off", false);
  const [web, setWeb] = useStored("web", false);
  const [favs] = useStored("favs", []);
  const [recent] = useStored("recent", []);
  const model = getModel(modelKey);
  const proof = useProofread(() => input, setInput);

  useModal(sheet, () => setSheet(false));

  // وانت بتكتب: أنسب الأدوات لطلبك
  const matches = useMemo(() => (input.trim().length > 2 ? findTools(input, 3) : []), [input]);
  const counts = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, tools.filter((t) => t.cat === c.id).length])), []);

  // السؤال بيتحفظ، والشات بيقراه ويبعته لوحده
  function ask() {
    const q = input.trim();
    if (!q) return;
    try { sessionStorage.setItem(PENDING_KEY, q); } catch {}
    write("bot", ""); // الرئيسية بتسأل بالموديل اللي ظاهر فيها (افتراضياً: دمج 4 نماذج)
    router.push("/chat");
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      ask();
    }
  }

  return (
    <div className={s.page}>
      <ScrollBands />

      {/* ============ القسم الأول: سما ليل والنجمة طالعة ============ */}
      <section className={`${s.band} ${s.night} ${s.hero} on-night`} data-band-sec="night">
        <i className={s.starfield} aria-hidden="true" />
        <i className={s.horizon} aria-hidden="true" />
        <div className={s.in}>
      {/* ===== الاسم ===== */}
      <div className={s.brand}>
        <span className={s.mark}><StarMark size={64} /></span>
        <h1 dir="ltr"><span>Rising</span>{" "}<span>StarAi</span></h1>
        <p>{tools.length} أداة ذكاء اصطناعي بالعربي، وإجابة واحدة من 4 نماذج قوية</p>
      </div>

      {/* ===== صندوق السؤال ===== */}
      <div className={s.composer}>
        <label htmlFor="ask" className="sr">اكتب سؤالك أو طلبك</label>
        <textarea
          id="ask"
          rows={2}
          value={input}
          maxLength={4000}
          placeholder="اسأل أي حاجة، اعمل أي حاجة"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
        />
        <div className={s.composerBar}>
          <div className={s.composerActions}>
            <button type="button" className={s.modelBtn} onClick={() => setSheet(true)} aria-haspopup="dialog">
              {model.fusion ? <FusionStack size={18} /> : <span aria-hidden="true">{model.icon}</span>}
              <b>{model.name}</b>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className={`${s.webBtn} ${web ? s.webOn : ""}`}
              onClick={() => setWeb(!web)}
              aria-pressed={web}
              title="بحث على الإنترنت"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z" />
              </svg>
              <span>بحث</span>
            </button>
          </div>

          <div className={s.composerActions}>
            <button
              type="button"
              className={s.roundBtn}
              onClick={proof.run}
              disabled={proof.busy || !input.trim()}
              aria-label="تدقيق لغوي"
              title="تدقيق لغوي: صحّح الإملاء والنحو"
            >
              {proof.busy ? <span className={s.spin} /> : <ProofIcon />}
            </button>
            <button
              type="button"
              className={s.roundBtn}
              onClick={() => window.dispatchEvent(new Event("rs-open-palette"))}
              aria-label="دوّر على أداة"
              title="دوّر على أداة"
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button type="button" className={s.sendBtn} onClick={ask} disabled={!input.trim()} aria-label="ابدأ">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>

        {proof.undo !== null && (
          <div className={s.undoNote}>
            اتصلّحت الأخطاء.
            <button type="button" onClick={proof.revert}>تراجع</button>
            <button type="button" onClick={proof.dismiss} aria-label="إخفاء">✕</button>
          </div>
        )}

        {matches.length > 0 && (
          <div className={s.matches}>
            <span>أو افتحه في أداة:</span>
            {matches.map((t) => (
              <Link key={t.id} href={`/tool/${t.id}?q=${encodeURIComponent(input.trim())}`} className={s.match}>
                <ToolIcon tool={t} size="sm" />
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ===== الاقتراحات ===== */}
      {!suggestOff && (
        <section className={s.suggest}>
          <div className={s.suggestHead}>
            <span>اقتراحات</span>
            <button type="button" className={s.closeBtn} onClick={() => setSuggestOff(true)} aria-label="إخفاء الاقتراحات">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className={s.suggestRow}>
            {IDEAS.map(({ tool, text }) => {
              const t = getTool(tool);
              if (!t) return null;
              return (
                <Link key={tool} href={`/tool/${tool}?q=${encodeURIComponent(text)}`} className={s.suggestCard}>
                  <ToolIcon tool={t} size="sm" />
                  <span className={s.suggestText}>
                    <b>{t.name}</b>
                    <small>{text}</small>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== شبكة الاختصارات ===== */}
      <section className={s.gridWrap} aria-label="أدوات سريعة">
        <div className={s.grid}>
          {SHORTCUTS.map(getTool).filter(Boolean).map((t, i) => (
            <Link key={t.id} href={`/tool/${t.id}`} className={s.tile}>
              {i === 0 && <span className={s.badge}>شائع</span>}
              <ToolIcon tool={t} />
              <span className={s.tileName}>{t.name}</span>
            </Link>
          ))}
        </div>
      </section>

        </div>
      </section>

      {/* ============ القسم التاني: نهار ============ */}
      <section className={`${s.band} ${s.white}`} data-band-sec="white">
        <div className={s.in}>
      {/* ===== المهام الكاملة ===== */}
      <section className={s.cats}>
        <div className={s.catsHead}>
          <span>مهام كاملة: اكتب سطر وخد شغل كامل</span>
          <Link href="/flows" className={s.allLink}>كل المهام</Link>
        </div>
        <FlowCards row />
      </section>

      <section className={s.cats}>
        <div className={s.catsHead}>
          <span>استوديو التصميم: زي أدوبي، وصورك ما بتطلعش من جهازك</span>
          <Link href="/tools?cat=studio" className={s.allLink}>كل أدوات الاستوديو</Link>
        </div>
        <Row ids={STUDIO} />
      </section>

      <Row title="المفضلة" ids={favs} />
      <Row title="استخدمتها مؤخراً" ids={recent} />

        </div>
      </section>

      {/* ============ القسم التالت: ليل، الموديلات زي كوكبة نجوم ============ */}
      <section className={`${s.band} ${s.night} ${s.sky} on-night`} data-band-sec="night">
        <i className={s.starfield} aria-hidden="true" />
        <div className={s.in}>
      <section className={s.cats}>
        <div className={s.catsHead}>
          <span>اتكلم مع أقوى موديلات العالم</span>
          <Link href="/models" className={s.allLink}>كل الموديلات</Link>
        </div>
        <div className={ms.strip}>
          {HOME_BOTS.map((b) => (
            <Link key={b.key} href={`/chat?bot=${b.key}`} className={ms.stripItem}>
              <BotIcon bot={b} size={44} />
              <span dir="auto">{b.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={s.cats}>
        <div className={s.catsHead}>
          <span>أشهر برامج الذكاء الاصطناعي</span>
          <Link href="/models" className={s.allLink}>كل البرامج</Link>
        </div>
        <div className={ms.strip}>
          {HOME_APPS.map((b) => (
            <Link key={b.key} href={b.href} className={ms.stripItem} title={b.desc}>
              <BotIcon bot={b} size={44} />
              <span dir="auto">{b.name}</span>
            </Link>
          ))}
        </div>
      </section>

        </div>
      </section>

      {/* ============ القسم الرابع: نهار ============ */}
      <section className={`${s.band} ${s.white}`} data-band-sec="white">
        <div className={s.in}>
      {/* ===== المجالات ===== */}
      <section className={s.cats}>
        <div className={s.catsHead}>
          <span>المجالات</span>
          <Link href="/tools" className={s.allLink}>كل الـ{tools.length} أداة</Link>
        </div>
        <div className={s.catsRow}>
          {categories.map((c) => (
            <Link key={c.id} href={`/tools?cat=${c.id}`} className={s.catChip} style={{ "--c": c.color }}>
              <span aria-hidden="true">{c.icon}</span>
              {c.name}
              <small>{counts[c.id]}</small>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== مواقع خارجية ===== */}
      <ExternalLinks />
        </div>
      </section>

      {/* ===== ورقة اختيار الموديل ===== */}
      {sheet && (
        <div className={s.sheetWrap} onMouseDown={() => setSheet(false)}>
          <div className={s.sheet} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="اختيار الموديل">
            <div className={s.sheetGrip} aria-hidden="true" />
            <div className={s.sheetHead}>اختار الموديل للشات</div>
            <div className={s.sheetList}>
              {MODEL_OPTIONS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`${s.sheetItem} ${m.key === model.key ? s.sheetActive : ""}`}
                  onClick={() => { setModelKey(m.key); setSheet(false); }}
                  aria-pressed={m.key === model.key}
                >
                  <span className={s.sheetIcon} aria-hidden="true">{m.icon}</span>
                  <span className={s.sheetText}>
                    <b>{m.name}</b>
                    <small>{m.desc}</small>
                  </span>
                  {m.key === model.key && <span className={s.tick} aria-hidden="true">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
