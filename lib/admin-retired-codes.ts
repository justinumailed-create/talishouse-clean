import { createHash } from "node:crypto";
import { normalizeAdminFastCode } from "./admin-constants";

/**
 * Server-only blocklist of retired legacy admin codes. Stored as SHA-256 hex
 * digests (never plaintext) so the old value cannot ship in any bundle; a
 * retired code can never log in or be re-granted.
 */
const RETIRED_ADMIN_FAST_CODE_HASHES: readonly string[] = [
  "5b40171489659251097e7790fc2f1892e2183a72546fe1df283d07865db9149c",
];

export function isRetiredAdminFastCode(code: string | null | undefined): boolean {
  const normalized = normalizeAdminFastCode(code);
  if (!normalized) return false;
  const digest = createHash("sha256").update(normalized).digest("hex");
  return RETIRED_ADMIN_FAST_CODE_HASHES.includes(digest);
}
