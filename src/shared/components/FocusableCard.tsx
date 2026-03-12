import { type ReactNode } from 'react';
import { ContentCard } from './ContentCard';

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
}: FocusableCardProps) {
  return (
    <div className="rail-item flex-shrink-0">
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
