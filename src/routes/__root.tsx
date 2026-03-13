import { createRootRoute, Outlet } from '@tanstack/react-router';
import { usePlayerStore } from '@lib/store';
import { PlayerPage } from '@features/player/components/PlayerPage';

export const Route = createRootRoute({
  component: RootLayout,
});

function FullscreenPlayer() {
  const currentStreamId = usePlayerStore((s) => s.currentStreamId);
  const currentStreamType = usePlayerStore((s) => s.currentStreamType);
  const currentStreamName = usePlayerStore((s) => s.currentStreamName);
  const startTime = usePlayerStore((s) => s.startTime);
  const stop = usePlayerStore((s) => s.stop);
  const episodeList = usePlayerStore((s) => s.episodeList);
  const episodeIndex = usePlayerStore((s) => s.episodeIndex);
  const playNextEpisode = usePlayerStore((s) => s.playNextEpisode);
  const playPrevEpisode = usePlayerStore((s) => s.playPrevEpisode);

  if (!currentStreamId || !currentStreamType) return null;

  const hasNext = episodeList.length > 0 && episodeIndex !== null && episodeIndex < episodeList.length - 1;
  const hasPrev = episodeList.length > 0 && episodeIndex !== null && episodeIndex > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button — always visible */}
      <button
        onClick={stop}
        className="absolute top-4 right-4 z-[60] p-2 bg-obsidian/70 rounded-full text-white/80 hover:text-white hover:bg-obsidian/90 transition-colors"
        aria-label="Close player"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <PlayerPage
        streamType={currentStreamType}
        streamId={currentStreamId}
        streamName={currentStreamName || undefined}
        startTime={startTime}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onNext={hasNext ? playNextEpisode : undefined}
        onPrev={hasPrev ? playPrevEpisode : undefined}
        onClose={stop}
      />
    </div>
  );
}

function RootLayout() {
  return (
    <>
      <div className="grain-overlay" />
      <Outlet />
      <FullscreenPlayer />
    </>
  );
}
