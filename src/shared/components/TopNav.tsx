import { useState, useEffect, useRef } from 'react';
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router';
import { useSpatialFocusable, useSpatialContainer, FocusContext, setFocus } from '@shared/hooks/useSpatialNav';
import { useAuthStore } from '@lib/store';
import { useLogout } from '@features/auth/hooks/useAuth';
import { useLiveCategories } from '@features/live/api';
import { useVODCategories } from '@features/vod/api';
import { useSeriesCategories } from '@features/series/api';
import { getDetectedLanguages } from '@shared/utils/categoryParser';
import { isTVMode } from '@shared/utils/isTVMode';

export function TopNav() {
  const username = useAuthStore((s) => s.username);
  const logoutMutation = useLogout();
  const matchRoute = useMatchRoute();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Register the top-nav spatial container
  const { ref: topNavRef, focusKey: topNavFocusKey } = useSpatialContainer({
    focusKey: 'top-nav',
  });

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close profile dropdown on outside click or Escape key
  useEffect(() => {
    const handleClick = () => {
      setProfileOpen(false);
      setMobileMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // TV mode: full nav header with Home, language links, Search, and profile
  if (isTVMode) {
    return (
      <FocusContext.Provider value={topNavFocusKey}>
        <header ref={topNavRef} className="fixed top-0 left-0 right-0 z-50 bg-obsidian/95 backdrop-blur-sm">
          <nav className="flex items-center h-12 px-4 lg:px-10 gap-2">
            <Link to="/" className="font-display text-lg font-bold text-text-primary flex-shrink-0">
              Stream<span className="text-teal">Vault</span>
            </Link>
            <TopNavFocusGroup languages={languages} matchRoute={matchRoute} />
            <ProfileMenu
              username={username}
              profileOpen={profileOpen}
              setProfileOpen={setProfileOpen}
              onLogout={() => logoutMutation.mutate()}
            />
          </nav>
        </header>
      </FocusContext.Provider>
    );
  }

  return (
    <FocusContext.Provider value={topNavFocusKey}>
      <header
        ref={topNavRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || mobileMenuOpen
            ? 'bg-obsidian/90 backdrop-blur-xl border-b border-border-subtle shadow-lg'
            : 'bg-gradient-to-b from-obsidian/80 to-transparent'
        }`}
      >
        <nav className="flex items-center justify-between h-16 px-4 lg:px-10">
          <div className="flex items-center">
            {/* Hamburger Menu Button (Mobile Only) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
                setProfileOpen(false);
              }}
              className="md:hidden p-2 mr-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised/50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Logo */}
            <Link
              to="/"
              className="font-display text-xl font-bold text-text-primary hover:text-teal transition-colors mr-8 flex-shrink-0"
            >
              Stream<span className="text-teal">Vault</span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex flex-1 items-center overflow-x-auto scrollbar-hide">
            <TopNavFocusGroup languages={languages} matchRoute={matchRoute} />
          </div>

          {/* Profile */}
          <div className="flex items-center">
            {/* Search Icon (Mobile Only) */}
            <Link
              to="/search"
              className="md:hidden p-2 mr-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            <ProfileMenu
              username={username}
              profileOpen={profileOpen}
              setProfileOpen={(v) => {
                setProfileOpen(v);
                if (v) setMobileMenuOpen(false);
              }}
              onLogout={() => logoutMutation.mutate()}
            />
          </div>
        </nav>

        {/* Mobile Menu Dropdown (touch-only, no spatial nav) */}
        <div
          className={`md:hidden fixed top-16 left-0 right-0 bg-surface-raised border-b border-border shadow-xl px-4 py-4 space-y-2 overflow-y-auto transition-transform origin-top duration-300 ${
            mobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
          }`}
          style={{ maxHeight: 'calc(100vh - 64px)' }}
        >
          <MobileNavLinks languages={languages} matchRoute={matchRoute} />
        </div>
      </header>
    </FocusContext.Provider>
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

  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `nav-item-${to}`,
    onEnterPress: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: to as any });
    },
  });

  return (
    <Link
      ref={ref}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      {...focusProps}
      className={`relative flex items-center gap-1.5 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap min-h-[48px] transition-all ${
        isActive
          ? 'text-text-primary'
          : showFocusRing
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

  const { ref: groupRef, focusKey } = useSpatialContainer({
    focusKey: 'top-nav-items',
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={groupRef} className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
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

/** Mobile dropdown nav — plain Links, no spatial nav (touch-only) */
function MobileNavLinks({ languages, matchRoute }: { languages: string[]; matchRoute: ReturnType<typeof useMatchRoute> }) {
  const isHome = matchRoute({ to: '/', fuzzy: false });
  return (
    <div className="flex flex-col gap-2">
      <Link to="/" className={`px-4 py-3 rounded-lg text-sm font-medium ${isHome ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised/30'}`}>Home</Link>
      {languages.map((lang) => (
        <Link
          key={lang}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          to={`/language/${lang.toLowerCase()}` as any}
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            matchRoute({ to: `/language/${lang.toLowerCase()}` as any, fuzzy: true }) ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised/30'
          }`}
        >{lang}</Link>
      ))}
      <Link to="/search" className={`px-4 py-3 rounded-lg text-sm font-medium ${matchRoute({ to: '/search', fuzzy: true }) ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised/30'}`}>Search</Link>
    </div>
  );
}

/**
 * Profile dropdown menu items — extracted into a separate component
 * that only mounts when profileOpen is true (norigin conditional render pattern:
 * never call useFocusable then conditionally return null).
 */
function ProfileDropdownItems({
  onNavigate,
  onLogout,
}: {
  onNavigate: (to: string) => void;
  onLogout: () => void;
}) {
  const { ref: menuRef, focusKey: menuFocusKey } = useSpatialContainer({
    focusKey: 'profile-menu',
  });

  const { ref: favRef, showFocusRing: favShowFocus, focusProps: favProps } = useSpatialFocusable({
    focusKey: 'profile-menu-fav',
    onEnterPress: () => onNavigate('/favorites'),
  });

  const { ref: histRef, showFocusRing: histShowFocus, focusProps: histProps } = useSpatialFocusable({
    focusKey: 'profile-menu-history',
    onEnterPress: () => onNavigate('/history'),
  });

  const { ref: logoutRef, showFocusRing: logoutShowFocus, focusProps: logoutProps } = useSpatialFocusable({
    focusKey: 'profile-menu-logout',
    onEnterPress: onLogout,
  });

  return (
    <FocusContext.Provider value={menuFocusKey}>
      <div ref={menuRef} role="menu" className="absolute right-0 top-full mt-2 w-48 py-2 bg-surface-raised border border-border rounded-lg shadow-xl z-[60]">
        <Link
          ref={favRef}
          to="/favorites"
          role="menuitem"
          {...favProps}
          className={`block px-4 py-2.5 text-sm min-h-[44px] flex items-center transition-colors ${
            favShowFocus
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
          {...histProps}
          className={`block px-4 py-2.5 text-sm min-h-[44px] flex items-center transition-colors ${
            histShowFocus
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
          {...logoutProps}
          className={`w-full text-left px-4 py-2.5 text-sm min-h-[44px] transition-colors ${
            logoutShowFocus
              ? 'text-error bg-error/10 ring-1 ring-error/40'
              : 'text-error hover:bg-surface-hover'
          }`}
        >
          Sign Out
        </button>
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
  const prevProfileOpen = useRef(profileOpen);

  // When profile menu closes, restore focus to profile button
  useEffect(() => {
    if (prevProfileOpen.current && !profileOpen) {
      setFocus('profile-btn');
    }
    prevProfileOpen.current = profileOpen;
  }, [profileOpen]);

  const { ref: profileBtnRef, showFocusRing: showProfileFocus, focusProps: profileFocusProps } = useSpatialFocusable({
    focusKey: 'profile-btn',
    onEnterPress: () => setProfileOpen(!profileOpen),
  });

  const handleNavigate = (to: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: to as any });
    setProfileOpen(false);
  };

  return (
    <div className="relative ml-4 flex-shrink-0">
      <button
        ref={profileBtnRef}
        {...profileFocusProps}
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
        <ProfileDropdownItems
          onNavigate={handleNavigate}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}
