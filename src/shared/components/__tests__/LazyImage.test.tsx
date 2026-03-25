import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LazyImage, upgradeProtocol } from "../LazyImage";

// ── mock shared IntersectionObserver ─────────────────────────────────────────

let observeCallback:
  | ((entry: Partial<IntersectionObserverEntry>) => void)
  | null = null;

vi.mock("@shared/hooks/useSharedIntersectionObserver", () => ({
  observe: (
    _el: Element,
    cb: (entry: Partial<IntersectionObserverEntry>) => void,
  ) => {
    observeCallback = cb;
    return () => {
      observeCallback = null;
    };
  },
}));

beforeEach(() => {
  observeCallback = null;
});

// ── helpers ───────────────────────────────────────────────────────────────────

function renderLazyImage(
  props?: Partial<React.ComponentProps<typeof LazyImage>>,
) {
  return render(
    <LazyImage
      src="https://example.com/image.jpg"
      alt="Test image"
      {...props}
    />,
  );
}

// ── upgradeProtocol utility ──────────────────────────────────────────────────

describe("upgradeProtocol", () => {
  it("upgrades http:// to https://", () => {
    expect(upgradeProtocol("http://example.com/img.jpg")).toBe(
      "https://example.com/img.jpg",
    );
  });

  it("leaves https:// URLs unchanged", () => {
    expect(upgradeProtocol("https://example.com/img.jpg")).toBe(
      "https://example.com/img.jpg",
    );
  });

  it("leaves non-http URLs unchanged", () => {
    expect(upgradeProtocol("data:image/png;base64,abc")).toBe(
      "data:image/png;base64,abc",
    );
  });
});

// ── LazyImage rendering ─────────────────────────────────────────────────────

describe("LazyImage — placeholder state", () => {
  it("renders a container with aspect ratio class", () => {
    const { container } = renderLazyImage();
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("aspect-[2/3]"); // default poster
  });

  it("renders landscape aspect ratio", () => {
    const { container } = renderLazyImage({ aspectRatio: "landscape" });
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("aspect-video");
  });

  it("renders square aspect ratio", () => {
    const { container } = renderLazyImage({ aspectRatio: "square" });
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("aspect-square");
  });

  it("does not render img element before intersection", () => {
    const { container } = renderLazyImage();
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("LazyImage — loading after intersection", () => {
  it("renders img element after intersection", () => {
    const { container } = renderLazyImage();
    // Simulate intersection
    act(() => {
      if (observeCallback) {
        observeCallback({ isIntersecting: true } as IntersectionObserverEntry);
      }
    });
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("img has correct src with https upgrade", () => {
    const { container } = renderLazyImage({
      src: "http://example.com/img.jpg",
    });
    act(() => {
      if (observeCallback) {
        observeCallback({ isIntersecting: true } as IntersectionObserverEntry);
      }
    });
    const img = container.querySelector("img");
    expect(img!.getAttribute("src")).toBe("https://example.com/img.jpg");
  });

  it("img has correct alt text", () => {
    renderLazyImage();
    act(() => {
      if (observeCallback) {
        observeCallback({ isIntersecting: true } as IntersectionObserverEntry);
      }
    });
    expect(screen.getByAltText("Test image")).toBeTruthy();
  });
});

describe("LazyImage — priority (eager) loading", () => {
  it("renders img immediately when priority=true", () => {
    const { container } = renderLazyImage({ priority: true });
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("loading")).toBe("eager");
  });

  it('sets fetchPriority="high" for priority images', () => {
    const { container } = renderLazyImage({ priority: true });
    const img = container.querySelector("img");
    expect(img!.getAttribute("fetchpriority")).toBe("high");
  });
});

describe("LazyImage — error state", () => {
  it("shows error fallback icon when src is empty", () => {
    const { container } = renderLazyImage({ src: "" });
    // Error state shows a play icon SVG
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("shows error fallback when image fails to load", () => {
    const { container } = renderLazyImage({ priority: true });
    const img = container.querySelector("img");
    fireEvent.error(img!);
    // After error, image should be removed and fallback shown
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

describe("LazyImage — loaded state", () => {
  it("sets opacity-100 after image loads", () => {
    const { container } = renderLazyImage({ priority: true });
    const img = container.querySelector("img")!;
    expect(img.className).toContain("opacity-0");

    fireEvent.load(img);
    expect(img.className).toContain("opacity-100");
  });
});

describe("LazyImage — className passthrough", () => {
  it("applies className to container", () => {
    const { container } = renderLazyImage({ className: "custom-image" });
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("custom-image");
  });
});
