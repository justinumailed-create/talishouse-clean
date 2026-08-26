import { readFile } from "node:fs/promises";
import path from "node:path";

/** Node runtime — serve the static WhatsApp / Open Graph JPEG. */
export const runtime = "nodejs";

export async function GET() {
  const filePath = path.join(process.cwd(), "public/seo/talispros-og.jpg");
  const file = await readFile(filePath);
  return new Response(file, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
