import { useState, useRef, useEffect, useCallback } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  aspectRatio?: 'square' | 'poster' | 'landscape';
}

const aspectClasses = {
  square: 'aspect-square',
  poster: 'aspect-[2/3]',
  landscape: 'aspect-video',
};

type LoadState = 'placeholder' | 'loading' | 'loaded' | 'error';

export function LazyImage({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  aspectRatio = 'poster',
}: LazyImageProps) {
  const [state, setState] = useState<LoadState>('placeholder');
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setState('loading');
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reset state when src changes
  useEffect(() => {
    setState('placeholder');
  }, [src]);

  const handleLoad = useCallback(() => {
    setState('loaded');
  }, []);

  const handleError = useCallback(() => {
    setState('error');
  }, []);

  const showImage = state === 'loading' || state === 'loaded';

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}
    >
      {/* Gradient placeholder / fallback */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-surface-raised to-surface ${fallbackClassName}`}
      />

      {/* Error icon */}
      {state === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-text-muted/40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
            />
          </svg>
        </div>
      )}

      {/* Image element */}
      {showImage && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            state === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
