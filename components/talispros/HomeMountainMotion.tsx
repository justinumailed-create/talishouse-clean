import Image from "next/image";
import {
  HOME_OWNERSHIP_BG_GIF,
  HOME_OWNERSHIP_BG_SRC,
} from "@/lib/talispros/ownership-models";

/**
 * Upper homepage mountain panel.
 * The looping GIF is the primary motion asset. prefers-reduced-motion
 * shows the static JPG instead (same pattern as theme-swapped images:
 * two layers, CSS media query, no preload so only the visible file loads).
 */
export default function HomeMountainMotion() {
  return (
    <>
      <Image
        src={HOME_OWNERSHIP_BG_GIF}
        alt=""
        fill
        unoptimized
        loading="eager"
        fetchPriority="high"
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover object-center motion-reduce:hidden"
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
