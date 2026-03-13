import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { TopNav } from '@shared/components/TopNav';
import { useAuthStore } from '@lib/store';
import { useAuthCheck } from '@features/auth/hooks/useAuth';
import { useBackNavigation } from '@shared/hooks/useBackNavigation';
import { autoLogin } from '@features/auth/api';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { isAuthenticated, setAuth } = useAuthStore.getState();
    if (!isAuthenticated) {
      // Try IP-based auto-login (LAN bypass)
      const result = await autoLogin();
      if (result) {
        setAuth(result.username);
        return;
      }
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useAuthCheck();
  useBackNavigation();

  return (
    <div className="min-h-screen bg-obsidian">
      <TopNav />
      <main className="min-h-screen pt-16 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
