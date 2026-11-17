"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n/client";
import { aishaInvitationParts } from "@/lib/talispros/aisha-invitation";
import { aishaBubbleFrame, aishaSpeechBubblePath } from "@/lib/talispros/aisha-speech-bubble";
import { watchPoweredByBanner } from "@/lib/talispros/hide-elevenlabs-banner";
import {
  DEFAULT_ASSISTANT_PERSONA,
  type AssistantPersona,
} from "@/lib/talispros/assistant-personas";

/**
 * Same rules as globals.css, shipped beside the widget so a cached
 * stylesheet cannot leave the write-up as a solid white pill.
 */
const BUBBLE_STYLE = `
.aisha-convai-label {
  position: relative;
  z-index: 1;
  margin: 0 0 10px;
  max-width: min(448px, calc(100vw - 16px));
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  padding: 14px 44px 26px 16px;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.011em;
  text-align: left;
  text-wrap: balance;
  color: #1d1d1f;
  pointer-events: auto;
  cursor: pointer;
}
.aisha-bubble-shape {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.18));
}
.aisha-bubble-glass {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.94);
  -webkit-backdrop-filter: saturate(160%) blur(16px);
  backdrop-filter: saturate(160%) blur(16px);
}
.aisha-convai-bubble { position: relative; }
.aisha-convai-bubble--aligned {
  position: fixed;
  margin: 0;
  max-width: none;
}
.aisha-convai-bubble--aligned .aisha-convai-label {
  width: 100%;
  max-width: none;
  margin: 0;
  box-sizing: border-box;
}
.aisha-convai-dismiss {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  pointer-events: auto;
}
.aisha-convai-slot[data-surface="open"] .aisha-convai-bubble,
.aisha-convai-slot[data-surface="open"] .aisha-convai-label {
  display: none !important;
}
.aisha-convai-slot elevenlabs-convai {
  z-index: 2;
}
.aisha-convai-slot[data-surface="open"] elevenlabs-convai {
  top: var(--aisha-panel-top, 0px) !important;
  right: var(--aisha-panel-right, 0px) !important;
  bottom: 0 !important;
  left: 0 !important;
  width: auto !important;
  height: auto !important;
}
.aisha-bubble-stroke {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.aisha-convai-copy { position: relative; z-index: 1; }
.aisha-convai-lead { font-weight: 500; }
.aisha-convai-rest { font-weight: 400; }
@media (max-width: 1023px) {
  .aisha-convai-label { font-size: 15px; }
}
`;

function usePageOrigin(): string {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

function usePortalHost(): HTMLElement | null {
  return useSyncExternalStore(
    () => () => {},
    () => document.body,
    () => null,
  );
}

/** The pop-up and the launcher both start the call. The terms sheet may still appear. */
function startAishaConversation(event: MouseEvent<HTMLButtonElement>) {
  const slot = event.currentTarget.closest("[data-testid='aisha-convai']");
  const widget = slot?.querySelector("elevenlabs-convai");
  const root = widget && "shadowRoot" in widget ? widget.shadowRoot : null;
  if (!root) return;
  const wanted = (event.currentTarget.dataset.startLabel ?? "").trim().toLowerCase();
  const buttons = [...root.querySelectorAll("button")];
  const match = buttons.find(
    (button) => button.textContent?.trim().toLowerCase() === wanted,
  );
  (match ?? buttons[0])?.click();
}

/**
 * Public voice and chat widget. The embed script loads after the page is
 * interactive. The spoken first message is set in ElevenLabs, not here.
 */
export default function AishaConvaiWidget({
  persona = DEFAULT_ASSISTANT_PERSONA,
  invitation = "greeting",
  placement = "bottom-left",
  agentId: agentIdOverride,
  dynamicVariables,
  startHref,
  embed = "floating",
  autoStart = false,
}: {
  persona?: AssistantPersona;
  /** Homepage greeting, or the call-back line used on an allowlisted Mapsite. */
  invitation?: "greeting" | "callback" | "mapsite";
  placement?: "bottom-left" | "bottom-right";
  /** Mapsite pages pass their own agent. Other pages keep the homepage agent. */
  agentId?: string;
  /** JSON for the Mapsite agent. Omitted on the homepage. */
  dynamicVariables?: string;
  /** Homepage Start a call opens this page first. Other pages start the call. */
  startHref?: string;
  /** Floating corner widget, or the conversation filling its column. */
  embed?: "floating" | "inline";
  /** Open the call after a homepage Start a call click. */
  autoStart?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const copy = t.home.assistants[persona.id];
  const closeLabel = t.mapsite.close;
  const origin = usePageOrigin();
  const host = usePortalHost();
  const slotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLButtonElement>(null);
  const [bubbleSize, setBubbleSize] = useState({ width: 0, height: 0 });
  const [surfaceOpen, setSurfaceOpen] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const startedRef = useRef(false);
  const [pillFrame, setPillFrame] = useState<{
    left: number;
    width: number;
    bottom: number;
    tip: number;
  } | null>(null);
  const avatar = origin ? `${origin}${persona.portraitSrc}` : persona.portraitSrc;

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    return watchPoweredByBanner(slot, setSurfaceOpen, embed === "inline");
  }, [embed, host]);

  const pressStart = useCallback(() => {
    const slot = slotRef.current;
    const hostEl = slot?.querySelector("elevenlabs-convai");
    const root = hostEl && "shadowRoot" in hostEl ? hostEl.shadowRoot : null;
    if (!root) return false;
    const terms = root.querySelector(".terms");
    if (terms instanceof HTMLElement && terms.getBoundingClientRect().height > 8) return true;
    const wanted = (copy?.startCall ?? "").trim().toLowerCase();
    // The page-layout phone control keeps the embed's English name even on /de.
    const names = new Set([wanted, "start a call", "anruf starten"].filter(Boolean));
    const start = [...root.querySelectorAll("button")].find((button) => {
      const text = button.textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
      const label = button.getAttribute("aria-label")?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
      return names.has(text) || names.has(label);
    });
    if (!start) return false;
    start.click();
    return true;
  }, [copy?.startCall]);

  useEffect(() => {
    if (embed !== "inline" || !autoStart) return;
    const termsOpen = () => {
      const slot = slotRef.current;
      const hostEl = slot?.querySelector("elevenlabs-convai");
      const root = hostEl && "shadowRoot" in hostEl ? hostEl.shadowRoot : null;
      const terms = root?.querySelector(".terms");
      return terms instanceof HTMLElement && terms.getBoundingClientRect().height > 8;
    };
    const timer = window.setInterval(() => {
      if (termsOpen()) {
        startedRef.current = true;
        setNeedsTap(false);
        window.clearInterval(timer);
        return;
      }
      if (startedRef.current) return;
      if (pressStart()) startedRef.current = true;
    }, 400);
    const stop = window.setTimeout(() => {
      window.clearInterval(timer);
      if (!termsOpen()) setNeedsTap(true);
    }, 3500);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [autoStart, embed, pressStart]);

  useEffect(() => {
    if (!startHref) return;
    const slot = slotRef.current;
    if (!slot) return;
    const wanted = (copy?.startCall ?? "").trim().toLowerCase();
    const onClick = (event: Event) => {
      const path = event.composedPath();
      const fromBubble = path.some(
        (node) => node instanceof HTMLElement && node.classList.contains("aisha-convai-label"),
      );
      if (fromBubble) return;
      const button = path.find((node): node is HTMLButtonElement => node instanceof HTMLButtonElement);
      const text = button?.textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
      if (!wanted || text !== wanted) return;
      event.preventDefault();
      event.stopPropagation();
      router.push(startHref);
    };
    slot.addEventListener("click", onClick, true);
    return () => slot.removeEventListener("click", onClick, true);
  }, [copy?.startCall, host, router, startHref]);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const apply = () => {
      const header = document.querySelector(
        "[data-testid='site-header'], [data-testid='personal-home-header']",
      );
      const subnav = document.querySelector("[data-testid='personal-home-subnav']");
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      const subnavBottom = subnav?.getBoundingClientRect().bottom ?? 0;
      const top = Math.max(0, Math.ceil(Math.max(headerBottom, subnavBottom)));
      const zoom = document.querySelector("[data-testid='mapsite-zoom-controls']");
      const zoomBox = zoom?.getBoundingClientRect();
      const right =
        zoomBox && zoomBox.width > 8
          ? Math.max(0, Math.ceil(window.innerWidth - zoomBox.left + 8))
          : 0;
      slot.style.setProperty("--aisha-panel-top", `${top}px`);
      slot.style.setProperty("--aisha-panel-right", `${right}px`);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [host, surfaceOpen]);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    const startLabel = copy?.startCall ?? "";
    if (!slot || bubbleDismissed || !startLabel) return;
    const measure = () => {
      const hostEl = slot.querySelector("elevenlabs-convai");
      const root = hostEl && "shadowRoot" in hostEl ? hostEl.shadowRoot : null;
      if (!root) return;
      const wanted = startLabel.trim().toLowerCase();
      const start = [...root.querySelectorAll("button")].find((button) => {
        const text = button.textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
        return text === wanted;
      });
      if (!start) return;
      const sheet = start.closest(".rounded-compact-sheet");
      let bar: HTMLElement = sheet instanceof HTMLElement ? sheet : start;
      if (!(sheet instanceof HTMLElement)) {
        const startBox = start.getBoundingClientRect();
        let node: HTMLElement = start;
        for (let i = 0; i < 6 && node.parentElement instanceof HTMLElement; i += 1) {
          const parent = node.parentElement;
          if (parent.getBoundingClientRect().width > startBox.width + 20) {
            bar = parent;
            break;
          }
          node = parent;
        }
      }
      const box = bar.getBoundingClientRect();
      if (box.width < 40 || box.height < 20) return;
      const image = bar.querySelector("img");
      const imageBox = image?.getBoundingClientRect();
      const avatarCenter =
        imageBox && imageBox.width > 8 ? imageBox.left + imageBox.width / 2 : null;
      const next = aishaBubbleFrame({
        pillLeft: box.left,
        pillTop: box.top,
        pillWidth: box.width,
        avatarCenter,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      });
      setPillFrame((current) =>
        current &&
        current.left === next.left &&
        current.width === next.width &&
        current.bottom === next.bottom &&
        current.tip === next.tip
          ? current
          : next,
      );
    };
    measure();
    const hostEl = slot.querySelector("elevenlabs-convai");
    const root = hostEl && "shadowRoot" in hostEl ? hostEl.shadowRoot : null;
    const observer = new MutationObserver(measure);
    if (root) observer.observe(root, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    const timer = window.setInterval(measure, 400);
    const stop = window.setTimeout(() => window.clearInterval(timer), 8000);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [host, bubbleDismissed, copy, surfaceOpen]);

  const line = !copy ? "" : invitation === "callback" ? copy.callback : copy.greeting;
  const bubbleSide = placement === "bottom-right" ? "right" : "left";

  useLayoutEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      setBubbleSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [host, line, placement]);

  const agentId = agentIdOverride?.trim() || persona.agentId;
  if (embed === "inline") {
    if (!copy) return null;
    return (
      <div
        ref={slotRef}
        className="aisha-convai-inline"
        data-testid="aisha-convai"
        data-embed="inline"
        data-call={autoStart ? "1" : "0"}
      >
        <elevenlabs-convai
          agent-id={agentId}
          dynamic-variables={dynamicVariables || undefined}
          action-text={line}
          aria-label={line}
          start-call-text={copy.startCall}
          end-call-text={copy.endCall}
          expand-text={copy.openChat}
          avatar-image-url={avatar}
          avatar-orb-color-1="#046BD9"
          avatar-orb-color-2="#d6e8fb"
          variant="expanded"
          layout="page"
        />
        {autoStart && needsTap ? (
          <button
            type="button"
            className="absolute inset-x-6 bottom-8 z-10 mx-auto flex min-h-14 max-w-sm items-center justify-center rounded-full bg-black px-6 text-[16px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
            data-testid="aisha-tap-to-talk"
            onClick={() => {
              startedRef.current = true;
              if (pressStart()) setNeedsTap(false);
            }}
          >
            {copy.tapToTalk}
          </button>
        ) : null}
        <Script
          src="https://unpkg.com/@elevenlabs/convai-widget-embed"
          strategy="lazyOnload"
          async
        />
      </div>
    );
  }

  if (!host || !copy) return null;
  const invitationParts = aishaInvitationParts(line);
  const bubblePath =
    bubbleSize.width > 0 && bubbleSize.height > 0
      ? aishaSpeechBubblePath(
          bubbleSize.width,
          bubbleSize.height,
          bubbleSide,
          pillFrame && bubbleSize.width > 0
            ? (pillFrame.tip / pillFrame.width) * bubbleSize.width
            : null,
        )
      : "";

  return createPortal(
    <div
      ref={slotRef}
      className="aisha-convai-slot"
      data-testid="aisha-convai"
      data-persona={persona.id}
      data-placement={placement}
      data-surface={surfaceOpen ? "open" : "idle"}
    >
      <style>{BUBBLE_STYLE}</style>
      {bubbleDismissed ? null : (
      <div
        className={
          pillFrame ? "aisha-convai-bubble aisha-convai-bubble--aligned" : "aisha-convai-bubble"
        }
        style={
          pillFrame
            ? { left: pillFrame.left, width: pillFrame.width, bottom: pillFrame.bottom }
            : undefined
        }
      >
      <button
        ref={labelRef}
        type="button"
        className="aisha-convai-label"
        data-start-label={copy.startCall}
        onClick={(event) => {
          if (startHref) {
            event.preventDefault();
            router.push(startHref);
            return;
          }
          startAishaConversation(event);
        }}
      >
        {bubblePath ? (
          <span className="aisha-bubble-shape" aria-hidden="true">
            <span
              className="aisha-bubble-glass"
              style={{ clipPath: `path('${bubblePath}')` }}
            />
            <svg
              className="aisha-bubble-stroke"
              width={bubbleSize.width}
              height={bubbleSize.height}
            >
              <path
                d={bubblePath}
                fill="none"
                stroke="rgba(0, 0, 0, 0.14)"
                strokeWidth="1"
              />
            </svg>
          </span>
        ) : null}
        <span className="aisha-convai-copy">
          <span className="aisha-convai-lead">{invitationParts.lead}</span>
          {invitationParts.rest ? (
            <span className="aisha-convai-rest"> {invitationParts.rest}</span>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        className="aisha-convai-dismiss"
        aria-label={closeLabel}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setBubbleDismissed(true);
        }}
      >
        <span aria-hidden="true">×</span>
      </button>
      </div>
      )}
      <elevenlabs-convai
        agent-id={agentId}
        dynamic-variables={dynamicVariables || undefined}
        action-text={line}
        aria-label={line}
        start-call-text={copy.startCall}
        end-call-text={copy.endCall}
        expand-text={copy.openChat}
        avatar-image-url={avatar}
        avatar-orb-color-1="#046BD9"
        avatar-orb-color-2="#d6e8fb"
        variant="compact"
        placement={placement}
      />
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="lazyOnload"
        async
      />
    </div>,
    host,
  );
}
