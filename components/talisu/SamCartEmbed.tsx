type SamCartEmbedProps = {
  src: string;
  title: string;
  height?: number;
};

/** First-party checkout not yet in-app — SamCart remains an allowed embed. */
export default function SamCartEmbed({
  src,
  title,
  height = 1400,
}: SamCartEmbedProps) {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
      <iframe
        title={title}
        src={src}
        className="w-full border-0"
        style={{ height }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
