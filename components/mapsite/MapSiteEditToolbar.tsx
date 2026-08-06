"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Pencil } from "lucide-react";
import { getMapSiteVisitorAccountStatus } from "@/lib/mapsite-account-status";
import type { MapSiteEditToolbarState } from "@/lib/mapsite-edit-auth";

interface MapSiteEditToolbarProps {
  fastCode: string;
  editAccess: MapSiteEditToolbarState;
  initialHasSubscribed: boolean;
  initialVisitorFastCode: string | null;
}

function normalizeFastCode(fastCode: string): string {
  return fastCode.trim().toLowerCase();
}

export default function MapSiteEditToolbar({
  fastCode,
  editAccess,
  initialHasSubscribed,
  initialVisitorFastCode,
}: MapSiteEditToolbarProps) {
  const [hasSubscribed, setHasSubscribed] = useState(initialHasSubscribed);
  const [visitorFastCode, setVisitorFastCode] = useState(initialVisitorFastCode);

  const refreshAccountStatus = useCallback(async () => {
    const status = await getMapSiteVisitorAccountStatus();
    setHasSubscribed(status.hasSubscribed);
    setVisitorFastCode(status.fastCode);
  }, []);

  useEffect(() => {
    void refreshAccountStatus();
  }, [refreshAccountStatus]);

  useEffect(() => {
    function handleRegistered() {
      void refreshAccountStatus();
    }

    window.addEventListener("mapsite:root-account-registered", handleRegistered);
    window.addEventListener("focus", handleRegistered);

    return () => {
      window.removeEventListener(
        "mapsite:root-account-registered",
        handleRegistered
      );
      window.removeEventListener("focus", handleRegistered);
    };
  }, [refreshAccountStatus]);

  const ownsThisMapSite =
    hasSubscribed &&
    visitorFastCode !== null &&
    normalizeFastCode(visitorFastCode) === normalizeFastCode(fastCode);

  const showToolbar = editAccess.showToolbar && ownsThisMapSite;

  if (!showToolbar) {
    return null;
  }

  if (editAccess.isAdmin) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 max-w-[calc(100vw-2rem)]">
        <Link
          href={`/talispros/admin/mapsites/${fastCode}`}
          className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-lg hover:bg-neutral-800"
        >
          <Pencil className="h-4 w-4" />
          Edit Mapsite™
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 max-w-[calc(100vw-2rem)]">
      <Link
        href="/talispros/client/login"
        className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-lg hover:bg-neutral-800"
      >
        <BarChart3 className="h-4 w-4" />
        View Analytics
      </Link>
    </div>
  );
}
