interface MapSiteVideoSectionProps {
  videoUrl: string;
  embedded?: boolean;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export default function MapSiteVideoSection({
  videoUrl,
  embedded = false,
}: MapSiteVideoSectionProps) {
  const player = (
    <div className={embedded ? "w-full h-full bg-black" : "aspect-video bg-black"}>
      {isDirectVideo(videoUrl) ? (
        <video
          src={videoUrl}
          controls
          playsInline
          className="w-full h-full object-contain"
        />
      ) : (
        <iframe
          src={videoUrl}
          title="MapSite video"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );

  if (embedded) {
    return player;
  }

  return (
    <section className="bg-[#f8f8f7]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900">Video</h2>
          </div>
          {player}
        </div>
      </div>
    </section>
  );
}
