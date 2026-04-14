import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EpisodeCard, type EpisodeCardProps } from "../EpisodeCard";

// ── helpers ───────────────────────────────────────────────────────────────────

const defaultProps: EpisodeCardProps = {
  title: "The One Where They All Find Out",
  thumbnailUrl: "https://example.com/ep-thumb.jpg",
  duration: "22 min",
  season: 5,
  episode: 14,
  description: "Everyone finds out about Monica and Chandler.",
  onClick: vi.fn(),
};

function renderCard(overrides?: Partial<EpisodeCardProps>) {
  return render(<EpisodeCard {...defaultProps} {...overrides} />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("EpisodeCard — rendering", () => {
  it("renders episode thumbnail image", () => {
    // Thumbnail is decorative (aria-hidden) — query via DOM, not role
    const { container } = renderCard();
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("https://example.com/ep-thumb.jpg");
  });

  it("renders episode title", () => {
    renderCard();
    expect(screen.getByText("The One Where They All Find Out")).toBeTruthy();
  });

  it("renders duration text", () => {
    renderCard();
    expect(screen.getByText("22 min")).toBeTruthy();
  });
});

describe("EpisodeCard — progress bar", () => {
  it("renders progress bar when watch progress exists", () => {
    renderCard({ progress: 65 });
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toBeTruthy();
    expect(progressbar.getAttribute("aria-valuenow")).toBe("65");
  });

  it("does NOT render progress bar when no progress", () => {
    renderCard({ progress: undefined });
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("clamps progress to 0-100 range", () => {
    renderCard({ progress: 150 });
    const progressbar = screen.getByRole("progressbar");
    expect(
      Number(progressbar.getAttribute("aria-valuenow")),
    ).toBeLessThanOrEqual(100);
  });
});

describe("EpisodeCard — episode info", () => {
  it("renders season/episode number in S01E03 format", () => {
    renderCard({ season: 1, episode: 3 });
    expect(screen.getByText(/S01E03/)).toBeTruthy();
  });

  it("renders episode description/synopsis", () => {
    renderCard();
    expect(
      screen.getByText("Everyone finds out about Monica and Chandler."),
    ).toBeTruthy();
  });
});

describe("EpisodeCard — image fallback", () => {
  it("shows gradient fallback on image error", () => {
    const { container } = renderCard();
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).not.toBeNull();
    fireEvent.error(img!);

    // After error, image is removed and gradient fallback is shown
    expect(container.querySelector("img")).toBeNull();
    const fallback = container.querySelector('[aria-hidden="true"]');
    expect(fallback).not.toBeNull();
  });
});

describe("EpisodeCard — accessibility", () => {
  it("has ARIA label with episode title and duration", () => {
    renderCard();
    const card = screen.getByRole("button");
    const label = card.getAttribute("aria-label");
    expect(label).toContain("The One Where They All Find Out");
    expect(label).toContain("22 min");
  });
});

describe("EpisodeCard — React.memo", () => {
  it("is wrapped with React.memo", () => {
    expect(EpisodeCard).toBeTruthy();
    expect(
      (EpisodeCard as any).type?.name === "EpisodeCard" ||
        (EpisodeCard as any).$$typeof?.toString() === "Symbol(react.memo)",
    ).toBe(true);
  });
});

describe("EpisodeCard — horizontal layout", () => {
  it("uses flex-row for horizontal layout", () => {
    const { container } = renderCard();
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("flex-row");
  });

  it("thumbnail is a fixed-width shrink-0 element", () => {
    const { container } = renderCard();
    const thumb = container.querySelector(".shrink-0") as HTMLElement | null;
    expect(thumb).not.toBeNull();
  });

  it("shows progress percentage text when progress provided", () => {
    renderCard({ progress: 42 });
    expect(screen.getByText(/42% watched/)).toBeTruthy();
  });

  it("ARIA label includes episode code when season+episode provided", () => {
    renderCard();
    const card = screen.getByRole("button");
    const label = card.getAttribute("aria-label");
    expect(label).toContain("S05E14");
  });
});

describe("EpisodeCard — interaction", () => {
  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    renderCard({ onClick });
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
