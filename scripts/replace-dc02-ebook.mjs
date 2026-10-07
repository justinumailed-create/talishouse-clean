/**
 * One-shot: rasterize Downloads/DC02.pdf and replace the DC02 Mapsite ebook.
 * Usage: node scripts/replace-dc02-ebook.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { createRequire } from "module";
import { pathToFileURL } from "url";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const { createCanvas } = require("@napi-rs/canvas");

const PDF_PATH = "/Users/arunrachuri/Downloads/DC02.pdf";
const MAPSITE_ID = "8d240ff7-ad84-48c5-8915-d511ff48d805";
const REPLACE_BOOK_ID = "c51b5dbd-ab80-48bc-b1f9-44a25fb5f463";
const FAST = "dc02";
const OUT_DIR = "/tmp/dc02-pages";
const MAX_PAGES = 16;

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

mkdirSync(OUT_DIR, { recursive: true });

console.log("loading pdfjs…");
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const workerPath = path.resolve("node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

const data = new Uint8Array(readFileSync(PDF_PATH));
console.log("pdf bytes", data.byteLength);
const doc = await pdfjs.getDocument({
  data,
  useSystemFonts: true,
  isEvalSupported: false,
  useWorkerFetch: false,
}).promise;
const pageCount = Math.min(doc.numPages, MAX_PAGES);
console.log("pages", doc.numPages, "using", pageCount);

const pageFiles = [];
for (let i = 1; i <= pageCount; i++) {
  const page = await doc.getPage(i);
  const unscaled = page.getViewport({ scale: 1 });
  // Target ~1600px on the long edge
  const scale = 1600 / Math.max(unscaled.width, unscaled.height);
  const viewport = page.getViewport({ scale: Math.min(2.0, Math.max(0.8, scale)) });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  const png = canvas.toBuffer("image/png");
  const jpgPath = path.join(OUT_DIR, `page-${String(i).padStart(2, "0")}.jpg`);
  await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(jpgPath);
  const meta = await sharp(jpgPath).metadata();
  pageFiles.push({ path: jpgPath, width: meta.width, height: meta.height, index: i });
  console.log("rasterized", i, meta.width, "x", meta.height, "→", jpgPath);
}

async function uploadAsset(filePath, name) {
  const buf = readFileSync(filePath);
  const storagePath = `auto-draft/${FAST}/${Date.now()}-${name}`;
  const { error } = await supabase.storage
    .from("talisbooks-assets")
    .upload(storagePath, buf, { contentType: "image/jpeg", upsert: true, cacheControl: "3600" });
  if (error) throw new Error(`upload ${name}: ${error.message}`);
  const { data } = supabase.storage.from("talisbooks-assets").getPublicUrl(storagePath);
  return data.publicUrl;
}

console.log("uploading", pageFiles.length, "pages…");
const uploaded = [];
for (const page of pageFiles) {
  const url = await uploadAsset(page.path, `p${page.index}.jpg`);
  uploaded.push({
    url,
    width: page.width,
    height: page.height,
    contentType: "image/jpeg",
  });
  console.log("uploaded", page.index, url.slice(-50));
}

// Page 1 of exact-PDF mode is wrap cover (back|front). Existing DC01 ingest
// used explicitCovers with separate front/back. For exactPdfPages, first page
// is wrap; interiors follow. Match prior metadata.exactPdfPages=true pattern:
// frontCover = first page right half conceptually — the pipeline with
// uploadMode pdf + frontCover/backCover expects split covers.
// Simpler: pass all as optimizedImages and set frontCover=page[0], backCover=page[0]
// when exact — looking at prior book: gallery has 16 images + separate covers.
// Prior source self-service-pdf with explicitCovers and exactPdfPages.
// Use first page as front, last as back, middle as interiors — OR all pages as
// optimizedImages with front=first back=last for exact PDF mode.

const frontCover = uploaded[0];
const backCover = uploaded[uploaded.length - 1];
const interiors = uploaded.slice(0, uploaded.length); // all pages including covers for exact pdf

const payload = {
  fastCode: FAST,
  mapsiteId: MAPSITE_ID,
  accountType: "root",
  title: "Grand River Falls Road, Nova Scotia, Canada",
  description: "DC02 Talisbook™ — Grand River Falls",
  location: "Grand River Falls",
  optimizedImages: interiors,
  uploadMode: "pdf",
  frontCover,
  backCover,
  replaceBookId: REPLACE_BOOK_ID,
  asAdmin: true,
  agentName: "Aisha C.",
};

writeFileSync("/tmp/dc02-ebook-payload.json", JSON.stringify({
  ...payload,
  optimizedImages: payload.optimizedImages.map((a) => ({ ...a, url: a.url })),
}, null, 2));
console.log("wrote payload /tmp/dc02-ebook-payload.json");
console.log("NEXT: run tsx/node importer that calls generateSelfServiceEbook");
console.log(JSON.stringify({ pages: uploaded.length, front: frontCover.url.slice(-40), back: backCover.url.slice(-40) }, null, 2));
