import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton, SkeletonText } from "../Skeleton";

// ── helpers ───────────────────────────────────────────────────────────────────

function renderSkeleton(
  props?: Partial<React.ComponentProps<typeof Skeleton>>,
) {
  return render(<Skeleton {...props} />);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

describe("Skeleton — accessibility", () => {
  it('has role="status" for screen readers', () => {
    renderSkeleton();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it('has aria-busy="true"', () => {
    renderSkeleton();
    expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("true");
  });

  it('has default aria-label "Loading..."', () => {
    renderSkeleton();
    expect(screen.getByLabelText("Loading\u2026")).toBeTruthy();
  });

  it("accepts a custom aria-label", () => {
    renderSkeleton({ "aria-label": "Loading profile" });
    expect(screen.getByLabelText("Loading profile")).toBeTruthy();
  });
});

describe("Skeleton — variants", () => {
  it("renders text variant by default with h-4 and w-full", () => {
    const { container } = renderSkeleton();
    const el = container.firstElementChild!;
    expect(el.className).toContain("h-4");
    expect(el.className).toContain("w-full");
  });

  it("renders card variant with aspect-video", () => {
    const { container } = renderSkeleton({ variant: "card" });
    const el = container.firstElementChild!;
    expect(el.className).toContain("aspect-video");
  });

  it("renders avatar variant with w-10 h-10 and rounded-full", () => {
    const { container } = renderSkeleton({ variant: "avatar" });
    const el = container.firstElementChild!;
    expect(el.className).toContain("w-10");
    expect(el.className).toContain("h-10");
    expect(el.className).toContain("rounded-full");
  });
});

describe("Skeleton — rounded overrides", () => {
  it("uses variant default rounded when no override", () => {
    const { container } = renderSkeleton({ variant: "text" });
    const el = container.firstElementChild!;
    // text default rounded is 'md'
    expect(el.className).toContain("rounded-[var(--radius-md)]");
  });

  it("allows overriding rounded", () => {
    const { container } = renderSkeleton({ variant: "text", rounded: "full" });
    const el = container.firstElementChild!;
    expect(el.className).toContain("rounded-full");
  });
});

describe("Skeleton — inline styles", () => {
  it("sets width as inline style from number", () => {
    const { container } = renderSkeleton({ width: 80 });
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe("80px");
  });

  it("sets width as inline style from string", () => {
    const { container } = renderSkeleton({ width: "12rem" });
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe("12rem");
  });

  it("sets height as inline style from number", () => {
    const { container } = renderSkeleton({ height: 16 });
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.height).toBe("16px");
  });

  it("does not set inline width/height when not provided", () => {
    const { container } = renderSkeleton();
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe("");
    expect(el.style.height).toBe("");
  });
});

describe("Skeleton — className passthrough", () => {
  it("applies additional className", () => {
    const { container } = renderSkeleton({ className: "my-custom-class" });
    const el = container.firstElementChild!;
    expect(el.className).toContain("my-custom-class");
  });
});

describe("Skeleton — animation", () => {
  it("has animate-pulse class", () => {
    const { container } = renderSkeleton();
    const el = container.firstElementChild!;
    expect(el.className).toContain("animate-pulse");
  });
});

// ── SkeletonText ──────────────────────────────────────────────────────────────

describe("SkeletonText", () => {
  it("renders 3 lines by default", () => {
    const { container } = render(<SkeletonText />);
    const wrapper = container.firstElementChild!;
    // Each line is a Skeleton div inside the wrapper
    const children = wrapper.querySelectorAll("[aria-busy]");
    // Inner skeletons have aria-label undefined so won't have aria-busy,
    // count the child divs instead
    const skeletonDivs = wrapper.children;
    expect(skeletonDivs.length).toBe(3);
  });

  it("renders custom number of lines", () => {
    const { container } = render(<SkeletonText lines={5} />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.children.length).toBe(5);
  });

  it('has role="status" and aria-busy on the wrapper', () => {
    render(<SkeletonText />);
    const wrapper = screen.getByLabelText("Loading text");
    expect(wrapper.getAttribute("aria-busy")).toBe("true");
  });

  it("applies className to the wrapper", () => {
    const { container } = render(<SkeletonText className="mt-4" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("mt-4");
  });

  it("lines have varying widths for natural paragraph flow", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const wrapper = container.firstElementChild!;
    const children = Array.from(wrapper.children);
    // First line should have w-full, second w-5/6, third w-4/5
    expect(children[0].className).toContain("w-full");
    expect(children[1].className).toContain("w-5/6");
    expect(children[2].className).toContain("w-4/5");
  });
});
