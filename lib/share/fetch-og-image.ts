import { readFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 12_000_000;

function isFetchableOgUrl(url: URL): boolean {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0" ||
    host === "::1"
  ) {
    return false;
  }
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
  return true;
}

export async function fetchOgImageBuffer(url: string): Promise<Buffer | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/")) {
    const relative = trimmed.replace(/^\/+/, "");
    if (!relative || relative.includes("..")) return null;
    try {
      return await readFile(path.join(process.cwd(), "public", relative));
    } catch {
      return null;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (!isFetchableOgUrl(parsed)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(parsed, {
      signal: controller.signal,
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*" },
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() || "";
    if (type && !type.startsWith("image/")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 32 || bytes.length > MAX_BYTES) return null;
    return bytes;
  } catch (error) {
    console.warn(
      "[og] image fetch failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}
