import { createHash, randomBytes, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AGENT_SESSION_COOKIE,
  sanitizeAgentScopes,
  type AdminAccount,
  type AgentGrantableScope,
} from "./admin-constants";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin";

/**
 * Agent Admins (`public.agent_admins`). Server-only: the table has RLS on and
 * no anon/authenticated policies, so every read/write goes through the
 * service-role client here.
 */

export type AgentStatus = "active" | "disabled";

export interface AgentAdminRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  loginId: string;
  hasPassword: boolean;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  isLocked: boolean;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  status: AgentStatus;
  privileges: AgentGrantableScope[];
  assignedMapSites: string[];
  regions: string[];
  pageHeadline: string | null;
  pageSubtext: string | null;
  pageCta: string | null;
  pageBio: string | null;
  videoUrl: string | null;
  showContactForm: boolean;
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentAuditEntry {
  id: string;
  action: string;
  performedBy: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

type AgentRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  login_id: string;
  password_hash: string | null;
  must_change_password: boolean | null;
  failed_login_attempts: number | null;
  locked_until: string | null;
  last_login_at: string | null;
  password_changed_at: string | null;
  status: string;
  privileges: string[] | null;
  assigned_mapsites: string[] | null;
  regions: string[] | null;
  page_headline: string | null;
  page_subtext: string | null;
  page_cta: string | null;
  page_bio: string | null;
  video_url: string | null;
  show_contact_form: boolean | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export const AGENT_TABLE = "agent_admins";
const SESSION_TABLE = "agent_admin_sessions";
/** Columns safe to load (no password_hash). hasPassword is derived separately. */
const AGENT_PUBLIC_COLUMNS =
  "id, name, email, phone, login_id, must_change_password, failed_login_attempts, locked_until, last_login_at, password_changed_at, status, privileges, assigned_mapsites, regions, page_headline, page_subtext, page_cta, page_bio, video_url, show_contact_form, notes, created_by, updated_by, created_at, updated_at, has_password:password_hash";
const AUDIT_TABLE_NAME = "agent_admins";

function db(): SupabaseClient {
  // agent_admins is not in the generated Database types yet.
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

function toRecord(row: AgentRow): AgentAdminRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    loginId: row.login_id,
    hasPassword: Boolean(row.password_hash ?? (row as { has_password?: string | null }).has_password),
    mustChangePassword: row.must_change_password ?? true,
    failedLoginAttempts: row.failed_login_attempts ?? 0,
    lockedUntil: row.locked_until,
    isLocked: Boolean(row.locked_until && Date.parse(row.locked_until) > Date.now()),
    lastLoginAt: row.last_login_at,
    passwordChangedAt: row.password_changed_at,
    status: row.status === "disabled" ? "disabled" : "active",
    privileges: sanitizeAgentScopes(row.privileges ?? []),
    assignedMapSites: (row.assigned_mapsites ?? []).map((c) => c.toLowerCase()),
    regions: row.regions ?? [],
    pageHeadline: row.page_headline,
    pageSubtext: row.page_subtext,
    pageCta: row.page_cta,
    pageBio: row.page_bio,
    videoUrl: row.video_url,
    showContactForm: row.show_contact_form ?? true,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function agentToAdminAccount(agent: AgentAdminRecord): AdminAccount {
  return {
    name: agent.name,
    // Agents have no FAST Code; this is a display/identity handle only.
    fastCode: `@${agent.loginId}`,
    email: agent.email,
    access: "agent",
    // No privileges until a temporary password has been changed.
    scopes: agent.mustChangePassword ? [] : agent.privileges,
    agentId: agent.id,
    assignedMapSites: agent.assignedMapSites,
    loginId: agent.loginId,
    mustChangePassword: agent.mustChangePassword,
  };
}

export function normalizeLoginId(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isValidLoginId(value: string): boolean {
  return /^[a-z0-9._-]{3,32}$/.test(value);
}

export async function getAgentByLoginId(
  loginId: string,
  options: { activeOnly?: boolean } = {},
): Promise<AgentAdminRecord | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const id = normalizeLoginId(loginId);
  if (!isValidLoginId(id)) return null;
  let query = db().from(AGENT_TABLE).select(AGENT_PUBLIC_COLUMNS).eq("login_id", id);
  if (options.activeOnly) query = query.eq("status", "active");
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return toRecord(data as unknown as AgentRow);
}

export async function getAgentById(id: string): Promise<AgentAdminRecord | null> {
  if (!isSupabaseAdminConfigured() || !id) return null;
  const { data, error } = await db().from(AGENT_TABLE).select(AGENT_PUBLIC_COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return toRecord(data as unknown as AgentRow);
}

export async function listAgents(): Promise<{ agents: AgentAdminRecord[]; error: string | null }> {
  if (!isSupabaseAdminConfigured()) {
    return { agents: [], error: "SUPABASE_SERVICE_ROLE_KEY is not configured." };
  }
  const { data, error } = await db()
    .from(AGENT_TABLE)
    .select(AGENT_PUBLIC_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) return { agents: [], error: error.message };
  return { agents: ((data ?? []) as unknown as AgentRow[]).map(toRecord), error: null };
}

export interface AgentInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  loginId: string;
  status?: AgentStatus;
  privileges?: readonly string[];
  assignedMapSites?: readonly string[];
  regions?: readonly string[];
  notes?: string | null;
}

function clean(value: string | null | undefined, max = 2000): string | null {
  const v = (value ?? "").trim();
  return v ? v.slice(0, max) : null;
}

function cleanList(values: readonly string[] | undefined, lower = false): string[] {
  const out = new Set<string>();
  for (const raw of values ?? []) {
    const v = String(raw).trim();
    if (v) out.add(lower ? v.toLowerCase() : v);
  }
  return [...out].slice(0, 200);
}

export function parseListField(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Validate a login ID: shape and uniqueness. */
export async function validateAgentLoginId(
  loginId: string,
  excludeAgentId?: string,
): Promise<string | null> {
  const id = normalizeLoginId(loginId);
  if (!isValidLoginId(id)) {
    return "Login ID must be 3–32 lowercase letters, digits, dots, dashes or underscores.";
  }
  const { data: existing } = await db()
    .from(AGENT_TABLE)
    .select("id")
    .eq("login_id", id)
    .limit(1);
  const other = (existing ?? []).find((row: { id: string }) => row.id !== excludeAgentId);
  if (other) return "Another agent already uses that login ID.";
  return null;
}

export async function logAgentAudit(
  agentId: string,
  action: string,
  performedBy: string,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    await db().from("activity_logs").insert({
      table_name: AUDIT_TABLE_NAME,
      record_id: agentId,
      action,
      performed_by: performedBy,
      details,
    });
  } catch (error) {
    console.warn("[agent-admins] audit log failed:", error);
  }
}

export async function listAgentAudit(agentId: string, limit = 30): Promise<AgentAuditEntry[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const { data } = await db()
    .from("activity_logs")
    .select("id, action, performed_by, details, created_at")
    .eq("table_name", AUDIT_TABLE_NAME)
    .eq("record_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Array<{
    id: string;
    action: string;
    performed_by: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    action: row.action,
    performedBy: row.performed_by,
    details: row.details,
    createdAt: row.created_at,
  }));
}

function diff(before: AgentAdminRecord | null, after: AgentAdminRecord): Record<string, unknown> {
  if (!before) return { created: { ...after } };
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after) as (keyof AgentAdminRecord)[]) {
    if (key === "updatedAt" || key === "updatedBy") continue;
    const a = JSON.stringify(before[key]);
    const b = JSON.stringify(after[key]);
    if (a !== b) changes[key] = { from: before[key], to: after[key] };
  }
  return changes;
}

export async function createAgent(
  input: AgentInput,
  actor: string,
): Promise<{ ok: true; agent: AgentAdminRecord } | { ok: false; error: string }> {
  const name = clean(input.name, 200);
  if (!name) return { ok: false, error: "Name is required." };
  const idError = await validateAgentLoginId(input.loginId);
  if (idError) return { ok: false, error: idError };

  const { data, error } = await db()
    .from(AGENT_TABLE)
    .insert({
      name,
      email: clean(input.email, 320)?.toLowerCase() ?? null,
      phone: clean(input.phone, 64),
      login_id: normalizeLoginId(input.loginId),
      must_change_password: true,
      status: input.status === "disabled" ? "disabled" : "active",
      privileges: sanitizeAgentScopes(input.privileges ?? []),
      assigned_mapsites: cleanList(input.assignedMapSites, true),
      regions: cleanList(input.regions),
      notes: clean(input.notes),
      created_by: actor,
      updated_by: actor,
    })
    .select(AGENT_PUBLIC_COLUMNS)
    .single();
  if (error || !data) return { ok: false, error: error?.message || "Could not create agent." };
  const agent = toRecord(data as unknown as AgentRow);
  await logAgentAudit(agent.id, "agent.create", actor, diff(null, agent));
  return { ok: true, agent };
}

export async function updateAgent(
  id: string,
  input: AgentInput,
  actor: string,
): Promise<{ ok: true; agent: AgentAdminRecord } | { ok: false; error: string }> {
  const before = await getAgentById(id);
  if (!before) return { ok: false, error: "Agent not found." };
  const name = clean(input.name, 200);
  if (!name) return { ok: false, error: "Name is required." };
  const loginId = normalizeLoginId(input.loginId);
  if (loginId !== before.loginId) {
    const idError = await validateAgentLoginId(loginId, id);
    if (idError) return { ok: false, error: idError };
  }

  const { data, error } = await db()
    .from(AGENT_TABLE)
    .update({
      name,
      email: clean(input.email, 320)?.toLowerCase() ?? null,
      phone: clean(input.phone, 64),
      login_id: loginId,
      status: input.status === "disabled" ? "disabled" : "active",
      privileges: sanitizeAgentScopes(input.privileges ?? []),
      assigned_mapsites: cleanList(input.assignedMapSites, true),
      regions: cleanList(input.regions),
      notes: clean(input.notes),
      updated_by: actor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(AGENT_PUBLIC_COLUMNS)
    .single();
  if (error || !data) return { ok: false, error: error?.message || "Could not update agent." };
  const agent = toRecord(data as unknown as AgentRow);
  if (agent.status === "disabled" || agent.loginId !== before.loginId) {
    await revokeAgentSessions(agent.id);
  }
  await logAgentAudit(agent.id, "agent.update", actor, diff(before, agent));
  return { ok: true, agent };
}

export async function setAgentStatus(
  id: string,
  status: AgentStatus,
  actor: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const before = await getAgentById(id);
  if (!before) return { ok: false, error: "Agent not found." };
  const { error } = await db()
    .from(AGENT_TABLE)
    .update({ status, updated_by: actor, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (status === "disabled") await revokeAgentSessions(id);
  await logAgentAudit(id, status === "disabled" ? "agent.disable" : "agent.enable", actor, {
    status: { from: before.status, to: status },
  });
  return { ok: true };
}

export interface AgentMapSiteSummary {
  fastCode: string;
  propertyTitle: string | null;
  status: string | null;
}

export async function listAgentMapSites(codes: readonly string[]): Promise<AgentMapSiteSummary[]> {
  if (!isSupabaseAdminConfigured() || codes.length === 0) return [];
  const lower = codes.map((c) => c.toLowerCase());
  const { data } = await db()
    .from("mapsites")
    .select("fast_code, property_title, status")
    .in("fast_code", lower);
  const found = new Map(
    ((data ?? []) as Array<{ fast_code: string; property_title: string | null; status: string | null }>).map(
      (row) => [row.fast_code.toLowerCase(), row],
    ),
  );
  return lower.map((code) => ({
    fastCode: code,
    propertyTitle: found.get(code)?.property_title ?? null,
    status: found.get(code)?.status ?? null,
  }));
}

/* ------------------------------------------------------------------ */
/* Passwords + sessions                                                */
/* ------------------------------------------------------------------ */

const BCRYPT_COST = 12;
export { AGENT_SESSION_COOKIE };
export const AGENT_SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours
export const AGENT_MAX_FAILED_ATTEMPTS = 5;
export const AGENT_LOCKOUT_MINUTES = 15;
export const AGENT_MIN_PASSWORD_LENGTH = 12;

/** Strong random temporary password (no ambiguous characters). */
export function generateTemporaryPassword(length = 16): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*-_";
  let out = "";
  for (let i = 0; i < length; i += 1) out += alphabet[randomInt(0, alphabet.length)];
  return out;
}

export function validateNewPassword(password: string): string | null {
  if (password.length < AGENT_MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${AGENT_MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > 200) return "Password is too long.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password needs upper- and lowercase letters and a digit.";
  }
  return null;
}

export async function hashAgentPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isAgentSessionTokenShape(value: string | null | undefined): boolean {
  return Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));
}

export async function revokeAgentSessions(agentId: string): Promise<void> {
  await db().from(SESSION_TABLE).delete().eq("agent_id", agentId);
}

export async function revokeAgentSessionToken(token: string | null | undefined): Promise<void> {
  if (!token || !isAgentSessionTokenShape(token) || !isSupabaseAdminConfigured()) return;
  await db().from(SESSION_TABLE).delete().eq("token_hash", hashToken(token));
}

async function createAgentSession(agentId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + AGENT_SESSION_MAX_AGE * 1000).toISOString();
  const { error } = await db()
    .from(SESSION_TABLE)
    .insert({ agent_id: agentId, token_hash: hashToken(token), expires_at: expires });
  if (error) throw new Error(error.message);
  return token;
}

/** Resolve an active agent from a session cookie token (expired/disabled → null). */
export async function getAgentBySessionToken(token: string | null | undefined): Promise<AgentAdminRecord | null> {
  if (!isAgentSessionTokenShape(token) || !isSupabaseAdminConfigured()) return null;
  const { data } = await db()
    .from(SESSION_TABLE)
    .select("agent_id, expires_at")
    .eq("token_hash", hashToken(token as string))
    .maybeSingle();
  if (!data) return null;
  const row = data as { agent_id: string; expires_at: string };
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await revokeAgentSessionToken(token);
    return null;
  }
  const agent = await getAgentById(row.agent_id);
  if (!agent || agent.status !== "active") return null;
  return agent;
}

export type AgentLoginResult =
  | { ok: true; token: string; agent: AgentAdminRecord }
  | { ok: false; error: string };

// Dummy hash so unknown login IDs take as long as real ones (timing).
let dummyHashPromise: Promise<string> | null = null;
function dummyHash(): Promise<string> {
  dummyHashPromise ??= bcrypt.hash(randomBytes(16).toString("hex"), BCRYPT_COST);
  return dummyHashPromise;
}

/**
 * Verify login ID + password. Per-account lockout: after
 * AGENT_MAX_FAILED_ATTEMPTS failures the account is locked for
 * AGENT_LOCKOUT_MINUTES. Error messages never reveal which part was wrong.
 */
export async function loginAgent(loginId: string, password: string): Promise<AgentLoginResult> {
  const generic = { ok: false as const, error: "Invalid login ID or password." };
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Agent login is not configured." };
  const id = normalizeLoginId(loginId);
  if (!isValidLoginId(id) || !password || password.length > 200) {
    await bcrypt.compare(password || "x", await dummyHash());
    return generic;
  }

  const { data } = await db()
    .from(AGENT_TABLE)
    .select("id, status, password_hash, failed_login_attempts, locked_until")
    .eq("login_id", id)
    .maybeSingle();
  const row = data as {
    id: string;
    status: string;
    password_hash: string | null;
    failed_login_attempts: number | null;
    locked_until: string | null;
  } | null;

  if (!row || !row.password_hash) {
    await bcrypt.compare(password, await dummyHash());
    return generic;
  }
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    return { ok: false, error: `Too many attempts. Try again in ${AGENT_LOCKOUT_MINUTES} minutes.` };
  }

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid || row.status !== "active") {
    if (!valid) {
      const attempts = (row.failed_login_attempts ?? 0) + 1;
      const lock = attempts >= AGENT_MAX_FAILED_ATTEMPTS;
      await db()
        .from(AGENT_TABLE)
        .update({
          failed_login_attempts: lock ? 0 : attempts,
          locked_until: lock
            ? new Date(Date.now() + AGENT_LOCKOUT_MINUTES * 60 * 1000).toISOString()
            : null,
        })
        .eq("id", row.id);
      if (lock) await logAgentAudit(row.id, "agent.login.locked", "system", { attempts });
    }
    return generic;
  }

  await db()
    .from(AGENT_TABLE)
    .update({ failed_login_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() })
    .eq("id", row.id);
  const agent = await getAgentById(row.id);
  if (!agent) return generic;
  const token = await createAgentSession(agent.id);
  await logAgentAudit(agent.id, "agent.login", agent.loginId, {});
  return { ok: true, token, agent };
}

/** Superadmin sets/resets a password. Always forces a change at next login and revokes sessions. */
export async function setAgentPassword(
  id: string,
  password: string,
  actor: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const agent = await getAgentById(id);
  if (!agent) return { ok: false, error: "Agent not found." };
  const problem = validateNewPassword(password);
  if (problem) return { ok: false, error: problem };
  const { error } = await db()
    .from(AGENT_TABLE)
    .update({
      password_hash: await hashAgentPassword(password),
      must_change_password: true,
      failed_login_attempts: 0,
      locked_until: null,
      password_changed_at: new Date().toISOString(),
      updated_by: actor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await revokeAgentSessions(id);
  await logAgentAudit(id, "agent.password.reset", actor, { mustChangePassword: true });
  return { ok: true };
}

/** Agent changes their own password (requires the current one). Keeps the current session. */
export async function changeOwnAgentPassword(
  id: string,
  currentPassword: string,
  newPassword: string,
  keepToken: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data } = await db().from(AGENT_TABLE).select("password_hash, login_id").eq("id", id).maybeSingle();
  const row = data as { password_hash: string | null; login_id: string } | null;
  if (!row?.password_hash || !(await bcrypt.compare(currentPassword || "", row.password_hash))) {
    return { ok: false, error: "Current password is incorrect." };
  }
  const problem = validateNewPassword(newPassword);
  if (problem) return { ok: false, error: problem };
  if (newPassword === currentPassword) return { ok: false, error: "Choose a new password." };
  const { error } = await db()
    .from(AGENT_TABLE)
    .update({
      password_hash: await hashAgentPassword(newPassword),
      must_change_password: false,
      password_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  // Sign out every other session.
  let q = db().from(SESSION_TABLE).delete().eq("agent_id", id);
  if (keepToken && isAgentSessionTokenShape(keepToken)) q = q.neq("token_hash", hashToken(keepToken));
  await q;
  await logAgentAudit(id, "agent.password.change", row.login_id, {});
  return { ok: true };
}
