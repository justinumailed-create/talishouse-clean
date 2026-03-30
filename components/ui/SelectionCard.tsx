interface SelectionCardProps {
  label: string;
  description?: string;
  price?: number;
  selected: boolean;
  onClick: () => void;
}

export function SelectionCard({ label, description, price, selected, onClick }: SelectionCardProps) {
  const textColor = selected ? '#ffffff' : '#374151';
  const descColor = selected ? '#ffffff' : '#6b7280';
  const priceColor = selected ? '#ffffff' : '#374151';
  
  return (
    <div
      onClick={onClick}
      className={`
        w-full
        p-4
        rounded-xl
        border
        cursor-pointer
        transition-all
        flex
        items-center
        justify-between
        ${selected
          ? "bg-[linear-gradient(180deg,#0070BA_0%,#003087_100%)] border-transparent shadow-md"
          : "bg-white border-gray-200 hover:bg-gray-50"
        }
      `}
    >
      <div className="flex-1">
        <span className="text-sm font-medium" style={{ color: textColor }}>
          {label}
        </span>
        {description && (
          <p className="text-xs mt-0.5 leading-snug" style={{ color: descColor }}>
            {description}
          </p>
        )}
      </div>
      {price !== undefined && (
        <span className="text-sm font-semibold ml-4" style={{ color: priceColor }}>
          {price > 0 ? `+CAD $${price.toLocaleString()}` : "Included"}
        </span>
      )}
    </div>
  );
}
