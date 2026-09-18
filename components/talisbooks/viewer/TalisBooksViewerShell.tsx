"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  orderedViewerImageUrls,
  warmViewerImages,
} from "@/lib/talisbooks/viewer/image-preloader";
import TalisBooksViewerControls from "@/components/talisbooks/viewer/TalisBooksViewerControls";
import TalisBooksViewerLiveEditor from "@/components/talisbooks/viewer/TalisBooksViewerLiveEditor";
import {
  TalisBooksViewerBrandRail,
  TalisBooksViewerPlaybackRail,
} from "@/components/talisbooks/viewer/TalisBooksViewerRails";
import TalisBooksViewerStage, {
  type TalisBooksViewerBinding,
} from "@/components/talisbooks/viewer/TalisBooksViewerStage";
import { ROUTES } from "@/lib/routes";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import { PINNED_TALISBOOK_SLUG } from "@/lib/talisbooks/library/pinned-catalog";
import { isPermanentViewerPage } from "@/lib/talisbooks/permanent-pages";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";
import { MAPSITE_APP_PATH, buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";
import {
  convertViewerNavIndex,
  createEmptyNarrationController,
  describeViewerPage,
  describeViewerSpread,
  enrichCoverPagesWithAgentBranding,
  getViewerSpread,
  getViewerSpreadCount,
  notifyNarrationPageEnter,
  notifyNarrationPageLeave,
  useAutoPageTurn,
  type TalisBooksNarrationController,
  type TalisBooksViewerBook,
  type TalisBooksViewerPage,
  type TalisBooksViewerViewMode,
} from "@/lib/talisbooks/viewer";

interface TalisBooksViewerShellProps {
  book: TalisBooksViewerBook;
  /** Owner / admin: show playback sidebar controls. */
  canEditTools?: boolean;
  /** After activation payment: show Live Edit panel. */
  canLiveEdit?: boolean;
  /** Demo / sample books: grey out insert-page controls. */
  pageInsertLocked?: boolean;
  /** After payment (or admin): show Dashboard link. */
  showDashboard?: boolean;
  /** Reserved for future audio narration — unused in playback today. */
  narration?: TalisBooksNarrationController | null;
}

function withCoverBranding(book: TalisBooksViewerBook): TalisBooksViewerBook {
  return {
    ...book,
    pages: enrichCoverPagesWithAgentBranding(book.pages),
  };
}

export default function TalisBooksViewerShell({
  book: initialBook,
  canEditTools = false,
  canLiveEdit = false,
  pageInsertLocked = false,
  showDashboard = false,
  narration = null,
}: TalisBooksViewerShellProps) {
  const narrationController = narration ?? createEmptyNarrationController();

  const [book, setBook] = useState<TalisBooksViewerBook>(() =>
    withCoverBranding(initialBook),
  );

  useEffect(() => {
    setBook(withCoverBranding(initialBook));
  }, [initialBook]);

  const [viewMode, setViewMode] = useState<TalisBooksViewerViewMode>("spread");
  const viewModeRef = useRef(viewMode);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  const spreadOptions = useMemo(
    () => ({
      coverSpreadOpening: Boolean(book.coverSpreadOpening),
      backCoverImageUrl: book.backCoverImageUrl,
      backCoverTitle: book.title,
    }),
    [book.coverSpreadOpening, book.backCoverImageUrl, book.title],
  );

  const spreadCount = useMemo(
    () => getViewerSpreadCount(book.pages.length),
    [book.pages.length],
  );
  const navCount = useMemo(
    () =>
      viewMode === "single"
        ? Math.max(book.pages.length, 1)
        : Math.max(spreadCount, 1),
    [viewMode, book.pages.length, spreadCount],
  );

  const isMagazine = true;

  const [binding, setBinding] = useState<TalisBooksViewerBinding>(
    isMagazine ? "open" : "closed-front",
  );
  const [direction, setDirection] = useState<1 | -1>(1);
  const previousNavRef = useRef(0);
  const stageHoverRef = useRef(false);
  const flippingRef = useRef(false);
  const goToRef = useRef<(index: number) => void>(() => {});

  const {
    pageIndex: navIndex,
    autoPlaying,
    pausedByHover,
    intervalMs,
    goNext,
    goPrevious,
    goTo,
    setAutoPlaying,
    setPausedByHover,
    setIntervalMs,
  } = useAutoPageTurn({
    pageCount: navCount,
    initialAutoPlaying: false,
    wrap: false,
    onReachEnd: () => {
      setDirection(1);
      setAutoPlaying(false);
      if (isMagazine) {
        goToRef.current(0);
        previousNavRef.current = 0;
        return;
      }
      setBinding("closed-back");
    },
    onPageChange: (nextNavIndex) => {
      const mode = viewModeRef.current;
      if (mode === "spread") {
        const previous = getViewerSpread(
          book.pages,
          previousNavRef.current,
          spreadOptions,
        );
        const next = getViewerSpread(book.pages, nextNavIndex, spreadOptions);
        const leavePage = previous.right ?? previous.left;
        const enterPage = next.left ?? next.right;
        if (leavePage) {
          notifyNarrationPageLeave(narrationController, leavePage.pageNumber);
        }
        if (enterPage) {
          notifyNarrationPageEnter(narrationController, enterPage.pageNumber);
        }
      } else {
        const leavePage = book.pages[previousNavRef.current];
        const enterPage = book.pages[nextNavIndex];
        if (leavePage) {
          notifyNarrationPageLeave(narrationController, leavePage.pageNumber);
        }
        if (enterPage) {
          notifyNarrationPageEnter(narrationController, enterPage.pageNumber);
        }
      }
      previousNavRef.current = nextNavIndex;
    },
  });

  useEffect(() => {
    goToRef.current = goTo;
  }, [goTo]);

  const syncStagePause = () => {
    setPausedByHover(stageHoverRef.current || flippingRef.current);
  };

  const effectiveNavIndex = navIndex;
  const lastNavIndex = Math.max(navCount - 1, 0);
  const spread =
    book.pages.length > 0
      ? getViewerSpread(book.pages, effectiveNavIndex, spreadOptions)
      : { index: 0, left: null, right: null };
  const singlePage = book.pages[effectiveNavIndex] ?? null;

  // Faces paint from CSS backgrounds, so an unwarmed page turns into a blank
  // leaf mid-flip. Keep downloads running ahead of wherever the reader is.
  const activePageIndex =
    viewMode === "single"
      ? effectiveNavIndex
      : (spread.left ?? spread.right)
        ? book.pages.indexOf((spread.left ?? spread.right)!)
        : 0;

  useEffect(() => {
    warmViewerImages(orderedViewerImageUrls(book, Math.max(activePageIndex, 0)));
  }, [book, activePageIndex]);

  if (book.pages.length === 0 || spreadCount === 0) {
    return (
      <div className="talisbooks-viewer">
        <p className="talisbooks-viewer__empty">This book has no pages yet.</p>
      </div>
    );
  }

  const openBook = (toNav = 0) => {
    setBinding("open");
    setDirection(1);
    goTo(toNav);
    previousNavRef.current = toNav;
  };

  const handleViewModeChange = (nextMode: TalisBooksViewerViewMode) => {
    if (nextMode === viewMode) {
      return;
    }
    const target = convertViewerNavIndex(
      viewMode,
      nextMode,
      effectiveNavIndex,
      book.pages.length,
    );
    setViewMode(nextMode);
    goToRef.current(target);
    previousNavRef.current = target;
  };

  const handleNext = () => {
    if (flippingRef.current) {
      return;
    }
    if (!isMagazine && binding === "closed-front") {
      openBook(0);
      return;
    }
    if (!isMagazine && binding === "closed-back") {
      openBook(lastNavIndex);
      return;
    }
    if (effectiveNavIndex >= lastNavIndex) {
      setDirection(1);
      setAutoPlaying(false);
      if (isMagazine) {
        // Last spread → restart at the front cover.
        goTo(0);
        previousNavRef.current = 0;
        return;
      }
      setBinding("closed-back");
      return;
    }
    setDirection(1);
    setAutoPlaying(false);
    goNext();
  };

  const handlePrevious = () => {
    if (flippingRef.current) {
      return;
    }
    if (!isMagazine && binding === "closed-back") {
      openBook(lastNavIndex);
      return;
    }
    if (!isMagazine && binding === "closed-front") {
      return;
    }
    if (effectiveNavIndex <= 0) {
      setDirection(-1);
      setAutoPlaying(false);
      if (!isMagazine) {
        setBinding("closed-front");
      }
      return;
    }
    setDirection(-1);
    setAutoPlaying(false);
    goPrevious();
  };

  const handleToggleAutoplay = () => {
    if (!isMagazine && binding !== "open") {
      openBook(binding === "closed-back" ? lastNavIndex : 0);
      setAutoPlaying(true);
      return;
    }
    setAutoPlaying((current) => !current);
  };

  const handleOpenBook = () => {
    openBook(binding === "closed-back" ? lastNavIndex : 0);
  };

  const handleUpdatePage = (pageId: string, patch: Partial<TalisBooksViewerPage>) => {
    setBook((current) => {
      const target = current.pages.find((page) => page.id === pageId);
      if (target && isPermanentViewerPage(target)) {
        return current;
      }
      const targetIndex = current.pages.findIndex((page) => page.id === pageId);
      const pairMate =
        target &&
        (target.layout === "centerfold_left" || target.layout === "centerfold_right") &&
        target.templateId
          ? current.pages[targetIndex + (target.layout === "centerfold_left" ? 1 : -1)]
          : null;
      const pairPatch: Partial<TalisBooksViewerPage> = {};
      if (pairMate?.templateId === target?.templateId) {
        if (patch.spreadImageUrl !== undefined) {
          pairPatch.spreadImageUrl = patch.spreadImageUrl;
        }
        if (patch.heroImageUrl !== undefined) {
          pairPatch.heroImageUrl = patch.heroImageUrl;
        }
        if (patch.title !== undefined) {
          pairPatch.title = patch.title;
        }
        if (patch.body !== undefined) {
          pairPatch.body = patch.body;
        }
      }
      return {
        ...current,
        pages: current.pages.map((page) => {
          if (page.id === pageId) return { ...page, ...patch };
          if (pairMate && page.id === pairMate.id) return { ...page, ...pairPatch };
          return page;
        }),
        title:
          pageId === current.pages[0]?.id && patch.title != null
            ? patch.title
            : current.title,
        subtitle:
          pageId === current.pages[0]?.id && patch.subtitle !== undefined
            ? patch.subtitle
            : current.subtitle,
      };
    });
  };

  const handleAddPage = (afterPageId: string | null) => {
    if (pageInsertLocked) return;
    let insertAt = book.pages.length;
    if (afterPageId) {
      const found = book.pages.findIndex((page) => page.id === afterPageId);
      if (found >= 0) {
        insertAt = found + 1;
      }
    } else if (binding === "open") {
      if (viewMode === "single") {
        insertAt = Math.min(effectiveNavIndex + 1, book.pages.length);
      } else {
        const anchor = spread.right ?? spread.left;
        if (anchor) {
          const found = book.pages.findIndex((page) => page.id === anchor.id);
          if (found >= 0) {
            insertAt = found + 1;
          }
        }
      }
    }

    // Never insert into/after permanent brochure or back-cover system block.
    const firstLocked = book.pages.findIndex((page) => isPermanentViewerPage(page));
    if (firstLocked >= 0 && insertAt > firstLocked) {
      insertAt = firstLocked;
    }
    if (firstLocked >= 0 && insertAt === firstLocked && afterPageId) {
      const after = book.pages.find((page) => page.id === afterPageId);
      if (after && isPermanentViewerPage(after)) {
        insertAt = firstLocked;
      }
    }

    const newPage: TalisBooksViewerPage = {
      id: `page-${Date.now()}`,
      pageNumber: insertAt + 1,
      pageRole: "property_content",
      layout: "caption",
      title: "New page",
      body: "",
      heroImageUrl: "",
    };

    setBook((current) => {
      const pages = [...current.pages];
      pages.splice(insertAt, 0, newPage);
      return {
        ...current,
        pages: pages.map((page, index) => ({
          ...page,
          pageNumber: index + 1,
        })),
      };
    });

    setBinding("open");
    setDirection(1);
    setAutoPlaying(false);

    if (viewMode === "single") {
      goToRef.current(insertAt);
      previousNavRef.current = insertAt;
    } else {
      const spreadTarget = convertViewerNavIndex(
        "single",
        "spread",
        insertAt,
        book.pages.length + 1,
      );
      goToRef.current(spreadTarget);
      previousNavRef.current = spreadTarget;
    }
  };

  const pageLabel =
    !isMagazine && binding === "closed-front"
      ? "Closed · Front hard cover"
      : !isMagazine && binding === "closed-back"
        ? "Closed · Back hard cover"
        : viewMode === "single"
          ? `${describeViewerPage(singlePage)} · ${effectiveNavIndex + 1}/${navCount}`
          : `${describeViewerSpread(spread)} · Spread ${effectiveNavIndex + 1}/${navCount}`;

  const editorLeft =
    binding === "open"
      ? viewMode === "single"
        ? singlePage
        : spread.left
      : null;
  const editorRight =
    binding === "open" && viewMode === "spread" ? spread.right : null;
  const showViewerSidebar = false;
  const isPinnedShowcase = book.slug === PINNED_TALISBOOK_SLUG;
  const backToMapSiteHref = isPinnedShowcase
    ? DEMO_MAPSITE_BUILD_PATH
    : book.fastCode && book.fastCode.trim().toLowerCase() !== "demo"
      ? buildClaimedMapSitePath({
          fastCode: book.fastCode,
          accountType: book.accountType,
        })
      : MAPSITE_APP_PATH;
  const backLinkLabel = isPinnedShowcase
    ? "Demo Mapsite™"
    : "Back to Mapsite™";

  return (
    <div
      className={[
        "talisbooks-viewer",
        isMagazine ? "talisbooks-viewer--magazine" : "talisbooks-viewer--hardcover",
      ].join(" ")}
    >
      <header className="talisbooks-viewer__header">
        <div>
          <p className="talisbooks-viewer__eyebrow">
            {isMagazine
              ? book.listingProfile === "fsbo"
                ? "Talisbooks™ FSBO Demo"
                : "Talisbooks™ Magazine"
              : "Talisbooks™ Viewer"}
          </p>
          <h1 className="talisbooks-viewer__title">{book.title}</h1>
          {book.subtitle ? (
            <p className="talisbooks-viewer__subtitle">{book.subtitle}</p>
          ) : null}
        </div>
        <div
          className={[
            "talisbooks-viewer__header-actions",
            isPinnedShowcase ? "talisbooks-viewer__header-actions--matched" : "",
          ].join(" ")}
        >
          {book.pdfDownloadUrl ? (
            <a
              href={book.pdfDownloadUrl}
              download={book.pdfDownloadFileName || true}
              className="talisbooks-viewer__back"
            >
              Download PDF
            </a>
          ) : null}
          <Link href={backToMapSiteHref} className="talisbooks-viewer__back">
            {backLinkLabel}
          </Link>
          {isPinnedShowcase ? (
            <Link href={ROUTES.HOME} className="talisbooks-viewer__back">
              Home
            </Link>
          ) : null}
          {isPinnedShowcase ? (
            <Link href={ROUTES.ADMIN_DASHBOARD} className="talisbooks-viewer__back">
              Global Admin
            </Link>
          ) : null}
          {!isPinnedShowcase && showDashboard ? (
            <Link href={TALISBOOKS_ROUTES.DASHBOARD} className="talisbooks-viewer__back">
              Dashboard
            </Link>
          ) : null}
        </div>
      </header>
      <TalisBooksViewerBrandRail book={book} />
      <TalisBooksViewerPlaybackRail
        viewMode={viewMode}
        autoPlaying={autoPlaying}
        intervalMs={intervalMs}
        onViewModeChange={handleViewModeChange}
        onToggleAutoplay={handleToggleAutoplay}
        onIntervalChange={setIntervalMs}
      />
      <div className="talisbooks-viewer__layout">
        <div className="talisbooks-viewer__stage-column">
          <TalisBooksViewerStage
            book={book}
            binding={isMagazine ? "open" : binding}
            viewMode={viewMode}
            navIndex={effectiveNavIndex}
            navCount={navCount}
            direction={direction}
            magazine={isMagazine}
            onHoverChange={(hovered) => {
              stageHoverRef.current = hovered;
              syncStagePause();
            }}
            onFlippingChange={(flipping) => {
              flippingRef.current = flipping;
              syncStagePause();
            }}
            onRequestNext={handleNext}
            onRequestPrevious={handlePrevious}
            onOpenBook={handleOpenBook}
          />
        </div>
        {showViewerSidebar && canEditTools ? (
          <aside className="talisbooks-viewer__sidebar">
            <TalisBooksViewerControls
              pageLabel={pageLabel}
              viewMode={viewMode}
              autoPlaying={autoPlaying}
              pausedByHover={pausedByHover}
              intervalMs={intervalMs}
              onViewModeChange={handleViewModeChange}
              onToggleAutoplay={handleToggleAutoplay}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onIntervalChange={setIntervalMs}
            />
            {canLiveEdit ? (
              <TalisBooksViewerLiveEditor
                leftPage={editorLeft}
                rightPage={editorRight}
                bindingLabel={pageLabel}
                viewMode={viewMode}
                onUpdatePage={handleUpdatePage}
                onAddPage={pageInsertLocked ? undefined : handleAddPage}
                pageInsertLocked={pageInsertLocked}
              />
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
