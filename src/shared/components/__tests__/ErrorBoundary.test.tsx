import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary";

// ── helpers ───────────────────────────────────────────────────────────────────

function ThrowingChild({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>Child rendered successfully</div>;
}

// Suppress console.error from ErrorBoundary.componentDidCatch
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("ErrorBoundary — normal rendering", () => {
  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Normal content")).toBeTruthy();
  });
});

describe("ErrorBoundary — error handling", () => {
  it("shows default error UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText("Test error message")).toBeTruthy();
  });

  it("shows fallback message when error has no message", () => {
    function ThrowEmpty() {
      throw new Error("");
    }
    render(
      <ErrorBoundary>
        <ThrowEmpty />
      </ErrorBoundary>,
    );
    expect(screen.getByText("An unexpected error occurred.")).toBeTruthy();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback UI</div>}>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom fallback UI")).toBeTruthy();
    expect(screen.queryByText("Something went wrong")).toBeNull();
  });
});

describe("ErrorBoundary — retry", () => {
  it('shows a "Try Again" button', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Try Again")).toBeTruthy();
  });

  it('resets error state when "Try Again" is clicked', () => {
    let shouldThrow = true;

    function ConditionalThrow() {
      if (shouldThrow) throw new Error("Fail");
      return <div>Recovered</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeTruthy();

    // Fix the error condition before retrying
    shouldThrow = false;
    fireEvent.click(screen.getByText("Try Again"));

    expect(screen.getByText("Recovered")).toBeTruthy();
    expect(screen.queryByText("Something went wrong")).toBeNull();
  });
});

describe("ErrorBoundary — logging", () => {
  it("logs the error to console.error", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(console.error).toHaveBeenCalled();
  });
});

describe("ErrorBoundary — layout", () => {
  it("centers the error UI", () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    const errorContainer = container.firstElementChild!;
    expect(errorContainer.className).toContain("flex");
    expect(errorContainer.className).toContain("items-center");
    expect(errorContainer.className).toContain("justify-center");
  });
});
