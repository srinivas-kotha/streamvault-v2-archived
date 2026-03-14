import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { usePlayerStore } from '@lib/store';

/**
 * Handles Escape and Backspace as "Back" navigation.
 * Skips when:
 * - Focus is in input/textarea elements
 * - A player is currently active (usePlayerKeyboard handles those keys instead)
 */
export function useBackNavigation() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when typing
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).isContentEditable
      ) return;

      // Don't intercept when player is active — usePlayerKeyboard handles it
      if (usePlayerStore.getState().currentStreamId) return;

      if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 4) {
        e.preventDefault();
        router.history.back();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
