import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastContainer, useToast } from "../Toast";
import { useToastStore } from "@/lib/toastStore";

// ── helpers ───────────────────────────────────────────────────────────────────

function addToastDirectly(
  message: string,
  severity: "error" | "warning" | "info" | "success" = "info",
  duration = 0,
) {
  useToastStore.getState().addToast(message, severity, duration);
}

beforeEach(() => {
  vi.useFakeTimers();
  // Clear toast store between tests
  useToastStore.setState({ toasts: [] });
});

afterEach(() => {
  vi.useRealTimers();
});

// ── ToastContainer ────────────────────────────────────────────────────────────

describe("ToastContainer — rendering", () => {
  it("renders nothing when there are no toasts", () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a toast when one is added", () => {
    render(<ToastContainer />);
    act(() => addToastDirectly("Hello world", "info"));
    expect(screen.getByText("Hello world")).toBeTruthy();
  });

  it("renders multiple toasts", () => {
    render(<ToastContainer />);
    act(() => {
      addToastDirectly("First toast", "info");
      addToastDirectly("Second toast", "success");
    });
    expect(screen.getByText("First toast")).toBeTruthy();
    expect(screen.getByText("Second toast")).toBeTruthy();
  });

  it('has aria-label "Notifications" on the container', () => {
    render(<ToastContainer />);
    act(() => addToastDirectly("Test", "info"));
    expect(screen.getByLabelText("Notifications")).toBeTruthy();
  });
});

describe("ToastContainer — severity styles", () => {
  it('error toast has role="alert" and aria-live="assertive"', () => {
    render(<ToastContainer />);
    act(() => addToastDirectly("Error!", "error"));
    const alert = screen.getByRole("alert");
    expect(alert).toBeTruthy();
    expect(alert.getAttribute("aria-live")).toBe("assertive");
  });

  it('warning toast has role="alert" and aria-live="assertive"', () => {
    render(<ToastContainer />);
    act(() => addToastDirectly("Warning!", "warning"));
    const alert = screen.getByRole("alert");
    expect(alert).toBeTruthy();
    expect(alert.getAttribute("aria-live")).toBe("assertive");
  });

  it('info toast has role="status" and aria-live="polite"', () => {
    render(<ToastContainer />);
    act(() => addToastDirectly("Info!", "info"));
    const status = screen.getByRole("status");
    expect(status).toBeTruthy();
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  it('success toast has role="status" and aria-live="polite"', () => {
    render(<ToastContainer />);
    act(() => addToastDirectly("Success!", "success"));
    const status = screen.getByRole("status");
    expect(status).toBeTruthy();
    expect(status.getAttribute("aria-live")).toBe("polite");
  });
});

describe("ToastContainer — dismiss", () => {
  it("renders a dismiss button with accessible label", () => {
    render(<ToastContainer />);
    act(() => addToastDirectly("Dismiss me", "info"));
    expect(screen.getByLabelText("Dismiss notification")).toBeTruthy();
  });

  it("removes toast when dismiss button is clicked (after fade-out)", () => {
    render(<ToastContainer />);
    act(() => addToastDirectly("Dismiss me", "info"));

    fireEvent.click(screen.getByLabelText("Dismiss notification"));
    // Fade-out transition takes 200ms
    act(() => vi.advanceTimersByTime(300));

    expect(screen.queryByText("Dismiss me")).toBeNull();
  });
});

describe("ToastContainer — aria-atomic", () => {
  it('toast items have aria-atomic="true"', () => {
    render(<ToastContainer />);
    act(() => addToastDirectly("Atomic test", "info"));
    const toast = screen.getByRole("status");
    expect(toast.getAttribute("aria-atomic")).toBe("true");
  });
});

// ── useToast hook ─────────────────────────────────────────────────────────────

describe("useToast", () => {
  function HookConsumer() {
    const toast = useToast();
    return (
      <div>
        <button onClick={() => toast.error("Error msg")}>Error</button>
        <button onClick={() => toast.warning("Warning msg")}>Warning</button>
        <button onClick={() => toast.info("Info msg")}>Info</button>
        <button onClick={() => toast.success("Success msg")}>Success</button>
      </div>
    );
  }

  it("exposes error, warning, info, success convenience methods", () => {
    render(
      <>
        <HookConsumer />
        <ToastContainer />
      </>,
    );

    fireEvent.click(screen.getByText("Error"));
    expect(screen.getByText("Error msg")).toBeTruthy();

    fireEvent.click(screen.getByText("Success"));
    expect(screen.getByText("Success msg")).toBeTruthy();
  });
});
