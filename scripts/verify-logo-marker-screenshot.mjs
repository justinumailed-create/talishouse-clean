/**
 * Renders the Modular Spaces tree logo marker and screenshots it with Playwright
 * (2x) to confirm the full tree fills about 70–80% of the ring's inner
 * diameter and the trunk base is not clipped. Same marker is used on
 * /talisu/mkts and the /start Markets preview.
 * Writes eval under tmp/ (not typechecked by next build).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "tmp/pin-marker-verify");
mkdirSync(outDir, { recursive: true });

async function main() {
  const { chromium } = await import("playwright");

  const evalPath = resolve(outDir, "eval.mts");
  // Paths relative to tmp/pin-marker-verify/
  writeFileSync(
    evalPath,
    `import { renderPinMarkerHtml } from "../../lib/talismaps/pin/render-html.ts";
import { TALISU_MKTS_TREE_LOGO, TALISU_MKTS_DO_MORE_PIN_SIZE } from "../../lib/talisu/markets-pins.ts";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const result = renderPinMarkerHtml({
  pinSize: TALISU_MKTS_DO_MORE_PIN_SIZE,
  whiteCenter: true,
  customLogoUrl: TALISU_MKTS_TREE_LOGO,
  pinBorderColor: "#000000",
  pinColor: "#FFFFFF",
});
const css = readFileSync(resolve("../../app/globals.css"), "utf8");
const start = css.indexOf(".talismaps-pin-icon {");
const end = css.indexOf("@keyframes talismaps-pin-breathe");
const pinCss = css.slice(start, end);
console.log(JSON.stringify({ html: result.html, pinCss, logoPath: TALISU_MKTS_TREE_LOGO }));
`,
  );

  const raw = execFileSync("npx", ["tsx", evalPath], {
    cwd: outDir,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const line = raw.trim().split("\n").filter(Boolean).pop();
  const data = JSON.parse(line);

  const logoBuf = readFileSync(resolve(root, "public" + data.logoPath));
  const mime = data.logoPath.endsWith(".svg") ? "image/svg+xml" : "image/png";
  const logoData = `data:${mime};base64,${logoBuf.toString("base64")}`;
  const htmlMarker = data.html.replaceAll(data.logoPath, logoData);

  const pageHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  html,body{margin:0;background:#5a7d4a;display:flex;align-items:center;justify-content:center;min-height:100vh;}
  ${data.pinCss}
</style>
</head>
<body><div data-testid="logo-marker-stage">${htmlMarker}</div></body></html>`;

  const htmlPath = resolve(outDir, "marker.html");
  writeFileSync(htmlPath, pageHtml);

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({
    viewport: { width: 480, height: 480 },
    // Rasterize the vector logo at 4× so the zoomed shot stays crisp (retina is 2×).
    deviceScaleFactor: 4,
  });
  await page.goto("file://" + htmlPath, { waitUntil: "load" });
  await page.waitForTimeout(300);
  const shotPath = resolve(outDir, "logo-marker.png");
  const marker = page.locator(".talismaps-pin-body");
  await marker.screenshot({ path: shotPath, type: "png" });
  await browser.close();

  const sharp = (await import("sharp")).default;
  const { data: rgba, info } = await sharp(shotPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let darkCount = 0;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  // Tree sits inside the white disk. The thin ring is near 0.34 of the body,
  // so dark pixels closer than 0.30 of the body are the tree (not the ring).
  const treeLimit = Math.min(w, h) * 0.3;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const dark = rgba[i + 3] > 200 && rgba[i] + rgba[i + 1] + rgba[i + 2] < 180;
      if (!dark) continue;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > treeLimit) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      // Trunk base sits in the lower half of the tree, near the vertical center.
      if (y > cy && Math.abs(x - cx) < w * 0.08) darkCount++;
    }
  }
  // Ring inner diameter is ~68% of the body; the tree's long side should
  // occupy about 70–80% of that circle.
  const inner = Math.min(w, h) * (0.34 * 2);
  const heightFill = maxY > minY ? (maxY - minY + 1) / inner : 0;
  console.log(
    JSON.stringify({
      shotPath,
      htmlPath,
      darkTrunkSamples: darkCount,
      trunkVisible: darkCount > 30,
      heightFill: Number(heightFill.toFixed(3)),
      devicePx: { w, h },
    })
  );
  if (darkCount <= 30) {
    console.error("FAIL: trunk base not detected");
    process.exit(2);
  }
  if (heightFill < 0.7 || heightFill > 0.8) {
    console.error(`FAIL: tree height fill ${heightFill.toFixed(3)} is outside 0.70–0.80`);
    process.exit(3);
  }
  console.error("OK: full tree visible, about 70–80% of the ring inner diameter");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
