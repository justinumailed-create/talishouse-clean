interface SelectionCardProps {
  label: string;
  description?: string;
  price?: number;
  selected: boolean;
  onClick: () => void;
}

export function SelectionCard({ label, description, price, selected, onClick }: SelectionCardProps) {
  const textColor = selected ? '#ffffff' : '#111827';
  const descColor = selected ? 'rgba(255, 255, 255, 0.8)' : '#6b7280';
  const priceColor = selected ? '#ffffff' : '#111827';
  
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
          ? "bg-black border-transparent shadow-md"
          : "bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50"
        }
      `}
    >
      <div className="flex-1">
        <span className="text-[15px] font-semibold" style={{ color: textColor }}>
          {label}
        </span>
        {description && (
          <p className="text-xs mt-1 leading-relaxed" style={{ color: descColor }}>
            {description}
          </p>
        )}
      </div>
      {price !== undefined && (
        <span className="text-sm font-bold ml-4" style={{ color: priceColor }}>
          {price > 0 ? `+CAD $${price.toLocaleString()}` : "Included"}
        </span>
      )}
    </div>
  );
}
