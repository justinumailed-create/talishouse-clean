"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { displayShelfBookTitle } from "@/lib/talisbooks/book-title";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import type { TalisBooksLibraryBook } from "@/lib/talisbooks/library/types";

export type TalisBooksShelfBookSize = "hero" | "featured" | "compact";

interface TalisBooksStandingBookProps {
  book: TalisBooksLibraryBook;
  index?: number;
  size?: TalisBooksShelfBookSize;
  /** Meta under covers is off inside physical niches; available for list views. */
  showMeta?: boolean;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: (book: TalisBooksLibraryBook) => void;
}

export default function TalisBooksStandingBook({
  book,
  index = 0,
  size = "featured",
  showMeta = false,
  canDelete = false,
  deleting = false,
  onDelete,
}: TalisBooksStandingBookProps) {
  const href = `${TALISBOOKS_ROUTES.VIEWER}/${book.slug}`;
  const displayTitle = displayShelfBookTitle(book.title);
  const openLabel = displayTitle
    ? `Open ${displayTitle}${book.subtitle ? ` — ${book.subtitle}` : ""}`
    : "Open ebook";
  const tipTitle = displayTitle
    ? `${displayTitle} · ${book.publishStatus} · ${book.views} views`
    : `${book.publishStatus} · ${book.views} views`;

  return (
    <article
      className={`talisbooks-standing-book talisbooks-standing-book--${size}`}
      style={{ animationDelay: `${Math.min(index, 24) * 18}ms` }}
    >
      <div className="talisbooks-standing-book__frame">
        {canDelete ? (
          <button
            type="button"
            className="talisbooks-standing-book__delete"
            aria-label={displayTitle ? `Delete ${displayTitle}` : "Delete ebook"}
            title="Delete ebook"
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete?.(book);
            }}
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
        <Link
          href={href}
          className="talisbooks-standing-book__link"
          aria-label={openLabel}
          title={tipTitle}
        >
        <div className="talisbooks-standing-book__scene">
          <div
            className="talisbooks-standing-book__volume"
            style={{ ["--book-cover" as string]: book.coverGradient }}
          >
            <div className="talisbooks-standing-book__spine" aria-hidden="true" />
            <div className="talisbooks-standing-book__cover">
              {book.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverImageUrl}
                  alt=""
                  className="talisbooks-standing-book__cover-image"
                />
              ) : (
                <div
                  className="talisbooks-standing-book__cover-fallback"
                  style={{ backgroundImage: book.coverGradient }}
                />
              )}
            </div>
            <div className="talisbooks-standing-book__pages" aria-hidden="true" />
          </div>
          <div className="talisbooks-standing-book__contact-shadow" aria-hidden="true" />
        </div>

        {showMeta ? (
          <div className="talisbooks-standing-book__meta">
            {displayTitle ? (
              <h3 className="talisbooks-standing-book__title">{displayTitle}</h3>
            ) : null}
          </div>
        ) : null}
      </Link>
      </div>
    </article>
  );
}
