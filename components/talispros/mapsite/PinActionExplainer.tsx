"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n/client";

export type PinActionExplainerId = "url" | "teb" | "ttv";

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

  const text = action === "teb" ? copy.teb : action === "ttv" ? copy.ttv : copy.url;

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
      const width = pop?.width || 280;
      const height = pop?.height || 96;
      let top = trigger.top - height - margin;
      if (top < NAV_CLEAR_PX) top = trigger.bottom + margin;
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

  function onKeyDown(event: ReactKeyboardEvent<HTMLSpanElement>) {
    if (event.key !== "Tab" || event.shiftKey || action === "teb" || !open) return;
    const link = popRef.current?.querySelector("a");
    if (!link) return;
    event.preventDefault();
    link.focus();
  }

  const popover = open ? (
    <div
      ref={popRef}
      id={popoverId}
      role={action === "teb" ? "tooltip" : "dialog"}
      data-testid={`pin-action-explainer-${action}`}
      className="pointer-events-auto w-[min(22rem,calc(100vw-1rem))] rounded-xl bg-white px-4 py-3 text-[16px] leading-relaxed text-neutral-950 shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-neutral-900/15"
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? 8,
        zIndex: 80,
      }}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    >
      <p className="m-0">{text}</p>
      {action === "teb" ? null : (
        <Link
          href={copy.learnMoreHref}
          className="mt-2 inline-flex text-[16px] font-semibold text-[#0356b0] underline decoration-[#0356b0] underline-offset-2"
          data-testid={`pin-action-${action}-learn-more`}
        >
          {copy.learnMore}
        </Link>
      )}
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
      onKeyDown={onKeyDown}
    >
      {children}
      {mounted && popover ? createPortal(popover, document.body) : null}
    </span>
  );
}
