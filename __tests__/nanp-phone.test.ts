import { describe, expect, it } from "vitest";
import {
  formatNanpPhone,
  formatNanpPhoneInput,
  isValidNanpPhone,
  parseNanpPhone,
} from "../lib/talispros/nanp-phone";

describe("NANP phone validation", () => {
  it.each([
    "(555) 555-5555",
    "555-555-5555",
    "555.555.5555",
    "5555555555",
    "+1 555 555 5555",
    "+15555555555",
    "1 555 555 5555",
    "1-555-555-5555",
    "+1 (212) 456-7890",
  ])("accepts %s", (input) => {
    expect(isValidNanpPhone(input)).toBe(true);
  });

  it.each([
    "",
    "555-5555",
    "555-555-555",
    "555-555-55555",
    "(155) 555-5555", // area code starts with 1
    "(055) 555-5555", // area code starts with 0
    "(555) 155-5555", // exchange starts with 1
    "(555) 055-5555", // exchange starts with 0
    "+44 20 7946 0958",
    "+2 555 555 5555",
    "2 555 555 5555",
    "555-555-5555 ext 12",
    "555-555-555a",
    "555+555-5555",
  ])("rejects %s", (input) => {
    expect(isValidNanpPhone(input)).toBe(false);
  });

  it("normalizes to the 10-digit national number and display format", () => {
    expect(parseNanpPhone("+1 (555) 555-5555")).toBe("5555555555");
    expect(formatNanpPhone("555.555.5555")).toBe("+1 (555) 555-5555");
    expect(formatNanpPhone("123-456-7890")).toBeNull();
  });

  it("auto-formats as the user types", () => {
    expect(formatNanpPhoneInput("5")).toBe("(5");
    expect(formatNanpPhoneInput("5555")).toBe("(555) 5");
    expect(formatNanpPhoneInput("5555555555")).toBe("(555) 555-5555");
    expect(formatNanpPhoneInput("55555555559999")).toBe("(555) 555-5555");
    expect(formatNanpPhoneInput("+1 5555555555")).toBe("+1 (555) 555-5555");
    expect(formatNanpPhoneInput("15555555555")).toBe("1 (555) 555-5555");
    expect(formatNanpPhoneInput("")).toBe("");
    expect(formatNanpPhoneInput("+")).toBe("+");
    expect(formatNanpPhoneInput("+1 ")).toBe("+1");
    expect(formatNanpPhoneInput("(")).toBe("");
    // Formatted output still validates.
    expect(isValidNanpPhone(formatNanpPhoneInput("+1 5555555555"))).toBe(true);
  });
});
