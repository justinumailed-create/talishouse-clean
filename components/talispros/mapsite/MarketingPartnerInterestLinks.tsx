"use client";

import { MARKETING_PARTNER_WHATSAPP_HREF } from "@/lib/talispros/marketing-partner-contact";
import { useT } from "@/lib/i18n/client";

interface MarketingPartnerInterestLinksProps {
  className?: string;
  align?: "start" | "center";
  /** Kept for callers; the Team Member heading is no longer shown. */
  hideRole?: boolean;
}

/**
 * Left-card contact: a single Talk to us button (WhatsApp), replacing the
 * previous separate chat buttons.
 */
export default function MarketingPartnerInterestLinks({
  className = "",
  align = "center",
}: MarketingPartnerInterestLinksProps) {
  const t = useT();
  const alignment = align === "start" ? "justify-start" : "justify-center";
  const href = MARKETING_PARTNER_WHATSAPP_HREF;

  return (
    <div className={`flex ${alignment} ${className}`} data-testid="team-member-links">
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
    </div>
  );
}
