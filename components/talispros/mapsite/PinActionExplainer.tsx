"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n/client";
import {
  FLAG_MESSAGE_POPOVER_WIDTH_CLASS,
  FLAG_MESSAGE_TEXT_CLASS,
} from "@/lib/talispros/mapsite-flag-messages";

export type PinActionExplainerId = "url" | "teb" | "tva" | "ttv";

const NAV_CLEAR_PX = 72;

function coarsePointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

/**
 * Short explainer for a PIN card action. Portaled and fixed so the map
 * overflow and the sticky navbar cannot clip it. Hover and keyboard focus
 * open it; a tap on a coarse pointer opens it first and follows the control
 * on the next tap.
 */
export default function PinActionExplainer({
  action,
  children,
}: {
  action: PinActionExplainerId;
  children: ReactElement;
}) {
  const copy = useT().mapsite.pinActions;
  const reactId = useId();
  const popoverId = `pin-action-${reactId.replace(/:/g, "")}`;
  const rootRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const text = copy[action];

  useEffect(() => {
    setMounted(true);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  function cancelHide() {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }

  function scheduleHide() {
    cancelHide();
    hideTimer.current = window.setTimeout(() => setOpen(false), 140);
  }

  useEffect(() => {
    if (!open) return;
    function place() {
      const trigger = rootRef.current?.getBoundingClientRect();
      const pop = popRef.current?.getBoundingClientRect();
      if (!trigger) return;
      const margin = 8;
      const width = pop?.width || 320;
      const height = pop?.height || 120;
      // Sit above the whole PIN card (the flag) when the control lives in one,
      // so the explainer never covers the card's other buttons.
      const flag = rootRef.current
        ?.closest("[data-pin-flag]")
        ?.getBoundingClientRect();
      const above = flag ?? trigger;
      let top = above.top - height - margin;
      if (top < NAV_CLEAR_PX) top = (flag ?? trigger).bottom + margin;
      if (top + height > window.innerHeight - margin) {
        top = Math.max(NAV_CLEAR_PX, window.innerHeight - height - margin);
      }
      let left = trigger.left + trigger.width / 2 - width / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
      setPos({ top, left });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, text]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target) || popRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function show() {
    cancelHide();
    setOpen(true);
  }

  function onBlurCapture(event: FocusEvent<HTMLSpanElement>) {
    const next = event.relatedTarget as Node | null;
    if (next && (rootRef.current?.contains(next) || popRef.current?.contains(next))) return;
    scheduleHide();
  }

  function onClickCapture(event: MouseEvent<HTMLSpanElement>) {
    if (!coarsePointer() || open) return;
    event.preventDefault();
    event.stopPropagation();
    show();
  }

  const popover = open ? (
    <div
      ref={popRef}
      id={popoverId}
      role="tooltip"
      data-testid={`pin-action-explainer-${action}`}
      className={`pointer-events-auto ${FLAG_MESSAGE_POPOVER_WIDTH_CLASS} rounded-xl bg-white px-4 py-3 text-[16px] leading-relaxed text-neutral-950 shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-neutral-900/15`}
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? 8,
        zIndex: 80,
      }}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    >
      <p className={FLAG_MESSAGE_TEXT_CLASS}>{text}</p>
    </div>
  ) : null;

  return (
    <span
      ref={rootRef}
      className="pin-action-explainer block min-w-0 [&>*]:w-full"
      onMouseEnter={() => {
        if (!coarsePointer()) show();
      }}
      onMouseLeave={scheduleHide}
      onFocusCapture={show}
      onBlurCapture={onBlurCapture}
      onClickCapture={onClickCapture}
    >
      {children}
      {mounted && popover ? createPortal(popover, document.body) : null}
    </span>
  );
}
