import Link from "next/link";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import {
  HIDDEN_BOOKS,
  HIDDEN_BOOKSHELF_TITLE,
  hiddenBookHref,
  type HiddenBook,
} from "@/lib/talisbooks/hidden-bookshelf";

/** Hero book on the first plank, then two per plank, as on Ralf's shelf. */
function shelfRows(books: readonly HiddenBook[]): HiddenBook[][] {
  if (books.length === 0) return [];
  const rows: HiddenBook[][] = [[books[0]!]];
  for (let index = 1; index < books.length; index += 2) {
    rows.push(books.slice(index, index + 2));
  }
  return rows;
}

function HiddenStandingBook({
  book,
  index,
  size,
}: {
  book: HiddenBook;
  index: number;
  size: "hero" | "featured";
}) {
  return (
    <article
      className={`talisbooks-standing-book talisbooks-standing-book--${size}`}
      style={{ animationDelay: `${Math.min(index, 24) * 18}ms` }}
    >
      <div className="talisbooks-standing-book__frame">
        <Link
          href={hiddenBookHref(book.slug)}
          className="talisbooks-standing-book__link"
          aria-label={`Open ${book.title}`}
          title={book.title}
          data-testid={`hidden-book-${book.slug}`}
        >
          <div className="talisbooks-standing-book__scene">
            <div
              className="talisbooks-standing-book__volume"
              style={{ ["--book-cover" as string]: book.coverGradient }}
            >
              <div className="talisbooks-standing-book__spine" aria-hidden="true" />
              <div className="talisbooks-standing-book__cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={book.coverImage}
                  alt=""
                  className="talisbooks-standing-book__cover-image"
                />
              </div>
              <div className="talisbooks-standing-book__pages" aria-hidden="true" />
            </div>
            <div className="talisbooks-standing-book__contact-shadow" aria-hidden="true" />
          </div>
        </Link>
      </div>
    </article>
  );
}

/**
 * Unlisted shelf at /private-shelf. Same plank, alcove and standing-book
 * styling as the Tsplits™ bookshelf; books open in the page-turning reader.
 */
export default function HiddenBookshelfView({
  books = HIDDEN_BOOKS,
}: {
  books?: readonly HiddenBook[];
}) {
  const rows = shelfRows(books);
  let startIndex = 0;

  return (
    <div className="talisbooks-library-shell" data-testid="hidden-bookshelf">
      <TalisUMktsHeader />
      <div className="talisbooks-library">
        <header className="talisbooks-library__topbar">
          <div className="talisbooks-library__brand">
            <h1 className="talisbooks-library__title">{HIDDEN_BOOKSHELF_TITLE}</h1>
          </div>
        </header>
        <div
          className="talisbooks-library__case"
          style={{ maxWidth: 520, marginInline: "auto" }}
        >
          <section
            className="talisbooks-library__niche talisbooks-library__niche--featured"
            aria-label={HIDDEN_BOOKSHELF_TITLE}
          >
            <div className="talisbooks-library__niche-inner">
              <div className="talisbooks-library__alcove">
                <div className="talisbooks-library__featured talisbooks-library__featured--hero">
                  {rows.map((row, rowIndex) => {
                    const rowStart = startIndex;
                    startIndex += row.length;
                    return (
                      <div key={`hidden-row-${rowIndex}`} className="talisbooks-library__shelf-bay">
                        <div
                          className={[
                            "talisbooks-library__shelf-row",
                            rowIndex === 0 ? "talisbooks-library__shelf-row--hero" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          role="list"
                        >
                          {row.map((book, index) => (
                            <div key={book.slug} role="listitem" className="talisbooks-library__shelf-slot">
                              <HiddenStandingBook
                                book={book}
                                index={rowStart + index}
                                size={rowIndex === 0 ? "hero" : "featured"}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="talisbooks-library__plank" aria-hidden="true">
                          <span className="talisbooks-library__plank-face" />
                          <span className="talisbooks-library__plank-shadow" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
