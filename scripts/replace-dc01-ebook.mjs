/**
 * One-shot: rasterize Downloads/DC01 (3).pdf and create the restored DC01 ebook.
 * Usage: node scripts/replace-dc01-ebook.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { createRequire } from "module";
import { pathToFileURL } from "url";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const { createCanvas } = require("@napi-rs/canvas");

const PDF_PATH = "/Users/arunrachuri/Downloads/DC01 (3).pdf";
const MAPSITE_ID = "dc6e1cce-ed17-47ff-a513-7d9a192f4676";
const FAST = "dc01";
const OUT_DIR = "/tmp/dc01-pages";
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

const frontCover = uploaded[0];
const backCover = uploaded[uploaded.length - 1];

const payload = {
  fastCode: FAST,
  mapsiteId: MAPSITE_ID,
  accountType: "root",
  title: "Grand River Falls Road, Nova Scotia, Canada",
  description: "DC01 Talisbook™ — Grand River Falls",
  location: "Grand River Falls",
  optimizedImages: uploaded,
  uploadMode: "pdf",
  frontCover,
  backCover,
  asAdmin: true,
  agentName: "Aisha C.",
};

writeFileSync("/tmp/dc01-ebook-payload.json", JSON.stringify(payload, null, 2));
console.log("wrote payload /tmp/dc01-ebook-payload.json");
console.log(JSON.stringify({ pages: uploaded.length, front: frontCover.url.slice(-40), back: backCover.url.slice(-40) }, null, 2));
