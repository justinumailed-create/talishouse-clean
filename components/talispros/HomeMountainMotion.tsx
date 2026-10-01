"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  HOME_OWNERSHIP_BG_MP4,
  HOME_OWNERSHIP_BG_SRC,
  HOME_OWNERSHIP_BG_WEBM,
} from "@/lib/talispros/ownership-models";

/**
 * Upper homepage mountain panel: muted looping WebM/MP4 Ken Burns, JPG poster
 * fallback (and for prefers-reduced-motion).
 */
export default function HomeMountainMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (reduceMotion || videoFailed) {
    return (
      <Image
        src={HOME_OWNERSHIP_BG_SRC}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover object-center"
      />
    );
  }

  return (
    <>
      <video
        className="absolute inset-0 h-full w-full object-cover object-center"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={HOME_OWNERSHIP_BG_SRC}
        aria-hidden
        onError={() => setVideoFailed(true)}
      >
        <source src={HOME_OWNERSHIP_BG_WEBM} type="video/webm" />
        <source src={HOME_OWNERSHIP_BG_MP4} type="video/mp4" />
      </video>
      {/* Poster visible until first frame; also CSS Ken Burns if video stalls */}
      <Image
        src={HOME_OWNERSHIP_BG_SRC}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="pointer-events-none -z-10 object-cover object-center opacity-0"
        aria-hidden
      />
    </>
  );
}
