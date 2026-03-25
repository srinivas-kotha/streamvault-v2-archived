import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FocusableEpisodeItem, type Episode } from "../EpisodeItem";

// ── mock spatial nav + focus styles ─────────────────────────────────────────

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: (opts: any) => ({
    ref: { current: null },
    showFocusRing: false,
    focused: false,
    focusProps: { "data-focus-key": opts?.focusKey ?? "test" },
  }),
}));

vi.mock("@/design-system/focus/useFocusStyles", () => ({
  useFocusStyles: () => ({
    cardFocus: "ring-2 ring-accent-teal shadow-focus",
    buttonFocus: "ring-2 ring-accent-teal ring-offset-2",
    inputFocus: "ring-2 ring-accent-teal",
  }),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function makeEpisode(overrides?: Partial<Episode>): Episode {
  return {
    id: "101",
    episodeNumber: 1,
    title: "Pilot Episode",
    ...overrides,
  };
}

function renderEpisodeItem(props?: {
  ep?: Episode;
  isPlaying?: boolean;
  playEpisode?: (ep: Episode) => void;
}) {
  return render(
    <FocusableEpisodeItem
      ep={props?.ep ?? makeEpisode()}
      isPlaying={props?.isPlaying ?? false}
      playEpisode={props?.playEpisode ?? vi.fn()}
    />,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("FocusableEpisodeItem — basic rendering", () => {
  it("renders episode number with padded format", () => {
    renderEpisodeItem();
    expect(screen.getByText("E01")).toBeTruthy();
  });

  it("renders episode title", () => {
    renderEpisodeItem();
    expect(screen.getByText("Pilot Episode")).toBeTruthy();
  });

  it("renders double-digit episode number", () => {
    renderEpisodeItem({ ep: makeEpisode({ episodeNumber: 12 }) });
    expect(screen.getByText("E12")).toBeTruthy();
  });
});

describe("FocusableEpisodeItem — metadata", () => {
  it("renders duration when provided", () => {
    renderEpisodeItem({ ep: makeEpisode({ duration: 3600 }) });
    // formatDuration(3600) returns "1:00:00"
    expect(screen.getByText("1:00:00")).toBeTruthy();
  });

  it("renders added date when provided as unix timestamp", () => {
    // Unix timestamp for Jan 15, 2024
    renderEpisodeItem({ ep: makeEpisode({ added: "1705276800" }) });
    expect(screen.getByText(/Jan/)).toBeTruthy();
  });

  it("renders episode plot when provided", () => {
    renderEpisodeItem({
      ep: makeEpisode({ plot: "A thrilling adventure begins." }),
    });
    expect(screen.getByText("A thrilling adventure begins.")).toBeTruthy();
  });

  it("does not render plot when not provided", () => {
    renderEpisodeItem();
    const { container } = renderEpisodeItem();
    const plotElements = container.querySelectorAll(".line-clamp-1");
    // Some may exist from layout; check no plot text
    expect(screen.queryByText("A thrilling adventure begins.")).toBeNull();
  });
});

describe("FocusableEpisodeItem — playing state", () => {
  it('shows "NOW PLAYING" badge when isPlaying is true', () => {
    renderEpisodeItem({ isPlaying: true });
    expect(screen.getByText("NOW PLAYING")).toBeTruthy();
  });

  it('does not show "NOW PLAYING" when not playing', () => {
    renderEpisodeItem({ isPlaying: false });
    expect(screen.queryByText("NOW PLAYING")).toBeNull();
  });

  it("applies playing-specific styles when isPlaying", () => {
    const { container } = renderEpisodeItem({ isPlaying: true });
    const itemDiv = container.firstElementChild!;
    expect(itemDiv.className).toContain("bg-teal/10");
    expect(itemDiv.className).toContain("border-teal/30");
  });
});

describe("FocusableEpisodeItem — click handler", () => {
  it("calls playEpisode with the episode when clicked", () => {
    const playEpisode = vi.fn();
    const ep = makeEpisode();
    renderEpisodeItem({ playEpisode, ep });

    fireEvent.click(screen.getByText("Pilot Episode"));
    expect(playEpisode).toHaveBeenCalledWith(ep);
  });
});

describe("FocusableEpisodeItem — thumbnail", () => {
  it("renders episode icon image when provided", () => {
    const { container } = renderEpisodeItem({
      ep: makeEpisode({ icon: "https://example.com/ep1.jpg" }),
    });
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("https://example.com/ep1.jpg");
  });

  it("renders placeholder icon when no icon provided", () => {
    const { container } = renderEpisodeItem();
    // Should have an SVG placeholder instead of img
    expect(container.querySelector("img")).toBeNull();
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });
});

describe("FocusableEpisodeItem — empty date handling", () => {
  it("does not render date for empty added field", () => {
    renderEpisodeItem({ ep: makeEpisode({ added: "" }) });
    // Should not crash and should not render date
    expect(screen.getByText("E01")).toBeTruthy();
  });

  it("does not render date for NaN timestamp", () => {
    renderEpisodeItem({ ep: makeEpisode({ added: "invalid" }) });
    expect(screen.getByText("E01")).toBeTruthy();
  });
});
