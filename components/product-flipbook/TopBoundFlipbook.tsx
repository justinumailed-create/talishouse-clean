"use client";

import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import {
  type ProductFlipbookHotspot,
  type ProductFlipbookPage,
} from "@/lib/product-flipbook/manifest";
import WebsterCataloguePage from "@/components/product-flipbook/WebsterCataloguePage";
import "./top-bound-flipbook.css";

const FLIP_MS = 720;

type Direction = "next" | "prev";

type Flip = {
  direction: Direction;
  fromIndex: number;
  toIndex: number;
};

function CatalogueFace({ page }: { page: ProductFlipbookPage }) {
  if (page.face === "webster") return <WebsterCataloguePage />;
  if (!page.src) return null;
  return (
    // Native img: next/image `fill` was painting the page against the viewport
    // whenever the slot had no used height.
    <img
      src={page.src}
      alt={page.alt}
      className="product-flipbook__image"
      draggable={false}
      decoding="async"
    />
  );
}

/**
 * Clickable product blocks, percent-positioned inside the page slot so they
 * scale with the viewer. Pointer events stop here so a tap on a block routes
 * to registration instead of turning the page.
 */
function CatalogueHotspots({ hotspots }: { hotspots: ProductFlipbookHotspot[] }) {
  const c = useT().catalogueUi;
  return (
    <div className="absolute inset-0" data-testid="product-flipbook-hotspots">
      {hotspots.map((spot) => (
        <Link
          key={spot.code}
          href={spot.href}
          aria-label={fmt(c.customize, { label: spot.label })}
          title={`Customize ${spot.label}`}
          data-product-code={spot.code}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          className="group absolute block cursor-pointer rounded-[3px] outline-none ring-[#046BD9] transition hover:ring-2 focus-visible:ring-2"
          style={{
            left: `${spot.rect.x}%`,
            top: `${spot.rect.y}%`,
            width: `${spot.rect.w}%`,
            height: `${spot.rect.h}%`,
          }}
        >
          <span className="absolute left-[3%] top-[5%] rounded bg-[#046BD9] px-[0.45em] py-[0.15em] text-[clamp(9px,1.1vw,14px)] font-semibold leading-tight text-white shadow-sm">
            {spot.code}
          </span>
          <span className="absolute bottom-[5%] right-[3%] rounded bg-white/90 px-[0.45em] py-[0.15em] text-[clamp(8px,0.9vw,12px)] font-semibold leading-tight text-[#046BD9] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
            {c.register}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function TopBoundFlipbook({
  pages,
  eyebrow = "Product",
  title = "Catalogue",
  subtitle = "Top-bound · one page at a time",
  showHeader = true,
  headline,
}: {
  pages: ProductFlipbookPage[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Visible sub-header strip (logo, eyebrow, title, Home/Bookshelf). Off on /catalogue. */
  showHeader?: boolean;
  /** Optional one-line headline above the book (e.g. /catalogue supply-side note). */
  headline?: string;
}) {
  const c = useT().catalogueUi;
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
    <div
      className="product-flipbook relative flex h-full min-h-full flex-col"
      data-testid="product-flipbook"
      data-binding="top"
      data-header={showHeader ? "visible" : "hidden"}
      data-headline={headline ? "visible" : undefined}
    >
      {showHeader ? (
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
              <p className="product-flipbook__eyebrow">{eyebrow}</p>
              <h1 className="product-flipbook__title">{title}</h1>
              <p className="product-flipbook__subtitle">{subtitle}</p>
            </div>
          </div>
          <div className="product-flipbook__header-tools">
            <nav className="product-flipbook__actions" aria-label="Talispros">
              <Link href={ROUTES.HOME} className="product-flipbook__link">
                {c.home}
              </Link>
              <Link
                href={ROUTES.CATALOGUE_BOOKSHELF}
                className="product-flipbook__link"
                data-testid="catalogue-bookshelf-button"
              >
                {c.bookshelf}
              </Link>
            </nav>
          </div>
        </header>
      ) : (
        <h1 className="sr-only">{title}</h1>
      )}

      {headline ? (
        <p className="product-flipbook__headline" data-testid="product-flipbook-headline">
          {headline}
        </p>
      ) : null}

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
            <div className="product-flipbook__slot relative aspect-video">
              <div className="product-flipbook__settled absolute inset-0 overflow-hidden" data-testid="product-flipbook-page">
                {underPage ? <CatalogueFace page={underPage} /> : null}
                {!flip && underPage?.hotspots?.length ? (
                  <CatalogueHotspots hotspots={underPage.hotspots} />
                ) : null}
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
            {c.previous}
          </button>
          <button
            type="button"
            className="product-flipbook__turn"
            data-testid="product-flipbook-next"
            onClick={() => go("next")}
            disabled={atEnd || flip !== null}
          >
            {c.next}
          </button>
        </div>
        <p className="product-flipbook__hint">Flip up from the top edge. Swipe down to turn back.</p>
      </div>
    </div>
  );
}
