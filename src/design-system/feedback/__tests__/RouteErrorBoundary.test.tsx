import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteErrorBoundary } from "../RouteErrorBoundary";

// ── helpers ───────────────────────────────────────────────────────────────────

function ThrowOnce({
  error,
  shouldThrow,
}: {
  error: Error;
  shouldThrow: boolean;
}) {
  if (shouldThrow) throw error;
  return <div>Recovered</div>;
}

function ThrowingChild({ error }: { error: Error }) {
  throw error;
}

function GoodChild() {
  return <div>Route content</div>;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("RouteErrorBoundary — normal rendering", () => {
  it("renders children when no error is thrown", () => {
    render(
      <RouteErrorBoundary>
        <GoodChild />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText("Route content")).toBeTruthy();
  });

  it("does not show error UI when children render normally", () => {
    render(
      <RouteErrorBoundary>
        <GoodChild />
      </RouteErrorBoundary>,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("RouteErrorBoundary — error catching", () => {
  it("catches errors and shows route-level error UI", () => {
    render(
      <RouteErrorBoundary>
        <ThrowingChild error={new Error("Route crash")} />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText("This page encountered an error")).toBeTruthy();
  });

  it('renders with role="alert"', () => {
    render(
      <RouteErrorBoundary>
        <ThrowingChild error={new Error("Crash")} />
      </RouteErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("shows error message in dev mode", () => {
    render(
      <RouteErrorBoundary>
        <ThrowingChild error={new Error("Route dev error")} />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText("Route dev error")).toBeTruthy();
  });
});

describe("RouteErrorBoundary — Go Back button", () => {
  it('renders a "Go Back" button', () => {
    render(
      <RouteErrorBoundary>
        <ThrowingChild error={new Error("Crash")} />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText("Go Back")).toBeTruthy();
  });

  it("calls window.history.back when Go Back is clicked", () => {
    const backMock = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => {});
    render(
      <RouteErrorBoundary>
        <ThrowingChild error={new Error("Crash")} />
      </RouteErrorBoundary>,
    );
    fireEvent.click(screen.getByText("Go Back"));
    expect(backMock).toHaveBeenCalledTimes(1);
  });
});

describe("RouteErrorBoundary — Try Again recovery", () => {
  it('renders a "Try Again" button', () => {
    render(
      <RouteErrorBoundary>
        <ThrowingChild error={new Error("Crash")} />
      </RouteErrorBoundary>,
    );
    expect(screen.getByText("Try Again")).toBeTruthy();
  });
});
