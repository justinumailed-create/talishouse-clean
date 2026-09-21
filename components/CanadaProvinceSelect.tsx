"use client";

import {
  CANADA_TAX_RATE_LIST,
  formatCanadaTaxPercent,
  type CanadaProvinceCode,
} from "@/lib/canada-sales-tax";

interface CanadaProvinceSelectProps {
  value: string;
  onChange: (code: CanadaProvinceCode | "") => void;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function CanadaProvinceSelect({
  value,
  onChange,
  className,
  id,
  name,
  required = true,
  disabled = false,
}: CanadaProvinceSelectProps) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      disabled={disabled}
      value={value}
      onChange={(event) =>
        onChange((event.target.value || "") as CanadaProvinceCode | "")
      }
      className={className}
    >
      <option value="">Select province / territory</option>
      {CANADA_TAX_RATE_LIST.map((rate) => (
        <option key={rate.code} value={rate.code}>
          {rate.name} ({rate.displayLabel} {formatCanadaTaxPercent(rate.combinedRate)})
        </option>
      ))}
    </select>
  );
}
