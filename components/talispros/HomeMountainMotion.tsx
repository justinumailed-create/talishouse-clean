"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  HOME_OWNERSHIP_BG_MP4,
  HOME_OWNERSHIP_BG_SRC,
} from "@/lib/talispros/ownership-models";

/**
 * Upper homepage mountain panel (gate right column / main banner).
 * Muted looping Pic2VDO MP4 is the primary motion asset.
 * prefers-reduced-motion shows the static JPG instead.
 *
 * Force muted + play() on mount: React's muted prop alone often fails
 * autoplay policies, leaving a frozen first frame that looks like the still.
 */
export default function HomeMountainMotion() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playMotion, setPlayMotion] = useState(false);

  useEffect(() => {
    const start = () => setPlayMotion(true);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const tryPlay = () => {
      void video.play().catch(() => {
        // Autoplay can still be blocked; muted+playsInline usually clears it.
      });
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    return () => video.removeEventListener("loadeddata", tryPlay);
  }, [playMotion]);

  return (
    <>
      <Image
        src={HOME_OWNERSHIP_BG_SRC}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover object-center motion-reduce:block"
      />
      {playMotion ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover object-center motion-reduce:hidden"
          src={HOME_OWNERSHIP_BG_MP4}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
        />
      ) : null}
    </>
  );
}
