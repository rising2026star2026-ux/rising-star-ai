"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { REFINES, DEFAULT_SETTINGS, SETTINGS } from "@/lib/settings";
import { read, useStored, write, toast } from "@/lib/store";
import ShareBar from "@/components/ShareBar";

const MAX = 6000;

export default function ToolRunner({ toolId, toolName, placeholder, option, label = "طلبك" }) {
  const [input, setInput] = useState("");
  const [choice, setChoice] = useState(option?.choices[0] || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [settings] = useStored("settings", DEFAULT_SETTINGS);
  const [favs, setFavs] = useStored("favs", []);
  const stopRef = useRef(null);
  const outRef = useRef(null);
  const mdRef = useRef(null);
  const inRef = useRef(null);
  const isFav = favs.includes(toolId);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get("q");
    if (q) setInput(q.slice(0, MAX));
    // فتح نتيجة قديمة من السجل
    const h = p.get("h");
    if (h) {
      const item = read("history", []).find((x) => x.id === h);
      if (item) { setInput(item.input); setResult(item.output); }
    }
    // تسجيل الأداة في "آخر استخدام"
    write("recent", [toolId, ...read("recent", []).filter((x) => x !== toolId)].slice(0, 8));
  }, [toolId]);

  // زرار «جرّب المثال» في شرح الأداة بيبعت المثال هنا
  useEffect(() => {
    function onFill(e) {
      if (typeof e.detail !== "string") return;
      setInput(e.detail.slice(0, MAX));
      setError("");
      const el = inRef.current;
      el?.closest(".composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el?.focus({ preventScroll: true }), 400);
    }
    window.addEventListener("rs-fill", onFill);
    return () => window.removeEventListener("rs-fill", onFill);
  }, []);

  async function run(refine) {
    if (!input.trim() || loading) return;
    const previous = result;
    setLoading(true);
    setError("");
    setResult("");
    const ctrl = new AbortController();
    stopRef.current = ctrl;
    let text = "";
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ toolId, input, option: choice, settings, refine, previous: refine ? previous : undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "حصلت مشكلة. جرّب تاني.");
      }
      setTimeout(() => outRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setResult(text);
      }
      if (text) {
        const entry = { id: Date.now().toString(36), toolId, toolName, input: input.slice(0, 600), output: text.slice(0, 8000), at: Date.now() };
        write("history", [entry, ...read("history", [])].slice(0, 30));
      }
    } catch (e) {
      if (e.name === "AbortError") { setResult(text); toast("اتوقف التوليد"); }
      else { setError(e.message || "الاتصال اتقطع. اتأكد من الإنترنت وجرّب تاني."); if (refine) setResult(previous); }
    } finally {
      setLoading(false);
      stopRef.current = null;
    }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(result); toast("اتنسخ"); } catch { toast("النسخ مش متاح في المتصفح ده"); }
  }

  function toggleFav() {
    setFavs((f) => (f.includes(toolId) ? f.filter((x) => x !== toolId) : [toolId, ...f]));
    toast(isFav ? "اتشالت من المفضلة" : "اتضافت للمفضلة");
  }

  const s = { ...DEFAULT_SETTINGS, ...settings };
  const activeSettings = [SETTINGS.voice.choices[s.voice], SETTINGS.depth.choices[s.depth], SETTINGS.style.choices[s.style]];

  return (
    <>
      <div className="composer">
        <div className="composer-top">
          <label htmlFor="in">{label}</label>
          <button className={`fav ${isFav ? "on" : ""}`} onClick={toggleFav} aria-pressed={isFav}>
            {isFav ? "★ في المفضلة" : "☆ أضف للمفضلة"}
          </button>
        </div>
        <textarea
          id="in"
          ref={inRef}
          value={input}
          maxLength={MAX}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }}
          placeholder={placeholder}
        />
        <div className="composer-bar">
          {option && (
            <div className="segmented" role="radiogroup" aria-label={option.label}>
              {option.choices.map((c) => (
                <button key={c} role="radio" aria-checked={choice === c} className={choice === c ? "on" : ""} onClick={() => setChoice(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="composer-actions">
            <button className="settings-peek" onClick={() => window.dispatchEvent(new Event("rs-open-settings"))} title="لوحة التحكم">
              {activeSettings.join(" • ")}
            </button>
            <span className="meta">{input.length}/{MAX}</span>
            {loading ? (
              <button className="btn stop" onClick={() => stopRef.current?.abort()}>إيقاف</button>
            ) : (
              <button className="btn" onClick={() => run()} disabled={!input.trim()}>نفّذ</button>
            )}
          </div>
        </div>
        {error && <div className="error" role="alert">{error}</div>}
      </div>

      {(loading || result) && (
        <div className="result" ref={outRef} aria-live="polite">
          {!result && loading ? (
            <div className="shimmer" aria-label="جاري الكتابة">
              <span /><span /><span />
            </div>
          ) : (
            <div ref={mdRef} className={`md ${loading ? "typing" : ""}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          )}

          {result && !loading && (
            <>
              <div className="refine">
                <span>عدّل النتيجة:</span>
                {Object.entries(REFINES).map(([k, r]) => (
                  <button key={k} className="pill" onClick={() => run(k)}>{r.label}</button>
                ))}
              </div>
              <div className="result-actions">
                <button className="btn ghost" onClick={copy}>نسخ</button>
                <button className="btn ghost" onClick={() => run()}>إعادة التوليد</button>
              </div>
              <ShareBar text={result} title={toolName} getHtml={() => mdRef.current?.innerHTML || ""} />
            </>
          )}
        </div>
      )}
    </>
  );
}
