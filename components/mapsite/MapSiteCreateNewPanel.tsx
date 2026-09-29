import Link from "next/link";
import {
  mapsiteCreateContentHref,
  mapsiteCreateEbookHref,
  mapsiteCreateVideoHref,
} from "@/lib/mapsite-layout";

interface MapSiteCreateNewPanelProps {
  fastCode: string;
  buildRequestId?: string;
  /** Demo Mapsites™: grey out Create New so visitors cannot insert pages. */
  pageInsertLocked?: boolean;
}

const ITEMS: {
  title: string;
  description: (code: string) => string;
  cta: string;
  href: (fastCode: string, requestId?: string) => string;
}[] = [
  {
    title: "E-Books",
    description: (code) =>
      `Generate a Talisbook™ for FAST Code ${code} and add it to this Mapsite™ shelf.`,
    cta: "Create e-book",
    href: (fastCode, requestId) => mapsiteCreateEbookHref(fastCode, requestId),
  },
  {
    title: "Content",
    description: () =>
      "Update listing copy, photos, and pin details for this Mapsite™.",
    cta: "Open editor",
    href: (fastCode) => mapsiteCreateContentHref(fastCode),
  },
  {
    title: "Video",
    description: () =>
      "Add programming to this Mapsite™ In-House Online TV Channel.",
    cta: "Open TalisTV™",
    href: (fastCode) => mapsiteCreateVideoHref(fastCode),
  },
];

export default function MapSiteCreateNewPanel({
  fastCode,
  buildRequestId,
  pageInsertLocked = false,
}: MapSiteCreateNewPanelProps) {
  const code = fastCode.trim().toUpperCase() || "this FAST Code";

  return (
    <div
      className={[
        "flex h-full min-h-0 flex-col justify-center",
        pageInsertLocked ? "select-none" : "",
      ].join(" ")}
      aria-disabled={pageInsertLocked || undefined}
      data-demo-page-insert-locked={pageInsertLocked ? "true" : undefined}
      inert={pageInsertLocked || undefined}
    >
      <h2
        className={[
          "m-0 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl",
          pageInsertLocked ? "text-neutral-400" : "text-[#1d1d1f]",
        ].join(" ")}
      >
        Create New
      </h2>
      {pageInsertLocked ? (
        <p className="mt-3 max-w-md text-[15px] leading-snug text-neutral-500">
          Demonstration only — inserting pages stays locked so Fractionalization,
          Tokenization, and SPLITS remain paid Mapsite™ capabilities.
        </p>
      ) : null}
      <div
        className={[
          "mt-10 flex flex-col divide-y divide-neutral-200/80 sm:mt-12",
          pageInsertLocked ? "pointer-events-none opacity-45 grayscale" : "",
        ].join(" ")}
      >
        {ITEMS.map((item) => (
          <div key={item.title} className="py-7 first:pt-0 last:pb-0 sm:py-8">
            <h3
              className={[
                "m-0 text-2xl font-semibold tracking-tight sm:text-[28px]",
                pageInsertLocked ? "text-neutral-500" : "text-[#1d1d1f]",
              ].join(" ")}
            >
              {item.title}
            </h3>
            <p className="mt-2 max-w-md text-[17px] leading-snug text-[#6e6e73]">
              {item.description(code)}
            </p>
            {pageInsertLocked ? (
              <span
                className="mt-4 inline-flex cursor-not-allowed items-center text-[17px] font-medium text-neutral-400 no-underline"
                aria-disabled="true"
              >
                {item.cta}
              </span>
            ) : (
              <Link
                href={item.href(fastCode, buildRequestId)}
                className="mt-4 inline-flex items-center text-[17px] font-medium text-[#06c] no-underline transition-opacity hover:opacity-70"
              >
                {item.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
