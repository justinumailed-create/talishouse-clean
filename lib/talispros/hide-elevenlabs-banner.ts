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
/* Homepage call sheet: notes stay near-black on white, not grey on the blue theme. */
.sheet,
[data-variant="expanded"].sheet,
[data-variant="fullscreen"].sheet {
  background: #ffffff !important;
  color: #1a1a1a !important;
}
.sheet p,
.sheet li,
.sheet span,
.sheet textarea {
  color: #1a1a1a !important;
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
[data-variant="expanded"].sheet,
[data-variant="fullscreen"].sheet {
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  left: auto !important;
  height: 100% !important;
  max-height: 100% !important;
  margin: 0 !important;
  max-width: min(440px, 100%) !important;
}
`;

/** Page embed: the conversation fills its column instead of docking to the screen. */
export const POWERED_BY_INLINE_STYLE = `
.sheet,
[data-variant="page"].sheet {
  background: #ffffff !important;
  color: #1a1a1a !important;
}
.sheet p,
.sheet li,
.sheet span,
.sheet textarea,
[data-variant="page"].sheet p,
[data-variant="page"].sheet span,
[data-variant="page"].sheet textarea {
  color: #1a1a1a !important;
}
p.whitespace-nowrap:has(a[href*="elevenlabs.io"]) {
  display: none !important;
}
/* Page layout is a row: a large avatar beside a narrow transcript.
   This page already shows the portrait, so the transcript uses the column.
   The speech pane (start/end, mute, "Talk to interrupt") sits in a reserved
   footer under the composer, so those controls never cover the text box. */
div:has(> [data-pane="speech"]) .sheet,
div:has(> [data-pane="speech"]) [data-variant="page"].sheet {
  padding-bottom: 6rem !important;
  box-sizing: border-box !important;
}
.basis-3\\/5 {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  top: auto !important;
  bottom: 0.25rem !important;
  width: 100% !important;
  height: auto !important;
  min-height: 5.5rem !important;
  flex: none !important;
  min-width: 0 !important;
  overflow: visible !important;
  background: transparent !important;
  z-index: 30 !important;
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.35rem 0.75rem !important;
  box-sizing: border-box !important;
  padding: 0.25rem 0.75rem 0.4rem !important;
  pointer-events: none !important;
}
.basis-3\\/5 button,
.basis-3\\/5 [role="button"] {
  pointer-events: auto !important;
}
.basis-3\\/5 > .relative {
  display: contents !important;
}
/* Status pill ("Talk to interrupt") on its own row under the buttons. */
.basis-3\\/5 .w-max {
  flex: 1 0 100% !important;
  display: flex !important;
  justify-content: center !important;
  order: 3 !important;
}
.basis-3\\/5 .w-72,
.basis-3\\/5 .rounded-full {
  display: none !important;
}
.basis-3\\/5 .absolute {
  position: static !important;
  transform: none !important;
  padding: 0 !important;
  background: transparent !important;
}
div:has(> .sheet) {
  flex: 1 1 auto !important;
  width: 100% !important;
  max-width: none !important;
  height: 100% !important;
}
.sheet,
[data-variant="expanded"].sheet,
[data-variant="fullscreen"].sheet,
[data-variant="page"].sheet {
  position: absolute !important;
  inset: 0 !important;
  left: 0 !important;
  right: 0 !important;
  top: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  border-radius: 0 !important;
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

export function hidePoweredByBanner(root: ShadowRoot, inline = false) {
  const css = inline ? POWERED_BY_INLINE_STYLE : POWERED_BY_BANNER_STYLE;
  let style = root.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    root.appendChild(style);
  } else if (style.textContent !== css) {
    style.textContent = css;
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
  inline = false,
): () => void {
  let shadowObserver: MutationObserver | undefined;
  let watched: ShadowRoot | undefined;

  const scan = () => {
    const host = slot.querySelector("elevenlabs-convai");
    const root = host && "shadowRoot" in host ? host.shadowRoot : null;
    if (!root) return;
    hidePoweredByBanner(root, inline);
    onSurface?.(convaiSurfaceOpen(root));
    if (watched === root) return;
    shadowObserver?.disconnect();
    watched = root;
    shadowObserver = new MutationObserver(() => {
      hidePoweredByBanner(root, inline);
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
