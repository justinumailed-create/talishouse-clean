"use client";

import type { TalisMapsCategory } from "@/lib/talismaps";

interface CategoryFilterProps {
  categories: TalisMapsCategory[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
          selected === null
            ? "bg-neutral-900 text-white border-neutral-900"
            : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          type="button"
          onClick={() => onSelect(cat.slug === selected ? null : cat.slug)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
            selected === cat.slug
              ? "text-white border-transparent"
              : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
          }`}
          style={selected === cat.slug ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
          {cat.name}
        </button>
      ))}
    </div>
  );
}
