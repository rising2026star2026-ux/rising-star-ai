// خدمة مساحة العمل على الخادم: الأنشطة والعضوية والنقل من الجهاز والحذف.
// كل دالة بتاخد sql (tagged template من Neon) والمستخدم من الجلسة، وكل وصول لنشاط بيتحقق من العضوية هنا،
// مش من إخفاء الأزرار في الواجهة (PRD القسم 13).
import { cleanBrand } from "../brandprofile.js";

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const LIMITS = { comparisons: 20, studies: 20, chats: 30, outputs: 50, json: 200_000 };
const uuid = () => globalThis.crypto.randomUUID();
const short = (v, n) => String(v ?? "").trim().slice(0, n);
const json = (v) => {
  const s = JSON.stringify(v ?? null);
  if (s.length > LIMITS.json) throw new HttpError(413, "البيانات أكبر من المسموح.");
  return s;
};
const arr = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);

export async function myBusinesses(sql, uid) {
  return sql`
    SELECT b.id, b.name, b.profile, b.updated_at, m.role
    FROM rb.businesses b JOIN rb.business_members m ON m.business_id = b.id
    WHERE m.user_id = ${uid} AND b.archived_at IS NULL
    ORDER BY b.updated_at DESC`;
}

/** بيرجّع دور المستخدم في النشاط أو بيرمي 403 */
export async function requireMember(sql, uid, businessId, roles = ["owner", "editor"]) {
  const rows = await sql`SELECT role FROM rb.business_members WHERE business_id = ${businessId} AND user_id = ${uid}`;
  const role = rows[0]?.role;
  if (!role || !roles.includes(role)) throw new HttpError(403, "مش مسموح لك بالنشاط ده.");
  return role;
}

export async function createBusiness(sql, uid, rawProfile) {
  const profile = cleanBrand(rawProfile || {});
  const name = short(profile.name, 80) || "نشاطي";
  const id = uuid();
  await sql.transaction([
    sql`INSERT INTO rb.businesses (id, owner_id, name, profile) VALUES (${id}, ${uid}, ${name}, ${json(profile)}::jsonb)`,
    sql`INSERT INTO rb.business_members (business_id, user_id, role) VALUES (${id}, ${uid}, 'owner')`,
    sql`INSERT INTO rb.audit_log (user_id, business_id, action) VALUES (${uid}, ${id}, 'business.create')`,
  ]);
  return { id, name };
}

export async function saveProfile(sql, uid, businessId, rawProfile) {
  await requireMember(sql, uid, businessId);
  const profile = cleanBrand(rawProfile || {});
  const name = short(profile.name, 80) || "نشاطي";
  await sql`UPDATE rb.businesses SET name = ${name}, profile = ${json(profile)}::jsonb, updated_at = now() WHERE id = ${businessId}`;
  return { id: businessId, name };
}

/**
 * نقل بيانات الجهاز (exportAll من lib/repo.js) لحساب العميل، في عملية واحدة: يا كله يا مفيش.
 * لو مفيش نشاط بنعمل واحد من ملف النشاط، ولو فيه بنضيف على أول نشاط ممكن يكتب فيه.
 */
export async function importDevice(sql, uid, payload, businessId = null) {
  const d = payload?.data;
  if (!payload || payload.app !== "Rising Business" || typeof d !== "object" || !d) throw new HttpError(400, "ملف البيانات مش مفهوم.");
  let bid = businessId;
  const q = [];
  if (bid) await requireMember(sql, uid, bid);
  else {
    const mine = await myBusinesses(sql, uid);
    const writable = mine.find((b) => b.role === "owner" || b.role === "editor");
    if (writable) bid = writable.id;
    else {
      bid = uuid();
      const profile = cleanBrand(d.profile || {});
      q.push(sql`INSERT INTO rb.businesses (id, owner_id, name, profile) VALUES (${bid}, ${uid}, ${short(profile.name, 80) || "نشاطي"}, ${json(profile)}::jsonb)`);
      q.push(sql`INSERT INTO rb.business_members (business_id, user_id, role) VALUES (${bid}, ${uid}, 'owner')`);
    }
  }
  if (d.profile && businessId) {
    const profile = cleanBrand(d.profile);
    q.push(sql`UPDATE rb.businesses SET name = ${short(profile.name, 80) || "نشاطي"}, profile = ${json(profile)}::jsonb, updated_at = now() WHERE id = ${bid}`);
  }
  const counts = { comparisons: 0, studies: 0, chats: 0, outputs: 0 };
  for (const c of arr(d.comparisons, LIMITS.comparisons)) {
    if (!Array.isArray(c?.list) || !c.list.length) continue;
    q.push(sql`INSERT INTO rb.comparisons (business_id, name, items) VALUES (${bid}, ${short(c.name, 120) || "مقارنة"}, ${json(c.list)}::jsonb)`);
    counts.comparisons++;
  }
  for (const st of arr(d.studies, LIMITS.studies)) {
    if (!st?.study?.a) continue;
    const sid = uuid();
    q.push(sql`INSERT INTO rb.feasibility_studies (id, business_id, name) VALUES (${sid}, ${bid}, ${short(st.name, 160) || "دراسة جدوى"})`);
    q.push(sql`INSERT INTO rb.feasibility_versions (study_id, version, data, sources_collected_at, created_by) VALUES (${sid}, 1, ${json(st.study)}::jsonb, ${st.study?.data?.at || null}, ${uid})`);
    counts.studies++;
  }
  for (const c of arr(d.chats, LIMITS.chats)) {
    if (!c?.answer) continue;
    q.push(sql`INSERT INTO rb.reports (business_id, kind, title, body) VALUES (${bid}, 'assistant_reply', ${short(c.question, 200) || "رد المساعد"}, ${json({ mode: c.mode, question: short(c.question, 300), answer: short(c.answer, 8000) })}::jsonb)`);
    counts.chats++;
  }
  for (const h of arr(d.outputs, LIMITS.outputs)) {
    if (!h?.output) continue;
    q.push(sql`INSERT INTO rb.reports (business_id, kind, title, body, tool_id) VALUES (${bid}, 'tool_output', ${short(h.toolName, 120) || "مخرج أداة"}, ${json({ input: short(h.input, 2000), output: short(h.output, 12000) })}::jsonb, ${short(h.toolId, 60) || null})`);
    counts.outputs++;
  }
  q.push(sql`INSERT INTO rb.audit_log (user_id, business_id, action, detail) VALUES (${uid}, ${bid}, 'device.import', ${json(counts)}::jsonb)`);
  await sql.transaction(q);
  return { businessId: bid, counts };
}

/** حذف كل الأنشطة اللي العميل مالكها وبياناتها (العضوية في أنشطة غيره بتتشال بس) */
export async function deleteMine(sql, uid) {
  await sql.transaction([
    sql`INSERT INTO rb.audit_log (user_id, action) VALUES (${uid}, 'account.delete_data')`,
    sql`DELETE FROM rb.businesses WHERE owner_id = ${uid}`,
    sql`DELETE FROM rb.business_members WHERE user_id = ${uid}`,
  ]);
  return { ok: true };
}

export async function summary(sql, uid, businessId) {
  await requireMember(sql, uid, businessId, ["owner", "editor", "viewer"]);
  const rows = await sql`
    SELECT
      (SELECT count(*) FROM rb.comparisons WHERE business_id = ${businessId})::int AS comparisons,
      (SELECT count(*) FROM rb.feasibility_studies WHERE business_id = ${businessId})::int AS studies,
      (SELECT count(*) FROM rb.reports WHERE business_id = ${businessId})::int AS reports,
      (SELECT count(*) FROM rb.products WHERE business_id = ${businessId})::int AS products`;
  return rows[0];
}
