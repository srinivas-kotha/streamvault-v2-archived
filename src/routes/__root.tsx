import { createRootRoute, Outlet } from '@tanstack/react-router';
import { MiniPlayer } from '@features/player/components/MiniPlayer';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <div className="grain-overlay" />
      <Outlet />
      <MiniPlayer />
    </>
  );
}
