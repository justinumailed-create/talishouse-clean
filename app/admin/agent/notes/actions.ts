"use server";

import { revalidatePath } from "next/cache";
import {
  confirmAgentNoteUpload,
  createAgentNote,
  createAgentNoteUpload,
  getCurrentAgent,
  updateAgentNote,
  type CollabResult,
} from "@/lib/agent-collab-server";

const unauthorized = { ok: false as const, error: "Please sign in again." };

export async function createNoteAction(body: string): Promise<CollabResult> {
  const agent = await getCurrentAgent();
  if (!agent) return unauthorized;
  const result = await createAgentNote(agent, body);
  if (result.ok) revalidatePath("/admin/agent/notes");
  return result;
}

export async function updateNoteAction(noteId: string, body: string): Promise<CollabResult> {
  const agent = await getCurrentAgent();
  if (!agent) return unauthorized;
  const result = await updateAgentNote(agent, String(noteId || ""), body);
  if (result.ok) revalidatePath("/admin/agent/notes");
  return result;
}

export async function startNoteUploadAction(file: { name: string; size: number; type: string }) {
  const agent = await getCurrentAgent();
  if (!agent) return unauthorized;
  return createAgentNoteUpload(agent, file);
}

export async function confirmNoteUploadAction(path: string): Promise<CollabResult> {
  const agent = await getCurrentAgent();
  if (!agent) return unauthorized;
  const result = await confirmAgentNoteUpload(agent, String(path || ""));
  if (result.ok) revalidatePath("/admin/agent/notes");
  return result;
}
