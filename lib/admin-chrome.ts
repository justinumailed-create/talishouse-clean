/**
 * Agent, reviewer and admin console chrome. English labels stay the nav
 * source of truth; German is applied when talis_locale=de.
 * Mapsite, FAST Code, SEO, Chat and Tsplits™ stay the product names.
 */

export type ChromeLocale = "en" | "de";

const NAV_DE: Record<string, string> = {
  "/admin/dashboard": "Übersicht",
  "/admin/notifications": "Mitteilungen",
  "/admin/build-requests": "Bauanfragen",
  "/admin/registrations": "Registrierungen",
  "/admin/marketing": "Marketing",
  "/admin/leads": "Interessenten",
  "/admin/agent/leads": "Interessenten (CRM)",
  "/admin/contact-from-leads": "Kontakt aus Interessenten",
  "/admin/mapsites": "Mapsites",
  "/admin/contracts": "Verträge",
  "/admin/seo": "SEO",
  "/admin/talisbooks": "Talisbooks™",
  "/admin/talisbooks/bookshelves": "Bücherregale",
  "/admin/pmc": "PMC-Pins",
  "/admin/payments": "Zahlungen",
  "/admin/fast-codes": "FAST Codes",
  "/admin/agents": "Agenten",
  "/admin/access": "Admin-Zugang",
  "/admin/agent": "Mein Dashboard",
  "/admin/agent/notes": "Tagesnotizen",
  "/admin/agent/review": "Prüfung",
  "/chat": "Chat",
};

const GROUP_DE: Record<string, string> = {
  Overview: "Überblick",
  Workspace: "Arbeitsbereich",
  Operations: "Betrieb",
  "Mapsites & content": "Mapsites und Inhalte",
  Administration: "Verwaltung",
  More: "Weiteres",
};

export function adminChrome(locale: ChromeLocale) {
  const de = locale === "de";
  return {
    agentConsole: de ? "Agentenkonsole" : "Agent Console",
    adminConsole: de ? "Adminkonsole" : "Admin Console",
    logout: de ? "Abmelden" : "Logout",
    home: de ? "Tsplits™ Startseite" : "Tsplits™ home",
    closeSidebar: de ? "Seitenleiste schließen" : "Close sidebar",
    openSidebar: de ? "Seitenleiste öffnen" : "Open sidebar",
    globalAdmin: de ? "Globale Administration" : "Global Admin",
    admin: de ? "Admin" : "Admin",
    agent: de ? "Agent" : "Agent",
    reviewer: de ? "Prüfer" : "Reviewer",
    nav(href: string, english: string): string {
      return de ? (NAV_DE[href] ?? english) : english;
    },
    group(title: string): string {
      return de ? (GROUP_DE[title] ?? title) : title;
    },
  };
}
