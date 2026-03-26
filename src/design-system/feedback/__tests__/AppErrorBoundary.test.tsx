import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppErrorBoundary } from "../AppErrorBoundary";

// ── helpers ───────────────────────────────────────────────────────────────────

function ThrowingChild({ error }: { error: Error }) {
  throw error;
}

function GoodChild() {
  return <div>All good</div>;
}

beforeEach(() => {
  vi.restoreAllMocks();
  // Suppress React's console.error for expected errors in boundary tests
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("AppErrorBoundary — normal rendering", () => {
  it("renders children when no error is thrown", () => {
    render(
      <AppErrorBoundary>
        <GoodChild />
      </AppErrorBoundary>,
    );
    expect(screen.getByText("All good")).toBeTruthy();
  });

  it("does not show error UI when children render normally", () => {
    render(
      <AppErrorBoundary>
        <GoodChild />
      </AppErrorBoundary>,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("AppErrorBoundary — error catching", () => {
  it("catches render errors and shows fallback UI", () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild error={new Error("Boom")} />
      </AppErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });

  it('renders with role="alert" for accessibility', () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild error={new Error("Crash")} />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("shows descriptive text about the error", () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild error={new Error("Test")} />
      </AppErrorBoundary>,
    );
    expect(screen.getByText(/could not recover/i)).toBeTruthy();
  });

  it("shows error message in dev mode", () => {
    // import.meta.env.DEV is true in vitest by default
    render(
      <AppErrorBoundary>
        <ThrowingChild error={new Error("Dev visible error")} />
      </AppErrorBoundary>,
    );
    expect(screen.getByText("Dev visible error")).toBeTruthy();
  });
});

describe("AppErrorBoundary — reload button", () => {
  it('renders a "Reload App" button', () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild error={new Error("Boom")} />
      </AppErrorBoundary>,
    );
    expect(screen.getByText("Reload App")).toBeTruthy();
  });

  it("calls window.location.reload when Reload App is clicked", () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    });

    render(
      <AppErrorBoundary>
        <ThrowingChild error={new Error("Boom")} />
      </AppErrorBoundary>,
    );
    fireEvent.click(screen.getByText("Reload App"));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});

describe("AppErrorBoundary — error icon", () => {
  it("renders an SVG error icon with aria-hidden", () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild error={new Error("Boom")} />
      </AppErrorBoundary>,
    );
    const svg = screen.getByRole("alert").querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });
});
