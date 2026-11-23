/**
 * "Income Units, Proposal by Webster": the web book on the Talishouse™
 * (Windswept) PIN of the public Mapsites map (Ralf, Nov 23). The Catalogue
 * is the next step after it, through a button.
 *
 * Pages are the book's slides as webp (`/public/talisbooks/webster/pages/`),
 * from Ralf's PDF of Nov 23. Only the book itself is used: the Aisha call
 * script and Q&A that followed it in the PDF are not part of the web book.
 * On the Pricing page the blank Notes lines are replaced, for the web, by a
 * "Book a call with Webster" button over that area. Webster's portrait
 * (last page) uses the same passport-style grey backdrop as Aisha's portrait.
 */

export const WEBSTER_BOOK_HREF = "/income-units";
export const WEBSTER_BOOK_ASSET_ROOT = "/talisbooks/webster";
export const WEBSTER_BOOK_PAGE_COUNT = 8;
/** 1-based page that carries Pricing (left) and the web "Book a call" area (right). */
export const WEBSTER_BOOK_PRICING_PAGE = 7;
/** First full photo page after the pitch: the "income lost" line sits on it (Ralf, Nov 23). */
export const WEBSTER_BOOK_LOSS_PAGE = 3;
/** Webster's call page (his guide with the live call opened). */
export const WEBSTER_CALL_HREF = "/webster?call=1";
export const WEBSTER_BOOK_COVER = websterBookPageSrc(1);

/** Same in every language (proper title of Ralf's book). */
export const WEBSTER_BOOK_TITLE = "Income Units";

export function websterBookPageSrc(page: number): string {
  return `${WEBSTER_BOOK_ASSET_ROOT}/pages/page-${String(page).padStart(2, "0")}.webp`;
}

export function websterBookPages(): { page: number; src: string }[] {
  return Array.from({ length: WEBSTER_BOOK_PAGE_COUNT }, (_, index) => ({
    page: index + 1,
    src: websterBookPageSrc(index + 1),
  }));
}
