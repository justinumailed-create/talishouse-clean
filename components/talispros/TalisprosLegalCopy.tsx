"use client";

import { TALISPROS_LEGAL_PRIMARY_COPY } from "@/lib/talispros/start-content";
import { useT } from "@/lib/i18n/client";

interface TalisprosLegalCopyProps {
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}

export default function TalisprosLegalCopy({
  className,
  primaryClassName,
  secondaryClassName,
}: TalisprosLegalCopyProps) {
  const t = useT();
  const primary = TALISPROS_LEGAL_PRIMARY_COPY.trim();
  return (
    <div className={className}>
      {primary ? <p className={primaryClassName}>{primary}</p> : null}
      <p className={secondaryClassName}>{t.home.legalSecondary}</p>
    </div>
  );
}
