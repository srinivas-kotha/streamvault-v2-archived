import { useEffect, useRef } from "react";
import { useToastStore } from "@lib/toastStore";

/**
 * Listens for service worker updates and shows a toast with a "Refresh" action
 * when a new SW version is waiting to activate.
 *
 * The SW posts a `SW_UPDATE_WAITING` message on install.
 * On refresh, we send `SKIP_WAITING` to the waiting SW then reload the page.
 */
export function useServiceWorkerUpdate(): void {
  // Track registration so we can send SKIP_WAITING to the correct waiting SW
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker) return;

    let didCleanup = false;

    // Keep a reference to the current registration
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (didCleanup || !reg) return;
      registrationRef.current = reg;
    });

    function showUpdateToast() {
      useToastStore.getState().addToast(
        "New version available — refresh to update",
        "info",
        0, // do not auto-dismiss; user must act
      );
    }

    function handleRefresh() {
      const waiting = registrationRef.current?.waiting;
      if (waiting) {
        waiting.postMessage({ type: "SKIP_WAITING" });
      }
      window.location.reload();
    }

    // Listen for the SW_UPDATE_WAITING message posted by the new SW during install
    function handleMessage(event: MessageEvent) {
      if (event.data && event.data.type === "SW_UPDATE_WAITING") {
        showUpdateToast();
      }
    }

    // Also detect when a new SW takes control (controllerchange fires after skipWaiting)
    function handleControllerChange() {
      // A new SW has taken control — reload for a clean state
      window.location.reload();
    }

    // Listen for a waiting SW on the current registration (handles page-refresh case)
    function checkForWaitingSW(reg: ServiceWorkerRegistration) {
      if (reg.waiting) {
        showUpdateToast();
      }

      // Handle the case where the SW transitions to waiting after registration
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showUpdateToast();
          }
        });
      });
    }

    navigator.serviceWorker.addEventListener("message", handleMessage);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    // Check for a waiting SW right now (e.g., after page reload)
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (didCleanup || !reg) return;
      checkForWaitingSW(reg);
    });

    // Expose refresh handler on window so the toast action can call it
    // (used by tests and by a potential action button pattern)
    (window as Window & { __swRefresh?: () => void }).__swRefresh =
      handleRefresh;

    return () => {
      didCleanup = true;
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
      delete (window as Window & { __swRefresh?: () => void }).__swRefresh;
    };
  }, []);
}
