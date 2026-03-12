import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { useEPG } from '../api';
import type { XtreamLiveStream } from '@shared/types/api';
import { Badge } from '@shared/components/Badge';
import { usePlayerStore, useUIStore } from '@lib/store';

interface ChannelCardProps {
  channel: XtreamLiveStream;
}

export function ChannelCard({ channel }: ChannelCardProps) {
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);
  const inputMode = useUIStore((s) => s.inputMode);
  const { data: epg } = useEPG(channel.stream_id);

  const nowPlaying = epg?.find((item) => {
    const now = Date.now() / 1000;
    return Number(item.start_timestamp) <= now && Number(item.stop_timestamp) >= now;
  });

  const handlePlay = useCallback(() => {
    playStream(String(channel.stream_id), 'live', channel.name);
    navigate({ to: '/live', search: { play: String(channel.stream_id) } });
  }, [channel, playStream, navigate]);

  const { ref, focused } = useFocusable({
    onEnterPress: handlePlay,
    onFocus: ({ node }) => {
      node?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    },
  });

  const showFocusRing = focused && inputMode === 'keyboard';

  return (
    <div
      ref={ref}
      onClick={handlePlay}
      className={`group cursor-pointer rounded-lg overflow-hidden bg-surface-raised border transition-all duration-200 ${
        showFocusRing
          ? 'border-teal scale-[1.05] z-10 ring-2 ring-teal/60 ring-offset-2 ring-offset-obsidian shadow-[0_0_24px_rgba(45,212,191,0.3)]'
          : 'border-border-subtle hover:border-teal/30 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(45,212,191,0.15)]'
      }`}
    >
      {/* Icon */}
      <div className="aspect-square relative bg-surface flex items-center justify-center overflow-hidden">
        {channel.stream_icon ? (
          <img
            src={channel.stream_icon}
            alt={channel.name}
            loading="lazy"
            className="w-full h-full object-contain p-3"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-raised/50 to-surface/50 -z-10 flex items-center justify-center">
          <span className="text-2xl font-display font-bold text-text-muted/30">
            {channel.name.charAt(0)}
          </span>
        </div>

        {/* Live badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="error">LIVE</Badge>
        </div>

        {/* Archive badge */}
        {channel.tv_archive === 1 && (
          <div className="absolute top-2 right-2">
            <Badge variant="indigo">DVR</Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h3 className="text-xs font-medium text-text-primary truncate">{channel.name}</h3>
        {nowPlaying && (
          <p className="text-[10px] text-teal truncate mt-0.5">{nowPlaying.title}</p>
        )}
      </div>
    </div>
  );
}
