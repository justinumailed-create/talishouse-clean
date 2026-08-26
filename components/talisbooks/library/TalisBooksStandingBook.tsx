"use client";

import Link from "next/link";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import type { TalisBooksLibraryBook } from "@/lib/talisbooks/library/types";

export type TalisBooksShelfBookSize = "hero" | "featured" | "compact";

interface TalisBooksStandingBookProps {
  book: TalisBooksLibraryBook;
  index?: number;
  size?: TalisBooksShelfBookSize;
  /** Meta under covers is off inside physical niches; available for list views. */
  showMeta?: boolean;
}

export default function TalisBooksStandingBook({
  book,
  index = 0,
  size = "featured",
  showMeta = false,
}: TalisBooksStandingBookProps) {
  const href = `${TALISBOOKS_ROUTES.VIEWER}/${book.slug}`;

  return (
    <article
      className={`talisbooks-standing-book talisbooks-standing-book--${size}`}
      style={{ animationDelay: `${Math.min(index, 24) * 18}ms` }}
    >
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="talisbooks-standing-book__link"
        aria-label={`Open ${book.title}${book.subtitle ? ` — ${book.subtitle}` : ""} in a new tab`}
        title={`${book.title} · ${book.publishStatus} · ${book.views} views`}
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
              <div className="talisbooks-standing-book__cover-scrim" />
              <div className="talisbooks-standing-book__cover-copy">
                {book.isPinned ? (
                  <p className="talisbooks-standing-book__cover-kicker">Pinned</p>
                ) : null}
                <p className="talisbooks-standing-book__cover-title">{book.title}</p>
                {book.subtitle && size !== "compact" ? (
                  <p className="talisbooks-standing-book__cover-subtitle">{book.subtitle}</p>
                ) : null}
              </div>
            </div>
            <div className="talisbooks-standing-book__pages" aria-hidden="true" />
          </div>
          <div className="talisbooks-standing-book__contact-shadow" aria-hidden="true" />
        </div>

        {showMeta ? (
          <div className="talisbooks-standing-book__meta">
            <h3 className="talisbooks-standing-book__title">{book.title}</h3>
          </div>
        ) : null}
      </Link>
    </article>
  );
}
