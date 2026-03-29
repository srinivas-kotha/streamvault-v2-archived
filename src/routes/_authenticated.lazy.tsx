import {
  createLazyFileRoute,
  Outlet,
  Link,
  useParams,
} from "@tanstack/react-router";
import { TopNav } from "@shared/components/TopNav";
import { useAuthCheck } from "@features/auth/hooks/useAuth";
import { useBackNavigation } from "@shared/hooks/useBackNavigation";
import { useTokenRefresh } from "@features/auth/hooks/useTokenRefresh";
import { useSpatialFocusable } from "@shared/hooks/useSpatialNav";

export const Route = createLazyFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const GLOBAL_NAV = [
  { to: "/language/telugu", key: "telugu", label: "Telugu" },
  { to: "/language/hindi", key: "hindi", label: "Hindi" },
  { to: "/language/english", key: "english", label: "English" },
  { to: "/sports", key: "sports", label: "Sports" },
  { to: "/search", key: "search", label: "Search" },
];

function GlobalNavLink({
  to,
  navKey,
  label,
  isActive,
}: {
  to: string;
  navKey: string;
  label: string;
  isActive: boolean;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `global-nav-${navKey}`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEnterPress: () => {
      window.location.href = to;
    },
  });

  return (
    <Link
      ref={ref}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      {...focusProps}
      className={`relative px-5 py-2.5 text-sm font-semibold transition-[background-color,border-color,color] min-h-[44px] rounded-lg ${
        isActive
          ? "text-teal bg-teal/10 border border-teal/30"
          : showFocusRing
            ? "text-text-primary bg-surface-raised/50 ring-2 ring-teal/50"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-raised/30"
      }`}
    >
      {label}
    </Link>
  );
}

function AuthenticatedLayout() {
  useAuthCheck();
  useBackNavigation();
  useTokenRefresh();

  // Detect current route for active state
  const params = useParams({ strict: false }) as { lang?: string };
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <div className="min-h-screen bg-obsidian">
      <TopNav />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen pt-14 px-6 lg:px-10 overflow-y-auto scrollbar-hide focus:outline-none"
      >
        {/* Global navigation — always visible */}
        <div className="pt-2 pb-2">
          <div className="flex items-center gap-2">
            {GLOBAL_NAV.map((item) => (
              <GlobalNavLink
                key={item.key}
                to={item.to}
                navKey={item.key}
                label={item.label}
                isActive={
                  item.key === "sports"
                    ? currentPath === "/sports"
                    : item.key === "search"
                      ? currentPath === "/search"
                      : params.lang === item.key
                }
              />
            ))}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
