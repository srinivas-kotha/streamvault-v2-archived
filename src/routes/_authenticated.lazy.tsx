import { createLazyFileRoute, Outlet } from "@tanstack/react-router";
import { TopNav } from "@shared/components/TopNav";
import { useAuthCheck } from "@features/auth/hooks/useAuth";
import { useBackNavigation } from "@shared/hooks/useBackNavigation";

export const Route = createLazyFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useAuthCheck();
  useBackNavigation();

  return (
    <div className="min-h-screen bg-obsidian">
      <TopNav />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen pt-14 px-6 lg:px-10 overflow-y-auto scrollbar-hide focus:outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
}
