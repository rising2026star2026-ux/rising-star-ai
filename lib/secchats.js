"use client";
// محادثات كل قسم على جهاز الزائر (مفتاح لكل قسم). بتظهر في القايمة الجانبية للقسم.
import { read, write } from "@/lib/store";

export const chatsKey = (section) => `sec-chats-${section}`;
export const activeKey = (section) => `sec-active-${section}`;
const MAX_CHATS = 30, MAX_MSGS = 40, MAX_LEN = 6000;

export const newChatId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const getChat = (section, id) => (read(chatsKey(section), []) || []).find((c) => c.id === id) || null;

export function saveChat(section, id, msgs) {
  const first = msgs.find((m) => m.role === "user")?.content || "محادثة";
  const chat = {
    id,
    title: first.replace(/\s+/g, " ").slice(0, 48),
    t: Date.now(),
    msgs: msgs.slice(-MAX_MSGS).map(({ role, content, cards }) => ({ role, content: String(content).slice(0, MAX_LEN), ...(Array.isArray(cards) && cards.length ? { cards: cards.slice(0, 12) } : {}) })),
  };
  const rest = (read(chatsKey(section), []) || []).filter((c) => c.id !== id);
  write(chatsKey(section), [chat, ...rest].slice(0, MAX_CHATS));
}
export const setActive = (section, id) => write(activeKey(section), id || "");
