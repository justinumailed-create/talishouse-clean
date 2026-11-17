"use client";

import { useLayoutEffect } from "react";

function isWhite(value: string): boolean {
  return value === "rgb(255, 255, 255)" || value === "rgba(255, 255, 255, 1)" || value === "white";
}

/** Largest light panel inside the checkout embed, or the embed itself. */
function checkoutCard(host: Element | null): HTMLElement | null {
  if (!(host instanceof HTMLElement)) return null;
  const roots: ParentNode[] = [];
  if (host.shadowRoot) roots.push(host.shadowRoot);
  roots.push(host);
  let best: HTMLElement | null = null;
  let bestArea = 0;
  for (const root of roots) {
    for (const node of root.querySelectorAll("*")) {
      if (!(node instanceof HTMLElement)) continue;
      const box = node.getBoundingClientRect();
      if (box.width < 240 || box.height < 240) continue;
      if (!isWhite(getComputedStyle(node).backgroundColor)) continue;
      const area = box.width * box.height;
      if (area > bestArea) {
        best = node;
        bestArea = area;
      }
    }
  }
  return best ?? host;
}

/**
 * Lines the top of Aisha's column with the SamCart card. The write-up keeps
 * its own height so a long paragraph stays visible without stretching the
 * column or leaving a dark band under the card.
 */
export default function RegisterCheckoutAlign() {
  useLayoutEffect(() => {
    const grid = document.querySelector<HTMLElement>("[data-testid='register-checkout-grid']");
    const aside = document.querySelector<HTMLElement>("[data-testid='register-checkout-aside']");
    if (!grid || !aside) return;

    const apply = () => {
      aside.style.minHeight = "";
      if (window.innerWidth < 1024) {
        aside.style.marginTop = "";
        return;
      }
      const card = checkoutCard(grid.querySelector("sc-checkout"));
      if (!card) return;
      const box = card.getBoundingClientRect();
      if (box.height < 80) return;
      const offset = Math.max(0, Math.round(box.top - grid.getBoundingClientRect().top));
      aside.style.marginTop = `${offset}px`;
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(grid);
    window.addEventListener("resize", apply);
    const timer = window.setInterval(apply, 400);
    const stop = window.setTimeout(() => window.clearInterval(timer), 15000);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, []);

  return null;
}
