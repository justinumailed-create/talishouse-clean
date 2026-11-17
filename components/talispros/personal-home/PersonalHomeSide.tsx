import { personalHomeEmbedSrc, type PersonalHomeSideMedia } from "@/lib/talispros/personal-home";

/** Left-column image, MP4, or YouTube/Vimeo. Fills the portrait box and crops. */
export default function PersonalHomeSide({ media }: { media: PersonalHomeSideMedia }) {
  if (media.kind === "video") {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={media.url}
        muted
        autoPlay
        loop
        playsInline
        data-testid="personal-home-side-video"
      />
    );
  }
  if (media.kind === "embed") {
    const src = personalHomeEmbedSrc(media);
    if (!src) return null;
    return (
      <iframe
        className="pointer-events-none absolute top-1/2 left-1/2 h-[140%] w-[140%] max-w-none -translate-x-1/2 -translate-y-1/2 border-0"
        src={src}
        title={media.provider === "vimeo" ? "Vimeo" : "YouTube"}
        allow="autoplay; encrypted-media; picture-in-picture"
        data-testid="personal-home-side-embed"
      />
    );
  }
  return null;
}
