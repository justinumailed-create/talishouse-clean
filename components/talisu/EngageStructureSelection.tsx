"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import TransactionStructurePicker from "@/components/talisu/TransactionStructurePicker";
import { talisUEngageCheckoutHref } from "@/lib/talisu/ask-step";
import { ENGAGE_STRUCTURES_ANCHOR } from "@/lib/talisu/engage-structure";

const ANCHOR_HASH = `#${ENGAGE_STRUCTURES_ANCHOR}`;
const DEFAULT_STRUCTURE = "conventional";

type Selection = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  /** The structure the checkout button uses: the open tab, else the default. */
  selectedId: string;
};

const SelectionContext = createContext<Selection | null>(null);

function useSelection(): Selection {
  const value = useContext(SelectionContext);
  if (!value) throw new Error("EngageStructureProvider is missing");
  return value;
}

/** Shares the open structure tab between the picker and the Engage Webster button. */
export function EngageStructureProvider({
  initialOpenId,
  children,
}: {
  initialOpenId?: string | null;
  children: ReactNode;
}) {
  const fallback = initialOpenId ?? DEFAULT_STRUCTURE;
  const [openId, setOpenId] = useState<string | null>(fallback);
  return (
    <SelectionContext.Provider
      value={{ openId, setOpenId, selectedId: openId ?? fallback }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

/**
 * The structure tabs, anchored at #structures. Links to #structures on this
 * page (the headline pill) and arriving with #structures in the URL scroll
 * smoothly to the tabs, focus them and highlight them briefly.
 */
export function EngageStructurePicker({
  testId = "engage-structures",
}: {
  testId?: string;
}) {
  const { openId, setOpenId } = useSelection();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reveal = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    el.focus({ preventScroll: true });
    el.dataset.highlight = "true";
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      delete el.dataset.highlight;
    }, 1600);
  }, []);

  useEffect(() => {
    if (window.location.hash === ANCHOR_HASH) reveal();
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href, window.location.href);
      if (url.hash !== ANCHOR_HASH || url.pathname !== window.location.pathname)
        return;
      event.preventDefault();
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}${ANCHOR_HASH}`,
      );
      reveal();
    };
    const onHash = () => {
      if (window.location.hash === ANCHOR_HASH) reveal();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("hashchange", onHash);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("hashchange", onHash);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [reveal]);

  return (
    <div
      id={ENGAGE_STRUCTURES_ANCHOR}
      ref={ref}
      tabIndex={-1}
      data-testid={`${testId}-anchor`}
      className="scroll-mt-24 rounded-2xl shadow-none outline-none transition-shadow duration-500 data-[highlight=true]:shadow-[0_0_0_4px_rgba(4,107,217,0.45)]"
    >
      <TransactionStructurePicker
        openId={openId}
        onOpenChange={setOpenId}
        learnMore
        testId={testId}
      />
    </div>
  );
}

/** Webster's main button: down-payment checkout with the selected structure. */
export function EngageWebsterCta({
  productCode = null,
  label,
  testId = "partner-cta",
}: {
  productCode?: string | null;
  label: string;
  testId?: string;
}) {
  const { selectedId } = useSelection();
  return (
    <Link
      href={talisUEngageCheckoutHref(productCode, selectedId)}
      data-testid={testId}
      data-structure-id={selectedId}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#046BD9] px-8 text-[16px] font-semibold text-white shadow-[0_10px_26px_rgba(4,107,217,0.3)] transition hover:bg-[#0558b3] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#046BD9]/30"
    >
      {label}
      <span aria-hidden className="text-lg leading-none">
        →
      </span>
    </Link>
  );
}
