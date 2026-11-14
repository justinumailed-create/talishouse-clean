export type RalfBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "letters"; items: string[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "numbers"; items: string[] }
  | { kind: "lines"; items: string[] };

export type RalfLegalDocument = {
  testId: "terms-page" | "privacy-page";
  coverKicker: string;
  coverDate: string;
  coverTitle: string;
  blocks: RalfBlock[];
};
