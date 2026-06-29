import Image from "next/image";
import Link from "next/link";

interface MapSiteHeaderProps {
  fastCode: string;
  accountType: string;
  status: string;
}

export default function MapSiteHeader({
  fastCode,
  accountType,
  status,
}: MapSiteHeaderProps) {
  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/talispros" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="TalisPros"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
            <span className="text-sm font-semibold tracking-tight text-neutral-900">
              MapSite™
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
              {accountType}
            </span>
            <span className="inline-flex items-center rounded-full bg-neutral-900 px-3 py-1 text-xs font-mono font-medium text-white">
              {fastCode}
            </span>
            <span className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 capitalize">
              {status}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
