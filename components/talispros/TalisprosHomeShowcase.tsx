import Image from "next/image";

/**
 * Static /start preview for the System Demo Markets screen. Keep this as an
 * image rather than mounting the map so the right section cannot pan, zoom, or
 * trigger navigation.
 */
export default function TalisprosHomeShowcase() {
  return (
    <aside
      className="flex min-h-0 flex-1 flex-col justify-center bg-[#f2f2f0] px-5 py-8 text-neutral-900 sm:px-8 sm:py-10 lg:border-l lg:border-[#dedede] lg:px-10 lg:py-12"
      aria-label="Talispros™ System Demo Markets map preview"
    >
      <div className="mx-auto flex w-full max-w-[62rem] flex-col">
        <div className="mb-4 sm:mb-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500 sm:text-[11px]">
            System demo
          </p>
          <h2 className="mt-1 text-xl font-semibold leading-snug tracking-tight text-neutral-900 sm:text-2xl">
            Markets
          </h2>
          <p className="mt-1 text-xs font-medium tracking-wide text-neutral-500 sm:text-sm">
            /talisu/mkts
          </p>
        </div>

        <figure className="overflow-hidden border border-[#dedede] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="relative aspect-[8/5] w-full bg-neutral-200">
            <Image
              src="/assets/home-demo/01-talismaps-mkts.jpg"
              alt="Static Talismaps™ Markets map demo with Canada pins"
              fill
              sizes="(max-width: 1023px) 100vw, calc(100vw - 22rem)"
              className="pointer-events-none select-none object-cover"
              draggable={false}
              priority
            />
          </div>
          <figcaption className="border-t border-[#ececec] px-3 py-2 text-[11px] leading-snug text-neutral-500 sm:px-4 sm:py-2.5 sm:text-xs">
            Static preview of the Markets map. Open System Demo on the left to
            explore the live experience.
          </figcaption>
        </figure>
      </div>
    </aside>
  );
}
