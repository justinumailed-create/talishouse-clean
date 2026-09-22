"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import {
  PRODUCT_FLIPBOOK_SAMPLE_HREF,
  type ProductFlipbookPage,
} from "@/lib/product-flipbook/manifest";

const FLIP_MS = 720;

type Direction = "next" | "prev";

type Flip = {
  direction: Direction;
  fromIndex: number;
  toIndex: number;
};

function CatalogueFace({ page }: { page: ProductFlipbookPage }) {
  if (!page.src) return null;
  return (
    <Image
      src={page.src}
      alt={page.alt}
      fill
      sizes="(max-width: 960px) 100vw, 960px"
      className="product-flipbook__image"
      draggable={false}
    />
  );
}

export default function TopBoundFlipbook({
  pages,
}: {
  pages: ProductFlipbookPage[];
}) {
  const leaves = pages;
  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState<Flip | null>(null);
  const indexRef = useRef(0);
  const flipRef = useRef<Flip | null>(null);
  const dragRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  const commit = useCallback(() => {
    const current = flipRef.current;
    if (!current) return;
    indexRef.current = current.toIndex;
    flipRef.current = null;
    setIndex(current.toIndex);
    setFlip(null);
  }, []);

  const go = useCallback(
    (direction: Direction) => {
      if (flipRef.current) return;
      const fromIndex = indexRef.current;
      const toIndex = direction === "next" ? fromIndex + 1 : fromIndex - 1;
      if (toIndex < 0 || toIndex >= leaves.length) return;
      const nextFlip = { direction, fromIndex, toIndex };
      flipRef.current = nextFlip;
      setFlip(nextFlip);
    },
    [leaves.length],
  );

  useEffect(() => {
    if (!flip) return;
    const timer = window.setTimeout(commit, FLIP_MS + 180);
    return () => window.clearTimeout(timer);
  }, [flip, commit]);

  useEffect(() => {
    const nearest = [leaves[index + 1], leaves[index - 1]];
    for (const page of nearest) {
      if (!page?.src) continue;
      const image = new window.Image();
      image.src = page.src;
    }
  }, [index, leaves]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        go("next");
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        go("prev");
      } else if (event.key === "Home") {
        event.preventDefault();
        if (flipRef.current) return;
        indexRef.current = 0;
        setIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        if (flipRef.current) return;
        const last = leaves.length - 1;
        indexRef.current = last;
        setIndex(last);
      } else if (event.key === " " && tag !== "BUTTON" && tag !== "A") {
        event.preventDefault();
        go("next");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, leaves.length]);

  const underIndex = flip
    ? flip.direction === "next"
      ? flip.toIndex
      : flip.fromIndex
    : index;
  const underPage = leaves[underIndex] ?? leaves[0];
  const sheetPage = flip
    ? leaves[flip.direction === "next" ? flip.fromIndex : flip.toIndex]
    : null;
  const displayNumber = (flip ? flip.toIndex : index) + 1;
  const atStart = index === 0 && !flip;
  const atEnd = index >= leaves.length - 1 && !flip;

  function onSheetAnimationEnd(event: React.AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (!event.animationName.includes("product-flipbook-turn")) return;
    commit();
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      go("next");
      return;
    }
    if (dy < -36) go("next");
    else if (dy > 36) go("prev");
  }

  return (
    <div className="product-flipbook" data-testid="product-flipbook" data-binding="top">
      <header className="product-flipbook__header">
        <div className="product-flipbook__brand">
          <Image
            src="/logo.png"
            alt="Talispros"
            width={36}
            height={36}
            className="product-flipbook__logo"
            priority
          />
          <div>
            <p className="product-flipbook__eyebrow">Product</p>
            <h1 className="product-flipbook__title">T-All catalogue</h1>
            <p className="product-flipbook__subtitle">Top-bound · one page at a time</p>
          </div>
        </div>
        <nav className="product-flipbook__actions" aria-label="Talispros">
          <Link href={ROUTES.HOME} className="product-flipbook__link">
            Home
          </Link>
          <Link href={PRODUCT_FLIPBOOK_SAMPLE_HREF} className="product-flipbook__link">
            Sample
          </Link>
          <Link href={MAPSITE_APP_PATH} className="product-flipbook__link">
            Markets
          </Link>
          <Link href={ROUTES.ADMIN_DASHBOARD} className="product-flipbook__link">
            Global Admin
          </Link>
        </nav>
      </header>

      <div className="product-flipbook__stage">
        <div className="product-flipbook__book">
          <div className="product-flipbook__hinge" aria-hidden="true">
            <span className="product-flipbook__hinge-wire" />
          </div>
          <div
            className="product-flipbook__perspective"
            data-testid="product-flipbook-stage"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
          >
            <div className="product-flipbook__slot">
              <div className="product-flipbook__settled" data-testid="product-flipbook-page">
                {underPage ? <CatalogueFace page={underPage} /> : null}
              </div>
              {flip && sheetPage ? (
                <div
                  className={[
                    "product-flipbook__sheet",
                    flip.direction === "next"
                      ? "product-flipbook__sheet--next"
                      : "product-flipbook__sheet--prev",
                  ].join(" ")}
                  onAnimationEnd={onSheetAnimationEnd}
                >
                  <div className="product-flipbook__face product-flipbook__face--front">
                    <CatalogueFace page={sheetPage} />
                    <span className="product-flipbook__curl" aria-hidden="true" />
                  </div>
                  <div className="product-flipbook__face product-flipbook__face--back" aria-hidden="true" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="product-flipbook__toolbar">
        <div className="product-flipbook__controls">
          <button
            type="button"
            className="product-flipbook__turn"
            data-testid="product-flipbook-prev"
            onClick={() => go("prev")}
            disabled={atStart || flip !== null}
          >
            Previous
          </button>
          <p className="product-flipbook__count" aria-live="polite">
            Page {displayNumber} of {leaves.length}
          </p>
          <button
            type="button"
            className="product-flipbook__turn"
            data-testid="product-flipbook-next"
            onClick={() => go("next")}
            disabled={atEnd || flip !== null}
          >
            Next
          </button>
        </div>
        <p className="product-flipbook__hint">Flip up from the top edge. Swipe down to turn back.</p>
      </div>
    </div>
  );
}
