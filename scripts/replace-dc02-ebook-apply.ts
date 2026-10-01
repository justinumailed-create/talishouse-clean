import { readFileSync } from "node:fs";
import { generateSelfServiceEbook } from "../lib/talisbooks/self-service-ebook";
import { getSupabaseAdmin } from "../lib/supabaseAdmin";

const payload = JSON.parse(readFileSync("/tmp/dc02-ebook-payload.json", "utf8"));

async function main() {
  console.log("generating ebook for", payload.fastCode, "replace", payload.replaceBookId);
  const result = await generateSelfServiceEbook({
    fastCode: payload.fastCode,
    mapsiteId: payload.mapsiteId,
    accountType: payload.accountType,
    title: payload.title,
    description: payload.description,
    location: payload.location,
    optimizedImages: payload.optimizedImages,
    uploadMode: "pdf",
    // Landscape PDF pages — omit portrait front/back so exact-PDF path accepts them.
    replaceBookId: payload.replaceBookId,
    asAdmin: true,
    agentName: payload.agentName,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.success) {
    process.exit(1);
  }

  const supabase = getSupabaseAdmin();
  const tebUrl = result.viewerUrl.startsWith("/")
    ? result.viewerUrl
    : `/talisbooks/viewer/${result.slug}`;
  const cover = payload.optimizedImages[0].url;
  const gallery = payload.optimizedImages.slice(1, 12).map((a: { url: string }) => a.url);

  const { error } = await supabase
    .from("mapsites")
    .update({
      fast_code: "dc02",
      teb_url: tebUrl,
      cover_image: cover,
      header_image_url: cover,
      gallery_images: gallery,
      broker_url: "https://talispros.mysamcart.com/checkout/register",
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.mapsiteId);
  if (error) {
    console.error("mapsite update failed", error.message);
    process.exit(1);
  }
  console.log("mapsite teb_url →", tebUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
