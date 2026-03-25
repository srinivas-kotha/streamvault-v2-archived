import { createRootRoute, Outlet } from "@tanstack/react-router";
import { PlayerShell } from "@features/player/components/PlayerShell";
import { ErrorBoundary } from "@shared/components/ErrorBoundary";
import { ToastContainer } from "@shared/components/Toast";
import { NetworkBanner } from "@shared/components/NetworkBanner";
import { InputModeProvider } from "@/providers/InputModeProvider";
import { LayoutSelector } from "@/layouts/LayoutSelector";
import { useDeviceContext } from "@/hooks/useDeviceContext";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { isTVMode } = useDeviceContext();
  useServiceWorkerUpdate();

  return (
    <InputModeProvider>
      {!isTVMode && <div className="grain-overlay" />}
      <NetworkBanner />
      <ErrorBoundary>
        <LayoutSelector>
          <Outlet />
        </LayoutSelector>
      </ErrorBoundary>
      {/* PlayerShell OUTSIDE LayoutSelector — AC-01: no CSS transform ancestors */}
      <PlayerShell />
      <ToastContainer />
    </InputModeProvider>
  );
}
