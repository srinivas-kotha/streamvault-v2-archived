import { useWatchHistory } from '../api';
import { usePlayerStore } from '@lib/store';
import { ContentRail } from '@shared/components/ContentRail';
import { FocusableCard } from '@shared/components/FocusableCard';

export function ContinueWatching() {
  const { data: history, isLoading } = useWatchHistory();
  const playStream = usePlayerStore((s) => s.playStream);

  const inProgress = (history ?? []).filter((item) => {
    if (item.duration_seconds <= 0) return false;
    const percent = (item.progress_seconds / item.duration_seconds) * 100;
    return percent > 0 && percent < 95;
  });

  if (!isLoading && inProgress.length === 0) return null;

  const handleClick = (item: (typeof inProgress)[0]) => {
    const type = item.content_type === 'channel' ? 'live' : item.content_type === 'vod' ? 'vod' : 'series';
    playStream(String(item.content_id), type, item.content_name ?? 'Unknown');
  };

  return (
    <ContentRail
      title="Continue Watching"
      isLoading={isLoading}
      isEmpty={inProgress.length === 0}
    >
      {inProgress.map((item) => {
        const percent = Math.round((item.progress_seconds / item.duration_seconds) * 100);
        return (
          <FocusableCard
            key={`${item.content_type}-${item.content_id}`}
            image={item.content_icon ?? ''}
            title={item.content_name ?? 'Unknown'}
            subtitle={`${percent}% watched`}
            progress={percent}
            aspectRatio="landscape"
            onClick={() => handleClick(item)}
          />
        );
      })}
    </ContentRail>
  );
}
