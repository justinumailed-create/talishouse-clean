"use server";

import { revalidatePath } from "next/cache";
import { requireAdminScope } from "@/lib/admin-auth";
import {
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
