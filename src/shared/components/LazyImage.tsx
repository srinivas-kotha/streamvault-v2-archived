import { useState, useRef, useEffect, useCallback, memo } from "react";
import { observe } from "@shared/hooks/useSharedIntersectionObserver";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  aspectRatio?: "square" | "poster" | "landscape";
  /** When true, loads eagerly with high fetchPriority (use for LCP images) */
  priority?: boolean;
}

/** Rewrite http:// image URLs to https:// to avoid mixed-content warnings */
export function upgradeProtocol(url: string): string {
  if (url.startsWith("http://")) return "https://" + url.slice(7);
  return url;
}

const aspectClasses = {
  square: "aspect-square",
  poster: "aspect-[2/3]",
  landscape: "aspect-video",
};

type LoadState = "placeholder" | "loading" | "loaded" | "error";

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  aspectRatio = "poster",
  priority = false,
}: LazyImageProps) {
  const safeSrc = src ? upgradeProtocol(src) : "";
  const [state, setState] = useState<LoadState>(
    !safeSrc ? "error" : priority ? "loading" : "placeholder",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!safeSrc) {
      setState("error");
      return;
    }

    // Priority images start loading immediately
    if (priority) {
      setState("loading");
      return;
    }

    // Reset to placeholder when src changes
    setState("placeholder");

    const el = containerRef.current;
    if (!el) return;

    return observe(
      el,
      (entry) => {
        if (entry.isIntersecting) {
          setState("loading");
        }
      },
      { rootMargin: "200px" },
    );
  }, [safeSrc, priority]);

  const handleLoad = useCallback(() => {
    setState("loaded");
  }, []);

  const handleError = useCallback(() => {
    setState("error");
  }, []);

  const showImage = state === "loading" || state === "loaded";

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}
    >
      {/* Gradient placeholder / fallback */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-surface-raised to-surface ${fallbackClassName}`}
      />

      {/* Placeholder icon */}
      {state === "error" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-text-muted/30"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}

      {/* Image element */}
      {showImage && (
        <img
          ref={imgRef}
          src={safeSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            state === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
});
