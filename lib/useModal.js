"use client";
import { useEffect } from "react";

// لما نافذة تتفتح جوه الصفحة: تطلع فوق الشريطين، والصفحة متتحركش وراها، وEsc يقفلها
export function useModal(open, onClose) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("rs-modal");
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("rs-modal");
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
