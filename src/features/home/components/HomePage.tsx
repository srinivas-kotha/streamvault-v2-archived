import { useAuthStore } from '@lib/store';
import { PageTransition } from '@shared/components/PageTransition';
import { ContinueWatching } from './ContinueWatching';
import { RecentlyAdded } from './RecentlyAdded';
import { FavoritesPreview } from './FavoritesPreview';

export function HomePage() {
  const username = useAuthStore((s) => s.username);

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Welcome back{username ? `, ${username}` : ''}
        </h1>
        <p className="text-text-secondary mt-1">
          Pick up where you left off, or discover something new.
        </p>
      </div>

      {/* Continue Watching */}
      <ContinueWatching />

      {/* Recently Added (tabbed) */}
      <RecentlyAdded />

      {/* Favorites Preview */}
      <FavoritesPreview />
    </div>
    </PageTransition>
  );
}
