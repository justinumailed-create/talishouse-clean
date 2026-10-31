"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { tryGetSupabaseAdmin } from "@/lib/supabaseAdmin";

export type ProposeRole = "referral" | "resale" | "fulfillment";
const ROLES: readonly ProposeRole[] = ["referral", "resale", "fulfillment"];

export type ProposeInput = {
  name: string;
  email: string;
  phone?: string | null;
  location: string;
  role: string;
};

export type ProposeResult = { ok: true } | { ok: false; error: "required" | "badEmail" | "failed" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateProposal(input: ProposeInput): "required" | "badEmail" | null {
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const location = input.location?.trim() ?? "";
  if (!name || !email || !location || !ROLES.includes(input.role as ProposeRole)) return "required";
  if (email.length > 254 || !EMAIL_RE.test(email)) return "badEmail";
  return null;
}

/**
 * Propose a Project → `applications` row (status "pending"), written on the
 * server. Only columns that exist on the table are sent.
 */
export async function submitProposalAction(input: ProposeInput): Promise<ProposeResult> {
  const invalid = validateProposal(input);
  if (invalid) return { ok: false, error: invalid };
  const admin = tryGetSupabaseAdmin();
  if (!admin) return { ok: false, error: "failed" };
  const row = {
    name: input.name.trim().slice(0, 120),
    email: input.email.trim().slice(0, 254),
    phone: input.phone?.trim().slice(0, 40) || null,
    location: input.location.trim().slice(0, 200),
    participation_level: input.role,
    status: "pending",
  };
  const { error } = await (admin as unknown as SupabaseClient).from("applications").insert([row]);
  if (error) return { ok: false, error: "failed" };
  return { ok: true };
}
