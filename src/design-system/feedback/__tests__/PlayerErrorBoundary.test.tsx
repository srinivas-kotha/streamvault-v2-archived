import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlayerErrorBoundary } from "../PlayerErrorBoundary";

// ── helpers ───────────────────────────────────────────────────────────────────

function ThrowingChild({ error }: { error: Error }) {
  throw error;
}

function GoodChild() {
  return <div>Player content</div>;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("PlayerErrorBoundary — normal rendering", () => {
  it("renders children when no error is thrown", () => {
    render(
      <PlayerErrorBoundary>
        <GoodChild />
      </PlayerErrorBoundary>,
    );
    expect(screen.getByText("Player content")).toBeTruthy();
  });

  it("does not show error UI when children render normally", () => {
    render(
      <PlayerErrorBoundary>
        <GoodChild />
      </PlayerErrorBoundary>,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("PlayerErrorBoundary — error catching", () => {
  it("catches errors and shows player error UI", () => {
    render(
      <PlayerErrorBoundary>
        <ThrowingChild error={new Error("Player crash")} />
      </PlayerErrorBoundary>,
    );
    expect(screen.getByText("Playback error")).toBeTruthy();
  });

  it('renders with role="alert"', () => {
    render(
      <PlayerErrorBoundary>
        <ThrowingChild error={new Error("Crash")} />
      </PlayerErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("shows descriptive text about the error", () => {
    render(
      <PlayerErrorBoundary>
        <ThrowingChild error={new Error("Crash")} />
      </PlayerErrorBoundary>,
    );
    expect(
      screen.getByText(/error occurred while rendering the player/i),
    ).toBeTruthy();
  });

  it("shows error message in dev mode", () => {
    render(
      <PlayerErrorBoundary>
        <ThrowingChild error={new Error("Player dev error")} />
      </PlayerErrorBoundary>,
    );
    expect(screen.getByText("Player dev error")).toBeTruthy();
  });
});

describe("PlayerErrorBoundary — Retry button", () => {
  it('renders a "Retry" button', () => {
    render(
      <PlayerErrorBoundary>
        <ThrowingChild error={new Error("Crash")} />
      </PlayerErrorBoundary>,
    );
    expect(screen.getByText("Retry")).toBeTruthy();
  });
});

describe("PlayerErrorBoundary — Close button", () => {
  it("renders Close button when onClose is provided", () => {
    render(
      <PlayerErrorBoundary onClose={vi.fn()}>
        <ThrowingChild error={new Error("Crash")} />
      </PlayerErrorBoundary>,
    );
    expect(screen.getByText("Close")).toBeTruthy();
  });

  it("does NOT render Close button when onClose is not provided", () => {
    render(
      <PlayerErrorBoundary>
        <ThrowingChild error={new Error("Crash")} />
      </PlayerErrorBoundary>,
    );
    expect(screen.queryByText("Close")).toBeNull();
  });

  it("calls onClose callback when Close is clicked", () => {
    const onCloseMock = vi.fn();
    render(
      <PlayerErrorBoundary onClose={onCloseMock}>
        <ThrowingChild error={new Error("Crash")} />
      </PlayerErrorBoundary>,
    );
    fireEvent.click(screen.getByText("Close"));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});

describe("PlayerErrorBoundary — SVG icon", () => {
  it("renders an SVG icon with aria-hidden", () => {
    render(
      <PlayerErrorBoundary>
        <ThrowingChild error={new Error("Crash")} />
      </PlayerErrorBoundary>,
    );
    const svg = screen.getByRole("alert").querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });
});
