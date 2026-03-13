import { useEffect, useRef, useCallback, useState } from 'react';
import { useLRUDContext } from '../providers/LRUDProvider';
import type { NodeConfig } from '@bam.tech/lrud';

interface UseLRUDOptions extends Omit<NodeConfig, 'id'> {
  id: string;
  onEnter?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  parent?: string;
}

export function useLRUD({ id, onEnter, onFocus, onBlur, parent = 'root', ...config }: UseLRUDOptions) {
  const { lrud } = useLRUDContext();
  const [isFocused, setIsFocused] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  // Callback ref compatible with any HTML element type
  const ref = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  // Use refs for callbacks to avoid re-registration on every render
  const onEnterRef = useRef(onEnter);
  const onFocusRef = useRef(onFocus);
  const onBlurRef = useRef(onBlur);
  onEnterRef.current = onEnter;
  onFocusRef.current = onFocus;
  onBlurRef.current = onBlur;

  useEffect(() => {
    // Register the node in the LRUD tree with parent
    lrud.registerNode(id, {
      parent,
      ...config,
      onFocus: () => {
        setIsFocused(true);
        onFocusRef.current?.();

        // Auto-scroll the DOM node into view when focused by the keyboard
        if (elementRef.current && typeof elementRef.current.scrollIntoView === 'function') {
          elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      },
      onBlur: () => {
        setIsFocused(false);
        onBlurRef.current?.();
      },
      onSelect: () => {
        onEnterRef.current?.();
      }
    });

    return () => {
      // Unregister the node when the component unmounts
      try {
        lrud.unregisterNode(id);
      } catch {
        // Node might already be gone
      }
    };
  }, [id, lrud, parent, config.orientation, config.isFocusable]);

  // Handle focus natively manually via mouse/touch
  const handleMouseEnter = useCallback(() => {
    try {
      lrud.assignFocus(id);
    } catch {
      // Ignore if node is not focusable or tree isn't ready
    }
  }, [id, lrud]);

  const setFocus = useCallback(() => {
    try {
      lrud.assignFocus(id);
    } catch {
      console.warn(`Could not focus LRUD node ${id}`);
    }
  }, [id, lrud]);

  return {
    ref,
    isFocused,
    setFocus,
    focusProps: {
      onMouseEnter: handleMouseEnter,
      // For accessibility, still use standard focus handlers if the element is naturally focusable
      onFocus: handleMouseEnter,
    }
  };
}
