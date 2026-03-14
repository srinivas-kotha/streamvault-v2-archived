import { useEffect, useState, type ReactNode } from 'react';
import { init, setFocus, getCurrentFocusKey, setKeyMap } from '@noriginmedia/norigin-spatial-navigation';
import { useUIStore, usePlayerStore } from '@lib/store';

// Check URL param for debug mode (e.g. ?debug=spatial)
const isSpatialDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'spatial';

// Initialize spatial navigation at module level (before any component renders).
// init() is idempotent — safe to call multiple times.
init({
  debug: isSpatialDebug,
  visualDebug: isSpatialDebug,
  distanceCalculationMethod: 'center',
  shouldUseNativeEvents: true,
  shouldFocusDOMNode: true,
  useGetBoundingClientRect: true,
  throttle: 100,
  throttleKeypresses: true,
});

// Extend Enter key mapping to include Fire TV DPAD_CENTER (keyCode 23)
setKeyMap({ enter: [13, 23, 'Enter'] });

interface SpatialNavProviderProps {
  children: ReactNode;
}

export function SpatialNavProvider({ children }: SpatialNavProviderProps) {
  const setInputMode = useUIStore((s) => s.setInputMode);

  useEffect(() => {
    // Fire TV APK dispatches KeyboardEvents to both window AND document.
    // Dedup: skip if same key fires twice within 50ms.
    let lastKeyTime = 0;
    let lastKeyCode = '';

    function handleKeyDown(e: KeyboardEvent) {
      const now = Date.now();
      if (e.key === lastKeyCode && now - lastKeyTime < 50) return;
      lastKeyTime = now;
      lastKeyCode = e.key;

      // Don't intercept when typing in inputs — EXCEPT arrow keys
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isInInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                        'Up', 'Down', 'Left', 'Right'].includes(e.key);

      if (isInInput && !isArrow) return;

      // When suppressArrowNav is true (player active in TV mode), skip arrow handling
      if (isArrow && useUIStore.getState().suppressArrowNav) return;

      if (isArrow) {
        e.preventDefault();  // Prevent native scroll — norigin handles focus movement, card onFocus scrolls into view
      }

      const isEnter = e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 23;
      const isNavKey = isArrow || isEnter || ['Escape', 'Backspace'].includes(e.key);

      if (isNavKey) {
        setInputMode('keyboard');
      }

      // Enter/Select: click the focused element directly.
      // norigin's onEnterPress can be unreliable with shouldUseNativeEvents:true on <div> cards.
      // Also handles Fire TV DPAD_CENTER (keyCode 23).
      // Uses data-focus-key attribute set by useSpatialFocusable to find the focused DOM element.
      // SKIP if the focused element wraps an input — let norigin's onEnterPress handle it
      // so the input can receive DOM focus naturally.
      if (isEnter && !isInInput) {
        const currentKey = getCurrentFocusKey();
        if (currentKey) {
          const focusedEl = document.querySelector(`[data-focus-key="${CSS.escape(currentKey)}"]`) as HTMLElement;
          if (focusedEl) {
            // Don't click() on elements that wrap inputs — it steals focus from the input
            const hasInput = focusedEl.querySelector('input, textarea, select');
            if (!hasInput) {
              focusedEl.click();
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          }
        }
      }

      // If in an input and arrow pressed, blur so spatial nav takes over
      if (isInInput && isArrow) {
        (document.activeElement as HTMLElement)?.blur();
      }

      // Back button handler (TV remotes: Escape, Fire TV: 4, Tizen: 10009, LG: 461)
      if (e.key === 'Escape' || e.keyCode === 4 || e.keyCode === 10009 || e.keyCode === 461) {
        // Skip if player is active — usePlayerKeyboard handles back during playback
        if (usePlayerStore.getState().currentStreamId) return;
        // Back navigation — let the app's router handle it
        if (e.key !== 'Escape') {
          window.history.back();
          e.preventDefault();
          e.stopPropagation(); // Prevent useBackNavigation from double-navigating
        }
      }

      // Bootstrap focus on first nav key if nothing is focused
      if (isNavKey && !document.querySelector('[data-focused="true"]')) {
        if (isSpatialDebug) console.log('[spatial] No focused element, bootstrapping to SN:ROOT');
        try { setFocus('SN:ROOT'); } catch { /* no focusable nodes yet */ }
      }

      if (isSpatialDebug && isArrow) {
        const currentKey = getCurrentFocusKey();
        console.log(`[spatial] Arrow ${e.key} | current focus: ${currentKey}`);
      }
    }

    function handleMouseMove() {
      setInputMode('mouse');
    }

    // Listen on BOTH document and window with capture phase.
    // Fire TV APK dispatches synthetic events to both targets.
    // 50ms dedup above prevents double-firing.
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [setInputMode]);

  return (
    <>
      {children}
      {isSpatialDebug && <SpatialDebugOverlay />}
    </>
  );
}

/** Visible overlay showing norigin focus state — only renders when ?debug=spatial */
function SpatialDebugOverlay() {
  const [info, setInfo] = useState({ focusKey: 'none', lastKey: '', focusedCount: 0 });

  useEffect(() => {
    function update() {
      const focusKey = getCurrentFocusKey() || 'none';
      const focusedEls = focusKey !== 'none' ? document.querySelectorAll(`[data-focus-key="${CSS.escape(focusKey)}"]`) : [];
      setInfo((prev) => ({
        ...prev,
        focusKey,
        focusedCount: focusedEls.length,
      }));
    }

    function onKey(e: KeyboardEvent) {
      setInfo((prev) => ({ ...prev, lastKey: e.key }));
      // Update focus state after norigin processes the key
      setTimeout(update, 50);
    }

    window.addEventListener('keydown', onKey);
    const interval = setInterval(update, 500);
    update();

    return () => {
      window.removeEventListener('keydown', onKey);
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 8, right: 8, zIndex: 99999,
      background: 'rgba(0,0,0,0.85)', color: '#2dd4bf', padding: '8px 12px',
      borderRadius: 8, fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6,
      pointerEvents: 'none', maxWidth: 320,
    }}>
      <div><strong>Spatial Debug</strong></div>
      <div>Focus: <span style={{ color: '#fff' }}>{info.focusKey}</span></div>
      <div>Last key: <span style={{ color: '#fff' }}>{info.lastKey || '-'}</span></div>
      <div>data-focused els: <span style={{ color: info.focusedCount > 0 ? '#4ade80' : '#f87171' }}>{info.focusedCount}</span></div>
    </div>
  );
}
