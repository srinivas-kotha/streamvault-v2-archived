import { useEffect, useRef, useCallback, useState } from 'react';
import { useLRUDContext, lrud } from '../providers/LRUDProvider';
import type { NodeConfig } from '@bam.tech/lrud';

// ── Pending registration queue ──────────────────────────────────────────────
// React fires child useEffects before parent useEffects. When a child tries
// to register with a parent that hasn't mounted yet, LRUD silently drops it.
// We queue failed registrations and flush them after the current effect batch.
interface PendingEntry {
  id: string;
  config: Record<string, unknown>;
}

const pendingQueue: PendingEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  // setTimeout(0) fires after all synchronous useEffects in the current
  // React render cycle, so all parent containers will be registered by then.
  flushTimer = setTimeout(flushPending, 0);
}

function flushPending() {
  flushTimer = null;
  // Multiple passes: level-1 parents register first, then level-2 children
  // can find them on the next pass, and so on.
  let changed = true;
  while (changed && pendingQueue.length > 0) {
    changed = false;
    for (let i = pendingQueue.length - 1; i >= 0; i--) {
      const entry = pendingQueue[i];
      if (!entry) continue;
      const { id, config } = entry;
      // Skip if already registered (e.g. by a re-mount)
      if (lrud.getNode(id)) {
        pendingQueue.splice(i, 1);
        changed = true;
        continue;
      }
      lrud.registerNode(id, config);
      if (lrud.getNode(id)) {
        pendingQueue.splice(i, 1);
        changed = true;
      }
    }
  }
  if (pendingQueue.length > 0) {
    console.warn('[LRUD] Failed to register nodes (missing parents):', pendingQueue.map(e => e.id));
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────

interface UseLRUDOptions extends Omit<NodeConfig, 'id'> {
  id: string;
  onEnter?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  parent?: string;
}

export function useLRUD({ id, onEnter, onFocus, onBlur, parent = 'root', ...config }: UseLRUDOptions) {
  const ctx = useLRUDContext();
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
    // Unregister first in case the node already exists (e.g. HMR, re-mount)
    try { lrud.unregisterNode(id); } catch { /* not registered yet */ }

    // Remove from pending queue if it was queued from a previous mount
    const pendingIdx = pendingQueue.findIndex(e => e.id === id);
    if (pendingIdx >= 0) pendingQueue.splice(pendingIdx, 1);

    // @bam.tech/lrud considers a node focusable only if isFocusable=true or
    // selectAction is set. Default leaf nodes (no orientation) to focusable.
    const isFocusable = config.isFocusable ?? (config.orientation == null);
    const nodeConfig = {
      parent,
      ...config,
      isFocusable,
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
    };

    // Attempt registration — if parent doesn't exist yet, queue for retry
    lrud.registerNode(id, nodeConfig);
    if (!lrud.getNode(id)) {
      pendingQueue.push({ id, config: nodeConfig });
      scheduleFlush();
    }

    return () => {
      // Remove from pending queue on unmount
      const idx = pendingQueue.findIndex(e => e.id === id);
      if (idx >= 0) pendingQueue.splice(idx, 1);
      // Unregister the node when the component unmounts
      try { lrud.unregisterNode(id); } catch { /* Node might already be gone */ }
    };
  }, [id, ctx.lrud, parent, config.orientation, config.isFocusable]);

  // Handle focus natively manually via mouse/touch
  const handleMouseEnter = useCallback(() => {
    try {
      lrud.assignFocus(id);
    } catch {
      // Ignore if node is not focusable or tree isn't ready
    }
  }, [id, ctx.lrud]);

  const setFocus = useCallback(() => {
    try {
      lrud.assignFocus(id);
    } catch {
      console.warn(`Could not focus LRUD node ${id}`);
    }
  }, [id, ctx.lrud]);

  return {
    ref,
    isFocused,
    setFocus,
    focusProps: {
      onMouseEnter: handleMouseEnter,
      onFocus: handleMouseEnter,
    }
  };
}
