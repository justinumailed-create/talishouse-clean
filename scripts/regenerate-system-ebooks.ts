/**
 * Rebuild the 12 system Talisbooks™ in the standard book format.
 *
 * Dry run (default): reads each brokerage website and prints whether a logo
 * and listings were found. It does not write to the database.
 *
 *   npx tsx scripts/regenerate-system-ebooks.ts
 *
 * Extraction only, no database credentials and no writes:
 *
 *   npx tsx scripts/regenerate-system-ebooks.ts --sources-only
 *
 * Apply, after the books have been reviewed:
 *
 *   SYSTEM_EBOOK_REGENERATE_CONFIRM=yes npx tsx scripts/regenerate-system-ebooks.ts --apply
 *
 * Apply writes scripts/system-ebook-backups/<timestamp>.csv first, then
 * replaces pages on the same book id. The slug, id, and FAST Code stay.
 * Mapsite links are not changed. kk01, kd01, and mkj01 keep their
 * town-photo files and any CC BY line already stored on the book.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "../lib/supabaseAdmin";
import { composeStandardSystemEbook } from "../lib/talisbooks/system-ebook-compose";
import {
  SYSTEM_EBOOK_FAST_CODES,
  SYSTEM_EBOOK_TOWN_PHOTO_CODES,
  placeFromOfficeAddress,
  type SystemEbookProfile,
} from "../lib/talisbooks/system-ebook-format";

const APPLY = process.argv.includes("--apply");
const SOURCES_ONLY = process.argv.includes("--sources-only");

/**
 * Brokerage sites for --sources-only. Apply still reads broker_url from the
 * database. These are the offices behind the 12 published system books.
 */
const SOURCE_SITES: Record<
  string,
  { brokerageName: string; website: string; town: string; province: string; latitude?: number; longitude?: number }
> = {
  dw01: { brokerageName: "The Right Choice Realty", website: "https://therightchoicerealty.ca/", town: "Fredericton", province: "New Brunswick" },
  hml01: { brokerageName: "Alliance Realty", website: "https://www.alliancerealty.nb.ca/", town: "Edmundston", province: "New Brunswick" },
  jdk01: { brokerageName: "Fair Realty", website: "https://fairrealty.com/", town: "Nelson", province: "British Columbia", latitude: 49.4928, longitude: -117.2948 },
  km01: { brokerageName: "Dream Realty SK", website: "https://realestatethebattlefords.ca/", town: "North Battleford", province: "Saskatchewan" },
  lb01: { brokerageName: "Black Tusk Realty", website: "https://www.blacktuskrealty.com/", town: "Squamish", province: "British Columbia" },
  pp03: { brokerageName: "Macdonald Realty", website: "https://macrealty.com/office/macdonald-realty-squamish", town: "Squamish", province: "British Columbia", latitude: 49.7016, longitude: -123.1558 },
  sdp01: { brokerageName: "Parker Real Estate", website: "https://parkerproperty.ca/", town: "Charlottetown", province: "Prince Edward Island" },
  wg01: { brokerageName: "Valhalla Path Realty", website: "https://valhallapathrealty.com/", town: "Nelson", province: "British Columbia" },
  ys01: { brokerageName: "Grassroots Realty Group", website: "https://grassrootsrealtygroup.ca/", town: "Canmore", province: "Alberta" },
  kk01: { brokerageName: "East Coast Realty", website: "https://www.eastcoast-realty.ca/", town: "Souris", province: "Prince Edward Island" },
  kd01: { brokerageName: "LD Agence Immobilière", website: "https://www.ldagence.com/fr", town: "Sherbrooke", province: "Quebec" },
  mkj01: { brokerageName: "DFH Real Estate", website: "https://www.dfh.ca/", town: "Sidney", province: "British Columbia" },
};

function csvCell(value: unknown): string {
  const text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function townPhotoCode(fastCode: string): boolean {
  return (SYSTEM_EBOOK_TOWN_PHOTO_CODES as readonly string[]).includes(fastCode);
}

function reportBook(
  code: string,
  document: Awaited<ReturnType<typeof composeStandardSystemEbook>>,
  extras: string[] = [],
): void {
  const visual = document.listingCount > 0 ? "visual=own-photo" : "";
  console.log(
    [
      code,
      `logo=${document.logoFound ? "found" : "initials"}`,
      `extracted=${document.extractedListingCount}`,
      `listings=${document.listingCount}`,
      `photos=${document.pages.filter((page) => page.layout === "listing" && page.heroImageUrl && !page.heroImageUrl.includes("/town-photos/")).length}`,
      document.lackedListings ? "NO_USABLE_LISTINGS" : "listings-ok",
      visual,
      ...extras,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

async function main(): Promise<void> {
  if (APPLY && SOURCES_ONLY) {
    console.error("Use either --apply or --sources-only, not both.");
    process.exit(1);
  }
  if (APPLY && process.env.SYSTEM_EBOOK_REGENERATE_CONFIRM !== "yes") {
    console.error(
      "Refusing to write. Set SYSTEM_EBOOK_REGENERATE_CONFIRM=yes to apply after review.",
    );
    process.exit(1);
  }
  if (SOURCES_ONLY) {
    const flagged: string[] = [];
    for (const code of SYSTEM_EBOOK_FAST_CODES) {
      const site = SOURCE_SITES[code];
      if (!site) {
        flagged.push(code);
        console.log(`${code} NO_SOURCE_SITE NO_USABLE_LISTINGS`);
        continue;
      }
      const document = await composeStandardSystemEbook({
        fastCode: code,
        brokerageName: site.brokerageName,
        brokerName: "",
        officeAddress: "",
        town: site.town,
        province: site.province,
        website: site.website,
        latitude: site.latitude ?? null,
        longitude: site.longitude ?? null,
      });
      reportBook(code, document);
      if (document.listingCount === 0) flagged.push(code);
    }
    if (flagged.length > 0) {
      console.log(`FLAGGED_NO_OWN_LISTINGS ${flagged.join(",")}`);
      console.log("No book with zero listing pages was written. Sources-only does not write.");
      process.exit(2);
    }
    console.log("Sources only. No rows were changed.");
    return;
  }
  if (!isSupabaseAdminConfigured()) {
    console.error("Database credentials are not configured. Nothing was written.");
    process.exit(1);
  }

  const supabase = getSupabaseAdmin();
  const { data: mapsites, error: mapsiteError } = await supabase
    .from("mapsites")
    .select(
      "id, fast_code, agent_name, property_title, property_address, phone, email, broker_url, website, latitude, longitude",
    )
    .in("fast_code", [...SYSTEM_EBOOK_FAST_CODES]);
  if (mapsiteError) throw new Error(mapsiteError.message);

  const { data: books, error: bookError } = await supabase
    .from("talisbooks_books")
    .select("id, slug, fast_code, title, description, metadata, publish_status, page_count")
    .in("fast_code", [...SYSTEM_EBOOK_FAST_CODES]);
  if (bookError) throw new Error(bookError.message);

  const systemBooks = (books ?? []).filter((book) => {
    const metadata = book.metadata;
    return (
      book.publish_status === "published" &&
      metadata &&
      typeof metadata === "object" &&
      (metadata as { autoGenerated?: boolean }).autoGenerated === true &&
      (metadata as { source?: string }).source === "self-service-pdf"
    );
  });

  const bookIds = systemBooks.map((book) => book.id);
  const { data: pages, error: pageError } = await supabase
    .from("talisbooks_book_pages")
    .select("id, book_id, page_number, title, slug, content")
    .in("book_id", bookIds);
  if (pageError) throw new Error(pageError.message);

  if (APPLY) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dir = join(process.cwd(), "scripts", "system-ebook-backups");
    mkdirSync(dir, { recursive: true });
    const lines = [
      ["record", "book_id", "slug", "fast_code", "page_id", "page_number", "title", "content"].join(","),
    ];
    for (const book of systemBooks) {
      lines.push(
        ["book", book.id, book.slug, book.fast_code, "", "", book.title, book.metadata]
          .map(csvCell)
          .join(","),
      );
    }
    for (const page of pages ?? []) {
      const book = systemBooks.find((row) => row.id === page.book_id);
      lines.push(
        [
          "page",
          page.book_id,
          book?.slug ?? "",
          book?.fast_code ?? "",
          page.id,
          page.page_number,
          page.title,
          page.content,
        ]
          .map(csvCell)
          .join(","),
      );
    }
    const file = join(dir, `${stamp}.csv`);
    writeFileSync(file, `${lines.join("\n")}\n`);
    console.log(`Backed up ${systemBooks.length} books to ${file}`);
  }

  const flagged: string[] = [];
  for (const code of SYSTEM_EBOOK_FAST_CODES) {
    const mapsite = (mapsites ?? []).find((row) => row.fast_code?.toLowerCase() === code);
    const book = systemBooks.find((row) => row.fast_code?.toLowerCase() === code);
    const office = mapsite?.property_address?.trim() || "";
    const place = placeFromOfficeAddress(office);
    const website =
      (mapsite?.broker_url && /^https?:\/\//i.test(mapsite.broker_url) && mapsite.broker_url) ||
      (mapsite?.website && /^https?:\/\//i.test(mapsite.website) && mapsite.website) ||
      "";
    const ownPages = (pages ?? []).filter((page) => page.book_id === book?.id);
    const townPhotoUrls: string[] = [];
    let photoCredit: string | null = null;
    if (townPhotoCode(code)) {
      for (const page of ownPages) {
        const content = page.content;
        if (!content || typeof content !== "object") continue;
        const record = content as Record<string, unknown>;
        for (const key of ["heroImageUrl", "spreadImageUrl"]) {
          const url = record[key];
          if (
            typeof url === "string" &&
            url.includes(`/town-photos/${code}/`) &&
            !townPhotoUrls.includes(url)
          ) {
            townPhotoUrls.push(url);
          }
        }
        if (typeof record.body === "string" && /CC BY/i.test(record.body)) {
          photoCredit = record.body;
        }
      }
    }
    const email =
      mapsite?.email && mapsite.email.includes("@") && !/talispros\.com$/i.test(mapsite.email)
        ? mapsite.email
        : null;
    const profile: SystemEbookProfile = {
      fastCode: code,
      brokerageName: mapsite?.property_title?.trim() || book?.title || code,
      brokerName: mapsite?.agent_name?.trim() || "",
      officeAddress: office,
      town: place.town,
      province: place.province,
      website,
      phone: mapsite?.phone || null,
      email,
      latitude: mapsite?.latitude ?? null,
      longitude: mapsite?.longitude ?? null,
      areaPhotoUrl: townPhotoUrls[0] ?? null,
      townPhotoUrls,
      photoCredit,
    };
    const document = await composeStandardSystemEbook(profile);
    reportBook(code, document, [
      townPhotoUrls.length ? `town-photos=${townPhotoUrls.length}` : "",
      photoCredit ? "credit-kept" : "",
      book ? `book=${book.slug}` : "NO_PUBLISHED_BOOK",
    ]);

    if (document.listingCount === 0) {
      flagged.push(code);
      if (APPLY) console.error(`${code}: left the published book unchanged.`);
      continue;
    }

    if (!APPLY || !book) continue;

    const now = new Date().toISOString();
    const { error: deleteError } = await supabase
      .from("talisbooks_book_pages")
      .delete()
      .eq("book_id", book.id);
    if (deleteError) throw new Error(`${code}: ${deleteError.message}`);
    const { error: insertError } = await supabase.from("talisbooks_book_pages").insert(
      document.pageRows.map((row) => ({
        book_id: book.id,
        title: row.title,
        slug: row.slug,
        page_number: row.page_number,
        sort_order: row.sort_order,
        content: row.content,
        is_visible: true,
        created_at: now,
        updated_at: now,
      })),
    );
    if (insertError) throw new Error(`${code}: ${insertError.message}`);
    const previous =
      book.metadata && typeof book.metadata === "object"
        ? (book.metadata as Record<string, unknown>)
        : {};
    const { error: updateError } = await supabase
      .from("talisbooks_books")
      .update({
        title: document.title,
        subtitle: document.subtitle,
        description: document.description,
        page_count: document.pageRows.length,
        metadata: {
          ...previous,
          ...document.metadata,
          source: previous.source ?? "self-service-pdf",
        },
        updated_at: now,
      })
      .eq("id", book.id);
    if (updateError) throw new Error(`${code}: ${updateError.message}`);
  }

  if (flagged.length > 0) {
    console.log(`FLAGGED_NO_OWN_LISTINGS ${flagged.join(",")}`);
    process.exit(2);
  }
  if (!APPLY) {
    console.log("Dry run only. No rows were changed.");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
