import { type ReactNode } from 'react';
import { ContentCard } from './ContentCard';
import { useUIStore } from '@lib/store';

interface FocusableCardProps {
  image: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  progress?: number;
  isFavorite?: boolean;
  isNew?: boolean;
  onFavoriteToggle?: () => void;
  onClick?: () => void;
  aspectRatio?: 'poster' | 'landscape' | 'square';
  focused?: boolean;
}

export function FocusableCard({
  image,
  title,
  subtitle,
  badge,
  progress,
  isFavorite,
  isNew,
  onFavoriteToggle,
  onClick,
  aspectRatio = 'poster',
  focused = false,
}: FocusableCardProps) {
  const inputMode = useUIStore((s) => s.inputMode);
  const showFocus = focused && inputMode === 'keyboard';

  return (
    <div
      className={`rail-item flex-shrink-0 transition-all duration-200 rounded-lg ${
        showFocus
          ? 'scale-[1.08] z-10 relative ring-2 ring-teal/60 ring-offset-2 ring-offset-obsidian shadow-[0_0_24px_rgba(45,212,191,0.3)]'
          : ''
      }`}
      tabIndex={0}
    >
      <ContentCard
        image={image}
        title={title}
        subtitle={subtitle}
        badge={
          isNew ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-teal text-obsidian">
              NEW
            </span>
          ) : badge
        }
        progress={progress}
        isFavorite={isFavorite}
        onFavoriteToggle={onFavoriteToggle}
        onClick={onClick}
        aspectRatio={aspectRatio}
      />
    </div>
  );
}
