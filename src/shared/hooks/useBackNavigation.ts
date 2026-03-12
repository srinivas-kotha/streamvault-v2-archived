import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';

/**
 * Handles Escape and Backspace as "Back" navigation.
 * Skips when focus is in input/textarea elements.
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

      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        router.history.back();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
