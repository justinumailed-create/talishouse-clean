import type { Locale } from "@/lib/i18n/config";
import type { Localized } from "@/lib/i18n/types";
import type { LeadCountry, LeadIssue, LeadPosition, LeadStatus } from "@/lib/crm-leads/model";

const en = {
  nav: "Leads (CRM)",
  dashboardKicker: "Leads",
  dashboardTitle: "Brokerage leads",
  dashboardText: "Add the brokerages you prospect, or upload today’s CSV.",
  kicker: "Leads (CRM)",
  listTitle: "Brokerage leads",
  listSubtitleMine: "Your contacts. Open everyone’s leads read-only if you need to check a duplicate.",
  listSubtitleAllAgent: "Every agent’s leads. You can edit only the ones you added.",
  listSubtitleAdmin: "Every agent’s brokerage leads. You can edit any row and you are the only person who can delete.",
  mine: "Mine",
  all: "All agents",
  add: "Add lead",
  import: "Upload CSV",
  export: "Export CSV",
  template: "CSV template",
  search: "Search",
  searchPlaceholder: "Name, brokerage, email, phone, market",
  status: "Status",
  country: "Country",
  market: "Market",
  agent: "Agent",
  any: "Any",
  sort: "Sort",
  apply: "Apply",
  reset: "Reset",
  empty: "No leads match these filters.",
  emptyMine: "You have not added a lead yet. Add one or upload a CSV.",
  emptyAll: "No brokerage leads yet.",
  results: "Showing {from}–{to} of {total}",
  resultsEmpty: "0 leads",
  prev: "Previous",
  next: "Next",
  edit: "Edit",
  view: "View",
  readOnly: "Read-only",
  delete: "Delete",
  deleteTitle: "Delete this lead?",
  deleteBody: "This removes the lead and its edit history. The activity log keeps who deleted it. This cannot be undone.",
  deleteConfirm: "Delete lead",
  cancel: "Cancel",
  deleting: "Deleting…",
  saved: "Saved.",
  created: "Lead added.",
  save: "Save lead",
  saving: "Saving…",
  back: "Back to leads",
  newTitle: "Add a lead",
  newSubtitle: "The lead is attributed to you.",
  editTitle: "Edit lead",
  viewTitle: "Lead",
  viewSubtitle: "You can read this lead. Only the agent who added it, or a superadmin, can change it.",
  history: "Edit history",
  historyEmpty: "No edits yet.",
  addedBy: "Added by {name}",
  updated: "Updated {when}",
  required: "Required",
  optional: "Optional",
  latLngHint: "Leave both blank if you do not have a pin.",
  notesPlaceholder: "What you said, what they asked, when to follow up.",
  positions: {
    broker: "Broker",
    acting_broker: "Acting broker",
    managing_broker: "Managing broker",
    team_leader: "Team leader",
  },
  statuses: {
    new: "New",
    contacted: "Contacted",
    replied: "Replied",
    registered: "Registered",
    not_interested: "Not interested",
  },
  countries: {
    Canada: "Canada",
    USA: "USA",
  },
  fields: {
    decision_maker_name: "Decision maker",
    position: "Position",
    cell_phone: "Cell phone",
    email: "Email",
    brokerage_name: "Brokerage",
    brokerage_website: "Brokerage website",
    brokerage_address: "Brokerage address",
    office_phone: "Office phone",
    latitude: "Latitude",
    longitude: "Longitude",
    country: "Country",
    market: "Market / anchor town",
    status: "Status",
    notes: "Notes",
  },
  sorts: {
    created_at: "Date added",
    decision_maker_name: "Decision maker",
    brokerage_name: "Brokerage",
    status: "Status",
    market: "Market",
    country: "Country",
  },
  dir: {
    desc: "Newest / Z–A",
    asc: "Oldest / A–Z",
  },
  importTitle: "Upload a CSV",
  importSubtitle: "Map the columns, fix any row the preview flags, then import. Each new lead is yours.",
  chooseFile: "Choose CSV",
  noFile: "No file chosen",
  mapping: "Column mapping",
  ignoreColumn: "Ignore",
  preview: "Preview",
  row: "Row",
  ready: "Ready",
  error: "Error",
  duplicate: "Duplicate",
  importSelected: "Import {count} leads",
  importing: "Importing…",
  imported: "Imported {count}. Skipped {skipped}.",
  nothingToImport: "Nothing to import. Fix the flagged rows or choose a different file.",
  tooMany: "This file has more than {max} data rows. Split it and upload again.",
  emptyFile: "That file has no data rows.",
  unmapped: "Map decision maker, position, brokerage and country before importing.",
  dupEmail: "Same email as {label}",
  dupPhone: "Same phone as {label}",
  dupName: "Same brokerage and name as {label}",
  inFile: "earlier in this file",
  include: "Import",
  historyCreate: "Created",
  historyUpdate: "Edited",
  historyImport: "Imported",
  by: "by {name}",
  exportEmpty: "Nothing to export for these filters.",
  unauthorized: "You do not have access to leads.",
  notFound: "That lead was not found.",
  deleteDenied: "Only a superadmin can delete a lead.",
  editDenied: "You can view this lead, but only its owner can edit it.",
  genericError: "Something went wrong. Please try again.",
  columns: {
    person: "Decision maker",
    brokerage: "Brokerage",
    contact: "Contact",
    place: "Market",
    status: "Status",
    agent: "Agent",
    actions: "Actions",
  },
} as const;

const de: Localized<typeof en> = {
  nav: "Leads (CRM)",
  dashboardKicker: "Leads",
  dashboardTitle: "Makler-Leads",
  dashboardText: "Erfassen Sie die Maklerbüros, die Sie ansprechen, oder laden Sie die CSV von heute hoch.",
  kicker: "Leads (CRM)",
  listTitle: "Makler-Leads",
  listSubtitleMine: "Ihre Kontakte. Die Leads aller Agenten können Sie schreibgeschützt öffnen, um Dubletten zu prüfen.",
  listSubtitleAllAgent: "Leads aller Agenten. Sie können nur die Einträge bearbeiten, die Sie selbst angelegt haben.",
  listSubtitleAdmin: "Makler-Leads aller Agenten. Sie können jeden Eintrag bearbeiten und sind die einzige Person, die löschen darf.",
  mine: "Meine",
  all: "Alle Agenten",
  add: "Lead hinzufügen",
  import: "CSV hochladen",
  export: "CSV exportieren",
  template: "CSV-Vorlage",
  search: "Suche",
  searchPlaceholder: "Name, Büro, E-Mail, Telefon, Markt",
  status: "Status",
  country: "Land",
  market: "Markt",
  agent: "Agent",
  any: "Alle",
  sort: "Sortierung",
  apply: "Anwenden",
  reset: "Zurücksetzen",
  empty: "Keine Leads für diese Filter.",
  emptyMine: "Sie haben noch keinen Lead. Fügen Sie einen hinzu oder laden Sie eine CSV hoch.",
  emptyAll: "Noch keine Makler-Leads.",
  results: "{from}–{to} von {total}",
  resultsEmpty: "0 Leads",
  prev: "Zurück",
  next: "Weiter",
  edit: "Bearbeiten",
  view: "Ansehen",
  readOnly: "Schreibgeschützt",
  delete: "Löschen",
  deleteTitle: "Diesen Lead löschen?",
  deleteBody: "Der Lead und sein Bearbeitungsverlauf werden entfernt. Das Aktivitätsprotokoll behält, wer gelöscht hat. Das kann nicht rückgängig gemacht werden.",
  deleteConfirm: "Lead löschen",
  cancel: "Abbrechen",
  deleting: "Wird gelöscht…",
  saved: "Gespeichert.",
  created: "Lead hinzugefügt.",
  save: "Lead speichern",
  saving: "Wird gespeichert…",
  back: "Zurück zu den Leads",
  newTitle: "Lead hinzufügen",
  newSubtitle: "Der Lead wird Ihnen zugeordnet.",
  editTitle: "Lead bearbeiten",
  viewTitle: "Lead",
  viewSubtitle: "Sie können diesen Lead lesen. Nur der Agent, der ihn angelegt hat, oder ein Superadmin kann ihn ändern.",
  history: "Bearbeitungsverlauf",
  historyEmpty: "Noch keine Bearbeitungen.",
  addedBy: "Angelegt von {name}",
  updated: "Aktualisiert {when}",
  required: "Pflicht",
  optional: "Optional",
  latLngHint: "Lassen Sie beide Felder leer, wenn Sie keine Koordinate haben.",
  notesPlaceholder: "Was Sie besprochen haben, was gefragt wurde, wann Sie nachfassen.",
  positions: {
    broker: "Broker",
    acting_broker: "Acting Broker",
    managing_broker: "Managing Broker",
    team_leader: "Teamleiter",
  },
  statuses: {
    new: "Neu",
    contacted: "Kontaktiert",
    replied: "Antwort erhalten",
    registered: "Registriert",
    not_interested: "Kein Interesse",
  },
  countries: {
    Canada: "Kanada",
    USA: "USA",
  },
  fields: {
    decision_maker_name: "Entscheider",
    position: "Position",
    cell_phone: "Mobiltelefon",
    email: "E-Mail",
    brokerage_name: "Maklerbüro",
    brokerage_website: "Website des Büros",
    brokerage_address: "Adresse des Büros",
    office_phone: "Bürotelefon",
    latitude: "Breitengrad",
    longitude: "Längengrad",
    country: "Land",
    market: "Markt / Ankerort",
    status: "Status",
    notes: "Notizen",
  },
  sorts: {
    created_at: "Datum",
    decision_maker_name: "Entscheider",
    brokerage_name: "Maklerbüro",
    status: "Status",
    market: "Markt",
    country: "Land",
  },
  dir: {
    desc: "Neueste / Z–A",
    asc: "Älteste / A–Z",
  },
  importTitle: "CSV hochladen",
  importSubtitle: "Ordnen Sie die Spalten zu, korrigieren Sie markierte Zeilen und importieren Sie dann. Jeder neue Lead gehört Ihnen.",
  chooseFile: "CSV wählen",
  noFile: "Keine Datei gewählt",
  mapping: "Spaltenzuordnung",
  ignoreColumn: "Ignorieren",
  preview: "Vorschau",
  row: "Zeile",
  ready: "Bereit",
  error: "Fehler",
  duplicate: "Dublett",
  importSelected: "{count} Leads importieren",
  importing: "Wird importiert…",
  imported: "{count} importiert. {skipped} übersprungen.",
  nothingToImport: "Nichts zu importieren. Korrigieren Sie die markierten Zeilen oder wählen Sie eine andere Datei.",
  tooMany: "Diese Datei hat mehr als {max} Datenzeilen. Teilen Sie sie und laden Sie erneut hoch.",
  emptyFile: "Diese Datei hat keine Datenzeilen.",
  unmapped: "Ordnen Sie Entscheider, Position, Maklerbüro und Land zu, bevor Sie importieren.",
  dupEmail: "Gleiche E-Mail wie {label}",
  dupPhone: "Gleiches Telefon wie {label}",
  dupName: "Gleiches Büro und gleicher Name wie {label}",
  inFile: "früher in dieser Datei",
  include: "Import",
  historyCreate: "Angelegt",
  historyUpdate: "Bearbeitet",
  historyImport: "Importiert",
  by: "von {name}",
  exportEmpty: "Für diese Filter gibt es nichts zu exportieren.",
  unauthorized: "Sie haben keinen Zugang zu den Leads.",
  notFound: "Dieser Lead wurde nicht gefunden.",
  deleteDenied: "Nur ein Superadmin kann einen Lead löschen.",
  editDenied: "Sie können diesen Lead ansehen, aber nur der Eigentümer kann ihn bearbeiten.",
  genericError: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
  columns: {
    person: "Entscheider",
    brokerage: "Maklerbüro",
    contact: "Kontakt",
    place: "Markt",
    status: "Status",
    agent: "Agent",
    actions: "Aktionen",
  },
};

export type CrmCopy = Localized<typeof en>;

const COPY: Record<Locale, CrmCopy> = { en, de };

export function crmCopy(locale: Locale): CrmCopy {
  return COPY[locale] ?? COPY.en;
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function issueText(copy: CrmCopy, issue: LeadIssue): string {
  switch (issue.code) {
    case "required":
      return `${copy.fields[issue.field]}: ${copy.required}`;
    case "email":
      return copy.fields.email;
    case "phone":
      return copy.fields[issue.field];
    case "position":
      return copy.fields.position;
    case "country":
      return copy.fields.country;
    case "status":
      return copy.fields.status;
    case "latlng":
      return `${copy.fields.latitude} / ${copy.fields.longitude}`;
    case "website":
      return copy.fields.brokerage_website;
    case "too_long":
      return copy.fields[issue.field];
    default:
      return copy.genericError;
  }
}

export function positionLabel(copy: CrmCopy, position: LeadPosition): string {
  return copy.positions[position];
}

export function statusLabel(copy: CrmCopy, status: LeadStatus): string {
  return copy.statuses[status];
}

export function countryLabel(copy: CrmCopy, country: LeadCountry): string {
  return copy.countries[country];
}
