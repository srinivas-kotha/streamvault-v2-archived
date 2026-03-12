import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { usePlayerStore, useUIStore } from '@lib/store';

export interface HeroItem {
  id: string | number;
  type: 'vod' | 'series' | 'live';
  title: string;
  description?: string;
  image: string; // backdrop or cover
  rating?: string;
  genre?: string;
  year?: string;
}

interface HeroBannerProps {
  items: HeroItem[];
  autoRotateMs?: number;
}

function HeroButton({
  onClick,
  children,
  variant = 'primary',
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  const inputMode = useUIStore((s) => s.inputMode);
  const { ref, focused } = useFocusable({ onEnterPress: onClick });
  const showFocus = focused && inputMode === 'keyboard';

  const base = variant === 'primary'
    ? 'bg-teal text-obsidian font-semibold hover:bg-teal/90'
    : 'bg-surface-raised/80 backdrop-blur-sm text-text-primary font-medium border border-border hover:bg-surface-hover';

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all min-h-[48px] text-sm lg:text-base ${base} ${
        showFocus ? 'ring-2 ring-teal ring-offset-2 ring-offset-obsidian scale-105' : ''
      }`}
    >
      {children}
    </button>
  );
}

export function HeroBanner({ items, autoRotateMs = 8000 }: HeroBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);

  const safeItems = useMemo(() => items.slice(0, 5), [items]);
  const current = safeItems[activeIndex];

  const { ref: heroRef, focusKey } = useFocusable({
    focusKey: 'hero-banner',
    trackChildren: true,
    saveLastFocusedChild: true,
  });

  // Auto-rotate (pause when hero is focused)
  useEffect(() => {
    if (safeItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeItems.length);
    }, autoRotateMs);
    return () => clearInterval(interval);
  }, [safeItems.length, autoRotateMs, activeIndex]);

  const handlePlay = useCallback(() => {
    if (!current) return;
    if (current.type === 'live') {
      playStream(String(current.id), 'live', current.title);
    } else if (current.type === 'vod') {
      navigate({ to: '/vod/$vodId', params: { vodId: String(current.id) } });
    } else {
      navigate({ to: '/series/$seriesId', params: { seriesId: String(current.id) } });
    }
  }, [current, navigate, playStream]);

  const handleMoreInfo = useCallback(() => {
    if (!current) return;
    if (current.type === 'vod') {
      navigate({ to: '/vod/$vodId', params: { vodId: String(current.id) } });
    } else if (current.type === 'series') {
      navigate({ to: '/series/$seriesId', params: { seriesId: String(current.id) } });
    }
  }, [current, navigate]);

  if (!current) return null;

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={heroRef} className="relative w-full -mt-16" style={{ height: 'clamp(300px, 60vh, 600px)' }}>
        {/* Backdrop image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={current.image}
            alt={current.title}
            className="w-full h-full object-cover transition-opacity duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/50 to-obsidian/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian/80 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 pb-8 lg:pb-12 z-10">
          <div className="max-w-2xl">
            {/* Meta badges */}
            <div className="flex items-center gap-3 mb-3">
              {current.rating && (
                <span className="flex items-center gap-1 text-sm text-warning">
                  <svg className="w-4 h-4 fill-warning" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {current.rating}
                </span>
              )}
              {current.year && (
                <span className="text-sm text-text-secondary">{current.year}</span>
              )}
              {current.genre && (
                <span className="text-sm text-text-secondary">{current.genre}</span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display font-bold text-text-primary mb-3 tv-text-hero leading-tight">
              {current.title}
            </h1>

            {/* Description */}
            {current.description && (
              <p className="text-text-secondary text-sm lg:text-base line-clamp-2 mb-5 max-w-lg">
                {current.description}
              </p>
            )}

            {/* Action buttons — focusable for TV remote */}
            <div className="flex items-center gap-3">
              <HeroButton onClick={handlePlay} variant="primary">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play
              </HeroButton>
              {current.type !== 'live' && (
                <HeroButton onClick={handleMoreInfo} variant="secondary">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  More Info
                </HeroButton>
              )}
            </div>
          </div>

          {/* Dot indicators */}
          {safeItems.length > 1 && (
            <div className="flex items-center gap-2 mt-6">
              {safeItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? 'w-8 bg-teal'
                      : 'w-2 bg-text-muted/40 hover:bg-text-muted/60'
                  }`}
                  aria-label={`Show item ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </FocusContext.Provider>
  );
}
