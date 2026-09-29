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
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-white">
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
