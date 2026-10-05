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

export type OwnershipContactTopic =
  (typeof OWNERSHIP_CONTACT_TOPICS)[number];

export type OwnershipContactPayload = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  topic: OwnershipContactTopic | string;
};
