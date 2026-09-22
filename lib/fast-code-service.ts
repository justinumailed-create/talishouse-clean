export {
  formatFastCode,
  generateFastCode,
  generateFastCodeResult,
  getNextFastCodeSequence,
  type GenerateFastCodeInput,
  type GenerateFastCodeResult,
} from "@/services/fast-code.service";

export {
  extractInitials,
  givenNameInitials,
  normalizeNamePart,
  splitPersonName,
  validateAndNormalizeFastCodeInput,
  validateNamePart,
  FastCodeValidationError,
  type NormalizedFastCodeNameInput,
} from "@/validators/fast-code.validator";
