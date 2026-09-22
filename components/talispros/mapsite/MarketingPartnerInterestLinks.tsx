import {
  MARKETING_PARTNER_TELEGRAM_HREF,
  MARKETING_PARTNER_WHATSAPP_HREF,
} from "@/lib/talispros/marketing-partner-contact";

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

  return (
    <div className={`${alignment} flex flex-col ${className}`}>
      <p className="text-[12px] font-semibold leading-snug text-black">
        Express an Interest
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <a
          href={MARKETING_PARTNER_WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryLinkClass}
        >
          WhatsApp
        </a>
        <a
          href={MARKETING_PARTNER_TELEGRAM_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryLinkClass}
        >
          Telegram
        </a>
      </div>
    </div>
  );
}
