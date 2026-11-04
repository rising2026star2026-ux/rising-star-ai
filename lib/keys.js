"use client";
// Enter بيبعت على الكمبيوتر بس. على الموبايل والتابلت (شاشة لمس) زرار Enter في الكيبورد بينزل سطر جديد،
// والإرسال من زرار الإرسال، عشان المستخدم يقدر يكتب سؤال طويل على كذا سطر من غير ما يتبعت نص.
export function enterSends(e) {
  if (e.key !== "Enter" || e.shiftKey || e.nativeEvent?.isComposing) return false;
  try {
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches) return false;
  } catch {}
  return true;
}
