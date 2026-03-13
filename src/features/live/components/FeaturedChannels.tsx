import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSpatialFocusable, useSpatialContainer, FocusContext } from '@shared/hooks/useSpatialNav';
import { useFeaturedChannels, useEPG } from '../api';
import { usePlayerStore } from '@lib/store';
import { Badge } from '@shared/components/Badge';
import type { XtreamLiveStream } from '@shared/types/api';
import { upgradeProtocol } from '@shared/components/LazyImage';

function FeaturedCard({ channel }: { channel: XtreamLiveStream }) {
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);
  const { data: epg } = useEPG(channel.stream_id);

  const nowPlaying = epg?.find((item) => {
    const now = Date.now() / 1000;
    return Number(item.start_timestamp) <= now && Number(item.stop_timestamp) >= now;
  });

  const handleClick = useCallback(() => {
    playStream(String(channel.stream_id), 'live', channel.name);
    navigate({ to: '/live', search: { play: String(channel.stream_id) } });
  }, [channel, playStream, navigate]);

  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `featured-${channel.stream_id}`,
    onEnterPress: handleClick,
  });

  return (
    <div
      ref={ref}
      {...focusProps}
      onClick={handleClick}
      className={`group relative cursor-pointer rounded-xl overflow-hidden bg-surface-raised border transition-all duration-300 min-w-[220px] flex-shrink-0 ${
        showFocusRing
          ? 'border-teal scale-[1.05] z-10 ring-2 ring-teal/60 ring-offset-2 ring-offset-obsidian shadow-[0_0_30px_rgba(45,212,191,0.3)]'
          : 'border-border-subtle hover:border-teal/40 hover:shadow-[0_0_30px_rgba(45,212,191,0.2)] hover:scale-[1.02]'
      }`}
    >
      {/* Channel Icon */}
      <div className="relative h-28 bg-gradient-to-br from-surface to-obsidian flex items-center justify-center overflow-hidden">
        {channel.stream_icon ? (
          <img
            src={upgradeProtocol(channel.stream_icon)}
            alt={channel.name}
            loading="lazy"
            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-raised/40 to-surface/60 -z-10 flex items-center justify-center">
          <span className="text-3xl font-display font-bold text-text-muted/20">
            {channel.name.charAt(0)}
          </span>
        </div>

        {/* Live pulse indicator */}
        <div className="absolute top-2.5 left-2.5">
          <Badge variant="error">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          </Badge>
        </div>

        {/* DVR badge */}
        {channel.tv_archive === 1 && (
          <div className="absolute top-2.5 right-2.5">
            <Badge variant="indigo">DVR</Badge>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-raised to-transparent" />
      </div>

      {/* Info section */}
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-teal transition-colors">
          {channel.name}
        </h3>
        {nowPlaying ? (
          <p className="text-xs text-teal/80 truncate">
            ▶ {nowPlaying.title}
          </p>
        ) : (
          <p className="text-xs text-text-muted truncate">Live Now</p>
        )}
      </div>
    </div>
  );
}

export function FeaturedChannels() {
  const { data: channels, isLoading } = useFeaturedChannels();

  // Register container for featured channel cards
  const { ref: containerRef, focusKey } = useSpatialContainer({
    focusKey: 'featured-channels',
    focusable: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
          <span className="w-1.5 h-5 bg-gradient-to-b from-teal to-indigo rounded-full" />
          Featured Channels
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="min-w-[220px] h-44 bg-surface-raised rounded-xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!channels || channels.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
        <span className="w-1.5 h-5 bg-gradient-to-b from-teal to-indigo rounded-full" />
        Featured Channels
      </h2>
      <FocusContext.Provider value={focusKey}>
        <div ref={containerRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {channels.map((channel) => (
            <FeaturedCard key={channel.stream_id} channel={channel} />
          ))}
        </div>
      </FocusContext.Provider>
    </div>
  );
}
