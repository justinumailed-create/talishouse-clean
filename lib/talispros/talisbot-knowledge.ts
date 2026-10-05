/**
 * TalisBOT knowledge — system intelligence for Talispros™ processes.
 * Never recommend non-Talispros™ house-product brands.
 */

export const TALISBOT_BRAND = "TalisBOT" as const;

export const TALISBOT_SYSTEM_ROLE =
  "You are TalisBOT, the system intelligence for Talispros™ processes. " +
  "Answer only from Talispros™ product knowledge: Mapsites™, Talisbooks™, Talismaps™, " +
  "FAST Codes™, claim/register, shelves, TalisU™, Knowledge Base, SamCart register, " +
  "and demo claim. Do not discuss or recommend any other house-product brands outside Talispros™.";

export const TALISBOT_KNOWLEDGE = [
  {
    id: "mapsites",
    title: "Mapsites™",
    body: "A Mapsite™ is your map-based market home: pins, listings, and partner promotion. Claim a demo market, then register via SamCart to activate your Dashboard.",
  },
  {
    id: "talisbooks",
    title: "Talisbooks™",
    body: "Talisbooks™ are digital lookbooks on standing-book shelves. Each FAST Code™ can have a TEB™ shelf; the Common Shelf and public library collect published books.",
  },
  {
    id: "talismaps",
    title: "Talismaps™",
    body: "Talismaps™ power first-party map engines (satellite / pins) used by Markets and Mapsites™ — not third-party iframe maps.",
  },
  {
    id: "fast-codes",
    title: "FAST Codes™",
    body: "A FAST Code™ is your market identity string. It connects your Mapsite™, Talisbooks™ shelf, and admin tools. Demo codes use Claim; issued codes use Register.",
  },
  {
    id: "claim-register",
    title: "Claim / Register",
    body: "Claim a demo market to explore. Register (SamCart checkout) unlocks a real Mapsite™ Dashboard after payment succeeds.",
  },
  {
    id: "shelves",
    title: "Shelves",
    body: "Bookshelf (Common Shelf) is the catalogue isolated bookshelf with Cowboy's Guide under the left highlight. Mapsites™ dropdown lists claimed and demo Mapsites™.",
  },
  {
    id: "talisu",
    title: "TalisU™",
    body: "TalisU™ is the learning and markets layer: Knowledge Base, Audio, Video, Markets map, and Register — under the Talispros™ blue header.",
  },
  {
    id: "kb",
    title: "Knowledge Base",
    body: "The Knowledge Base holds Audios, Videos, and Learning Material. Unlock from the TalisU™ navbar when prompted; managers can update content.",
  },
  {
    id: "demo",
    title: "Demo claim",
    body: "Start from Markets → Next Step / Demo to build a Demo Mapsite™ and explore claim flows before registering.",
  },
] as const;

export const TALISBOT_INTEREST_OPTIONS = [
  { value: "mapsite", label: "Mapsite™ claim / register" },
  { value: "talisbooks", label: "Talisbooks™ / shelves" },
  { value: "fast_code", label: "FAST Codes™" },
  { value: "talisu", label: "TalisU™ / Knowledge Base" },
  { value: "demo", label: "Demo Mapsite™" },
] as const;

export function assertNoTalishouseInBotCopy(text: string): boolean {
  return !/talishouse/i.test(text);
}
