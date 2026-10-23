/**
 * Homepage ownership Learn More → contact form.
 * Emails marketing + admin; also persisted under Admin → Contact from leads.
 */

export const OWNERSHIP_CONTACT_RECIPIENTS = [
  "Just.inumailed@gmail.com",
  "remecom@mac.com",
] as const;

export const OWNERSHIP_CONTACT_SOURCE = "ownership_learn_more" as const;

export const OWNERSHIP_CONTACT_TOPICS = [
  "Conventional",
  "Lease-to-Own",
  "Fractionalization",
  "Tokenization",
] as const;

/**
 * Max length of the "Propose a Project" message (TalisBOT form + API).
 * Enough to understand the proposal — not a business plan.
 */
export const OWNERSHIP_CONTACT_MESSAGE_MAX = 280;

/** Max length of the Discuss a Project page location (Google formatted address). */
export const OWNERSHIP_CONTACT_LOCATION_MAX = 200;

/**
 * `?topic=fractionalization` → "Fractionalization" (default Conventional).
 * `splits` is the previous Lease-to-Own id and still resolves.
 */
export function canonicalOwnershipTopic(
  id: string | null | undefined,
): OwnershipContactTopic | null {
  const key = (id || "").trim().toLowerCase();
  if (!key) return null;
  if (key === "splits") return "Lease-to-Own";
  return OWNERSHIP_CONTACT_TOPICS.find((topic) => topic.toLowerCase() === key) ?? null;
}

export function ownershipTopicFromId(id: string | null | undefined): OwnershipContactTopic {
  return canonicalOwnershipTopic(id) ?? OWNERSHIP_CONTACT_TOPICS[0];
}

/** Stored lead or deal text that still says SPLITS, shown as Lease-to-Own. */
export function displayStoredStructureLabel(text: string): string {
  return text.replace(/\bSPLITS\b/g, "Lease-to-Own");
}

/** Lead `location` column: where the inquiry came from (+ project location). */
export function ownershipLeadLocation(input: {
  topic: string;
  location?: string | null;
  channel?: string | null;
}): string {
  const where = (input.location || "").trim();
  if (input.channel === "discuss-page") {
    return where
      ? `Share a Project Vision — ${input.topic} — ${where}`
      : `Share a Project Vision — ${input.topic}`;
  }
  return where
    ? `Ownership Learn More — ${input.topic} — ${where}`
    : `Ownership Learn More — ${input.topic}`;
}

export type OwnershipContactTopic =
  (typeof OWNERSHIP_CONTACT_TOPICS)[number];

export type OwnershipContactPayload = {
  name: string;
  email: string;
  /** Required; must be a North American (NANP) number — see nanp-phone.ts. */
  phone: string;
  message: string;
  topic: OwnershipContactTopic | string;
};

/**
 * Window event the homepage Learn More buttons dispatch so the TalisBOT chat
 * widget opens with the contact form (instead of a full-page modal).
 */
export const OPEN_OWNERSHIP_CONTACT_EVENT = "talisbot:open-ownership-contact" as const;

export type OpenOwnershipContactDetail = {
  topic: OwnershipContactTopic | string;
};

export function openOwnershipContactInTalisBot(topic: OwnershipContactTopic | string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OpenOwnershipContactDetail>(OPEN_OWNERSHIP_CONTACT_EVENT, {
      detail: { topic },
    }),
  );
}
