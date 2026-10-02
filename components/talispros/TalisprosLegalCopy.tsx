import {
  TALISPROS_LEGAL_PRIMARY_COPY,
  TALISPROS_LEGAL_SECONDARY_COPY,
} from "@/lib/talispros/start-content";

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
  const primary = TALISPROS_LEGAL_PRIMARY_COPY.trim();
  return (
    <div className={className}>
      {primary ? <p className={primaryClassName}>{primary}</p> : null}
      <p className={secondaryClassName}>{TALISPROS_LEGAL_SECONDARY_COPY}</p>
    </div>
  );
}
