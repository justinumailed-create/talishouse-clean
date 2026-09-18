import { shouldKeepPlatformDemoMapSite } from "@/lib/talispros/demo-mapsite";

export function issuedFastCodeKey(code: string | null | undefined): string {
  return (code ?? "").trim().toLowerCase();
}

export function shouldDeleteMapSiteMissingFastCode(input: {
  mapsiteId: string;
  fastCode: string | null | undefined;
  issuedFastCodes: Iterable<string>;
}): boolean {
  if (
    shouldKeepPlatformDemoMapSite({
      mapsiteId: input.mapsiteId,
      fastCode: input.fastCode,
    })
  ) {
    return false;
  }
  const code = issuedFastCodeKey(input.fastCode);
  if (!code) return true;
  const issued = new Set(
    [...input.issuedFastCodes].map((value) => issuedFastCodeKey(value)).filter(Boolean),
  );
  return !issued.has(code);
}

export function shouldDeleteBookshelfMissingFastCode(input: {
  fastCode: string | null | undefined;
  isPinned?: boolean | null;
  issuedFastCodes: Iterable<string>;
}): boolean {
  if (input.isPinned) return false;
  const code = issuedFastCodeKey(input.fastCode);
  if (!code) return false;
  const issued = new Set(
    [...input.issuedFastCodes].map((value) => issuedFastCodeKey(value)).filter(Boolean),
  );
  return !issued.has(code);
}
