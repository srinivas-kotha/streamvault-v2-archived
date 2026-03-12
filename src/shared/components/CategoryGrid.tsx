interface CategoryGridProps {
  categories: Array<{ category_id: string; category_name: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CategoryGrid({ categories, selectedId, onSelect }: CategoryGridProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect('')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          !selectedId
            ? 'bg-teal/15 text-teal border border-teal/30'
            : 'bg-surface-raised text-text-secondary border border-border hover:border-border hover:text-text-primary'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.category_id}
          onClick={() => onSelect(cat.category_id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            selectedId === cat.category_id
              ? 'bg-teal/15 text-teal border border-teal/30'
              : 'bg-surface-raised text-text-secondary border border-border hover:border-border hover:text-text-primary'
          }`}
        >
          {cat.category_name}
        </button>
      ))}
    </div>
  );
}
