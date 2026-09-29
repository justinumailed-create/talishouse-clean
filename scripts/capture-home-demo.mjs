/**
 * Capture live homepage demo-flow screenshots from production.
 *
 * Usage (from repo root):
 *   npm install puppeteer-core --no-save
 *   node scripts/capture-home-demo.mjs
 *   # then recompress with sharp if desired
 *
 * Sources:
 *   1) https://www.talispros.com/talisu/mkts          → Talismaps™ Markets
 *   2) https://www.talispros.com/catalogue/bookshelf → Talisbooks™ Bookshelf
 *   3) https://www.talispros.com/talispros/mapsite/brokers/rm22 → claimed Mapsite™
 */
import puppeteer from "puppeteer-core";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.join(root, "public/assets/home-demo");
fs.mkdirSync(OUT, { recursive: true });

const shots = [
  {
    url: "https://www.talispros.com/talisu/mkts",
    file: "01-talismaps-mkts.png",
    waitMs: 8000,
    waitSel: "canvas, .maplibregl-canvas, [class*='map']",
  },
  {
    url: "https://www.talispros.com/catalogue/bookshelf",
    file: "02-talisbooks-bookshelf.png",
    waitMs: 6000,
    waitSel: "main, [class*='shelf'], [class*='book']",
  },
  {
    url: "https://www.talispros.com/talispros/mapsite/brokers/rm22",
    file: "03-claimed-mapsite-rm22.png",
    waitMs: 10000,
    waitSel: "canvas, .maplibregl-canvas, main, body",
  },
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    "--hide-scrollbars",
    "--window-size=1440,900",
    "--force-device-scale-factor=1",
  ],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});

for (const shot of shots) {
  const page = await browser.newPage();
  console.log("navigating", shot.url);
  try {
    await page.goto(shot.url, { waitUntil: "networkidle2", timeout: 90000 });
  } catch (e) {
    console.warn("goto warning", e.message);
  }
  try {
    await page.waitForSelector(shot.waitSel, { timeout: 15000 });
  } catch {
    console.warn("selector wait missed", shot.waitSel);
  }
  await new Promise((r) => setTimeout(r, shot.waitMs));
  const out = path.join(OUT, shot.file);
  await page.screenshot({ path: out, type: "png", fullPage: false });
  console.log("wrote", out, fs.statSync(out).size);
  await page.close();
}

await browser.close();
console.log("done — convert PNGs to JPEG with sharp before committing");
