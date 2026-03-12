import { useState, useEffect } from 'react';
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { useAuthStore, useUIStore } from '@lib/store';
import { useLogout } from '@features/auth/hooks/useAuth';
import { useLiveCategories } from '@features/live/api';
import { useVODCategories } from '@features/vod/api';
import { useSeriesCategories } from '@features/series/api';
import { getDetectedLanguages } from '@shared/utils/categoryParser';

export function TopNav() {
  const username = useAuthStore((s) => s.username);
  const logoutMutation = useLogout();
  const matchRoute = useMatchRoute();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Detect languages from categories
  const { data: liveCategories } = useLiveCategories();
  const { data: vodCategories } = useVODCategories();
  const { data: seriesCategories } = useSeriesCategories();

  const languages = getDetectedLanguages(
    liveCategories ?? [],
    vodCategories ?? [],
    seriesCategories ?? []
  );

  // Track scroll position for transparency
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const handleScroll = () => setScrolled(main.scrollTop > 20);
    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => main.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown on outside click or Escape key
  useEffect(() => {
    if (!profileOpen) return;
    const handleClick = () => setProfileOpen(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);


  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-obsidian/90 backdrop-blur-xl border-b border-border-subtle shadow-lg'
          : 'bg-gradient-to-b from-obsidian/80 to-transparent'
      }`}
    >
      <nav className="flex items-center h-16 px-6 lg:px-10">
        {/* Logo */}
        <Link
          to="/"
          className="font-display text-xl font-bold text-text-primary hover:text-teal transition-colors mr-8 flex-shrink-0"
        >
          Stream<span className="text-teal">Vault</span>
        </Link>

        {/* Nav items — wrapped in FocusContext for spatial nav */}
        <TopNavFocusGroup languages={languages} matchRoute={matchRoute} />

        {/* Profile */}
        <ProfileMenu
          username={username}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          onLogout={() => logoutMutation.mutate()}
        />
      </nav>
    </header>
  );
}

interface NavItemProps {
  to: string;
  label: string;
  isActive: boolean;
  icon?: React.ReactNode;
}

function NavItem({ to, label, isActive, icon }: NavItemProps) {
  const navigate = useNavigate();
  const inputMode = useUIStore((s) => s.inputMode);

  const { ref, focused } = useFocusable({
    onEnterPress: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: to as any });
    },
    onFocus: ({ node }) => {
      node?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    },
  });

  const showFocus = focused && inputMode === 'keyboard';

  return (
    <Link
      ref={ref}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      className={`relative flex items-center gap-1.5 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap min-h-[48px] transition-all ${
        isActive
          ? 'text-text-primary'
          : showFocus
            ? 'text-text-primary bg-surface-raised/50 ring-2 ring-teal/50'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised/30'
      }`}
    >
      {icon}
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-teal to-indigo rounded-full" />
      )}
    </Link>
  );
}

function TopNavFocusGroup({ languages, matchRoute }: { languages: string[]; matchRoute: ReturnType<typeof useMatchRoute> }) {
  const isHome = matchRoute({ to: '/', fuzzy: false });

  const { ref, focusKey } = useFocusable({
    focusKey: 'top-nav',
    saveLastFocusedChild: true,
    trackChildren: true,
    isFocusBoundary: true,
    focusBoundaryDirections: ['up'],
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
        <NavItem to="/" label="Home" isActive={!!isHome} />
        {languages.map((lang) => (
          <NavItem
            key={lang}
            to={`/language/${lang.toLowerCase()}`}
            label={lang}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            isActive={!!matchRoute({ to: `/language/${lang.toLowerCase()}` as any, fuzzy: true })}
          />
        ))}
        <NavItem to="/search" label="Search" isActive={!!matchRoute({ to: '/search', fuzzy: true })} icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        } />
      </div>
    </FocusContext.Provider>
  );
}

function ProfileMenu({
  username,
  profileOpen,
  setProfileOpen,
  onLogout,
}: {
  username: string | null;
  profileOpen: boolean;
  setProfileOpen: (v: boolean) => void;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const inputMode = useUIStore((s) => s.inputMode);

  const { ref: profileBtnRef, focused: profileFocused } = useFocusable({
    onEnterPress: () => setProfileOpen(!profileOpen),
  });

  const { ref: favRef, focused: favFocused } = useFocusable({
    onEnterPress: () => { navigate({ to: '/favorites' }); setProfileOpen(false); },
  });

  const { ref: histRef, focused: histFocused } = useFocusable({
    onEnterPress: () => { navigate({ to: '/history' }); setProfileOpen(false); },
  });

  const { ref: logoutRef, focused: logoutFocused } = useFocusable({
    onEnterPress: onLogout,
  });

  const showProfileFocus = profileFocused && inputMode === 'keyboard';

  return (
    <div className="relative ml-4 flex-shrink-0">
      <button
        ref={profileBtnRef}
        onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
        aria-expanded={profileOpen}
        aria-haspopup="menu"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised/50 transition-all min-h-[48px] ${
          showProfileFocus ? 'ring-2 ring-teal/50 text-text-primary' : ''
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-indigo flex items-center justify-center text-sm font-bold text-obsidian">
          {username?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <span className="text-sm hidden lg:block">{username}</span>
      </button>

      {profileOpen && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-48 py-2 bg-surface-raised border border-border rounded-lg shadow-xl z-[60]">
          <Link
            ref={favRef}
            to="/favorites"
            role="menuitem"
            className={`block px-4 py-2.5 text-sm min-h-[44px] flex items-center transition-colors ${
              favFocused && inputMode === 'keyboard'
                ? 'text-text-primary bg-teal/10 ring-1 ring-teal/40'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            Favorites
          </Link>
          <Link
            ref={histRef}
            to="/history"
            role="menuitem"
            className={`block px-4 py-2.5 text-sm min-h-[44px] flex items-center transition-colors ${
              histFocused && inputMode === 'keyboard'
                ? 'text-text-primary bg-teal/10 ring-1 ring-teal/40'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            Watch History
          </Link>
          <hr className="my-1 border-border-subtle" />
          <button
            ref={logoutRef}
            role="menuitem"
            onClick={onLogout}
            className={`w-full text-left px-4 py-2.5 text-sm min-h-[44px] transition-colors ${
              logoutFocused && inputMode === 'keyboard'
                ? 'text-error bg-error/10 ring-1 ring-error/40'
                : 'text-error hover:bg-surface-hover'
            }`}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
