import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CHROME = ["/usr/local/bin/google-chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(
  (path) => existsSync(path),
);

/**
 * The real embed host is position:fixed and the size of the viewport.
 * This fixture mounts that host over ordinary homepage links and drives
 * Chrome the way a visitor would: click the nav and the account CTAs.
 */
function fixtureHtml(): string {
  const css = readFileSync(resolve("app/globals.css"), "utf8");
  const slot = css.match(/\/\* Aisha sits[\s\S]*?@media \(min-width: 1024px\) \{[\s\S]*?\n\}/)?.[0] ?? "";
  if (!slot.includes("pointer-events: none !important")) {
    throw new Error("Aisha host CSS is missing pointer-events: none");
  }
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; font-family: sans-serif; }
    header { position: sticky; top: 0; z-index: 40; display: flex; gap: 12px; padding: 12px; background: #046bd2; }
    a, button.cta { color: white; background: transparent; border: 0; font: inherit; min-height: 44px; }
    main { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
    .cta { color: #046bd2; border: 2px solid #046bd2; background: white; padding: 12px; }
    ${slot}
  </style>
</head>
<body>
  <header>
    <a id="home" href="#home">Home</a>
    <a id="mapsites" href="#mapsites">Mapsites</a>
    <a id="register" href="#register">Register</a>
  </header>
  <main>
    <button class="cta" id="account" type="button">Open your Account</button>
    <a class="cta" id="claim" href="#claim">Claim Mapsite</a>
  </main>
  <div class="aisha-convai-slot" data-testid="aisha-convai">
    <button type="button" class="aisha-convai-label" data-start-label="Start a call">
      Hi, I'm Aisha. I can help make your advertising revenue producing
    </button>
    <elevenlabs-convai></elevenlabs-convai>
  </div>
  <script>
    customElements.define("elevenlabs-convai", class extends HTMLElement {
      constructor() {
        super();
        this.style.position = "fixed";
        this.style.inset = "0";
        this.style.width = "100vw";
        this.style.height = "100vh";
        this.style.zIndex = "50";
        const root = this.attachShadow({ mode: "open" });
        root.innerHTML = '<style>button{position:fixed;left:88px;bottom:24px;width:122px;height:36px;pointer-events:auto}</style><button type="button">Start a call</button>';
        root.querySelector("button").addEventListener("click", () => {
          document.body.dataset.started = "1";
        });
      }
    });
    document.querySelector(".aisha-convai-label").addEventListener("click", (event) => {
      const widget = event.currentTarget.closest("[data-testid='aisha-convai']").querySelector("elevenlabs-convai");
      const wanted = event.currentTarget.dataset.startLabel.trim().toLowerCase();
      const buttons = [...widget.shadowRoot.querySelectorAll("button")];
      const match = buttons.find((button) => button.textContent.trim().toLowerCase() === wanted);
      (match || buttons[0]).click();
    });
    for (const id of ["account"]) {
      document.getElementById(id).addEventListener("click", () => {
        document.body.dataset.clicked = id;
      });
    }
  </script>
</body>
</html>`;
}

describe("homepage stays clickable with Aisha mounted", () => {
  it.skipIf(!CHROME)(
    "clicks nav links and CTAs through the full-viewport widget host",
    async () => {
      const { chromium } = await import("playwright-core");
      const dir = mkdtempSync(join(tmpdir(), "aisha-clicks-"));
      const file = join(dir, "home.html");
      writeFileSync(file, fixtureHtml());
      const browser = await chromium.launch({
        executablePath: CHROME,
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });
      try {
        for (const viewport of [
          { width: 1280, height: 900 },
          { width: 390, height: 844 },
        ]) {
          const page = await browser.newPage({ viewport });
          await page.goto(`file://${file}`);
          await page.waitForSelector("elevenlabs-convai");
          const blocked = await page.evaluate((size) => {
            const host = document.querySelector("elevenlabs-convai");
            const box = host.getBoundingClientRect();
            const mid = document.elementFromPoint(Math.round(size.width / 2), 180);
            return {
              hostFillsViewport: box.width >= size.width - 1 && box.height > 400,
              mid: mid && mid.tagName,
            };
          }, viewport);
          expect(blocked.hostFillsViewport).toBe(true);
          expect(blocked.mid).not.toBe("ELEVENLABS-CONVAI");

          await page.click("#mapsites");
          expect(page.url()).toContain("#mapsites");
          await page.click("#register");
          expect(page.url()).toContain("#register");
          await page.click("#home");
          expect(page.url()).toContain("#home");
          await page.click("#claim");
          expect(page.url()).toContain("#claim");
          await page.click("#account");
          expect(await page.evaluate(() => document.body.dataset.clicked)).toBe("account");

          const launcher = page.locator("elevenlabs-convai");
          const start = await launcher.evaluate((el) => {
            const button = el.shadowRoot.querySelector("button");
            const rect = button.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          });
          await page.mouse.click(start.x, start.y);
          expect(await page.evaluate(() => document.body.dataset.started)).toBe("1");
          await page.evaluate(() => {
            delete document.body.dataset.started;
          });
          await page.click(".aisha-convai-label");
          expect(await page.evaluate(() => document.body.dataset.started)).toBe("1");
          await page.close();
        }
      } finally {
        await browser.close();
      }
    },
    30000,
  );
});
