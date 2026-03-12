import { Link } from '@tanstack/react-router';
import { useLogout } from '@features/auth/hooks/useAuth';
import { useAuthStore } from '@lib/store';

export function Navbar() {
  const username = useAuthStore((s) => s.username);
  const logoutMutation = useLogout();

  return (
    <header className="h-14 bg-surface/80 backdrop-blur-md border-b border-border-subtle flex items-center justify-between px-4 sticky top-0 z-40">
      <Link to="/" className="font-display text-xl font-bold text-text-primary hover:text-teal transition-colors">
        Stream<span className="text-teal">Vault</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          to="/search"
          className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-raised transition-all"
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </Link>

        {username && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary hidden sm:block">{username}</span>
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-sm text-text-muted hover:text-error transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
