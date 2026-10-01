import Image from "next/image";
import {
  HOME_OWNERSHIP_BG_SRC,
  HOME_OWNERSHIP_SECTIONS,
} from "@/lib/talispros/ownership-models";

/**
 * Homepage gate right column: ownership models over mountain climbers
 * background (replaces the former Markets map preview). Scrollable when
 * needed; dark scrim for readable contrast.
 */
export default function TalisprosHomeShowcase() {
  return (
    <aside
      className="relative min-h-[42vh] w-full flex-1 overflow-hidden bg-neutral-900 lg:min-h-0 lg:h-full lg:border-l lg:border-[#dedede]"
      aria-label="Ownership models"
    >
      <Image
        src={HOME_OWNERSHIP_BG_SRC}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/75"
        aria-hidden
      />
      <div className="relative z-10 flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain px-5 py-6 sm:px-7 sm:py-8 lg:px-8 lg:py-9 lg:[&::-webkit-scrollbar]:thin">
        <div className="mx-auto flex w-full max-w-[36rem] flex-col gap-0 text-white">
          {HOME_OWNERSHIP_SECTIONS.map((section, index) => (
            <section
              key={section.id}
              className={
                index === 0
                  ? "pb-5 sm:pb-6"
                  : "border-t border-white/25 py-5 sm:py-6"
              }
              aria-labelledby={`ownership-${section.id}-title`}
            >
              <h2
                id={`ownership-${section.id}-title`}
                className="text-[17px] font-semibold tracking-wide text-white sm:text-[18px]"
              >
                {section.title}
              </h2>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/92 sm:text-[14.5px] sm:leading-relaxed">
                {section.body}
              </p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/85 sm:text-[14.5px]">
                {section.result}
              </p>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}
