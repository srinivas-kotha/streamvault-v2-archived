import { useCallback, type ReactNode } from 'react';
import { useLRUD } from '@shared/hooks/useLRUD';
import { LazyImage } from './LazyImage';
import { useUIStore } from '@lib/store';
import { useRailParent } from './ContentRail';

interface ContentCardProps {
  image: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  progress?: number; // 0-100
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onClick?: () => void;
  aspectRatio?: 'poster' | 'landscape' | 'square';
  focusKey?: string;
  parentFocusKey?: string;
}

function FocusableFavoriteButton({ isFavorite, onToggle, parentFocusKey }: { isFavorite?: boolean; onToggle: () => void; parentFocusKey?: string }) {
  const inputMode = useUIStore((s) => s.inputMode);
  const { ref, isFocused, focusProps } = useLRUD({
    id: `fav-btn-${parentFocusKey}`,
    parent: parentFocusKey || 'root',
    onEnter: () => onToggle(),
  });
  const showFocus = isFocused && inputMode === 'keyboard';

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`absolute top-2 right-2 p-1.5 rounded-full bg-obsidian/60 backdrop-blur-sm hover:bg-obsidian/80 transition-all ${showFocus ? 'ring-2 ring-teal z-10' : ''}`}
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
  onClick,
  aspectRatio = 'poster',
  focusKey: propFocusKey,
  parentFocusKey,
}: ContentCardProps) {
  const inputMode = useUIStore((s) => s.inputMode);
  const railParent = useRailParent();

  const onEnterPress = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const { ref, isFocused, focusProps } = useLRUD({
    id: propFocusKey || `card-${title.replace(/\s+/g, '-').toLowerCase()}`,
    parent: parentFocusKey || railParent,
    onEnter: onEnterPress,
  });

  const showFocusRing = isFocused && inputMode === 'keyboard';

  return (
    <div
      ref={ref}
      {...focusProps}
      onClick={onClick}
      className={`group relative cursor-pointer rounded-lg overflow-hidden bg-surface-raised border transition-all duration-200 ambient-glow ${
        showFocusRing
          ? 'border-teal scale-[1.05] z-10 ring-2 ring-teal/60 ring-offset-2 ring-offset-obsidian shadow-[0_0_24px_rgba(45,212,191,0.3)]'
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
          <FocusableFavoriteButton isFavorite={isFavorite} onToggle={onFavoriteToggle} parentFocusKey={propFocusKey || `card-${title.replace(/\s+/g, '-').toLowerCase()}`} />
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
      <div className="p-3">
        <h3 className="text-sm font-medium text-text-primary truncate">{title}</h3>
        {subtitle && (
          <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

