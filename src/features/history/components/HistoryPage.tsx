import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useSpatialFocusable,
  useSpatialContainer,
  FocusContext,
} from "@shared/hooks/useSpatialNav";
import { usePageFocus } from "@shared/hooks/usePageFocus";
import { useWatchHistory, useClearHistory } from "../api";
import { usePlayerStore } from "@lib/store";
import { EmptyState } from "@shared/components/EmptyState";
import { LandscapeCard } from "@/design-system";
import { formatDuration, formatTimeAgo } from "@shared/utils/formatDuration";
import { PageTransition } from "@shared/components/PageTransition";
import type { ContentType } from "@shared/types/api";

type FilterTab = "all" | ContentType;

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Channels" },
  { key: "vod", label: "Movies" },
  { key: "series", label: "Series" },
];

function FocusableFilterTab({
  id,
  label,
  isActive,
  onSelect,
}: {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: id,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onSelect}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-[background-color,border-color,color] ${
        isActive
          ? "bg-teal/10 text-teal"
          : showFocusRing
            ? "text-text-primary bg-surface-raised ring-2 ring-teal/50"
            : "text-text-muted hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}

export function HistoryPage() {
  const navigate = useNavigate();
  usePageFocus("history-tab-all");
  const { ref: containerRef, focusKey } = useSpatialContainer({
    focusKey: "HISTORY_PAGE",
    focusable: false,
  });
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const { data: history, isLoading } = useWatchHistory();
  const clearHistory = useClearHistory();
  const playStream = usePlayerStore((s) => s.playStream);

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    const sorted = [...history].sort(
      (a, b) =>
        new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime(),
    );
    if (activeFilter === "all") return sorted;
    return sorted.filter((item) => item.content_type === activeFilter);
  }, [history, activeFilter]);

  function handleItemClick(item: (typeof filteredHistory)[0]) {
    if (item.content_type === "live") {
      playStream(String(item.content_id), {
        streamType: "live",
        streamName: item.content_name || "Channel",
      });
      navigate({ to: "/live", search: { play: String(item.content_id) } });
    } else if (item.content_type === "vod") {
      navigate({
        to: "/vod/$vodId",
        params: { vodId: String(item.content_id) },
      });
    } else if (item.content_type === "series") {
      navigate({
        to: "/series/$seriesId",
        params: { seriesId: String(item.content_id) },
      });
    }
  }

  function getProgressPercent(item: (typeof filteredHistory)[0]): number {
    if (!item.duration_seconds || item.duration_seconds <= 0) return 0;
    return Math.min((item.progress_seconds / item.duration_seconds) * 100, 100);
  }

  return (
    <PageTransition>
      <FocusContext.Provider value={focusKey}>
        <div ref={containerRef}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold text-text-primary">
              Watch History
            </h1>
            {history && history.length > 0 && (
              <button
                onClick={() => clearHistory.mutate()}
                disabled={clearHistory.isPending}
                className="px-3 py-1.5 text-xs text-text-muted hover:text-error bg-surface-raised hover:bg-error/10 border border-border-subtle hover:border-error/30 rounded-lg transition-[background-color,border-color,color,opacity] disabled:opacity-50"
              >
                {clearHistory.isPending ? "Clearing..." : "Clear History"}
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1 w-fit">
            {filterTabs.map((tab) => (
              <FocusableFilterTab
                id={`history-tab-${tab.key}`}
                key={tab.key}
                label={tab.label}
                isActive={activeFilter === tab.key}
                onSelect={() => setActiveFilter(tab.key)}
              />
            ))}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-video bg-surface-raised rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <EmptyState
              title="No watch history"
              message={
                activeFilter === "all"
                  ? "Content you watch will appear here"
                  : `No ${filterTabs.find((t) => t.key === activeFilter)?.label.toLowerCase()} in history`
              }
              icon="history"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredHistory.map((item) => (
                <div
                  key={`${item.content_type}-${item.content_id}-${item.id}`}
                  data-testid="history-item"
                  className="relative"
                >
                  <h3 className="sr-only">{item.content_name || `${item.content_type} #${item.content_id}`}</h3>
                  <LandscapeCard
                    focusKey={`history-item-${item.content_type}-${item.content_id}-${item.id}`}
                    title={item.content_name || `${item.content_type} #${item.content_id}`}
                    imageUrl={item.content_icon || ""}
                    subtitle={formatTimeAgo(item.watched_at)}
                    progress={getProgressPercent(item)}
                    onClick={() => handleItemClick(item)}
                  />
                  <div className="absolute top-2 left-2 z-10 pointer-events-none">
                    <span className="text-[10px] text-text-secondary bg-bg-primary/60 px-1.5 py-0.5 rounded">
                      {item.content_type === "live" ? "live" : item.content_type}
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-2 z-10 pointer-events-none">
                    <span className="text-[10px] font-medium text-teal">Continue</span>
                  </div>
                  {item.duration_seconds > 0 && (
                    <div className="absolute bottom-5 right-2 z-10 pointer-events-none">
                      <span className="text-[10px] text-text-secondary">
                        {formatDuration(item.progress_seconds)} / {formatDuration(item.duration_seconds)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </FocusContext.Provider>
    </PageTransition>
  );
}
