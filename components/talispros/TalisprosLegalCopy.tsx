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
  return (
    <div className={className}>
      <p className={primaryClassName}>{TALISPROS_LEGAL_PRIMARY_COPY}</p>
      <p className={secondaryClassName}>{TALISPROS_LEGAL_SECONDARY_COPY}</p>
    </div>
  );
}
