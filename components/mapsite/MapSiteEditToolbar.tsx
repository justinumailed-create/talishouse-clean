import Link from "next/link";
import { Pencil } from "lucide-react";
import type { MapSiteEditToolbarState } from "@/lib/mapsite-edit-auth";

interface MapSiteEditToolbarProps {
  fastCode: string;
  editAccess: MapSiteEditToolbarState;
}

export default function MapSiteEditToolbar({
  fastCode,
  editAccess,
}: MapSiteEditToolbarProps) {
  const editHref = editAccess.isAdmin
    ? `/talispros/admin/mapsites/${fastCode}`
    : `/talispros/mapsites/${fastCode}/edit`;

  const label =
    editAccess.isOwner || editAccess.isAdmin
      ? "Edit MapSite"
      : "Edit this MapSite";

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 max-w-[calc(100vw-2rem)]">
      <Link
        href={editHref}
        className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-lg hover:bg-neutral-800"
      >
        <Pencil className="h-4 w-4" />
        {label}
      </Link>
    </div>
  );
}
