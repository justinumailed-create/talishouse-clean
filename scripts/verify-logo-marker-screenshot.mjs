/**
 * Renders the Modular Spaces tree logo marker and screenshots it with Playwright
 * to confirm the trunk base is not clipped (object-fit: contain).
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
  const logoData = `data:image/png;base64,${logoBuf.toString("base64")}`;
  const htmlMarker = data.html.replaceAll(data.logoPath, logoData);

  const pageHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  html,body{margin:0;background:#5a7d4a;display:flex;align-items:center;justify-content:center;min-height:100vh;}
  ${data.pinCss}
  .stage{transform:scale(4);transform-origin:center center;}
</style>
</head>
<body><div class="stage" data-testid="logo-marker-stage">${htmlMarker}</div></body></html>`;

  const htmlPath = resolve(outDir, "marker.html");
  writeFileSync(htmlPath, pageHtml);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 480, height: 480 } });
  await page.goto("file://" + htmlPath, { waitUntil: "load" });
  await page.waitForTimeout(300);
  const shotPath = resolve(outDir, "logo-marker.png");
  await page.screenshot({ path: shotPath, type: "png" });
  await browser.close();

  const sharp = (await import("sharp")).default;
  const { data: rgba, info } = await sharp(shotPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let darkCount = 0;
  const x0 = Math.floor(w * 0.45);
  const x1 = Math.floor(w * 0.55);
  const y0 = Math.floor(h * 0.55);
  const y1 = Math.floor(h * 0.8);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      if (rgba[i + 3] > 200 && rgba[i] + rgba[i + 1] + rgba[i + 2] < 120) darkCount++;
    }
  }
  console.log(JSON.stringify({ shotPath, htmlPath, darkTrunkSamples: darkCount, trunkVisible: darkCount > 30 }));
  if (darkCount <= 30) {
    console.error("FAIL: trunk base not detected");
    process.exit(2);
  }
  console.error("OK: trunk base visible in screenshot");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
