import Link from "next/link";
import { SEA_CAN_NOTES, SEA_CAN_SKUS } from "@/lib/talisu/content";
import { TALISU_CARD } from "@/lib/talisu/ui";

export default function SeaCanProductGrid({
  linkToCheckout = true,
}: {
  linkToCheckout?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SEA_CAN_SKUS.map((sku) => {
          const inner = (
            <>
              <p className="text-xs uppercase tracking-wider text-[#0069CF]">
                {sku.code}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-neutral-950">
                {sku.name}
              </h3>
              <p className="mt-2 text-sm text-neutral-700">{sku.dimensions}</p>
              <p className="mt-1 text-sm text-neutral-500">{sku.blurb}</p>
            </>
          );

          if (linkToCheckout) {
            return (
              <Link
                key={sku.slug}
                href={`/talisu/bo/${sku.slug}`}
                className={`${TALISU_CARD} transition hover:ring-[#0069CF]/40`}
              >
                {inner}
              </Link>
            );
          }

          return (
            <div key={sku.slug} className={TALISU_CARD}>
              {inner}
            </div>
          );
        })}
      </div>

      <div className={TALISU_CARD}>
        <p className="mb-2 text-sm font-medium text-neutral-950">Please note:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600">
          {SEA_CAN_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
