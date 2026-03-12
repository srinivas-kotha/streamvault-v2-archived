import { useNavigate } from '@tanstack/react-router';
import { useWatchHistory } from '../api';
import { usePlayerStore } from '@lib/store';
import { HorizontalScroll } from '@shared/components/HorizontalScroll';
import { ContentCard } from '@shared/components/ContentCard';

export function ContinueWatching() {
  const { data: history, isLoading } = useWatchHistory();
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);

  // Filter items where progress < 95%
  const inProgress = (history ?? []).filter((item) => {
    if (item.duration_seconds <= 0) return false;
    const percent = (item.progress_seconds / item.duration_seconds) * 100;
    return percent > 0 && percent < 95;
  });

  if (isLoading || inProgress.length === 0) return null;

  const handleClick = (item: (typeof inProgress)[0]) => {
    const type = item.content_type === 'channel' ? 'live' : item.content_type === 'vod' ? 'vod' : 'series';
    playStream(String(item.content_id), type, item.content_name ?? 'Unknown');
    navigate({ to: '/player' as string });
  };

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-text-primary mb-3">
        Continue Watching
      </h2>
      <HorizontalScroll>
        {inProgress.map((item) => {
          const percent = Math.round((item.progress_seconds / item.duration_seconds) * 100);
          return (
            <div key={`${item.content_type}-${item.content_id}`} className="min-w-[180px] max-w-[180px]" style={{ scrollSnapAlign: 'start' }}>
              <ContentCard
                image={item.content_icon ?? ''}
                title={item.content_name ?? 'Unknown'}
                subtitle={`${percent}% watched`}
                progress={percent}
                aspectRatio="landscape"
                onClick={() => handleClick(item)}
              />
            </div>
          );
        })}
      </HorizontalScroll>
    </section>
  );
}
