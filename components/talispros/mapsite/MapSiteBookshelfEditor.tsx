"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  rectSwappingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  loadOwnerBookshelfAction,
  saveBookshelfOrderAction,
  type OwnerShelfBook,
} from "@/app/talispros/mapsite/dashboard-actions";
import {
  insertBookAt,
  nudgeBook,
  swapBooks,
} from "@/lib/talispros/mapsite-owner-customizations";
import MapSiteDashboardPanel, { DashboardNotice } from "./MapSiteDashboardPanel";

type DropMode = "insert" | "swap";

type MapSiteBookshelfEditorProps = {
  mapsiteId: string;
  fastCode: string;
  onClose: () => void;
};

function SortableBook({
  book,
  index,
  total,
  onNudge,
}: {
  book: OwnerShelfBook;
  index: number;
  total: number;
  onNudge: (id: string, delta: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: book.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex flex-col items-center gap-1 rounded-md p-1 ${
        isDragging ? "z-10 opacity-70" : ""
      } ${isOver && !isDragging ? "ring-2 ring-[#046BD9]" : ""}`}
      data-book-id={book.id}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${book.title} (position ${index + 1} of ${total})`}
        className="relative aspect-[3/4] w-full cursor-grab touch-manipulation select-none overflow-hidden rounded-[3px] shadow-md active:cursor-grabbing"
        style={{ background: book.coverGradient }}
      >
        {book.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImageUrl}
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full object-cover"
          />
        ) : (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center p-1 text-center text-[10px] font-semibold leading-tight text-white">
            {book.title}
          </span>
        )}
        <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-semibold text-white">
          {index + 1}
        </span>
        {index === 0 ? (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-[#046BD9]/90 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wide text-white">
            Hero
          </span>
        ) : null}
      </button>
      <span className="line-clamp-2 w-full text-center text-[10px] leading-tight text-neutral-700">
        {book.title}
      </span>
      <span className="flex gap-1">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onNudge(book.id, -1)}
          aria-label={`Move ${book.title} earlier`}
          className="rounded border border-neutral-200 px-1.5 text-[11px] disabled:opacity-30"
        >
          ←
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onNudge(book.id, 1)}
          aria-label={`Move ${book.title} later`}
          className="rounded border border-neutral-200 px-1.5 text-[11px] disabled:opacity-30"
        >
          →
        </button>
      </span>
    </li>
  );
}

/**
 * Bookshelf Editor: drag-and-drop the owner's ebooks (mouse, touch long-press,
 * or keyboard). Drop on a book to insert there, or switch to Swap.
 * Saved per FAST Code and used on every FAST-scoped shelf.
 */
export default function MapSiteBookshelfEditor({
  mapsiteId,
  fastCode,
  onClose,
}: MapSiteBookshelfEditorProps) {
  const [books, setBooks] = useState<OwnerShelfBook[] | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<DropMode>("insert");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void loadOwnerBookshelfAction({ mapsiteId, fastCode }).then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        setError(result.error);
        setBooks([]);
        return;
      }
      setBooks(result.books);
      setSavedIds(result.books.map((book) => book.id));
    });
    return () => {
      cancelled = true;
    };
  }, [mapsiteId, fastCode]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // Long-press to pick up on touch so the panel can still scroll.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => (books ?? []).map((book) => book.id), [books]);
  const dirty = ids.join("|") !== savedIds.join("|");

  const reorder = useCallback(
    (nextIds: string[]) => {
      setBooks((current) => {
        if (!current) return current;
        const byId = new Map(current.map((book) => [book.id, book]));
        return nextIds.map((id) => byId.get(id)!).filter(Boolean);
      });
      setMessage(null);
    },
    [],
  );

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || overId === activeId) return;
    reorder(
      mode === "swap"
        ? swapBooks(ids, activeId, overId)
        : insertBookAt(ids, activeId, overId),
    );
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveBookshelfOrderAction({
        mapsiteId,
        fastCode,
        orderedBookIds: ids,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setBooks(result.books);
      setSavedIds(result.books.map((book) => book.id));
      setMessage("Bookshelf order saved. Your shelf now shows books in this order.");
    });
  }

  return (
    <MapSiteDashboardPanel title="Bookshelf Editor" fastCode={fastCode} onClose={onClose} wide>
      {message ? <DashboardNotice tone="success">{message}</DashboardNotice> : null}
      {error ? <DashboardNotice tone="error">{error}</DashboardNotice> : null}

      <p className="text-[11px] leading-relaxed text-neutral-500">
        Drag a cover to a new spot (long-press on touch). Drop it on another book to{" "}
        {mode === "swap" ? "swap the two" : "insert it at that position"}. Book 1 is the
        hero on your shelf.
      </p>

      <div role="radiogroup" aria-label="Drop behavior" className="flex gap-1.5">
        {(["insert", "swap"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${
              mode === value
                ? "bg-[#046BD9] text-white ring-[#046BD9]"
                : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {value === "insert" ? "Insert" : "Swap"}
          </button>
        ))}
      </div>

      {books === null ? (
        <p className="text-xs text-neutral-500">Loading your bookshelf…</p>
      ) : books.length === 0 ? (
        <p className="text-xs text-neutral-500">No ebooks on this FAST Code™ shelf yet.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={ids}
            strategy={mode === "swap" ? rectSwappingStrategy : rectSortingStrategy}
          >
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Bookshelf order">
              {books.map((book, index) => (
                <SortableBook
                  key={book.id}
                  book={book}
                  index={index}
                  total={books.length}
                  onNudge={(id, delta) => reorder(nudgeBook(ids, id, delta))}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending || !books?.length}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save order"}
        </button>
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() => reorder(savedIds)}
          className="rounded-md px-2 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
        >
          Undo changes
        </button>
        <a
          href={`/talisbooks/fast/${encodeURIComponent(fastCode.trim().toLowerCase())}`}
          className="ml-auto text-xs font-medium text-[#046BD9] hover:underline"
        >
          Open bookshelf
        </a>
      </div>
    </MapSiteDashboardPanel>
  );
}
