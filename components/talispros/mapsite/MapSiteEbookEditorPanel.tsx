"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  loadOwnerBookshelfAction,
  type OwnerShelfBook,
} from "@/app/talispros/mapsite/dashboard-actions";
import { deleteOwnerEbookAction } from "@/app/talispros/mapsite/ebook-editor-actions";
import {
  ownerEbookCreatePath,
  ownerEbookEditorPath,
} from "@/lib/talispros/owner-ebook-routes";
import MapSiteDashboardPanel, { DashboardNotice } from "./MapSiteDashboardPanel";

type MapSiteEbookEditorPanelProps = {
  mapsiteId: string;
  fastCode: string;
  onClose: () => void;
};

/** Ebook Editor panel: the owner's ebooks with Edit / Create new / Delete. */
export default function MapSiteEbookEditorPanel({
  mapsiteId,
  fastCode,
  onClose,
}: MapSiteEbookEditorPanelProps) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [books, setBooks] = useState<OwnerShelfBook[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const back = pathname || null;

  useEffect(() => {
    let cancelled = false;
    void loadOwnerBookshelfAction({ mapsiteId, fastCode }).then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        setError(result.error);
        setBooks([]);
        return;
      }
      // Synthetic demo shelf entries are not real rows and cannot be edited.
      setBooks(result.books);
    });
    return () => {
      cancelled = true;
    };
  }, [mapsiteId, fastCode]);

  function remove(book: OwnerShelfBook) {
    if (
      !window.confirm(
        `Delete “${book.title}”? This removes it from your shelf and cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(book.id);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteOwnerEbookAction({ fastCode, bookId: book.id });
      setDeletingId(null);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setBooks((current) => (current ?? []).filter((item) => item.id !== book.id));
      setMessage(`Deleted “${book.title}”.`);
      router.refresh();
    });
  }

  return (
    <MapSiteDashboardPanel title="Ebook Editor" fastCode={fastCode} onClose={onClose} wide>
      {message ? <DashboardNotice tone="success">{message}</DashboardNotice> : null}
      {error ? <DashboardNotice tone="error">{error}</DashboardNotice> : null}

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Edit any ebook on your shelf, create a new one, or delete ones you no longer need.
        </p>
        <Link
          href={ownerEbookCreatePath(fastCode, back)}
          className="shrink-0 rounded-md bg-[#046BD9] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#035bb8]"
        >
          + Create new ebook
        </Link>
      </div>

      {books === null ? (
        <p className="text-xs text-neutral-500">Loading your ebooks…</p>
      ) : books.length === 0 ? (
        <p className="text-xs text-neutral-500">No ebooks yet. Create your first one.</p>
      ) : (
        <ul className="space-y-2">
          {books.map((book) => (
            <li
              key={book.id}
              className="flex items-center gap-3 rounded-md border border-neutral-200 p-2"
            >
              <div
                className="h-14 w-10 shrink-0 overflow-hidden rounded-[3px] shadow"
                style={{ background: book.coverGradient }}
              >
                {book.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverImageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{book.title}</p>
                <p className="text-[11px] capitalize text-neutral-500">{book.publishStatus}</p>
              </div>
              <a
                href={`/talisbooks/viewer/${encodeURIComponent(book.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-100"
              >
                View
              </a>
              <Link
                href={ownerEbookEditorPath(fastCode, book.id, back)}
                className="rounded-md border border-neutral-300 px-2.5 py-1 text-[11px] font-semibold hover:bg-neutral-50"
              >
                Edit
              </Link>
              <button
                type="button"
                disabled={deletingId === book.id}
                onClick={() => remove(book)}
                className="rounded-md px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId === book.id ? "Deleting…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </MapSiteDashboardPanel>
  );
}
