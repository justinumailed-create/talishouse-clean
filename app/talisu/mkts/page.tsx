import Link from "next/link";
import type { TalisMapsPin } from "@/lib/talismaps";
import { listAllPinsAggregatedPins } from "@/lib/talispros/allpins-mapsite";
import { TALISU_MARKETS_COPY } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";
import TalisUMarketsMap from "@/components/talisu/TalisUMarketsMap";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Markets served",
  description: TALISU_MARKETS_COPY.body,
  path: "/talisu/mkts",
});

export const dynamic = "force-dynamic";

function toEmbedPins(
  pins: Awaited<ReturnType<typeof listAllPinsAggregatedPins>>
): TalisMapsPin[] {
  return pins.map((pin, index) => ({
    id: pin.id,
    name: pin.label || pin.fastCode.toUpperCase(),
    description: pin.address || "",
    categoryId: null,
    categorySlug: null,
    categoryName: null,
    categoryColor: pin.pinColor || "#F59E0B",
    latitude: pin.latitude,
    longitude: pin.longitude,
    address: pin.address || "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada",
    website: pin.mapsiteHref || "",
    phone: "",
    email: "",
    featured: true,
    sortOrder: index,
    pinIcon: pin.pinIcon,
    pinColor: pin.pinColor,
    pinBorder: pin.pinBorder,
    whiteCenter: pin.whiteCenter,
    pinAnimated: pin.pinAnimated,
    href: pin.mapsiteHref,
  }));
}

export default async function TalisUMarketsPage() {
  const aggregated = await listAllPinsAggregatedPins();
  const pins = toEmbedPins(aggregated);

  return (
    <SectionShell title={TALISU_MARKETS_COPY.title} subtitle={TALISU_MARKETS_COPY.body}>
      <TalisUMarketsMap pins={pins} />
      <div className="mt-8 text-center">
        <Link
          href={TALISU_MARKETS_COPY.claimHref}
          className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
        >
          Claim a market
        </Link>
      </div>
    </SectionShell>
  );
}
