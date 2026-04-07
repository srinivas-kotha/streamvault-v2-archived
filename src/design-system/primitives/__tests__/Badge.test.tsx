import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, type BadgeVariant, type BadgeSize } from "../Badge";

// ── helpers ───────────────────────────────────────────────────────────────────

function renderBadge(
  props?: React.ComponentPropsWithRef<typeof Badge>,
  children = "Label",
) {
  return render(<Badge {...props}>{children}</Badge>);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("Badge — variants", () => {
  const variants: BadgeVariant[] = [
    "primary",
    "secondary",
    "new",
    "live",
    "rating",
  ];

  it.each(variants)("renders the %s variant without crashing", (variant) => {
    const { container } = renderBadge({ variant });
    expect(container.querySelector("span")).toBeTruthy();
  });

  it("secondary variant uses bg-bg-tertiary and border-border classes", () => {
    const { container } = renderBadge({ variant: "secondary" });
    const el = container.querySelector("span")!;
    expect(el.className).toContain("bg-bg-tertiary");
    expect(el.className).toContain("border-border");
  });

  it("new variant uses accent-teal classes", () => {
    const { container } = renderBadge({ variant: "new" });
    const el = container.querySelector("span")!;
    expect(el.className).toContain("bg-accent-teal");
    expect(el.className).toContain("text-accent-teal");
  });

  it("live variant uses error classes", () => {
    const { container } = renderBadge({ variant: "live" });
    const el = container.querySelector("span")!;
    expect(el.className).toContain("bg-error");
    expect(el.className).toContain("text-error");
  });

  it("rating variant uses warning classes", () => {
    const { container } = renderBadge({ variant: "rating" });
    const el = container.querySelector("span")!;
    expect(el.className).toContain("bg-warning");
    expect(el.className).toContain("text-warning");
  });
});

describe("Badge — live variant pulsing dot", () => {
  it("renders a pulsing dot for the live variant", () => {
    const { container } = renderBadge({ variant: "live" });
    // The LiveDot is an aria-hidden span with rounded-full + bg-error
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    expect(dot!.className).toContain("rounded-full");
    expect(dot!.className).toContain("bg-error");
  });

  it("does NOT render a pulsing dot for non-live variants", () => {
    const { container } = renderBadge({ variant: "new" });
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeNull();
  });
});

describe("Badge — rating variant star icon", () => {
  it("renders an SVG star icon for the rating variant", () => {
    const { container } = renderBadge({ variant: "rating" }, "8.5");
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).not.toBeNull();
  });

  it("does NOT render an SVG star icon for non-rating variants", () => {
    const { container } = renderBadge({ variant: "new" });
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeNull();
  });
});

describe("Badge — sizes", () => {
  const sizes: BadgeSize[] = ["sm", "md"];

  it.each(sizes)("renders the %s size without crashing", (size) => {
    const { container } = renderBadge({ size });
    expect(container.querySelector("span")).toBeTruthy();
  });

  it("sm size uses text-xs", () => {
    const { container } = renderBadge({ size: "sm" });
    const el = container.querySelector("span")!;
    expect(el.className).toContain("text-xs");
  });

  it("md size uses text-sm", () => {
    const { container } = renderBadge({ size: "md" });
    const el = container.querySelector("span")!;
    expect(el.className).toContain("text-sm");
  });
});

describe("Badge — children", () => {
  it("renders its children", () => {
    renderBadge({}, "NEW");
    expect(screen.getByText("NEW")).toBeTruthy();
  });
});

describe("Badge — new variants (primary, secondary, status)", () => {
  it("primary variant uses accent-teal classes", () => {
    const { container } = renderBadge({ variant: "primary" });
    const el = container.querySelector("span")!;
    expect(el.className).toContain("bg-accent-teal");
    expect(el.className).toContain("text-accent-teal");
  });

  it("secondary variant uses bg-bg-tertiary and border-border classes", () => {
    const { container } = renderBadge({ variant: "secondary" });
    const el = container.querySelector("span")!;
    expect(el.className).toContain("bg-bg-tertiary");
    expect(el.className).toContain("border-border");
  });

  it("status variant with statusColor=success uses success classes", () => {
    const { container } = renderBadge({
      variant: "status",
      statusColor: "success",
    });
    const el = container.querySelector("span")!;
    expect(el.className).toContain("bg-success");
    expect(el.className).toContain("text-success");
  });

  it("status variant with statusColor=error uses error classes", () => {
    const { container } = renderBadge({
      variant: "status",
      statusColor: "error",
    });
    const el = container.querySelector("span")!;
    expect(el.className).toContain("bg-error");
    expect(el.className).toContain("text-error");
  });
});

describe("Badge — lg size", () => {
  it("lg size uses text-base and px-3", () => {
    const { container } = renderBadge({ size: "lg" });
    const el = container.querySelector("span")!;
    expect(el.className).toContain("text-base");
    expect(el.className).toContain("px-3");
  });
});
