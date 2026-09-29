import Image from "next/image";
import Link from "next/link";
import { TALISPROS_HOME_DEMO_FLOW } from "@/lib/talispros/start-content";

/**
 * Right homepage column: demo flow of actual system screens
 * Talismaps™ → Talisbooks™ Bookshelf → claimed Mapsite™ (with arrows).
 * No stock / 3D neighborhood art.
 */
export default function TalisprosHomeShowcase() {
  return (
    <aside
      className="flex min-h-0 flex-1 flex-col bg-[#f2f2f0] text-neutral-900 lg:border-l lg:border-[#dedede]"
      aria-label="Talispros™ system demo flow"
    >
      <div className="shrink-0 border-b border-[#dedede] px-5 py-5 sm:px-7 sm:py-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
          System demo flow
        </p>
        <h2 className="mt-1.5 text-[22px] leading-tight tracking-[-0.01em] text-neutral-900 sm:text-[26px]">
          Talismaps™ → Talisbooks™ → Mapsites™
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-snug text-neutral-600 sm:text-[15px]">
          Actual product screens from the live system — Markets on Talismaps™,
          the Talisbooks™ Bookshelf, then a claimed Mapsite™ opened with a FAST
          Code™.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6 lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]">
        <ol className="flex flex-col">
          {TALISPROS_HOME_DEMO_FLOW.map((step, index) => {
            const isLast = index === TALISPROS_HOME_DEMO_FLOW.length - 1;
            return (
              <li key={step.id} className="flex flex-col">
                <article className="overflow-hidden border border-[#dedede] bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-1.5 border-b border-[#ececec] bg-[#fafafa] px-3 py-2">
                    <span
                      className="h-2 w-2 rounded-full bg-[#e2e2e2]"
                      aria-hidden
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-[#e2e2e2]"
                      aria-hidden
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-[#e2e2e2]"
                      aria-hidden
                    />
                    <span className="ml-2 truncate text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                      {step.step}. {step.eyebrow}
                    </span>
                    <Link
                      href={step.href}
                      className="ml-auto truncate text-[10px] font-medium tracking-wide text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
                    >
                      {step.href}
                    </Link>
                  </div>
                  <div className="relative aspect-[16/9] bg-neutral-200 sm:aspect-[2/1]">
                    <Image
                      src={step.imageSrc}
                      alt={step.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover object-top"
                      priority={index === 0}
                    />
                  </div>
                  <div className="px-4 py-3.5 sm:px-5 sm:py-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                      {step.eyebrow}
                    </p>
                    <h3 className="mt-1 text-[17px] font-semibold leading-snug tracking-tight text-neutral-900 sm:text-[18px]">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-snug text-neutral-600">
                      {step.body}
                    </p>
                  </div>
                </article>

                {!isLast ? (
                  <div
                    className="flex flex-col items-center gap-1 py-3 text-neutral-500"
                    aria-hidden
                  >
                    <span className="h-4 w-px bg-neutral-300" />
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a.75.75 0 0 1 .75.75v9.69l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V3.75A.75.75 0 0 1 10 3Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                      Next
                    </span>
                    <span className="h-4 w-px bg-neutral-300" />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
