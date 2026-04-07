import { formatCAD } from "@/utils/currency";

interface SelectionCardProps {
  label: string;
  description?: string;
  price?: number;
  selected: boolean;
  onClick: () => void;
}

export function SelectionCard({ label, description, price, selected, onClick }: SelectionCardProps) {
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
        duration-200
        flex
        items-center
        justify-between
        ${selected
          ? "bg-gray-900 border-transparent shadow-md"
          : "bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50"
        }
      `}
    >
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium break-words ${selected ? "text-white" : "text-gray-900"}`}>
          {label}
        </span>
        {description && (
          <p className={`text-xs mt-1 leading-relaxed break-words ${selected ? "text-white/70" : "text-gray-500"}`}>
            {description}
          </p>
        )}
      </div>
      {price !== undefined && (
        <span className={`text-sm font-semibold ml-4 ${selected ? "text-white" : "text-gray-900"}`}>
          {price > 0 ? `+${formatCAD(price)}` : "Included"}
        </span>
      )}
    </div>
  );
}
