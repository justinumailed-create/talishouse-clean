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
  "SPLITS",
  "Fractionalization",
  "Tokenization",
] as const;

/**
 * Max length of the "Propose a Project" message (TalisBOT form + API).
 * Enough to understand the proposal — not a business plan.
 */
export const OWNERSHIP_CONTACT_MESSAGE_MAX = 280;

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
