import { describe, it, expect } from "vitest";
import { cn } from "../cn";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes via clsx", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
    expect(cn("base", true && "active")).toBe("base active");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("merges conflicting Tailwind classes (last wins)", () => {
    // tailwind-merge resolves conflicts
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("keeps non-conflicting Tailwind classes", () => {
    expect(cn("p-4", "m-2")).toBe("p-4 m-2");
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("handles arrays of class names", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles objects with boolean values", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });

  it("returns empty string for all falsy inputs", () => {
    expect(cn(false, null, undefined, 0, "")).toBe("");
  });

  it("handles complex Tailwind merge scenarios", () => {
    // Responsive prefix conflicts
    expect(cn("md:p-4", "md:p-2")).toBe("md:p-2");
  });

  it("handles mixed strings, arrays, and objects", () => {
    expect(cn("base", ["arr1", "arr2"], { obj: true })).toBe(
      "base arr1 arr2 obj",
    );
  });
});
