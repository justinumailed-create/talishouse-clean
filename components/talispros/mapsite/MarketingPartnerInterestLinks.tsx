"use client";

import {
  MARKETING_PARTNER_TELEGRAM_HREF,
  MARKETING_PARTNER_WHATSAPP_HREF,
} from "@/lib/talispros/marketing-partner-contact";
import { useT } from "@/lib/i18n/client";

const primaryLinkClass =
  "inline-flex min-h-8 items-center justify-center rounded-full bg-neutral-900 px-3 text-[12px] font-medium text-white transition hover:bg-neutral-800";

const secondaryLinkClass =
  "inline-flex min-h-8 items-center justify-center rounded-full bg-white px-3 text-[12px] font-medium text-neutral-900 ring-1 ring-black/10 transition hover:bg-neutral-50";

interface MarketingPartnerInterestLinksProps {
  className?: string;
  align?: "start" | "center";
}

export default function MarketingPartnerInterestLinks({
  className = "",
  align = "center",
}: MarketingPartnerInterestLinksProps) {
  const alignment = align === "start" ? "items-start text-left" : "items-center text-center";
  // Ralf (Oct 17): these still reach Ralf, identified as a "Team Member".
  const teamMember = useT().mapsite.leftCard.teamMember;

  return (
    <div className={`${alignment} flex flex-col ${className}`} data-testid="team-member-links">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        {teamMember}
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={MARKETING_PARTNER_WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryLinkClass}
          aria-label={`WhatsApp — ${teamMember}`}
        >
          WhatsApp
        </a>
        <a
          href={MARKETING_PARTNER_TELEGRAM_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryLinkClass}
          aria-label={`Telegram — ${teamMember}`}
        >
          Telegram
        </a>
      </div>
    </div>
  );
}
