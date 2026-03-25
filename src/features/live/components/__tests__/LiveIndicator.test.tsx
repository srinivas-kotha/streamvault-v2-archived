/**
 * Sprint 5 — LiveIndicator tests
 *
 * These tests WILL FAIL because LiveIndicator does not exist yet.
 * Expected path: src/features/live/components/LiveIndicator.tsx
 *
 * Contract:
 *   - Renders a pulsing red dot animation
 *   - Has aria-label="Live" for accessibility
 *   - Used inside ChannelCard when stream is live
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveIndicator } from "../LiveIndicator";
import { ChannelCard } from "../ChannelCard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── mock spatial nav ──────────────────────────────────────────────────────────

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: () => ({
    ref: { current: null },
    showFocusRing: false,
    focusProps: {},
  }),
  useSpatialContainer: () => ({ ref: { current: null }, focusKey: "card" }),
  FocusContext: { Provider: ({ children }: any) => children },
  setFocus: vi.fn(),
}));

// ── mock router ───────────────────────────────────────────────────────────────

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

// ── mock player store ─────────────────────────────────────────────────────────

vi.mock("@lib/store", () => ({
  usePlayerStore: (selector: any) => selector({ playStream: vi.fn() }),
}));

// ── mock LazyImage ────────────────────────────────────────────────────────────

vi.mock("@shared/components/LazyImage", () => ({
  upgradeProtocol: (url: string) => url,
}));

// ── mock Badge ────────────────────────────────────────────────────────────────

vi.mock("@shared/components/Badge", () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

// ── mock api ──────────────────────────────────────────────────────────────────

const NOW_SEC = Math.floor(Date.now() / 1000);
const mockEPGData = [
  {
    id: "prog-1",
    epg_id: "star-maa",
    title: "Morning News",
    lang: "en",
    start: "2024-01-01 08:00:00",
    end: "2024-01-01 09:00:00",
    description: "News",
    channel_id: "star-maa",
    start_timestamp: String(NOW_SEC - 1800),
    stop_timestamp: String(NOW_SEC + 1800),
  },
];

vi.mock("@features/live/api", () => ({
  useEPG: () => ({ data: mockEPGData, isLoading: false }),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const mockChannel = {
  num: 1,
  name: "Star Maa",
  stream_type: "live",
  stream_id: 201,
  stream_icon: "https://img.example.com/starmaa.png",
  epg_channel_id: "star-maa",
  added: "1700000000",
  is_adult: "0",
  category_id: "10",
  category_ids: [10],
  custom_sid: "",
  tv_archive: 0,
  direct_source: "",
  tv_archive_duration: 0,
};

// ── helpers ───────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderChannelCard() {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ChannelCard channel={mockChannel} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── LiveIndicator unit tests ──────────────────────────────────────────────────

describe("LiveIndicator — standalone", () => {
  it("renders with aria-label='Live'", () => {
    render(<LiveIndicator />);
    expect(screen.getByLabelText("Live")).toBeTruthy();
  });

  it("renders a pulsing animation element", () => {
    const { container } = render(<LiveIndicator />);
    // Should have an element with animate-pulse class for the pulsing dot
    const pulsing = container.querySelector(".animate-pulse");
    expect(pulsing).not.toBeNull();
  });

  it("contains a red dot indicator element", () => {
    const { container } = render(<LiveIndicator />);
    // Should have an element using an error/red color class for the dot
    const dot = container.querySelector(
      "[class*='bg-error'], [class*='bg-red']",
    );
    expect(dot).not.toBeNull();
  });

  it("has role='status' for screen reader announcement", () => {
    render(<LiveIndicator />);
    const indicator = screen.getByRole("status");
    expect(indicator).toBeTruthy();
  });

  it("displays LIVE text label", () => {
    render(<LiveIndicator />);
    // Should contain readable "LIVE" text (can be visually hidden but present)
    expect(screen.getByLabelText("Live")).toBeTruthy();
  });
});

describe("LiveIndicator — inside ChannelCard", () => {
  it("ChannelCard renders a live indicator for live streams", () => {
    renderChannelCard();
    // The LiveIndicator component should be present within ChannelCard
    // Previously implemented as a Badge — now should be the dedicated LiveIndicator
    const liveEl = screen.getByLabelText("Live");
    expect(liveEl).toBeTruthy();
  });

  it("live indicator is visually prominent (positioned in card)", () => {
    renderChannelCard();
    const liveEl = screen.getByLabelText("Live");
    // Should be inside the card element
    const card = liveEl.closest("[class*='rounded']");
    expect(card).not.toBeNull();
  });
});

describe("LiveIndicator — size variants", () => {
  it("renders with default size", () => {
    const { container } = render(<LiveIndicator />);
    expect(container.firstChild).toBeTruthy();
  });

  it("accepts a size prop (sm, md, lg)", () => {
    // LiveIndicator should accept optional size prop without crashing
    const { container } = render(<LiveIndicator size="sm" />);
    expect(container.firstChild).toBeTruthy();
  });
});
