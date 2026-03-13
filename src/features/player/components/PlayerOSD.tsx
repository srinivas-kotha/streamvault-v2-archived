import { useEffect, useState } from 'react';

export interface OSDAction {
  type: 'seek-back' | 'seek-forward' | 'fast-forward' | 'fast-rewind' | 'seek-percent' | 'volume' | 'play' | 'pause' | 'mute' | 'unmute';
  value?: number; // volume level 0-1, seek seconds, or seek percentage
  speed?: number; // fast-seek speed multiplier (2, 4, 8)
  timestamp: number; // Date.now() to trigger re-renders on same action
}

export function PlayerOSD({ action }: { action: OSDAction | null }) {
  const [visible, setVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<OSDAction | null>(null);

  useEffect(() => {
    if (!action) return;
    setCurrentAction(action);
    setVisible(true);

    // Fast-seek OSD stays visible longer while holding (refreshed each repeat)
    const hideDelay = action.type === 'fast-forward' || action.type === 'fast-rewind' ? 800 : 1200;
    const timer = setTimeout(() => setVisible(false), hideDelay);
    return () => clearTimeout(timer);
  }, [action]);

  if (!visible || !currentAction) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
      <div className="bg-black/70 rounded-2xl px-8 py-6 text-white text-center backdrop-blur-sm animate-in fade-in duration-150">
        {renderOSDContent(currentAction)}
      </div>
    </div>
  );
}

function renderOSDContent(action: OSDAction) {
  switch (action.type) {
    case 'seek-back':
      return (
        <div className="flex flex-col items-center gap-2">
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.5 3C7.81 3 4.01 6.54 3.57 11H1l3.5 4 3.5-4H5.59c.44-3.36 3.3-6 6.91-6 3.87 0 7 3.13 7 7s-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C7.82 20.04 10.05 21 12.5 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
            <text x="10" y="15.5" fontSize="7.5" fontWeight="bold" textAnchor="middle" fill="currentColor">10</text>
          </svg>
          <span className="text-sm font-medium">-10s</span>
        </div>
      );
    case 'seek-forward':
      return (
        <div className="flex flex-col items-center gap-2">
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.5 3c4.69 0 8.49 3.54 8.93 8H23l-3.5 4-3.5-4h2.02c-.44-3.36-3.3-6-6.91-6-3.87 0-7 3.13-7 7s3.13 7 7 7c1.93 0 3.68-.79 4.94-2.06l1.42 1.42C15.68 20.04 13.45 21 11.5 21c-4.97 0-9-4.03-9-9s4.03-9 9-9z" />
            <text x="14" y="15.5" fontSize="7.5" fontWeight="bold" textAnchor="middle" fill="currentColor">10</text>
          </svg>
          <span className="text-sm font-medium">+10s</span>
        </div>
      );
    case 'fast-forward':
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
            </svg>
            <span className="text-2xl font-bold">{action.speed ?? 2}x</span>
          </div>
          <span className="text-sm font-medium text-teal">
            +{formatSeekTime(action.value ?? 0)}
          </span>
        </div>
      );
    case 'fast-rewind':
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold">{action.speed ?? 2}x</span>
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 18V6l-8.5 6L20 18zM11 18V6l-8.5 6L11 18z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-teal">
            -{formatSeekTime(action.value ?? 0)}
          </span>
        </div>
      );
    case 'seek-percent':
      return (
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl font-bold">{Math.round(action.value ?? 0)}%</span>
          <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${action.value ?? 0}%` }} />
          </div>
        </div>
      );
    case 'volume':
      return (
        <div className="flex flex-col items-center gap-2">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${Math.round((action.value ?? 0) * 100)}%` }} />
          </div>
          <span className="text-sm font-medium">{Math.round((action.value ?? 0) * 100)}%</span>
        </div>
      );
    case 'play':
      return (
        <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case 'pause':
      return (
        <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
        </svg>
      );
    case 'mute':
      return (
        <div className="flex flex-col items-center gap-2">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
          <span className="text-sm font-medium">Muted</span>
        </div>
      );
    case 'unmute':
      return (
        <div className="flex flex-col items-center gap-2">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span className="text-sm font-medium">Unmuted</span>
        </div>
      );
  }
}

/** Format accumulated seek seconds into human-readable string */
function formatSeekTime(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${seconds}s`;
}
