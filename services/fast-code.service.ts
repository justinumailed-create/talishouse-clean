import { findFastCodesByPrefix } from "@/repositories/fast-code.repository";
import {
  extractInitials,
  validateAndNormalizeFastCodeInput,
} from "@/validators/fast-code.validator";

export interface GenerateFastCodeInput {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}

export interface GenerateFastCodeResult {
  fastCode: string;
}

const MAX_SEQUENCE = 99;

export function formatFastCode(prefix: string, sequence: number): string {
  if (sequence < 1 || sequence > MAX_SEQUENCE) {
    throw new Error(
      `FAST Code sequence must be between 1 and ${MAX_SEQUENCE}, got ${sequence}`
    );
  }

  return `${prefix}${String(sequence).padStart(2, "0")}`;
}

export function getNextFastCodeSequence(
  prefix: string,
  existingCodes: string[]
): number {
  const normalizedPrefix = prefix.toLowerCase();
  const pattern = new RegExp(
    `^${normalizedPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d{2})$`
  );

  let maxSequence = 0;

  for (const code of existingCodes) {
    const match = code.toLowerCase().match(pattern);
    if (!match) continue;
    const sequence = Number.parseInt(match[1], 10);
    if (sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  const nextSequence = maxSequence + 1;
  if (nextSequence > MAX_SEQUENCE) {
    throw new Error(
      `No available FAST Code sequences remain for prefix "${normalizedPrefix}"`
    );
  }

  return nextSequence;
}

export async function generateFastCode(
  input: GenerateFastCodeInput
): Promise<string> {
  const normalized = validateAndNormalizeFastCodeInput(input);
  const prefix = extractInitials(normalized);

  if (!prefix) {
    throw new Error("Unable to derive FAST Code initials from name");
  }

  const existingCodes = await findFastCodesByPrefix(prefix);
  const sequence = getNextFastCodeSequence(prefix, existingCodes);

  return formatFastCode(prefix, sequence);
}

export async function generateFastCodeResult(
  input: GenerateFastCodeInput
): Promise<GenerateFastCodeResult> {
  const fastCode = await generateFastCode(input);
  return { fastCode };
}
