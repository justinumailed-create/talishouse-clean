import Link from "next/link";
import { SEA_CAN_NOTES, SEA_CAN_SKUS } from "@/lib/talisu/content";

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
              <p className="text-xs uppercase tracking-wider text-amber-300/80">
                {sku.code}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {sku.name}
              </h3>
              <p className="mt-2 text-sm text-white/70">{sku.dimensions}</p>
              <p className="mt-1 text-sm text-white/50">{sku.blurb}</p>
            </>
          );

          if (linkToCheckout) {
            return (
              <Link
                key={sku.slug}
                href={`/talisu/bo/${sku.slug}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-amber-400/40 hover:bg-white/10"
              >
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={sku.slug}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              {inner}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
        <p className="mb-2 text-sm font-medium text-white">Please note:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-white/60">
          {SEA_CAN_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
