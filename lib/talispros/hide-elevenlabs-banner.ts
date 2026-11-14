const STYLE_ID = "aisha-hide-powered-by";

/**
 * The public embed paints "Powered by ElevenAgents" inside an open shadow root.
 * override-config replaces the whole widget config and skips the agent fetch,
 * so the line is hidden here instead. Agent settings are left alone.
 */
export const POWERED_BY_BANNER_STYLE = `
p.whitespace-nowrap:has(a[href*="elevenlabs.io"]) {
  display: none !important;
}
button.aisha-call-pill {
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important;
  font-size: 15px !important;
  font-weight: 500 !important;
  letter-spacing: -0.011em !important;
  line-height: 1.2 !important;
  border-radius: 980px !important;
  min-height: 36px !important;
  padding: 6px 16px !important;
  background: #1d1d1f !important;
  color: #f5f5f7 !important;
  border: 0 !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16) !important;
}
`;

const OPEN_LABEL = /^(terms and conditions|end call|anruf beenden)$/i;

function elementIsShown(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  const box = el.getBoundingClientRect();
  return box.width > 8 && box.height > 8;
}

/**
 * True when the embed is showing a panel instead of the collapsed launcher:
 * the terms sheet, an active call, or the chat composer.
 */
export function convaiSurfaceOpen(root: ParentNode): boolean {
  const terms = root.querySelector(".terms");
  if (terms instanceof HTMLElement && elementIsShown(terms)) return true;
  const textarea = root.querySelector("textarea");
  if (textarea instanceof HTMLElement && elementIsShown(textarea)) return true;
  for (const node of root.querySelectorAll("h1, h2, h3, h4, button")) {
    if (!(node instanceof HTMLElement) || !elementIsShown(node)) continue;
    const text = node.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (OPEN_LABEL.test(text)) return true;
  }
  return false;
}

export function isPoweredByBanner(text: string | null | undefined): boolean {
  const value = text?.replace(/\s+/g, " ").trim() ?? "";
  return /^powered by\b/i.test(value) && /eleven/i.test(value);
}

/** Marks the Start a call control so the injected style can restyle that pill only. */
export function markAishaCallPill(root: ShadowRoot) {
  const host = root.host instanceof Element ? root.host : null;
  const start = host?.getAttribute("start-call-text")?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
  if (!start) return;
  for (const button of root.querySelectorAll("button")) {
    const text = button.textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
    if (text === start) button.classList.add("aisha-call-pill");
  }
}

export function hidePoweredByBanner(root: ShadowRoot) {
  let style = root.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = POWERED_BY_BANNER_STYLE;
    root.appendChild(style);
  } else if (style.textContent !== POWERED_BY_BANNER_STYLE) {
    style.textContent = POWERED_BY_BANNER_STYLE;
  }
  for (const node of root.querySelectorAll("p")) {
    if (!isPoweredByBanner(node.textContent)) continue;
    node.style.setProperty("display", "none", "important");
  }
  markAishaCallPill(root);
}

/** Re-apply after the embed script builds or rewrites its shadow tree. */
export function watchPoweredByBanner(
  slot: ParentNode,
  onSurface?: (open: boolean) => void,
): () => void {
  let shadowObserver: MutationObserver | undefined;
  let watched: ShadowRoot | undefined;

  const scan = () => {
    const host = slot.querySelector("elevenlabs-convai");
    const root = host && "shadowRoot" in host ? host.shadowRoot : null;
    if (!root) return;
    hidePoweredByBanner(root);
    onSurface?.(convaiSurfaceOpen(root));
    if (watched === root) return;
    shadowObserver?.disconnect();
    watched = root;
    shadowObserver = new MutationObserver(() => {
      hidePoweredByBanner(root);
      onSurface?.(convaiSurfaceOpen(root));
    });
    // The orb rewrites attributes every frame. Watching those and then
    // measuring the tree forces layout on every frame and freezes the page.
    // Panels are inserted as nodes. A short interval covers a panel that
    // only changes visibility.
    shadowObserver.observe(root, { childList: true, subtree: true });
    if (host instanceof HTMLElement) {
      host.addEventListener("elevenlabs-convai:call", () => onSurface?.(true));
    }
  };

  scan();
  const slotObserver = new MutationObserver(scan);
  slotObserver.observe(slot, { childList: true, subtree: true });
  const timer = window.setInterval(scan, 400);
  const stopTimer = window.setTimeout(() => window.clearInterval(timer), 20000);
  void customElements.whenDefined("elevenlabs-convai").then(scan);

  return () => {
    window.clearInterval(timer);
    window.clearTimeout(stopTimer);
    slotObserver.disconnect();
    shadowObserver?.disconnect();
  };
}
