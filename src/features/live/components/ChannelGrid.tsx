import type { XtreamLiveStream } from '@shared/types/api';
import { ChannelCard } from './ChannelCard';

interface ChannelGridProps {
  channels: XtreamLiveStream[];
  focusKey?: string;
  parentFocusKey?: string;
}

export function ChannelGrid({ channels, parentFocusKey }: ChannelGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {channels.map((channel) => (
        <ChannelCard key={channel.stream_id} channel={channel} parentFocusKey={parentFocusKey} />
      ))}
    </div>
  );
}
