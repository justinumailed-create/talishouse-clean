import { headers } from "next/headers";
import type { GenerateFastCodeInput, GenerateFastCodeResult } from "@/services/fast-code.service";

export class FastCodeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "FastCodeApiError";
  }
}

async function resolveBaseUrl(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export async function requestFastCodeGeneration(
  input: GenerateFastCodeInput
): Promise<GenerateFastCodeResult> {
  const baseUrl = await resolveBaseUrl();
  const response = await fetch(`${baseUrl}/api/fast-code/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const payload = (await response.json()) as GenerateFastCodeResult & {
    error?: string;
  };

  if (!response.ok) {
    throw new FastCodeApiError(
      payload.error || "Failed to generate FAST Code",
      response.status
    );
  }

  if (!payload.fastCode) {
    throw new FastCodeApiError("FAST Code API returned an empty response", 500);
  }

  return { fastCode: payload.fastCode };
}
