import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export function formatCAD(n: number): string {
  return n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ExplanationSectionsProps {
  planLabel: string;
  price?: number;
  monthly?: number;
  bullets: string[];
  ctaHref: string;
  ctaLabel: string;
}

export function ExplanationSections({
  planLabel,
  price,
  monthly,
  bullets,
  ctaHref,
  ctaLabel,
}: ExplanationSectionsProps) {
  return (
    <div className="max-w-2xl mx-auto px-5 pb-20 sm:pb-28">
      {/* FAST Codes™ */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-3">
          What is a FAST Code™?
        </h2>
        <div className="text-sm text-neutral-600 space-y-3 leading-relaxed">
          <p>
            A FAST Code™ is your unique gateway identifier in the TalisPros™ ecosystem.
            It functions as a universal account access key — share it with clients,
            partners, and referral sources so they can find your MapSite™ instantly.
          </p>
          <p>
            Every account type receives a permanent, human-readable FAST Code™
            that is stored permanently and never duplicated.
          </p>
        </div>
      </section>

      <hr className="border-t border-neutral-200 mb-12" />

      {/* MapSites™ */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-3">
          What is a MapSite™?
        </h2>
        <div className="text-sm text-neutral-600 space-y-3 leading-relaxed">
          <p>
            A MapSite™ is your dedicated property discovery page inside the TalisPros™
            marketplace. It serves as your professional storefront where potential
            buyers and sellers can find your listings, learn about your services,
            and connect with you directly.
          </p>
          <p>
            Each MapSite™ is linked to your FAST Code™ and is immediately accessible
            at your unique URL upon registration.
          </p>
        </div>
      </section>

      <hr className="border-t border-neutral-200 mb-12" />

      {/* TalisMaps™ */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-3">
          What is TalisMaps™?
        </h2>
        <div className="text-sm text-neutral-600 space-y-3 leading-relaxed">
          <p>
            TalisMaps™ is the interactive mapping layer that powers all TalisPros™
            marketplaces. It displays property pins, AdPro™ placements, and market
            overlays on an interactive map, making it easy for clients to explore
            listings and for professionals to showcase their coverage areas.
          </p>
          <p>
            Future versions will include search, category filtering, and market
            intelligence overlays.
          </p>
        </div>
      </section>

      <hr className="border-t border-neutral-200 mb-12" />

      {/* Recommended Plan */}
      <section className="mb-12">
        <div className="rounded-2xl border-2 border-neutral-900 p-6 sm:p-8 shadow-md">
          <h2 className="text-xl font-semibold text-neutral-900 mb-1">
            Recommended: {planLabel}
          </h2>
          <p className="text-sm text-neutral-500 mt-1 mb-4">
            Best suited for your profile based on your needs.
          </p>

          {price !== undefined && (
            <div className="mb-4">
              {monthly !== undefined ? (
                <>
                  <div className="text-lg font-bold text-neutral-900">CAD {formatCAD(price)}</div>
                  <div className="text-xs text-neutral-400">setup</div>
                  <div className="text-lg font-bold text-neutral-900 mt-1">CAD {formatCAD(monthly)}</div>
                  <div className="text-xs text-neutral-400">/month</div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-neutral-900">CAD {formatCAD(price)}</div>
                  <div className="text-xs text-neutral-400">/month</div>
                </>
              )}
            </div>
          )}

          <ul className="space-y-1.5 mb-5">
            {bullets.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-neutral-600">
                <Check className="w-3.5 h-3.5 text-neutral-900 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Link
            href={ctaHref}
            className="inline-flex h-11 w-full rounded-xl bg-neutral-900 text-white text-sm font-medium tracking-wide items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all"
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export const FSBO_BULLETS = [
  "Individual business placement",
  "Month-to-month — no long-term commitment",
  "Advertise your property directly",
  "Get discovered by motivated buyers",
  "No SPLITS — full control",
];

export const INVESTOR_BULLETS = [
  "Multi-PIN support for multiple properties",
  "FAST Code generation",
  "Operates under a Root Account™",
  "SPLITS enabled for team collaboration",
  "Lower entry cost with room to grow",
];

export const DEVELOPER_BULLETS = [
  "Up to 100 Derivative Accounts",
  "SPLITS enabled",
  "Market ownership",
  "FAST Code generation",
  "Claim A Market™ eligibility",
];
