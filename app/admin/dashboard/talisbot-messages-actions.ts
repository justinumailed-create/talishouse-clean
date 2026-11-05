"use server";

import { revalidatePath } from "next/cache";
import { requireAdminScope } from "@/lib/admin-auth";
import {
  insertAdminTalisbotComment,
  insertAdminTalisbotMessage,
  markAdminTalisbotMessageRead,
} from "@/lib/talispros/admin-talisbot-messages";

export async function markTalisbotMessageReadAction(id: string): Promise<{ ok: boolean }> {
  const account = await requireAdminScope("agents").catch(() => null);
  if (!account || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false };
  const ok = await markAdminTalisbotMessageRead(id);
  revalidatePath("/admin/dashboard");
  return { ok };
}

/** Comment under a message, or a general note to TalisBOT™ (message_id null). */
export async function postTalisbotCommentAction(form: FormData): Promise<{ ok: boolean; error?: string }> {
  const account = await requireAdminScope("agents").catch(() => null);
  if (!account) return { ok: false, error: "auth" };
  const body = typeof form.get("body") === "string" ? String(form.get("body")).trim() : "";
  const messageIdRaw = typeof form.get("message_id") === "string" ? String(form.get("message_id")).trim() : "";
  const messageId = messageIdRaw && /^[0-9a-f-]{36}$/i.test(messageIdRaw) ? messageIdRaw : null;
  if (body.length < 1) return { ok: false, error: "invalid" };
  const res = await insertAdminTalisbotComment({
    body,
    author: account.name,
    messageId,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

/** Optional message-thread reply (keeps parent_id). Prefer comments for sourcing-bot handoff. */
export async function replyTalisbotMessageAction(form: FormData): Promise<{ ok: boolean; error?: string }> {
  const account = await requireAdminScope("agents").catch(() => null);
  if (!account) return { ok: false, error: "auth" };
  const parentId = typeof form.get("parent_id") === "string" ? String(form.get("parent_id")).trim() : "";
  const body = typeof form.get("body") === "string" ? String(form.get("body")).trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(parentId) || body.length < 1) return { ok: false, error: "invalid" };
  const res = await insertAdminTalisbotMessage({
    type: "reply",
    title: `Reply from ${account.name}`,
    body,
    parentId,
    createdBy: `admin:${account.name}`,
    metadata: { replyTo: parentId },
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/admin/dashboard");
  return { ok: true };
}
