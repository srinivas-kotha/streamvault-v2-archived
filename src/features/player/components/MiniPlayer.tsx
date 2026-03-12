import { usePlayerStore } from '@lib/store';
import { PlayerPage } from './PlayerPage';

export function MiniPlayer() {
  const currentStreamId = usePlayerStore((s) => s.currentStreamId);
  const currentStreamType = usePlayerStore((s) => s.currentStreamType);
  const currentStreamName = usePlayerStore((s) => s.currentStreamName);
  const isMiniPlayer = usePlayerStore((s) => s.isMiniPlayer);
  const stop = usePlayerStore((s) => s.stop);

  if (!isMiniPlayer || !currentStreamId || !currentStreamType) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50 rounded-xl overflow-hidden shadow-2xl border border-border bg-surface">
      <button
        onClick={stop}
        className="absolute top-2 right-2 z-10 p-1 bg-obsidian/80 rounded-full text-text-muted hover:text-text-primary transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <PlayerPage
        streamType={currentStreamType}
        streamId={currentStreamId}
        streamName={currentStreamName || undefined}
        onClose={stop}
      />
    </div>
  );
}
