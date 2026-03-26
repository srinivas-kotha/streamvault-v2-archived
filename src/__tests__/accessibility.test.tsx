/**
 * Sprint 8 Phase 7 — Accessibility Audit with axe-core
 *
 * Tests the 10 most critical pages/components for WCAG violations using vitest-axe.
 * Each test renders the component with providers and runs axe-core analysis.
 *
 * Components tested:
 *   1. HomePage
 *   2. VODPage
 *   3. SeriesPage
 *   4. LivePage
 *   5. SearchPage
 *   6. SettingsPage
 *   7. LoginPage
 *   8. FavoritesPage
 *   9. DesktopLayout (navigation + sidebar)
 *  10. PlayerControls
 */

import { describe, it, expect, vi, type Mock } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ── Global mocks ──────────────────────────────────────────────────────────────

// Mock spatial navigation (no DOM layout in jsdom)
vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: () => ({
    ref: { current: null },
    focused: false,
    showFocusRing: false,
    focusProps: {},
  }),
  useSpatialContainer: () => ({
    ref: { current: null },
    focusKey: "test-key",
  }),
  FocusContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  setFocus: vi.fn(),
}));

vi.mock("@shared/hooks/usePageFocus", () => ({
  usePageFocus: vi.fn(),
}));

vi.mock("@shared/hooks/useDeviceContext", () => ({
  useDeviceContext: () => ({
    deviceType: "desktop",
    isTVMode: false,
    isMobile: false,
    isTV: false,
    isFocusMode: false,
  }),
}));

vi.mock("@/hooks/useDeviceContext", () => ({
  useDeviceContext: () => ({
    deviceType: "desktop",
    isTVMode: false,
    isMobile: false,
    isTV: false,
    isFocusMode: false,
  }),
}));

vi.mock("@shared/utils/isTVMode", () => ({
  isTVMode: false,
}));

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useSearch: () => ({}),
  useMatch: () => ({}),
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

// Mock player store
vi.mock("@lib/store", () => ({
  usePlayerStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      playStream: vi.fn(),
      currentStreamId: null,
      isPlaying: false,
    }),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const client = createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

// ── 1. HomePage ───────────────────────────────────────────────────────────────

describe("Accessibility: HomePage", () => {
  // Mock child components to simplify rendering
  vi.mock("@features/home/components/HeroBanner", () => ({
    HeroBanner: (props: Record<string, unknown>) => (
      <section aria-label="Hero banner">
        <h2>{String(props.title)}</h2>
      </section>
    ),
  }));
  vi.mock("@features/home/components/ContentRail", () => ({
    ContentRail: (props: Record<string, unknown>) => (
      <section aria-label={String(props.title)}>{String(props.title)}</section>
    ),
  }));
  vi.mock("@features/home/components/ContinueWatchingRail", () => ({
    ContinueWatchingRail: () => (
      <section aria-label="Continue watching">Continue Watching</section>
    ),
  }));
  vi.mock("@features/home/components/FeaturedRail", () => ({
    FeaturedRail: () => <section aria-label="Featured">Featured</section>,
  }));
  vi.mock("@features/home/components/CategoryRail", () => ({
    CategoryRail: (props: Record<string, unknown>) => (
      <section aria-label={String(props.title)}>{String(props.title)}</section>
    ),
  }));

  it("has no axe violations", async () => {
    const { HomePage } = await import("@features/home/components/HomePage");
    const { container } = renderWithProviders(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("does not render duplicate main landmarks (fix #144)", async () => {
    const { HomePage } = await import("@features/home/components/HomePage");
    const { container } = renderWithProviders(<HomePage />);
    const mains = container.querySelectorAll("main");
    expect(mains.length).toBe(0);
  });
});

// ── 2. VODPage ────────────────────────────────────────────────────────────────

describe("Accessibility: VODPage", () => {
  // NOTE: @features/vod/api is mocked at module level (see below SearchPage section)
  // with both useVODCategories and useVODStreams
  vi.mock("@features/vod/components/SortFilterBar", () => ({
    SortFilterBar: () => <div data-testid="sort-filter-bar" />,
  }));
  vi.mock("@shared/components/PageTransition", () => ({
    PageTransition: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }));
  vi.mock("@shared/components/CategoryGrid", () => ({
    CategoryGrid: () => <div role="list" aria-label="Categories" />,
  }));
  vi.mock("@shared/components/Skeleton", () => ({
    SkeletonGrid: () => <div />,
  }));
  vi.mock("@shared/components/EmptyState", () => ({
    EmptyState: (props: Record<string, unknown>) => (
      <div role="status">{String(props.title)}</div>
    ),
  }));
  vi.mock("@shared/components/ContentCard", () => ({
    ContentCard: () => <div />,
  }));
  vi.mock("@shared/components/Badge", () => ({
    Badge: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
  }));
  vi.mock("@shared/utils/sortContent", () => ({
    sortContent: (items: unknown[]) => items,
    SORT_OPTIONS: [{ field: "name", direction: "asc", label: "Name" }],
  }));
  vi.mock("@shared/utils/filterContent", () => ({
    filterContent: (items: unknown[]) => items,
    DEFAULT_FILTERS: {},
  }));
  vi.mock("@shared/utils/parseGenres", () => ({
    collectAllGenres: () => [],
  }));
  vi.mock("@shared/hooks/useDebounce", () => ({
    useDebounce: (v: string) => v,
  }));

  it("has no axe violations", async () => {
    const { VODPage } = await import("@features/vod/components/VODPage");
    const { container } = renderWithProviders(<VODPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── 3. SeriesPage ─────────────────────────────────────────────────────────────

describe("Accessibility: SeriesPage", () => {
  vi.mock("@features/series/api", () => ({
    useSeriesByLanguage: () => ({
      allSeries: [],
      channels: [],
      isLoading: false,
    }),
    useSeriesCategories: () => ({ data: [], isLoading: false }),
  }));
  vi.mock("@shared/components/ContentRail", () => ({
    ContentRail: ({
      children,
      title,
    }: {
      children: React.ReactNode;
      title: string;
    }) => (
      <section aria-label={title || "Content rail"}>
        <h2>{title}</h2>
        {children}
      </section>
    ),
  }));
  vi.mock("@shared/components/FocusableCard", () => ({
    FocusableCard: () => <div />,
  }));
  vi.mock("@shared/utils/isNewContent", () => ({
    isNewContent: () => false,
  }));

  it("has no axe violations", async () => {
    const { SeriesPage } =
      await import("@features/series/components/SeriesPage");
    const { container } = renderWithProviders(<SeriesPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── 4. LivePage ───────────────────────────────────────────────────────────────

describe("Accessibility: LivePage", () => {
  vi.mock("@features/live/api", () => ({
    useLiveCategories: () => ({
      data: [
        { id: "1", name: "News" },
        { id: "2", name: "Sports" },
      ],
      isLoading: false,
    }),
    useLiveStreams: () => ({
      data: [],
      isLoading: false,
    }),
  }));
  vi.mock("@features/live/components/ChannelGrid", () => ({
    ChannelGrid: () => <div role="list" aria-label="Channels" />,
  }));
  vi.mock("@features/live/components/EPGGrid", () => ({
    EPGGrid: () => <div />,
  }));
  vi.mock("@features/live/components/FeaturedChannels", () => ({
    FeaturedChannels: () => (
      <section aria-label="Featured channels">Featured</section>
    ),
  }));

  it("has no axe violations", async () => {
    const { LivePage } = await import("@features/live/components/LivePage");
    const { container } = renderWithProviders(<LivePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── 5. SearchPage ─────────────────────────────────────────────────────────────

describe("Accessibility: SearchPage", () => {
  vi.mock("@features/search/api", () => ({
    useSearch: () => ({
      data: null,
      isLoading: false,
      isFetching: false,
    }),
  }));
  vi.mock("@features/search/components/SearchResultsList", () => ({
    SearchResultsList: () => <div />,
  }));
  vi.mock("@features/vod/api", () => ({
    useVODCategories: () => ({
      data: [
        { id: "10", name: "Action" },
        { id: "11", name: "Comedy" },
      ],
      isLoading: false,
    }),
    useVODStreams: () => ({
      data: [],
      isLoading: false,
    }),
  }));
  vi.mock("@shared/utils/categoryParser", () => ({
    getDetectedLanguages: () => [],
    getLiveCategoriesForLanguage: () => [],
    getMovieCategoriesForLanguage: () => [],
    getSeriesCategoriesForLanguage: () => [],
  }));
  vi.mock("@lib/toastStore", () => ({
    useToastStore: () => vi.fn(),
  }));

  it("has no axe violations", async () => {
    const { SearchPage } =
      await import("@features/search/components/SearchPage");
    const { container } = renderWithProviders(<SearchPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── 6. SettingsPage ───────────────────────────────────────────────────────────

describe("Accessibility: SettingsPage", () => {
  vi.mock("@lib/stores/settingsStore", () => ({
    useSettingsStore: (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        defaultQuality: "auto",
        defaultSubtitleLang: "",
        autoPlayNextEpisode: false,
        serverUrl: "",
        setDefaultQuality: vi.fn(),
        setDefaultSubtitleLang: vi.fn(),
        setAutoPlayNextEpisode: vi.fn(),
        setServerUrl: vi.fn(),
      }),
  }));
  vi.mock("@features/auth/hooks/useAuth", () => ({
    useLogout: () => ({ mutate: vi.fn(), isPending: false }),
  }));
  vi.mock("@/design-system/focus/FocusableButton", () => ({
    FocusableButton: ({
      children,
      onClick,
      ...rest
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      [key: string]: unknown;
    }) => (
      <button onClick={onClick} {...rest}>
        {children}
      </button>
    ),
  }));

  it("has no axe violations", async () => {
    const { SettingsPage } =
      await import("@features/settings/components/SettingsPage");
    const { container } = renderWithProviders(<SettingsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── 7. LoginPage ──────────────────────────────────────────────────────────────

describe("Accessibility: LoginPage", () => {
  vi.mock("@features/auth/hooks/useAuth", () => ({
    useLogin: () => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    }),
    useLogout: () => ({ mutate: vi.fn(), isPending: false }),
  }));

  it("has no axe violations", async () => {
    const { LoginPage } = await import("@features/auth/components/LoginPage");
    const { container } = renderWithProviders(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── 8. FavoritesPage ──────────────────────────────────────────────────────────

describe("Accessibility: FavoritesPage", () => {
  vi.mock("@features/favorites/api", () => ({
    useFavorites: () => ({
      data: [],
      isLoading: false,
    }),
    useRemoveFavorite: () => ({
      mutate: vi.fn(),
    }),
  }));

  it("has no axe violations", async () => {
    const { FavoritesPage } =
      await import("@features/favorites/components/FavoritesPage");
    const { container } = renderWithProviders(<FavoritesPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── 9. DesktopLayout (Navigation + Sidebar) ───────────────────────────────────

describe("Accessibility: DesktopLayout", () => {
  it("has no axe violations", async () => {
    const { DesktopLayout } = await import("@/layouts/DesktopLayout");
    const { container } = renderWithProviders(
      <DesktopLayout>
        <h1>Test Content</h1>
        <p>Page body</p>
      </DesktopLayout>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has banner role on top bar (avoids duplicate nav landmark)", async () => {
    const { DesktopLayout } = await import("@/layouts/DesktopLayout");
    const { container } = renderWithProviders(
      <DesktopLayout>
        <p>Content</p>
      </DesktopLayout>,
    );
    const banner = container.querySelector('[role="banner"]');
    expect(banner).toBeTruthy();
    // DesktopLayout should NOT have its own <nav> — TopNav provides it
    const nav = container.querySelector("nav");
    expect(nav).toBeNull();
  });

  it("has exactly one main landmark", async () => {
    const { DesktopLayout } = await import("@/layouts/DesktopLayout");
    const { container } = renderWithProviders(
      <DesktopLayout>
        <p>Content</p>
      </DesktopLayout>,
    );
    const mains = container.querySelectorAll("main");
    expect(mains.length).toBe(1);
  });
});

// ── 10. PlayerControls ────────────────────────────────────────────────────────

describe("Accessibility: PlayerControls", () => {
  it("has no axe violations", async () => {
    const { PlayerControls } =
      await import("@features/player/components/PlayerControls");
    const { container } = renderWithProviders(
      <PlayerControls
        playerRef={{ current: null }}
        isPlaying={false}
        isLive={false}
        currentTime={30}
        duration={120}
        qualityLevels={[]}
        currentQuality={-1}
        onQualityChange={vi.fn()}
        volume={0.8}
        isMuted={false}
        onVolumeChange={vi.fn()}
        onMuteToggle={vi.fn()}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── 11. MobileLayout (Navigation) ─────────────────────────────────────────────

describe("Accessibility: MobileLayout", () => {
  it("has aria-label on bottom tab navigation (fix #145)", async () => {
    const { MobileLayout } = await import("@/layouts/MobileLayout");
    const { container } = renderWithProviders(
      <MobileLayout>
        <p>Content</p>
      </MobileLayout>,
    );
    const nav = container.querySelector("nav");
    expect(nav).toBeTruthy();
    // MobileLayout uses "Tab navigation" to avoid duplicate with TopNav's "Main navigation"
    expect(nav?.getAttribute("aria-label")).toBe("Tab navigation");
  });

  it("has exactly one main landmark", async () => {
    const { MobileLayout } = await import("@/layouts/MobileLayout");
    const { container } = renderWithProviders(
      <MobileLayout>
        <p>Content</p>
      </MobileLayout>,
    );
    const mains = container.querySelectorAll("main");
    expect(mains.length).toBe(1);
  });
});

// ── 12. TVLayout ──────────────────────────────────────────────────────────────

describe("Accessibility: TVLayout", () => {
  it("has exactly one main landmark with skip-to-content target", async () => {
    const { TVLayout } = await import("@/layouts/TVLayout");
    const { container } = renderWithProviders(
      <TVLayout>
        <p>Content</p>
      </TVLayout>,
    );
    const mains = container.querySelectorAll("main");
    expect(mains.length).toBe(1);
    expect(mains[0]?.id).toBe("main-content");
  });
});
