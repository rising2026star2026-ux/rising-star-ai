"use client";

// بيحط المثال في خانة الطلب فوق (ToolRunner بيسمع الحدث rs-fill)
export default function TryExample({ text }) {
  return (
    <button
      type="button"
      className="btn ghost try"
      onClick={() => window.dispatchEvent(new CustomEvent("rs-fill", { detail: text }))}
    >
      جرّب المثال ده
    </button>
  );
}
