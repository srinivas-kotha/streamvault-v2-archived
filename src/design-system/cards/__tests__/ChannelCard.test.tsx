import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChannelCard, type ChannelCardProps } from "../ChannelCard";

// ── helpers ───────────────────────────────────────────────────────────────────

const defaultProps: ChannelCardProps = {
  channelName: "BBC One",
  channelNumber: 101,
  logoUrl: "https://example.com/bbc-one.png",
  isLive: true,
  currentProgram: "Evening News",
  nextProgram: "Weather Report",
  onClick: vi.fn(),
};

function renderCard(overrides?: Partial<ChannelCardProps>) {
  return render(<ChannelCard {...defaultProps} {...overrides} />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("ChannelCard — rendering", () => {
  it("renders channel name", () => {
    renderCard();
    expect(screen.getByText("BBC One")).toBeTruthy();
  });

  it("renders channel number", () => {
    renderCard();
    expect(screen.getByText("101")).toBeTruthy();
  });

  it("renders channel logo image", () => {
    renderCard();
    const img = screen.getByRole("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("https://example.com/bbc-one.png");
    expect(img.getAttribute("alt")).toContain("BBC One");
  });
});

describe("ChannelCard — live indicator", () => {
  it("renders a pulsing live indicator dot when channel is live", () => {
    const { container } = renderCard({ isLive: true });
    // Live dot should be a small element with animate-pulse or similar pulsing class
    const liveDot = container.querySelector('[data-testid="live-indicator"]');
    expect(liveDot).not.toBeNull();
  });

  it("does NOT render live indicator when channel is not live", () => {
    const { container } = renderCard({ isLive: false });
    const liveDot = container.querySelector('[data-testid="live-indicator"]');
    expect(liveDot).toBeNull();
  });
});

describe("ChannelCard — EPG info", () => {
  it("renders the current program name", () => {
    renderCard({ currentProgram: "Evening News" });
    expect(screen.getByText("Evening News")).toBeTruthy();
  });

  it('renders the next program name with "Up next:" prefix', () => {
    renderCard({ nextProgram: "Weather Report" });
    expect(screen.getByText("Up next: Weather Report")).toBeTruthy();
  });

  it("handles missing next program gracefully", () => {
    const { container } = renderCard({ nextProgram: undefined });
    // Should render without crashing
    expect(container.firstChild).toBeTruthy();
  });
});

describe("ChannelCard — image fallback", () => {
  it("shows gradient fallback on image error", () => {
    const { container } = renderCard();
    const img = screen.getByRole("img");
    fireEvent.error(img);

    // After error, image should be replaced with gradient fallback
    const fallback = container.querySelector('[aria-hidden="true"]');
    expect(fallback).not.toBeNull();
  });
});

describe("ChannelCard — aspect ratio", () => {
  it("has 16:9 aspect ratio (aspect-video class)", () => {
    const { container } = renderCard();
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("aspect-video");
  });
});

describe("ChannelCard — accessibility", () => {
  it("has ARIA label with channel name and current program", () => {
    renderCard();
    const card = screen.getByRole("button");
    const label = card.getAttribute("aria-label");
    expect(label).toContain("BBC One");
    expect(label).toContain("Evening News");
  });
});

describe("ChannelCard — React.memo", () => {
  it("is wrapped with React.memo (has correct displayName)", () => {
    // React.memo wrapping is verified by checking the component's displayName
    // or that it's a memo component type
    expect(ChannelCard).toBeTruthy();
    // memo(function ChannelCard ...) sets displayName = "ChannelCard"
    expect(
      (ChannelCard as any).type?.name === "ChannelCard" ||
        (ChannelCard as any).$$typeof?.toString() === "Symbol(react.memo)",
    ).toBe(true);
  });
});

describe("ChannelCard — touch target", () => {
  it("has minimum 44x44px touch target", () => {
    const { container } = renderCard();
    const card = container.firstChild as HTMLElement;
    // The card itself should be at least 44px in both dimensions
    // via min-h-[44px] min-w-[44px] or equivalent sizing
    expect(card.className).toMatch(/min-[hw]-\[44px\]|min-h-11|min-w-11/);
  });
});

describe("ChannelCard — content type badge", () => {
  it("renders content type badge when provided", () => {
    renderCard({ contentType: "Sports" });
    expect(screen.getByText("Sports")).toBeTruthy();
  });

  it("renders News badge with correct text", () => {
    renderCard({ contentType: "News" });
    expect(screen.getByText("News")).toBeTruthy();
  });

  it("does not render content type badge when not provided", () => {
    renderCard({ contentType: undefined });
    expect(screen.queryByText("Sports")).toBeNull();
    expect(screen.queryByText("News")).toBeNull();
  });
});

describe("ChannelCard — interaction", () => {
  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    renderCard({ onClick });
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
