"use client";

interface ResponsiveVideoProps {
  src: string;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onClick?: () => void;
}

export default function ResponsiveVideo({ src, videoRef, onClick }: ResponsiveVideoProps) {
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black shadow-lg flex-shrink-0">
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full object-cover cursor-pointer"
        onClick={onClick}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
