export type AdproCategoryCode = "ssp" | "psp" | "2sp" | "asp";

export interface AdproCategoryOption {
  code: AdproCategoryCode;
  label: string;
  title: string;
}

export const ADPRO_CATEGORY_OPTIONS: readonly AdproCategoryOption[] = [
  {
    code: "ssp",
    label: "Source Service Provider (SSP)",
    title: "Source Service Provider",
  },
  {
    code: "psp",
    label: "Primary Service Provider (PSP)",
    title: "Primary Service Provider",
  },
  {
    code: "2sp",
    label: "Secondary Service Provider (2SP)",
    title: "Secondary Service Provider",
  },
  {
    code: "asp",
    label: "Ancillary Service Provider (ASP)",
    title: "Ancillary Service Provider",
  },
] as const;

const ADPRO_CATEGORY_CODE_SET = new Set<AdproCategoryCode>(
  ADPRO_CATEGORY_OPTIONS.map((option) => option.code)
);

export function normalizeAdproCategoryCode(
  value: string | null | undefined
): AdproCategoryCode | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase() as AdproCategoryCode;
  return ADPRO_CATEGORY_CODE_SET.has(normalized) ? normalized : null;
}

export function adproCategoryLabel(
  value: string | null | undefined
): string | null {
  const code = normalizeAdproCategoryCode(value);
  if (!code) return null;
  return (
    ADPRO_CATEGORY_OPTIONS.find((option) => option.code === code)?.label ?? null
  );
}
