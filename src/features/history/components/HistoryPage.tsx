import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useWatchHistory, useClearHistory } from '../api';
import { usePlayerStore } from '@lib/store';
import { EmptyState } from '@shared/components/EmptyState';
import { formatDuration, formatTimeAgo } from '@shared/utils/formatDuration';
import { PageTransition } from '@shared/components/PageTransition';
import type { ContentType } from '@shared/types/api';

type FilterTab = 'all' | 'channel' | 'vod' | 'series';

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'channel', label: 'Channels' },
  { key: 'vod', label: 'Movies' },
  { key: 'series', label: 'Series' },
];

const contentTypeIcons: Record<ContentType, string> = {
  channel: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  vod: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
  series: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
};

export function HistoryPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const { data: history, isLoading } = useWatchHistory();
  const clearHistory = useClearHistory();
  const playStream = usePlayerStore((s) => s.playStream);

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    const sorted = [...history].sort(
      (a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime(),
    );
    if (activeFilter === 'all') return sorted;
    return sorted.filter((item) => item.content_type === activeFilter);
  }, [history, activeFilter]);

  function handleItemClick(item: (typeof filteredHistory)[0]) {
    if (item.content_type === 'channel') {
      playStream(String(item.content_id), 'live', item.content_name || 'Channel');
      navigate({ to: '/live', search: { play: String(item.content_id) } });
    } else if (item.content_type === 'vod') {
      navigate({ to: '/vod/$vodId', params: { vodId: String(item.content_id) } });
    } else if (item.content_type === 'series') {
      navigate({ to: '/series/$seriesId', params: { seriesId: String(item.content_id) } });
    }
  }

  function getProgressPercent(item: (typeof filteredHistory)[0]): number {
    if (!item.duration_seconds || item.duration_seconds <= 0) return 0;
    return Math.min((item.progress_seconds / item.duration_seconds) * 100, 100);
  }

  return (
    <PageTransition>
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-text-primary">Watch History</h1>
        {history && history.length > 0 && (
          <button
            onClick={() => clearHistory.mutate()}
            disabled={clearHistory.isPending}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-error bg-surface-raised hover:bg-error/10 border border-border-subtle hover:border-error/30 rounded-lg transition-all disabled:opacity-50"
          >
            {clearHistory.isPending ? 'Clearing...' : 'Clear History'}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeFilter === tab.key
                ? 'bg-teal/10 text-teal'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-surface-raised rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <EmptyState
          title="No watch history"
          message={
            activeFilter === 'all'
              ? 'Content you watch will appear here'
              : `No ${filterTabs.find((t) => t.key === activeFilter)?.label.toLowerCase()} in history`
          }
          icon="history"
        />
      ) : (
        <div className="space-y-2">
          {filteredHistory.map((item) => {
            const progress = getProgressPercent(item);
            return (
              <div
                key={`${item.content_type}-${item.content_id}-${item.id}`}
                onClick={() => handleItemClick(item)}
                className="group flex items-center gap-4 p-3 bg-surface-raised border border-border-subtle rounded-lg cursor-pointer hover:border-teal/30 hover:shadow-[0_0_15px_rgba(45,212,191,0.1)] transition-all"
              >
                {/* Icon/Poster */}
                <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-surface flex items-center justify-center">
                  {item.content_icon ? (
                    <img
                      src={item.content_icon}
                      alt={item.content_name || ''}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  {/* Fallback icon */}
                  <svg
                    className="w-6 h-6 text-text-muted/30 absolute"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={contentTypeIcons[item.content_type]}
                    />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {item.content_name || `${item.content_type} #${item.content_id}`}
                    </h3>
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-surface text-text-muted uppercase">
                      {item.content_type === 'channel' ? 'live' : item.content_type}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {item.duration_seconds > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-text-muted flex-shrink-0">
                        {formatDuration(item.progress_seconds)} / {formatDuration(item.duration_seconds)}
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-text-muted mt-1">
                    {formatTimeAgo(item.watched_at)}
                  </p>
                </div>

                {/* Continue button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-teal bg-teal/10 hover:bg-teal/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  Continue
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </PageTransition>
  );
}
