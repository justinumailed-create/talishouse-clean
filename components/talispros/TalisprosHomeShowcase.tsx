import TalisprosStartMktsMap from "@/components/talispros/TalisprosStartMktsMap";

/**
 * /start right column: Markets map only (CA flag / Modular Spaces pins from
 * the same TALISU_MKTS_PINS source as /talisu/mkts), full height of the gate.
 * No mkts navbar, sidebar, title, cards, or caption — cannot pan, zoom, or
 * navigate.
 */
export default function TalisprosHomeShowcase() {
  return (
    <aside
      className="relative min-h-[42vh] w-full flex-1 overflow-hidden bg-neutral-200 lg:min-h-0 lg:h-full lg:border-l lg:border-[#dedede]"
      aria-label="Talispros™ Markets map preview"
    >
      <TalisprosStartMktsMap />
    </aside>
  );
}
