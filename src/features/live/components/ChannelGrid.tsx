import type { XtreamLiveStream } from '@shared/types/api';
import { ChannelCard } from './ChannelCard';

interface ChannelGridProps {
  channels: XtreamLiveStream[];
  focusKey?: string;
}

export function ChannelGrid({ channels }: ChannelGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
      {channels.map((channel) => (
        <ChannelCard key={channel.stream_id} channel={channel} />
      ))}
    </div>
  );
}
