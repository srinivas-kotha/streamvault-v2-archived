import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { TopNav } from '@shared/components/TopNav';
import { SpatialNavigationProvider } from '@shared/providers/SpatialNavigationProvider';
import { useAuthStore } from '@lib/store';
import { useAuthCheck } from '@features/auth/hooks/useAuth';
import { useBackNavigation } from '@shared/hooks/useBackNavigation';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useAuthCheck();
  useBackNavigation();

  return (
    <SpatialNavigationProvider>
      <div className="min-h-screen bg-obsidian">
        <TopNav />
        <main className="min-h-screen pt-16 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </SpatialNavigationProvider>
  );
}
