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
`;

export function isPoweredByBanner(text: string | null | undefined): boolean {
  const value = text?.replace(/\s+/g, " ").trim() ?? "";
  return /^powered by\b/i.test(value) && /eleven/i.test(value);
}

export function hidePoweredByBanner(root: ShadowRoot) {
  let style = root.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = POWERED_BY_BANNER_STYLE;
    root.appendChild(style);
  }
  for (const node of root.querySelectorAll("p")) {
    if (!isPoweredByBanner(node.textContent)) continue;
    node.style.setProperty("display", "none", "important");
  }
}

/** Re-apply after the embed script builds or rewrites its shadow tree. */
export function watchPoweredByBanner(slot: ParentNode): () => void {
  let shadowObserver: MutationObserver | undefined;
  let watched: ShadowRoot | undefined;

  const scan = () => {
    const host = slot.querySelector("elevenlabs-convai");
    const root = host && "shadowRoot" in host ? host.shadowRoot : null;
    if (!root) return;
    hidePoweredByBanner(root);
    if (watched === root) return;
    shadowObserver?.disconnect();
    watched = root;
    shadowObserver = new MutationObserver(() => hidePoweredByBanner(root));
    shadowObserver.observe(root, { childList: true, subtree: true });
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
