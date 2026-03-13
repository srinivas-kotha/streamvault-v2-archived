import { useCallback, type ReactNode } from 'react';
import { useSpatialFocusable } from '@shared/hooks/useSpatialNav';
import { LazyImage } from './LazyImage';

interface ContentCardProps {
  image: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  progress?: number; // 0-100
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onRemove?: () => void;
  onClick?: () => void;
  aspectRatio?: 'poster' | 'landscape' | 'square';
  focusKey?: string;
}

function FocusableFavoriteButton({ isFavorite, onToggle, focusId }: { isFavorite?: boolean; onToggle: () => void; focusId: string }) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: focusId,
    onEnterPress: () => onToggle(),
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`absolute top-2 right-2 p-1.5 rounded-full bg-obsidian/60 backdrop-blur-sm hover:bg-obsidian/80 transition-all ${showFocusRing ? 'ring-2 ring-teal z-10' : ''}`}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className={`w-4 h-4 ${isFavorite ? 'text-warning fill-warning' : 'text-text-muted'}`}
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    </button>
  );
}

function FocusableRemoveButton({ onRemove, focusId }: { onRemove: () => void; focusId: string }) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: focusId,
    onEnterPress: () => onRemove(),
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      className={`absolute top-2 right-2 p-1 rounded-full bg-obsidian/60 backdrop-blur-sm hover:bg-error/80 transition-all ${showFocusRing ? 'ring-2 ring-error z-10 bg-error/80' : ''}`}
      aria-label="Remove"
    >
      <svg className="w-3.5 h-3.5 text-text-muted hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

const aspectClasses = {
  poster: 'aspect-[2/3]',
  landscape: 'aspect-video',
  square: 'aspect-square',
};

export function ContentCard({
  image,
  title,
  subtitle,
  badge,
  progress,
  isFavorite,
  onFavoriteToggle,
  onRemove,
  onClick,
  aspectRatio = 'poster',
  focusKey: propFocusKey,
}: ContentCardProps) {
  const cardKey = propFocusKey || `card-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const onEnterPress = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: cardKey,
    onEnterPress,
    onFocus: (layout) => {
      // Auto-scroll into view when focused via D-pad
      layout.node?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
    },
  });

  return (
    <div
      ref={ref}
      {...focusProps}
      onClick={onClick}
      className={`group relative cursor-pointer rounded-lg overflow-hidden bg-surface-raised border transition-all duration-200 ambient-glow ${
        showFocusRing
          ? 'border-teal scale-[1.08] z-10 ring-2 ring-teal/60 ring-offset-2 ring-offset-obsidian shadow-[0_0_24px_rgba(45,212,191,0.3)]'
          : 'border-border-subtle hover:border-teal/30 hover:scale-[1.03]'
      }`}
    >
      {/* Image */}
      <div className={`relative ${aspectClasses[aspectRatio]} overflow-hidden`}>
        <LazyImage
          src={image}
          alt={title}
          aspectRatio={aspectRatio}
          className="transition-transform duration-300 group-hover:scale-105"
        />

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-obsidian/90 to-transparent" />

        {/* Badge */}
        {badge && (
          <div className="absolute top-2 left-2">{badge}</div>
        )}

        {/* Favorite star */}
        {onFavoriteToggle && (
          <FocusableFavoriteButton isFavorite={isFavorite} onToggle={onFavoriteToggle} focusId={`fav-btn-${cardKey}`} />
        )}

        {/* Remove button (for Continue Watching) */}
        {onRemove && (
          <FocusableRemoveButton onRemove={onRemove} focusId={`remove-btn-${cardKey}`} />
        )}

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-obsidian/60">
            <div
              className="h-full bg-teal rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="p-1.5">
        <h3 className="text-xs font-medium text-text-primary truncate">{title}</h3>
        {subtitle && (
          <p className="text-[10px] text-text-muted mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
