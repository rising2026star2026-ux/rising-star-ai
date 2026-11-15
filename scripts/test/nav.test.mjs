import assert from "node:assert/strict";
import { SIDE_NAV, TAB_NAV, isOn } from "../../lib/nav.js";
const paths = ["/", "/brand", "/my-work", "/compare-business", "/feasibility", "/feasibility/chat", "/market-check", "/amazon/profit", "/catalog", "/tools", "/tool/ad-copy", "/seller", "/seller/agent", "/s/seller", "/photo-ad", "/voice-post", "/test-ad", "/survey", "/maker"];
for (const list of [SIDE_NAV, TAB_NAV]) for (const p of paths) {
  const on = list.filter((i) => isOn(i, p));
  assert.ok(on.length <= 1, `المسار ${p} بيشغّل ${on.length} عناصر: ${on.map((x) => x.label)}`);
  if (p !== "/lab") assert.ok(on.length === 1, `المسار ${p} مالوش عنصر في القايمة`);
}
console.log("nav: تمام");
