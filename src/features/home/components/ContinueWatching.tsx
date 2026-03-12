import { useWatchHistory } from '../api';
import { useNavigate } from '@tanstack/react-router';
import { usePlayerStore } from '@lib/store';
import { ContentRail } from '@shared/components/ContentRail';
import { FocusableCard } from '@shared/components/FocusableCard';

export function ContinueWatching() {
  const { data: history, isLoading } = useWatchHistory();
  const playStream = usePlayerStore((s) => s.playStream);
  const navigate = useNavigate();

  const inProgress = (history ?? []).filter((item) => {
    if (item.duration_seconds <= 0) return false;
    const percent = (item.progress_seconds / item.duration_seconds) * 100;
    return percent > 0 && percent < 95;
  });

  if (!isLoading && inProgress.length === 0) return null;

  const handleClick = (item: (typeof inProgress)[0]) => {
    if (item.content_type === 'channel') {
      playStream(String(item.content_id), 'live', item.content_name ?? 'Unknown');
      navigate({ to: '/live', search: { play: String(item.content_id) } });
    } else if (item.content_type === 'vod') {
      navigate({ to: '/vod/$vodId', params: { vodId: String(item.content_id) } });
    } else if (item.content_type === 'series') {
      navigate({ to: '/series/$seriesId', params: { seriesId: String(item.content_id) } });
    }
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
