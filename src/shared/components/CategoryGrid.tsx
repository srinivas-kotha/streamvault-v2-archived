import {
  useSpatialFocusable,
  useSpatialContainer,
  FocusContext,
} from "@shared/hooks/useSpatialNav";

interface CategoryGridProps {
  categories: Array<{ id: string; name: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  focusKey?: string;
}

function FocusableCategoryButton({
  id,
  label,
  isActive,
  onSelect,
}: {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: id,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onSelect}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-[background-color,border-color,color] ${
        isActive
          ? "bg-teal/15 text-teal border border-teal/30"
          : showFocusRing
            ? "bg-surface-raised text-text-primary border border-teal ring-2 ring-teal/50"
            : "bg-surface-raised text-text-secondary border border-border hover:border-border hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}

export function CategoryGrid({
  categories,
  selectedId,
  onSelect,
  focusKey: propFocusKey,
}: CategoryGridProps) {
  const parentId = propFocusKey || "category-grid";

  const { ref: containerRef, focusKey } = useSpatialContainer({
    focusKey: parentId,
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={containerRef} className="flex flex-wrap gap-2">
        <FocusableCategoryButton
          id={`${parentId}-all`}
          label="All"
          isActive={!selectedId}
          onSelect={() => onSelect("")}
        />
        {categories.map((cat) => (
          <FocusableCategoryButton
            id={`${parentId}-${cat.id}`}
            key={cat.id}
            label={cat.name}
            isActive={selectedId === cat.id}
            onSelect={() => onSelect(cat.id)}
          />
        ))}
      </div>
    </FocusContext.Provider>
  );
}
