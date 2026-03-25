/**
 * Sprint 6A — Settings Page
 *
 * Route: /settings (authenticated)
 * Sections: Server, Player Preferences, About, Logout
 * All interactive elements are D-pad navigable via norigin spatial navigation.
 */

import { useRef } from "react";
import {
  useSettingsStore,
  type DefaultQuality,
} from "@lib/stores/settingsStore";
import { useLogout } from "@features/auth/hooks/useAuth";
import {
  useSpatialFocusable,
  useSpatialContainer,
  FocusContext,
} from "@shared/hooks/useSpatialNav";
import { usePageFocus } from "@shared/hooks/usePageFocus";
import { FocusableButton } from "@/design-system/focus/FocusableButton";

// ── Section wrapper ───────────────────────────────────────────────────────────

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-bg-secondary border border-white/5 rounded-[var(--radius-xl)] p-6">
      <h2 className="text-lg font-semibold text-text-primary font-[var(--font-family-heading)] mb-4">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// ── Row layout ────────────────────────────────────────────────────────────────

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && (
          <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Focusable Select ──────────────────────────────────────────────────────────

function FocusableSelect<T extends string>({
  focusKey,
  label,
  value,
  options,
  onChange,
}: {
  focusKey: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const { ref, focused, focusProps } = useSpatialFocusable({
    focusKey,
    onEnterPress: () => selectRef.current?.focus(),
  });

  return (
    <div ref={ref} {...focusProps}>
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={[
          "bg-bg-tertiary text-text-primary text-sm rounded-[var(--radius-md)] px-3 py-2 border",
          "focus:outline-none focus:ring-2 focus:ring-accent-teal/50",
          "transition-[border-color,box-shadow]",
          "cursor-pointer min-w-[120px]",
          focused
            ? "border-accent-teal ring-2 ring-accent-teal/50"
            : "border-white/10 hover-capable:border-white/20",
        ].join(" ")}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-bg-secondary">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Focusable Toggle ──────────────────────────────────────────────────────────

function FocusableToggle({
  focusKey,
  checked,
  onChange,
  label,
}: {
  focusKey: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const { ref, focused, focusProps } = useSpatialFocusable({
    focusKey,
    onEnterPress: () => onChange(!checked),
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full",
        "transition-[background-color,box-shadow]",
        "focus:outline-none",
        checked ? "bg-accent-teal" : "bg-bg-tertiary border border-white/10",
        focused
          ? "ring-2 ring-accent-teal/50 ring-offset-2 ring-offset-bg-primary"
          : "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-4 w-4 rounded-full bg-white shadow-sm",
          "transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

// ── Focusable Text Input ──────────────────────────────────────────────────────

function FocusableTextInput({
  focusKey,
  label,
  value,
  onChange,
  placeholder,
}: {
  focusKey: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { ref, focused, focusProps } = useSpatialFocusable({
    focusKey,
    onEnterPress: () => inputRef.current?.focus(),
  });

  return (
    <div ref={ref} {...focusProps}>
      <input
        ref={inputRef}
        type="text"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            inputRef.current?.blur();
          }
        }}
        className={[
          "bg-bg-tertiary text-text-primary text-sm rounded-[var(--radius-md)] px-3 py-2 border",
          "placeholder:text-text-tertiary",
          "focus:outline-none focus:ring-2 focus:ring-accent-teal/50",
          "transition-[border-color,box-shadow]",
          "w-48",
          focused
            ? "border-accent-teal ring-2 ring-accent-teal/50"
            : "border-white/10 hover-capable:border-white/20",
        ].join(" ")}
      />
    </div>
  );
}

// ── Quality options ───────────────────────────────────────────────────────────

const QUALITY_OPTIONS: { value: DefaultQuality; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// ── SettingsPage ──────────────────────────────────────────────────────────────

export function SettingsPage() {
  const defaultQuality = useSettingsStore((s) => s.defaultQuality);
  const defaultSubtitleLang = useSettingsStore((s) => s.defaultSubtitleLang);
  const autoPlayNextEpisode = useSettingsStore((s) => s.autoPlayNextEpisode);
  const serverUrl = useSettingsStore((s) => s.serverUrl);
  const setDefaultQuality = useSettingsStore((s) => s.setDefaultQuality);
  const setDefaultSubtitleLang = useSettingsStore(
    (s) => s.setDefaultSubtitleLang,
  );
  const setAutoPlayNextEpisode = useSettingsStore(
    (s) => s.setAutoPlayNextEpisode,
  );
  const setServerUrl = useSettingsStore((s) => s.setServerUrl);

  const logoutMutation = useLogout();

  const { ref: containerRef, focusKey: containerFocusKey } =
    useSpatialContainer({
      focusKey: "settings-page",
      focusable: false,
    });

  usePageFocus("settings-quality-select");

  const displayServerUrl =
    serverUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const appVersion = import.meta.env.VITE_APP_VERSION || "dev";

  return (
    <FocusContext.Provider value={containerFocusKey}>
      <div
        ref={containerRef}
        className="max-w-2xl mx-auto py-8 space-y-6"
        data-testid="settings-page"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary font-[var(--font-family-heading)]">
            Settings
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage your preferences and account
          </p>
        </div>

        {/* Server Section */}
        <SettingsSection title="Server">
          <SettingsRow
            label="Server URL"
            description="The API server this app is connected to"
          >
            <span
              className="text-sm text-text-secondary font-mono bg-bg-tertiary px-3 py-2 rounded-[var(--radius-md)] block max-w-[200px] truncate"
              title={displayServerUrl}
              data-testid="server-url-display"
            >
              {displayServerUrl}
            </span>
          </SettingsRow>
          <SettingsRow
            label="Custom Server URL"
            description="Override the default server URL (leave blank for auto)"
          >
            <FocusableTextInput
              focusKey="settings-server-url"
              label="Custom server URL"
              value={serverUrl}
              onChange={setServerUrl}
              placeholder="http://192.168.1.x:3001"
            />
          </SettingsRow>
        </SettingsSection>

        {/* Player Preferences Section */}
        <SettingsSection title="Player Preferences">
          <SettingsRow
            label="Default Quality"
            description="Preferred video quality when multiple streams are available"
          >
            <FocusableSelect
              focusKey="settings-quality-select"
              label="Default quality"
              value={defaultQuality}
              options={QUALITY_OPTIONS}
              onChange={setDefaultQuality}
            />
          </SettingsRow>

          <SettingsRow
            label="Subtitle Language"
            description="Default subtitle language code (e.g. en, te). Leave blank to disable."
          >
            <FocusableTextInput
              focusKey="settings-subtitle-lang"
              label="Subtitle language"
              value={defaultSubtitleLang}
              onChange={setDefaultSubtitleLang}
              placeholder="en"
            />
          </SettingsRow>

          <SettingsRow
            label="Auto-play Next Episode"
            description="Automatically start the next episode when one ends"
          >
            <FocusableToggle
              focusKey="settings-autoplay-toggle"
              checked={autoPlayNextEpisode}
              onChange={setAutoPlayNextEpisode}
              label="Toggle auto-play next episode"
            />
          </SettingsRow>
        </SettingsSection>

        {/* About Section */}
        <SettingsSection title="About">
          <SettingsRow label="App Version">
            <span
              className="text-sm text-text-secondary font-mono"
              data-testid="app-version"
            >
              {appVersion}
            </span>
          </SettingsRow>
          <SettingsRow label="Build" description="Frontend build information">
            <span
              className="text-xs text-text-tertiary font-mono"
              data-testid="build-info"
            >
              StreamVault Frontend
            </span>
          </SettingsRow>
        </SettingsSection>

        {/* Logout */}
        <div className="pt-2">
          <FocusableButton
            focusKey="settings-logout-btn"
            variant="secondary"
            size="lg"
            onClick={() => logoutMutation.mutate()}
            className="w-full border-error/30 text-error hover-capable:bg-error/10 hover-capable:border-error/50"
            data-testid="logout-button"
          >
            {logoutMutation.isPending ? "Signing out…" : "Sign Out"}
          </FocusableButton>
        </div>
      </div>
    </FocusContext.Provider>
  );
}
