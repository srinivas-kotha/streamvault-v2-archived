import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroCard } from "../HeroCard";

// ── helpers ───────────────────────────────────────────────────────────────────

const defaultProps = {
  title: "Test Movie",
  imageUrl: "https://example.com/image.jpg",
};

function renderHeroCard(
  props?: Partial<React.ComponentProps<typeof HeroCard>>,
) {
  return render(<HeroCard {...defaultProps} {...props} />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("HeroCard — basic rendering", () => {
  it("renders the title as an h2", () => {
    renderHeroCard();
    expect(screen.getByRole("heading", { level: 2 })).toBeTruthy();
    expect(screen.getByText("Test Movie")).toBeTruthy();
  });

  it("renders the background image", () => {
    const { container } = renderHeroCard();
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("https://example.com/image.jpg");
  });

  it('background image has aria-hidden="true" and empty alt', () => {
    const { container } = renderHeroCard();
    const img = container.querySelector("img");
    expect(img!.getAttribute("aria-hidden")).toBe("true");
    expect(img!.getAttribute("alt")).toBe("");
  });

  it("background image uses eager loading", () => {
    const { container } = renderHeroCard();
    const img = container.querySelector("img");
    expect(img!.getAttribute("loading")).toBe("eager");
  });
});

describe("HeroCard — description", () => {
  it("renders description when provided", () => {
    renderHeroCard({ description: "A great movie" });
    expect(screen.getByText("A great movie")).toBeTruthy();
  });

  it("does not render description paragraph when not provided", () => {
    const { container } = renderHeroCard();
    // No paragraph for description — only the title h2 and overlays
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBe(0);
  });
});

describe("HeroCard — children (CTA area)", () => {
  it("renders children in the action area", () => {
    render(
      <HeroCard {...defaultProps}>
        <button>Play</button>
      </HeroCard>,
    );
    expect(screen.getByText("Play")).toBeTruthy();
  });

  it("does not render action area when no children", () => {
    const { container } = renderHeroCard();
    // The action div with mt-4 should not exist
    const actionDivs = container.querySelectorAll(".mt-4");
    expect(actionDivs.length).toBe(0);
  });
});

describe("HeroCard — image fallback", () => {
  it("shows fallback gradient when image fails to load", () => {
    const { container } = renderHeroCard();
    const img = container.querySelector("img");
    expect(img).not.toBeNull();

    // Trigger image error
    fireEvent.error(img!);

    // After error, image should be replaced with fallback
    expect(container.querySelector("img")).toBeNull();
    // Fallback shows the title text
    const fallbackTexts = container.querySelectorAll("span");
    const titleSpan = Array.from(fallbackTexts).find((s) =>
      s.textContent?.includes("Test Movie"),
    );
    expect(titleSpan).toBeTruthy();
  });
});

describe("HeroCard — className", () => {
  it("applies additional className", () => {
    const { container } = renderHeroCard({ className: "my-hero-class" });
    const root = container.firstElementChild!;
    expect(root.className).toContain("my-hero-class");
  });
});

describe("HeroCard — layout", () => {
  it("has minimum height classes", () => {
    const { container } = renderHeroCard();
    const root = container.firstElementChild!;
    expect(root.className).toContain("min-h-[200px]");
  });

  it("has overflow-hidden", () => {
    const { container } = renderHeroCard();
    const root = container.firstElementChild!;
    expect(root.className).toContain("overflow-hidden");
  });

  it("title has max-w-2xl for readability", () => {
    renderHeroCard();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.className).toContain("max-w-2xl");
  });
});
