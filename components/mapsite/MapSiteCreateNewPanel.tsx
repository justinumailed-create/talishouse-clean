import Link from "next/link";
import {
  mapsiteCreateContentHref,
  mapsiteCreateEbookHref,
  mapsiteCreateVideoHref,
} from "@/lib/mapsite-layout";

interface MapSiteCreateNewPanelProps {
  fastCode: string;
  buildRequestId?: string;
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
}: MapSiteCreateNewPanelProps) {
  const code = fastCode.trim().toUpperCase() || "this FAST Code";

  return (
    <div className="flex h-full min-h-0 flex-col justify-center">
      <h2 className="m-0 text-3xl font-semibold tracking-[-0.03em] text-[#1d1d1f] sm:text-4xl">
        Create New
      </h2>
      <div className="mt-10 flex flex-col divide-y divide-neutral-200/80 sm:mt-12">
        {ITEMS.map((item) => (
          <div key={item.title} className="py-7 first:pt-0 last:pb-0 sm:py-8">
            <h3 className="m-0 text-2xl font-semibold tracking-tight text-[#1d1d1f] sm:text-[28px]">
              {item.title}
            </h3>
            <p className="mt-2 max-w-md text-[17px] leading-snug text-[#6e6e73]">
              {item.description(code)}
            </p>
            <Link
              href={item.href(fastCode, buildRequestId)}
              className="mt-4 inline-flex items-center text-[17px] font-medium text-[#06c] no-underline transition-opacity hover:opacity-70"
            >
              {item.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
