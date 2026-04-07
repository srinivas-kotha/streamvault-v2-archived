import { cn } from "@/shared/utils/cn";
import { Badge } from "@/design-system/primitives/Badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeroBannerProps {
  title: string;
  description: string;
  imageUrl: string;
  genres?: string[];
  rating?: string;
  onPlay?: () => void;
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function HeroBannerSkeleton() {
  return (
    <div
      data-testid="hero-skeleton"
      className="relative w-full aspect-[21/9] rounded-[var(--radius-lg)] overflow-hidden bg-bg-secondary animate-pulse"
    >
      <div className="absolute bottom-8 left-8 space-y-3">
        <div className="h-8 w-64 bg-bg-tertiary rounded" />
        <div className="h-4 w-96 bg-bg-tertiary rounded" />
        <div className="h-10 w-32 bg-bg-tertiary rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HeroBanner({
  title,
  description,
  imageUrl,
  genres,
  rating,
  onPlay,
  isLoading,
}: HeroBannerProps) {
  if (isLoading) {
    return <HeroBannerSkeleton />;
  }

  return (
    <header
      role="banner"
      className="relative w-full aspect-[21/9] rounded-[var(--radius-lg)] overflow-hidden"
    >
      {/* Background image */}
      <img
        src={imageUrl}
        alt={title}
        loading="eager"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Gradient overlay for text readability */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent pointer-events-none"
      />

      {/* Content overlay — bottom left */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-6 md:px-8 md:pb-8 flex flex-col gap-3">
        {/* Genre badges */}
        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {genres.map((genre) => (
              <Badge key={genre} variant="secondary" size="sm">
                {genre}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary font-[family-name:var(--font-family-heading)] leading-tight">
          {title}
        </h1>

        {/* Description */}
        <p className="text-sm md:text-base text-text-secondary max-w-xl line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Rating + CTA row */}
        <div className="flex items-center gap-4">
          {rating && (
            <Badge variant="rating" size="md">
              {rating}
            </Badge>
          )}

          {onPlay && (
            <button
              type="button"
              onClick={onPlay}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-2.5",
                "bg-accent-teal text-bg-primary font-semibold rounded-[var(--radius-md)]",
                "transition-[background-color,transform] duration-200 ease-out",
                "hover-capable:hover:bg-accent-teal/90 hover-capable:hover:scale-[1.02]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Now
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
