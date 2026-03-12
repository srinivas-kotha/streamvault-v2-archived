interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface-raised rounded-lg ${className}`}
    />
  );
}

export function SkeletonCard({ aspectRatio = 'poster' }: { aspectRatio?: 'poster' | 'landscape' | 'square' }) {
  const aspectClasses = {
    poster: 'aspect-[2/3]',
    landscape: 'aspect-video',
    square: 'aspect-square',
  };
  return (
    <div className="rounded-lg overflow-hidden bg-surface-raised border border-border-subtle">
      <Skeleton className={`${aspectClasses[aspectRatio]} rounded-none`} />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12, aspectRatio = 'poster' }: { count?: number; aspectRatio?: 'poster' | 'landscape' | 'square' }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} aspectRatio={aspectRatio} />
      ))}
    </>
  );
}
