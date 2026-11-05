import { istDay } from "@/lib/talispros/fast-code-tracker";
import type { AdminTalisbotMessage, Locale } from "@/lib/talispros/admin-talisbot-messages-types";

export function localizedMessage(
  m: AdminTalisbotMessage,
  locale: Locale,
): { title: string; body: string } {
  const i18n =
    m.metadata.i18n && typeof m.metadata.i18n === "object" && !Array.isArray(m.metadata.i18n)
      ? (m.metadata.i18n as Record<string, unknown>)
      : {};
  const pack =
    i18n[locale] && typeof i18n[locale] === "object" && !Array.isArray(i18n[locale])
      ? (i18n[locale] as Record<string, unknown>)
      : {};
  const title = typeof pack.title === "string" && pack.title.trim() ? pack.title : m.title;
  const body = typeof pack.body === "string" && pack.body.trim() ? pack.body : m.body;
  return { title, body };
}

export function groupMessagesByIstDay(
  messages: AdminTalisbotMessage[],
): { day: string; items: AdminTalisbotMessage[] }[] {
  const map = new Map<string, AdminTalisbotMessage[]>();
  for (const m of messages) {
    const day = istDay(m.createdAt);
    const list = map.get(day) ?? [];
    list.push(m);
    map.set(day, list);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, items]) => ({ day, items }));
}
