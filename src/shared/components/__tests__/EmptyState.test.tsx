import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

// ── helpers ───────────────────────────────────────────────────────────────────

function renderEmptyState(
  props?: Partial<React.ComponentProps<typeof EmptyState>>,
) {
  return render(<EmptyState {...props} />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("EmptyState — default rendering", () => {
  it('renders default title "Nothing here"', () => {
    renderEmptyState();
    expect(screen.getByText("Nothing here")).toBeTruthy();
  });

  it('renders default message "No content to display"', () => {
    renderEmptyState();
    expect(screen.getByText("No content to display")).toBeTruthy();
  });

  it("renders an SVG icon", () => {
    const { container } = renderEmptyState();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

describe("EmptyState — custom props", () => {
  it("renders custom title", () => {
    renderEmptyState({ title: "No favorites yet" });
    expect(screen.getByText("No favorites yet")).toBeTruthy();
  });

  it("renders custom message", () => {
    renderEmptyState({ message: "Add some favorites to see them here" });
    expect(
      screen.getByText("Add some favorites to see them here"),
    ).toBeTruthy();
  });
});

describe("EmptyState — icon variants", () => {
  it("renders content icon by default", () => {
    const { container } = renderEmptyState();
    const path = container.querySelector("svg path");
    expect(path).not.toBeNull();
  });

  it("renders search icon variant", () => {
    const { container } = renderEmptyState({ icon: "search" });
    const path = container.querySelector("svg path");
    expect(path!.getAttribute("d")).toContain("21l-6-6");
  });

  it("renders favorites icon variant", () => {
    const { container } = renderEmptyState({ icon: "favorites" });
    const path = container.querySelector("svg path");
    expect(path!.getAttribute("d")).toContain("11.049");
  });

  it("renders history icon variant", () => {
    const { container } = renderEmptyState({ icon: "history" });
    const path = container.querySelector("svg path");
    expect(path!.getAttribute("d")).toContain("12 8v4l3 3");
  });
});

describe("EmptyState — layout", () => {
  it("centers content vertically and horizontally", () => {
    const { container } = renderEmptyState();
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("flex-col");
    expect(wrapper.className).toContain("items-center");
    expect(wrapper.className).toContain("justify-center");
  });

  it("uses text-center alignment", () => {
    const { container } = renderEmptyState();
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("text-center");
  });

  it("title uses heading element (h3)", () => {
    renderEmptyState();
    expect(screen.getByRole("heading", { level: 3 })).toBeTruthy();
  });
});
