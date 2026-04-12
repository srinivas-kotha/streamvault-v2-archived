import { useWatchHistory } from "../api";
import { useRemoveHistoryItem } from "@features/history/api";
import { useNavigate } from "@tanstack/react-router";
import { usePlayerStore, type StreamType } from "@lib/store";
import { ContentRail } from "@shared/components/ContentRail";
import { FocusableCard, LandscapeCard } from "@/design-system";
import { useSpatialFocusable } from "@shared/hooks/useSpatialNav";

const contentTypeToStreamType: Record<string, StreamType> = {
  live: "live",
  vod: "vod",
  series: "series",
};

function RemoveButton({
  focusKey,
  onRemove,
}: {
  focusKey: string;
  onRemove: () => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey,
    onEnterPress: onRemove,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      aria-label="Remove from continue watching"
      className={`absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-bg-primary/80 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-primary transition-[background-color,color] ${showFocusRing ? "ring-2 ring-accent-teal" : ""}`}
    >
      <svg
        className="w-3 h-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}

export function ContinueWatching() {
  const { data: history, isLoading } = useWatchHistory();
  const removeHistoryItem = useRemoveHistoryItem();
  const playStream = usePlayerStore((s) => s.playStream);
  const navigate = useNavigate();

  const inProgress = (history ?? []).filter((item) => {
    if (item.duration_seconds <= 0) return false;
    const percent = (item.progress_seconds / item.duration_seconds) * 100;
    return percent > 0 && percent < 95;
  });

  if (!isLoading && inProgress.length === 0) return null;

  const handleClick = (item: (typeof inProgress)[0]) => {
    const streamType = contentTypeToStreamType[item.content_type];
    if (!streamType) return;

    if (item.content_type === "live") {
      playStream(String(item.content_id), {
        streamType: "live",
        streamName: item.content_name ?? "Unknown",
      });
      navigate({ to: "/live", search: { play: String(item.content_id) } });
    } else {
      playStream(String(item.content_id), {
        streamType,
        streamName: item.content_name ?? "Unknown",
        startTime: item.progress_seconds,
      });
    }
  };

  return (
    <ContentRail
      title="Continue Watching"
      isLoading={isLoading}
      isEmpty={inProgress.length === 0}
    >
      {inProgress.map((item) => {
        const percent = Math.round(
          (item.progress_seconds / item.duration_seconds) * 100,
        );
        const itemKey = `${item.content_type}-${item.content_id}`;
        return (
          <div key={itemKey} className="relative rail-item flex-shrink-0">
            <FocusableCard
              focusKey={`cw-${itemKey}`}
              onEnterPress={() => handleClick(item)}
            >
              <LandscapeCard
                imageUrl={item.content_icon ?? ""}
                title={item.content_name ?? "Unknown"}
                subtitle={`${percent}% watched`}
                progress={percent}
                onClick={() => handleClick(item)}
              />
            </FocusableCard>
            <RemoveButton
              focusKey={`cw-remove-${itemKey}`}
              onRemove={() =>
                removeHistoryItem.mutate({
                  contentId: item.content_id,
                  contentType: item.content_type,
                })
              }
            />
          </div>
        );
      })}
    </ContentRail>
  );
}
