import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export function generateUrlGatePin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function urlGatePepper(): string {
  return (
    process.env.MAPSITE_URL_PIN_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "talispros-url-gate"
  );
}

export function hashUrlGatePin(fastCode: string, pin: string): string {
  const code = fastCode.trim().toLowerCase();
  return createHash("sha256")
    .update(`${urlGatePepper()}:${code}:${pin}`)
    .digest("hex");
}

export function urlGatePinsMatch(
  fastCode: string,
  pin: string,
  storedHash: string,
): boolean {
  const actual = Buffer.from(hashUrlGatePin(fastCode, pin), "utf8");
  const expected = Buffer.from(storedHash, "utf8");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
