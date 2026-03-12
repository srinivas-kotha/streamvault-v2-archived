import { useState, useEffect, useCallback } from 'react';

interface UseGridNavigationOptions {
  totalItems: number;
  columns: number;
  onSelect?: (index: number) => void;
  enabled?: boolean;
}

export function useGridNavigation({
  totalItems,
  columns,
  onSelect,
  enabled = true,
}: UseGridNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (focusedIndex === -1) return;

      let newIndex = focusedIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          newIndex = Math.min(focusedIndex + 1, totalItems - 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = Math.max(focusedIndex - 1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(focusedIndex + columns, totalItems - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(focusedIndex - columns, 0);
          break;
        case 'Enter':
          e.preventDefault();
          onSelect?.(focusedIndex);
          return;
        default:
          return;
      }

      setFocusedIndex(newIndex);
      // Scroll focused element into view
      const el = document.querySelector(`[data-grid-index="${newIndex}"]`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, focusedIndex, totalItems, columns, onSelect]);

  const getItemProps = useCallback(
    (index: number) => ({
      'data-grid-index': index,
      tabIndex: index === focusedIndex ? 0 : -1,
      onFocus: () => setFocusedIndex(index),
      onClick: () => {
        setFocusedIndex(index);
        onSelect?.(index);
      },
      className: index === focusedIndex ? 'focus-ring ring-2 ring-teal/50 ring-offset-2 ring-offset-obsidian rounded-lg' : '',
    }),
    [focusedIndex, onSelect]
  );

  return { focusedIndex, setFocusedIndex, getItemProps };
}
