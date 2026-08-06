import Image from "next/image";

interface MapSiteHeroProps {
  headerImageUrl: string | null;
  logoUrl: string | null;
  propertyTitle: string;
  fastCode: string;
  accountType: string;
  status: string;
}

export default function MapSiteHero({
  headerImageUrl,
  logoUrl,
  propertyTitle,
  fastCode,
  accountType,
  status,
}: MapSiteHeroProps) {
  return (
    <section className="relative bg-neutral-900 text-white overflow-hidden">
      <div className="absolute inset-0">
        {headerImageUrl ? (
          <Image
            src={headerImageUrl}
            alt={propertyTitle}
            fill
            className="object-cover opacity-70"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
      </div>

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            {logoUrl && (
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex-shrink-0">
                <Image
                  src={logoUrl}
                  alt="Logo"
                  fill
                  className="object-contain p-2"
                  sizes="64px"
                />
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2">
                Mapsite™
              </p>
              <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">
                {propertyTitle}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {accountType}
            </span>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-mono font-medium text-neutral-900">
              {fastCode}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/30 px-3 py-1 text-xs font-medium text-white capitalize">
              {status}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
