import Image from "next/image";
import {
  HOME_OWNERSHIP_BG_MP4,
  HOME_OWNERSHIP_BG_SRC,
} from "@/lib/talispros/ownership-models";

/**
 * Upper homepage mountain panel.
 * Royalty-free looping muted video is the primary motion asset.
 * prefers-reduced-motion shows the static JPG instead.
 */
export default function HomeMountainMotion() {
  return (
    <>
      <video
        className="absolute inset-0 h-full w-full object-cover object-center motion-reduce:hidden"
        src={HOME_OWNERSHIP_BG_MP4}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      />
      <Image
        src={HOME_OWNERSHIP_BG_SRC}
        alt=""
        fill
        loading="lazy"
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="hidden object-cover object-center motion-reduce:block"
        aria-hidden
      />
    </>
  );
}
