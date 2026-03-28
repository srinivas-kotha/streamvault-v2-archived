import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  useSpatialFocusable,
  useSpatialContainer,
  FocusContext,
  setFocus,
} from "@shared/hooks/useSpatialNav";
import { useAuthStore } from "@lib/store";
import { useLogout } from "@features/auth/hooks/useAuth";
import { isTVMode } from "@shared/utils/isTVMode";

const NAV_ITEMS = [
  { to: "/language/telugu", label: "Telugu", focusKey: "nav-telugu" },
  { to: "/language/hindi", label: "Hindi", focusKey: "nav-hindi" },
  { to: "/language/english", label: "English", focusKey: "nav-english" },
  { to: "/sports", label: "Sports", focusKey: "nav-sports" },
  { to: "/search", label: "Search", focusKey: "nav-search" },
];

function NavLink({
  to,
  label,
  focusKey,
}: {
  to: string;
  label: string;
  focusKey: string;
}) {
  const navigate = useNavigate();
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey,
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
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-[background-color,color] min-h-[40px] flex items-center ${
        showFocusRing
          ? "text-text-primary bg-teal/10 ring-2 ring-teal/50"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-raised/50"
      }`}
      activeProps={{ className: "text-teal" }}
    >
      {label}
    </Link>
  );
}

export function TopNav() {
  const username = useAuthStore((s) => s.username);
  const logoutMutation = useLogout();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Register the top-nav spatial container — focusable: false so individual
  // items are direct smartNavigate candidates (containers block Up navigation)
  const { ref: topNavRef, focusKey: topNavFocusKey } = useSpatialContainer({
    focusKey: "top-nav",
    focusable: false,
  });

  // Track scroll position for transparency
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const handleScroll = () => setScrolled(main.scrollTop > 20);
    main.addEventListener("scroll", handleScroll, { passive: true });
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  // Close profile dropdown on outside click or Escape key
  useEffect(() => {
    const handleClick = () => {
      setProfileOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // TV mode: logo + profile only
  if (isTVMode) {
    return (
      <FocusContext.Provider value={topNavFocusKey}>
        <header
          ref={topNavRef}
          className="fixed top-0 left-0 right-0 z-50 bg-obsidian/95"
        >
          <nav
            aria-label="Main navigation"
            className="flex items-center justify-between h-12 px-4 lg:px-10"
          >
            <Link
              to="/"
              className="font-display text-lg font-bold text-text-primary flex-shrink-0"
            >
              Stream<span className="text-teal">Vault</span>
            </Link>
            <div className="flex items-center gap-1 ml-6">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.focusKey}
                  to={item.to}
                  label={item.label}
                  focusKey={item.focusKey}
                />
              ))}
            </div>
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
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color] duration-300 ${
          scrolled
            ? `${isTVMode ? "bg-obsidian/95" : "bg-obsidian/90 backdrop-blur-xl"} border-b border-border-subtle shadow-lg`
            : "bg-gradient-to-b from-obsidian/80 to-transparent"
        }`}
      >
        <nav
          aria-label="Main navigation"
          className="flex items-center justify-between h-16 px-4 lg:px-10"
        >
          {/* Logo */}
          <Link
            to="/"
            className="font-display text-xl font-bold text-text-primary hover:text-teal transition-colors flex-shrink-0"
          >
            Stream<span className="text-teal">Vault</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1 ml-8">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.focusKey}
                to={item.to}
                label={item.label}
                focusKey={item.focusKey}
              />
            ))}
          </div>

          {/* Profile */}
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
    focusKey: "profile-menu",
  });

  const {
    ref: favRef,
    showFocusRing: favShowFocus,
    focusProps: favProps,
  } = useSpatialFocusable({
    focusKey: "profile-menu-fav",
    onEnterPress: () => onNavigate("/favorites"),
  });

  const {
    ref: histRef,
    showFocusRing: histShowFocus,
    focusProps: histProps,
  } = useSpatialFocusable({
    focusKey: "profile-menu-history",
    onEnterPress: () => onNavigate("/history"),
  });

  const {
    ref: settingsRef,
    showFocusRing: settingsShowFocus,
    focusProps: settingsProps,
  } = useSpatialFocusable({
    focusKey: "profile-menu-settings",
    onEnterPress: () => onNavigate("/settings"),
  });

  const {
    ref: logoutRef,
    showFocusRing: logoutShowFocus,
    focusProps: logoutProps,
  } = useSpatialFocusable({
    focusKey: "profile-menu-logout",
    onEnterPress: onLogout,
  });

  return (
    <FocusContext.Provider value={menuFocusKey}>
      <div
        ref={menuRef}
        role="menu"
        className="absolute right-0 top-full mt-2 w-48 py-2 bg-surface-raised border border-border rounded-lg shadow-xl z-[60]"
      >
        <Link
          ref={favRef}
          to="/favorites"
          role="menuitem"
          {...favProps}
          className={`block px-4 py-2.5 text-sm min-h-[44px] flex items-center transition-colors ${
            favShowFocus
              ? "text-text-primary bg-teal/10 ring-1 ring-teal/40"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
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
              ? "text-text-primary bg-teal/10 ring-1 ring-teal/40"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          Watch History
        </Link>
        <Link
          ref={settingsRef}
          to="/settings"
          role="menuitem"
          {...settingsProps}
          className={`block px-4 py-2.5 text-sm min-h-[44px] flex items-center gap-2 transition-colors ${
            settingsShowFocus
              ? "text-text-primary bg-teal/10 ring-1 ring-teal/40"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Settings
        </Link>
        <hr className="my-1 border-border-subtle" />
        <button
          ref={logoutRef}
          role="menuitem"
          onClick={onLogout}
          {...logoutProps}
          className={`w-full text-left px-4 py-2.5 text-sm min-h-[44px] transition-colors ${
            logoutShowFocus
              ? "text-error bg-error/10 ring-1 ring-error/40"
              : "text-error hover:bg-surface-hover"
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
      setFocus("profile-btn");
    }
    prevProfileOpen.current = profileOpen;
  }, [profileOpen]);

  const {
    ref: profileBtnRef,
    showFocusRing: showProfileFocus,
    focusProps: profileFocusProps,
  } = useSpatialFocusable({
    focusKey: "profile-btn",
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
        onClick={(e) => {
          e.stopPropagation();
          setProfileOpen(!profileOpen);
        }}
        aria-expanded={profileOpen}
        aria-haspopup="menu"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised/50 transition-[background-color,color] min-h-[48px] ${
          showProfileFocus ? "ring-2 ring-teal/50 text-text-primary" : ""
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-indigo flex items-center justify-center text-sm font-bold text-obsidian">
          {username?.[0]?.toUpperCase() ?? "U"}
        </div>
        <span className="text-sm hidden lg:block">{username}</span>
      </button>

      {profileOpen && (
        <ProfileDropdownItems onNavigate={handleNavigate} onLogout={onLogout} />
      )}
    </div>
  );
}
