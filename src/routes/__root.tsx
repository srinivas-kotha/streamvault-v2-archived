import { createRootRoute, Outlet } from "@tanstack/react-router";
import { PlayerShell } from "@features/player/components/PlayerShell";
import { ErrorBoundary } from "@shared/components/ErrorBoundary";
import { ToastContainer } from "@shared/components/Toast";
import { InputModeProvider } from "@/providers/InputModeProvider";
import { LayoutSelector } from "@/layouts/LayoutSelector";
import { useDeviceContext } from "@/hooks/useDeviceContext";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { isTVMode } = useDeviceContext();

  return (
    <InputModeProvider>
      {!isTVMode && <div className="grain-overlay" />}
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
