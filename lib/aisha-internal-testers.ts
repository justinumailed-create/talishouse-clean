/**
 * Central, inspectable list of internal testers whose Aisha calls must not
 * enter Rishav's transcript queue or Contact CRM.
 *
 * Update this list when a team member should be treated as a tester.
 * Matching is conservative for common first names (Arun, Ralf, Jonathan):
 * those require a last name, login id, email, or phone, so a real caller
 * with the same first name is not excluded.
 */

export type InternalTester = {
  /** Stable id for logs and tests. */
  id: string;
  /** Lowercase full-name or distinctive first-name aliases. */
  names: readonly string[];
  /** Distinctive first names that are safe to match on their own. */
  distinctiveNames?: readonly string[];
  loginIds: readonly string[];
  emails: readonly string[];
  /** Digits-only phone numbers (leading NANP 1 is stripped at match time). */
  phones: readonly string[];
};

export const AISHA_INTERNAL_TESTERS: readonly InternalTester[] = [
  {
    id: "aritri",
    names: ["aritri"],
    distinctiveNames: ["aritri"],
    loginIds: ["aritri"],
    emails: [],
    phones: [],
  },
  {
    id: "enanko",
    names: ["enanko"],
    distinctiveNames: ["enanko"],
    loginIds: ["enanko"],
    emails: [],
    phones: [],
  },
  {
    id: "arun",
    names: ["arun rachuri"],
    distinctiveNames: [],
    loginIds: ["arun"],
    emails: ["arun@kyptronix.com"],
    phones: [],
  },
  {
    id: "ralf",
    names: ["ralf meyer"],
    distinctiveNames: [],
    loginIds: ["ralf"],
    emails: ["remecom@mac.com"],
    phones: ["9023172223"],
  },
  {
    id: "jonathan",
    names: ["jonathan meyer"],
    distinctiveNames: [],
    loginIds: ["jonathan"],
    emails: [],
    phones: [],
  },
];

export function normalizeTesterName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTesterEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Digits only, drop a leading NANP 1 on 11-digit numbers. */
export function normalizeTesterPhone(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (/^1\d{10}$/.test(digits)) return digits.slice(1);
  return digits.length >= 7 ? digits : null;
}

export function normalizeTesterLogin(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function matchInternalTester(
  input: {
    callerName?: string | null;
    email?: string | null;
    phone?: string | null;
    loginId?: string | null;
  },
  testers: readonly InternalTester[] = AISHA_INTERNAL_TESTERS,
): InternalTester | null {
  const name = normalizeTesterName(input.callerName);
  const email = normalizeTesterEmail(input.email);
  const phone = normalizeTesterPhone(input.phone);
  const loginId = normalizeTesterLogin(input.loginId);

  for (const tester of testers) {
    if (loginId && tester.loginIds.some((id) => id === loginId)) return tester;
    if (email && tester.emails.some((e) => e === email)) return tester;
    if (phone && tester.phones.some((p) => normalizeTesterPhone(p) === phone)) return tester;
    if (name) {
      if (tester.names.some((alias) => name === alias || name.includes(alias))) return tester;
      if (tester.distinctiveNames?.some((alias) => name === alias || name.split(" ")[0] === alias)) {
        return tester;
      }
    }
  }
  return null;
}
