import type { Locale } from "@/lib/i18n/config";

/**
 * Tsplits™ Sales Playbook (Nov 3 2026): internal sales-team reference behind a
 * server-checked passcode. Not linked from any navigation or sitemap.
 * Client-safe constants and copy only; the gate itself lives in
 * tsplits-playbook.server.ts and the files in private/tsplits/.
 */

export const TSPLITS_PLAYBOOK_PATH = "/talisu/tsplits-playbook";
export const TSPLITS_PLAYBOOK_UNLOCK_API = "/api/tsplits-playbook/unlock";
export const TSPLITS_PLAYBOOK_PDF_API = "/api/tsplits-playbook/pdf";
export const TSPLITS_PLAYBOOK_VIEW_API = "/api/tsplits-playbook/view";
export const TSPLITS_PLAYBOOK_COOKIE = "talis_tsplits_playbook";
export const TSPLITS_PLAYBOOK_COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours
export const TSPLITS_PLAYBOOK_PDF_FILE_NAME = "Tsplits-Sales-Playbook.pdf";
export const TSPLITS_PLAYBOOK_FAILED_LIMIT = 10;
export const TSPLITS_PLAYBOOK_FAILED_WINDOW_MINUTES = 15;

export type TsplitsPlaybookUnlockError = "badCode" | "tooMany" | "unavailable";

export type TsplitsPlaybookCopy = {
  kicker: string;
  title: string;
  intro: string;
  passcode: string;
  submit: string;
  checking: string;
  badCode: string;
  tooMany: string;
  unavailable: string;
  downloadPdf: string;
  frameTitle: string;
};

export const TSPLITS_PLAYBOOK_COPY: Record<Locale, TsplitsPlaybookCopy> = {
  en: {
    kicker: "Tsplits™ · Sales Team",
    title: "Tsplits™ Sales Playbook",
    intro: "Enter the team passcode to open the playbook.",
    passcode: "Passcode",
    submit: "Open Playbook",
    checking: "Checking…",
    badCode: "That passcode is not correct.",
    tooMany: "Too many attempts. Please try again in 15 minutes.",
    unavailable: "Access is not available right now.",
    downloadPdf: "Download PDF",
    frameTitle: "Tsplits™ Sales Playbook",
  },
  de: {
    kicker: "Tsplits™ · Vertriebsteam",
    title: "Tsplits™ Sales Playbook",
    intro: "Geben Sie den Team-Zugangscode ein, um das Playbook zu öffnen.",
    passcode: "Zugangscode",
    submit: "Playbook öffnen",
    checking: "Wird geprüft…",
    badCode: "Dieser Zugangscode ist nicht korrekt.",
    tooMany: "Zu viele Versuche. Bitte versuchen Sie es in 15 Minuten erneut.",
    unavailable: "Der Zugang ist derzeit nicht verfügbar.",
    downloadPdf: "PDF herunterladen",
    frameTitle: "Tsplits™ Sales Playbook",
  },
};

export function tsplitsPlaybookCopy(locale: string | null | undefined): TsplitsPlaybookCopy {
  return TSPLITS_PLAYBOOK_COPY[locale === "de" ? "de" : "en"];
}
