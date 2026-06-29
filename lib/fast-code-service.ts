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
  normalizeNamePart,
  validateAndNormalizeFastCodeInput,
  validateNamePart,
  FastCodeValidationError,
  type NormalizedFastCodeNameInput,
} from "@/validators/fast-code.validator";
