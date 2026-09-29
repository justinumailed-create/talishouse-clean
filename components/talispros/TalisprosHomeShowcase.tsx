import Image from "next/image";
import Link from "next/link";
import { TALISPROS_HOME_DEMO_FLOW } from "@/lib/talispros/start-content";

/**
 * compact trio of mini system screens beside Login / System Demo on /start.
 * All three visible together — not a tall right-rail carousel.
 * Address / FAST Code details are scrubbed from Mapsite™ asset + masked in UI.
 */
export default function TalisprosHomeShowcase() {
  return (
    <aside
      className="flex min-h-0 flex-1 flex-col justify-center bg-[#f2f2f0] px-4 py-5 text-neutral-900 sm:px-6 sm:py-6 lg:border-l lg:border-[#dedede] lg:px-7"
      aria-label="Talispros™ system demo — Talismaps™, Talisbooks™, Mapsites™"
    >
      <div className="mb-4 shrink-0 sm:mb-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500 sm:text-[11px]">
          System demo
        </p>
        <h2 className="mt-1 text-[15px] font-semibold leading-snug tracking-tight text-neutral-900 sm:text-[17px]">
          Talismaps™ → Talisbooks™ → Mapsites™
        </h2>
      </div>

      <ol className="flex min-h-0 flex-1 flex-col justify-center gap-3 sm:gap-3.5">
        {TALISPROS_HOME_DEMO_FLOW.map((step, index) => {
          const isLast = index === TALISPROS_HOME_DEMO_FLOW.length - 1;
          return (
            <li key={step.id} className="flex flex-col gap-2">
              <article className="overflow-hidden rounded-md border border-[#dedede] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-1.5 border-b border-[#ececec] bg-[#fafafa] px-2.5 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e2e2e2]" aria-hidden />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e2e2e2]" aria-hidden />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e2e2e2]" aria-hidden />
                  <span className="ml-1.5 truncate text-[9px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                    {step.step}. {step.eyebrow}
                  </span>
                  <Link
                    href={step.href}
                    className="ml-auto truncate text-[9px] font-medium tracking-wide text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
                  >
                    {step.hrefLabel || step.href}
                  </Link>
                </div>
                <div className="relative aspect-[16/9] max-h-[9.5rem] bg-neutral-200 sm:max-h-[10.5rem] lg:max-h-[11.5rem]">
                  <Image
                    src={step.imageSrc}
                    alt={step.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 28rem"
                    className={`object-cover ${step.imageObjectPosition || "object-top"}`}
                    priority={index === 0}
                  />
                  {/* Extra privacy veil over any residual address / FAST Code chrome */}
                  {step.privacyMask ? (
                    <div
                      className="pointer-events-none absolute inset-0"
                      aria-hidden
                    >
                      {step.privacyMask.map((mask) => (
                        <div
                          key={mask.id}
                          className="absolute bg-white/70 backdrop-blur-[6px]"
                          style={{
                            left: mask.left,
                            top: mask.top,
                            width: mask.width,
                            height: mask.height,
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="px-2.5 py-2 sm:px-3">
                  <h3 className="text-[12px] font-semibold leading-snug text-neutral-900 sm:text-[13px]">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-neutral-600">
                    {step.body}
                  </p>
                </div>
              </article>

              {!isLast ? (
                <div
                  className="flex items-center justify-center gap-2 text-neutral-400"
                  aria-hidden
                >
                  <span className="h-px w-6 bg-neutral-300" />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a.75.75 0 0 1 .75.75v9.69l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V3.75A.75.75 0 0 1 10 3Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="h-px w-6 bg-neutral-300" />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
