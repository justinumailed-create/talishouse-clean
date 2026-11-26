"use client";

import type { ReactNode } from "react";
import { MapPinPlus } from "lucide-react";
import { MARKETING_PARTNER_WHATSAPP_HREF } from "@/lib/talispros/marketing-partner-contact";
import { useT } from "@/lib/i18n/client";

interface MarketingPartnerInterestLinksProps {
  className?: string;
  align?: "start" | "center";
  /** Kept for callers; the Team Member heading is no longer shown. */
  hideRole?: boolean;
  /**
   * Owner / admin only: "Add Pin" sits next to Talk to us at the bottom of the
   * Mapsite card and opens the PIN Dashboard step by step.
   */
  onAddPin?: () => void;
  /** Greyed out (not clickable) until the dashboard is unlocked by payment. */
  addPinLocked?: boolean;
  /** Extra buttons in the same row (e.g. the owner Logout button). */
  extraActions?: ReactNode;
}

/**
 * Bottom of the Mapsite card: Add Pin (owners) and Talk to us (WhatsApp).
 */
export default function MarketingPartnerInterestLinks({
  className = "",
  align = "center",
  onAddPin,
  addPinLocked = false,
  extraActions = null,
}: MarketingPartnerInterestLinksProps) {
  const t = useT();
  const alignment = align === "start" ? "justify-start" : "justify-center";
  const href = MARKETING_PARTNER_WHATSAPP_HREF;
  const addPinLabel = t.mapsite.leftCard.addPin;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${alignment} ${className}`}
      data-testid="team-member-links"
    >
      {onAddPin ? (
        addPinLocked ? (
          <span
            data-testid="mapsite-card-add-pin"
            aria-disabled="true"
            title={t.nav.dashboardLocked.title}
            className="inline-flex min-h-8 cursor-not-allowed items-center justify-center gap-1.5 rounded-full bg-neutral-200 px-4 text-[12px] font-semibold text-neutral-500"
          >
            <MapPinPlus className="h-3.5 w-3.5" aria-hidden />
            {addPinLabel}
          </span>
        ) : (
          <button
            type="button"
            data-testid="mapsite-card-add-pin"
            aria-label={t.mapsite.leftCard.addPinAria}
            onClick={(event) => {
              event.stopPropagation();
              onAddPin();
            }}
            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <MapPinPlus className="h-3.5 w-3.5" aria-hidden />
            {addPinLabel}
          </button>
        )
      ) : null}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="mapsite-card-talk"
          aria-label={t.personalHome.navTalkAria}
          className="inline-flex min-h-8 items-center justify-center rounded-full bg-[#046BD9] px-4 text-[12px] font-semibold text-white transition hover:bg-[#0358b3]"
        >
          {t.personalHome.navTalk}
        </a>
      ) : (
        <span
          data-testid="mapsite-card-talk"
          aria-disabled="true"
          aria-label={t.personalHome.navTalk}
          className="inline-flex min-h-8 cursor-not-allowed items-center justify-center rounded-full bg-neutral-200 px-4 text-[12px] font-semibold text-neutral-500"
        >
          {t.personalHome.navTalk}
        </span>
      )}
      {extraActions}
    </div>
  );
}
