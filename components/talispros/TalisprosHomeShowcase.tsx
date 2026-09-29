import Image from "next/image";

/**
 * Static /start right column: Markets map only (CA flag / tree pins), full
 * height of the gate. No mkts navbar, sidebar, title, cards, or caption —
 * image cannot pan, zoom, or navigate.
 */
export default function TalisprosHomeShowcase() {
  return (
    <aside
      className="relative min-h-[42vh] w-full flex-1 overflow-hidden bg-neutral-200 lg:min-h-0 lg:h-full lg:border-l lg:border-[#dedede]"
      aria-label="Talispros™ Markets map preview"
    >
      <Image
        src="/assets/home-demo/01-talismaps-mkts.jpg"
        alt="Static Talismaps™ Markets map with Canada pins"
        fill
        sizes="(max-width: 1023px) 100vw, 60vw"
        className="pointer-events-none select-none object-cover object-center"
        draggable={false}
        priority
      />
    </aside>
  );
}
