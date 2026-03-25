import { useEffect, useRef, useState } from "react";
import { useNetworkStatus } from "@shared/hooks/useNetworkStatus";
import { cn } from "@shared/utils/cn";

/**
 * Fixed banner at the top of the screen indicating network status.
 *
 * - Offline: persistent amber banner with warning message.
 * - Reconnected: brief green banner that auto-dismisses after 3 seconds.
 * - Online (no prior offline): renders nothing.
 */
export function NetworkBanner() {
  const { isOnline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const prevOnlineRef = useRef<boolean>(isOnline);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wasOnline = prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (!wasOnline && isOnline) {
      // Transition: offline → online — show "restored" banner briefly
      setShowReconnected(true);

      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [isOnline]);

  if (isOnline && !showReconnected) return null;

  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="network-banner-offline"
        className={cn(
          "fixed top-0 inset-x-0 z-[60]",
          "flex items-center justify-center gap-2",
          "px-4 py-2",
          "bg-warning/15 border-b border-warning/30 text-warning",
          "text-sm font-medium",
        )}
      >
        <span aria-hidden="true">⚠</span>
        You are offline — some features may be unavailable
      </div>
    );
  }

  // showReconnected === true
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="network-banner-reconnected"
      className={cn(
        "fixed top-0 inset-x-0 z-[var(--z-toast)]",
        "flex items-center justify-center gap-2",
        "px-4 py-2",
        "bg-success/15 border-b border-success/30 text-success",
        "text-sm font-medium",
      )}
    >
      <span aria-hidden="true">✓</span>
      Connection restored
    </div>
  );
}
