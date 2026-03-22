"use client";

import { cn } from "@/lib/utils";
import { TECH_CATEGORIES, type TechCategory } from "@/lib/types";

interface CategoryFilterProps {
  activeCategory: TechCategory | null;
  onSelect: (category: TechCategory | null) => void;
}

export function CategoryFilter({ activeCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
          activeCategory === null
            ? "bg-primary text-primary-foreground"
            : "bg-surface-0 text-muted-foreground hover:bg-surface-1"
        )}
      >
        All
      </button>
      {TECH_CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            activeCategory === cat.value
              ? "bg-primary text-primary-foreground"
              : "bg-surface-0 text-muted-foreground hover:bg-surface-1"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
