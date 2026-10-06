import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import { getDictionary } from "../lib/i18n/dictionaries";

type Json = unknown;

/** Walks both trees and reports structural differences (keys, array lengths, types). */
function diffShape(a: Json, b: Json, path = "", out: string[] = []): string[] {
  if (typeof a === "string") {
    if (typeof b !== "string") out.push(`${path}: expected string`);
    else if (b.trim() === "") out.push(`${path}: empty German string`);
    return out;
  }
  if (typeof a !== "object" || a === null) {
    if (a !== b) out.push(`${path}: non-string value differs (${String(a)} vs ${String(b)})`);
    return out;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return out.concat(`${path}: expected array`);
    if (a.length !== b.length) out.push(`${path}: length ${a.length} vs ${b.length}`);
    a.forEach((item, i) => diffShape(item, b[i], `${path}[${i}]`, out));
    return out;
  }
  if (typeof b !== "object" || b === null || Array.isArray(b)) {
    return out.concat(`${path}: expected object`);
  }
  const ak = Object.keys(a as object).sort();
  const bk = Object.keys(b as object).sort();
  for (const k of ak) if (!bk.includes(k)) out.push(`${path}.${k}: missing in DE`);
  for (const k of bk) if (!ak.includes(k)) out.push(`${path}.${k}: extra in DE`);
  for (const k of ak) {
    if (!bk.includes(k)) continue;
    diffShape(
      (a as Record<string, Json>)[k],
      (b as Record<string, Json>)[k],
      `${path}.${k}`,
      out,
    );
  }
  return out;
}

function collect(node: Json, path: string, out: Array<[string, string]>) {
  if (typeof node === "string") out.push([path, node]);
  else if (Array.isArray(node)) node.forEach((n, i) => collect(n, `${path}[${i}]`, out));
  else if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node)) collect(v, `${path}.${k}`, out);
}

describe("i18n dictionary parity (EN ↔ DE)", () => {
  it("German has exactly the English keys, nesting and list lengths", () => {
    expect(diffShape(en, de)).toEqual([]);
  });

  it("keeps stable ids / URLs / labels that are identifiers identical", () => {
    const enStrings: Array<[string, string]> = [];
    const deStrings: Array<[string, string]> = [];
    collect(en, "", enStrings);
    collect(de, "", deStrings);
    const deMap = new Map(deStrings);
    for (const [path, value] of enStrings) {
      if (/\.id$|Url$|Src$|Image$|Href$|\.href$/.test(path)) {
        expect(deMap.get(path), path).toBe(value);
      }
    }
  });

  it("actually translates (most German strings differ from English)", () => {
    const enStrings: Array<[string, string]> = [];
    const deStrings: Array<[string, string]> = [];
    collect(en, "", enStrings);
    collect(de, "", deStrings);
    const deMap = new Map(deStrings);
    const prose = enStrings.filter(([, v]) => v.split(" ").length >= 4);
    const same = prose.filter(([p, v]) => deMap.get(p) === v).map(([p]) => p);
    expect(same).toEqual([]);
  });

  it("keeps trademarks unchanged in German", () => {
    const deStrings: Array<[string, string]> = [];
    collect(de, "", deStrings);
    const all = deStrings.map(([, v]) => v).join("\n");
    for (const mark of ["Talispros™", "Mapsite", "Talisbooks™", "TalisTV™", "FAST Code", "SamCart", "TalisBOT"]) {
      expect(all).toContain(mark);
    }
    expect(all).not.toMatch(/Talisbücher|Kartenseite|SCHNELL-Code/);
  });

  it("falls back to English for unknown locales", () => {
    expect(getDictionary("en")).toBe(en);
    expect(getDictionary("de")).toBe(de);
    expect(getDictionary("fr" as never)).toBe(en);
  });
});
