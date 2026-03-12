import { useNavigate } from '@tanstack/react-router';
import { useEPG } from '../api';
import type { XtreamLiveStream } from '@shared/types/api';
import { Badge } from '@shared/components/Badge';
import { usePlayerStore } from '@lib/store';

interface ChannelCardProps {
  channel: XtreamLiveStream;
}

export function ChannelCard({ channel }: ChannelCardProps) {
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);
  const { data: epg } = useEPG(channel.stream_id);

  const nowPlaying = epg?.find((item) => {
    const now = Date.now() / 1000;
    return Number(item.start_timestamp) <= now && Number(item.stop_timestamp) >= now;
  });

  return (
    <div
      onClick={() => {
        playStream(String(channel.stream_id), 'live', channel.name);
        navigate({ to: '/live', search: { play: String(channel.stream_id) } });
      }}
      className="group cursor-pointer rounded-lg overflow-hidden bg-surface-raised border border-border-subtle hover:border-teal/30 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(45,212,191,0.15)]"
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
