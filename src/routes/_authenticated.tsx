import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { TopNav } from '@shared/components/TopNav';
import { useAuthStore } from '@lib/store';
import { useAuthCheck } from '@features/auth/hooks/useAuth';
import { useBackNavigation } from '@shared/hooks/useBackNavigation';
import { autoLogin, checkAuth } from '@features/auth/api';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { isAuthenticated, setAuth } = useAuthStore.getState();
    if (!isAuthenticated) {
      // Try silent cookie-based auth check (httpOnly refresh token may still be valid)
      const cookieValid = await checkAuth();
      if (cookieValid) {
        const savedUsername = localStorage.getItem('sv_user') || 'user';
        setAuth(savedUsername);
        return;
      }
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
      <main className="min-h-screen pt-14 px-6 lg:px-10 overflow-y-auto scrollbar-hide">
        <Outlet />
      </main>
    </div>
  );
}
