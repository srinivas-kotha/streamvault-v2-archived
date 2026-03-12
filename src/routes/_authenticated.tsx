import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Navbar } from '@shared/components/Navbar';
import { Sidebar } from '@shared/components/Sidebar';
import { useAuthStore } from '@lib/store';
import { useAuthCheck } from '@features/auth/hooks/useAuth';

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
  // Re-validate session with server on mount (handles cookie-valid but store-stale case)
  useAuthCheck();

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
