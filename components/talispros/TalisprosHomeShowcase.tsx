import Image from "next/image";
import { TALISPROS_HOME_SHOWCASE_PANELS } from "@/lib/talispros/start-content";

/**
 * Right homepage column: system roadmap screens / product showcase
 * (Mapsites, Markets, ebooks, catalogue) — not SamCart funnel marketing.
 */
export default function TalisprosHomeShowcase() {
  return (
    <aside
      className="flex min-h-0 flex-1 flex-col bg-[#f2f2f0] text-neutral-900 lg:border-l lg:border-[#dedede]"
      aria-label="Talispros™ system roadmap"
    >
      <div className="shrink-0 border-b border-[#dedede] px-5 py-5 sm:px-7 sm:py-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
          System roadmap
        </p>
        <h2 className="mt-1.5 text-[22px] leading-tight tracking-[-0.01em] text-neutral-900 sm:text-[26px]">
          Mapsites™, ebooks, markets &amp; more
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-snug text-neutral-600 sm:text-[15px]">
          A quick look at the surfaces you run after you claim a market — from
          pinned Mapsites™ to Talisbooks™ and territory on the map.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:space-y-5 sm:px-6 sm:py-6 lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]">
        {TALISPROS_HOME_SHOWCASE_PANELS.map((panel) => (
          <article
            key={panel.id}
            className="overflow-hidden border border-[#dedede] bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-center gap-1.5 border-b border-[#ececec] bg-[#fafafa] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-[#e2e2e2]" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-[#e2e2e2]" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-[#e2e2e2]" aria-hidden />
              <span className="ml-2 truncate text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                {panel.eyebrow}
              </span>
            </div>
            <div className="relative aspect-[16/9] bg-neutral-200 sm:aspect-[2/1]">
              <Image
                src={panel.imageSrc}
                alt={panel.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
                priority={panel.id === "mapsites"}
              />
            </div>
            <div className="px-4 py-3.5 sm:px-5 sm:py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                {panel.eyebrow}
              </p>
              <h3 className="mt-1 text-[17px] font-semibold leading-snug tracking-tight text-neutral-900 sm:text-[18px]">
                {panel.title}
              </h3>
              <p className="mt-1.5 text-sm leading-snug text-neutral-600">
                {panel.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
