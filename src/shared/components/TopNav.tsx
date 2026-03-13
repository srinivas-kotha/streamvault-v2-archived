import { useState, useEffect } from 'react';
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router';
import { useLRUD } from '@shared/hooks/useLRUD';
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

  // Register the top-nav LRUD container so children (hamburger, nav-items, profile-btn) have a parent
  const { ref: topNavRef } = useLRUD({
    id: 'top-nav',
    parent: 'root',
    orientation: 'horizontal',
    isFocusable: false,
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

  const inputMode = useUIStore((s) => s.inputMode);

  const { ref: hamburgerRef, isFocused: hamburgerFocused } = useLRUD({
    id: 'hamburger-menu',
    parent: 'top-nav',
    onEnter: () => setMobileMenuOpen((prev) => !prev),
  });

  return (
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
            ref={hamburgerRef}
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(!mobileMenuOpen);
              setProfileOpen(false);
            }}
            className={`md:hidden p-2 mr-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised/50 transition-colors ${
              hamburgerFocused && inputMode === 'keyboard' ? 'ring-2 ring-teal/50 text-text-primary' : ''
            }`}
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

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden fixed top-16 left-0 right-0 bg-surface-raised border-b border-border shadow-xl px-4 py-4 space-y-2 overflow-y-auto transition-transform origin-top duration-300 ${
          mobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
        }`}
        style={{ maxHeight: 'calc(100vh - 64px)' }}
      >
        <TopNavFocusGroup languages={languages} matchRoute={matchRoute} isMobile={true} isOpen={mobileMenuOpen} />
      </div>
    </header>
  );
}

interface NavItemProps {
  to: string;
  label: string;
  isActive: boolean;
  icon?: React.ReactNode;
  isFocusable?: boolean;
}

function NavItem({ to, label, isActive, icon, isFocusable = true }: NavItemProps) {
  const navigate = useNavigate();
  const inputMode = useUIStore((s) => s.inputMode);

  const { ref, isFocused, focusProps } = useLRUD({
    id: `nav-item-${to}`,
    parent: 'top-nav-items',
    isFocusable,
    onEnter: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: to as any });
    },
  });

  const showFocus = isFocused && inputMode === 'keyboard';

  return (
    <Link
      ref={ref}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      {...focusProps}
      tabIndex={isFocusable ? 0 : -1}
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

function TopNavFocusGroup({ languages, matchRoute, isMobile, isOpen = true }: { languages: string[]; matchRoute: ReturnType<typeof useMatchRoute>; isMobile?: boolean; isOpen?: boolean }) {
  const isHome = matchRoute({ to: '/', fuzzy: false });

  // Register a boundary container node for all the nav items
  const { ref: groupRef } = useLRUD({
    id: 'top-nav-items',
    parent: 'top-nav',
    orientation: isMobile ? 'vertical' : 'horizontal',
    isFocusable: false, // It's just a structural proxy node
  });

  return (
    <div ref={groupRef} className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-1 overflow-x-auto scrollbar-hide flex-1'}`}>
      <NavItem to="/" label="Home" isActive={!!isHome} isFocusable={isOpen} />
      {languages.map((lang) => (
        <NavItem
          key={lang}
          to={`/language/${lang.toLowerCase()}`}
          label={lang}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          isActive={!!matchRoute({ to: `/language/${lang.toLowerCase()}` as any, fuzzy: true })}
          isFocusable={isOpen}
        />
      ))}
      {!isMobile && (
        <NavItem isFocusable={isOpen} to="/search" label="Search" isActive={!!matchRoute({ to: '/search', fuzzy: true })} icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        } />
      )}
    </div>
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

  // Register the profile-menu LRUD container so dropdown children have a parent
  const { ref: menuRef } = useLRUD({
    id: 'profile-menu',
    parent: 'top-nav',
    orientation: 'vertical',
    isFocusable: false,
  });

  const { ref: profileBtnRef, isFocused: profileFocused } = useLRUD({
    id: 'profile-btn',
    parent: 'top-nav',
    onEnter: () => setProfileOpen(!profileOpen),
  });

  const { ref: favRef, isFocused: favFocused, focusProps: favProps } = useLRUD({
    id: 'profile-menu-fav',
    parent: 'profile-menu',
    onEnter: () => { navigate({ to: '/favorites' }); setProfileOpen(false); },
  });

  const { ref: histRef, isFocused: histFocused, focusProps: histProps } = useLRUD({
    id: 'profile-menu-history',
    parent: 'profile-menu',
    onEnter: () => { navigate({ to: '/history' }); setProfileOpen(false); },
  });

  const { ref: logoutRef, isFocused: logoutFocused, focusProps: logoutProps } = useLRUD({
    id: 'profile-menu-logout',
    parent: 'profile-menu',
    onEnter: onLogout,
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
        <div ref={menuRef} role="menu" className="absolute right-0 top-full mt-2 w-48 py-2 bg-surface-raised border border-border rounded-lg shadow-xl z-[60]">
          <Link
            ref={favRef}
            to="/favorites"
            role="menuitem"
            {...favProps}
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
            {...histProps}
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
            {...logoutProps}
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
