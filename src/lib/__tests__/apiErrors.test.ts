import { describe, it, expect } from "vitest";
import { ApiError } from "../api";
import {
  isNetworkError,
  isServerError,
  isClientError,
  isAuthError,
  getUserFriendlyMessage,
} from "../apiErrors";

// ── isNetworkError ────────────────────────────────────────────────────────────

describe("isNetworkError()", () => {
  it('returns true for a TypeError with "fetch" in the message', () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it('returns true for a TypeError with "fetch" in any case', () => {
    expect(
      isNetworkError(
        new TypeError("NetworkError when attempting to fetch resource"),
      ),
    ).toBe(true);
  });

  it('returns false for a TypeError without "fetch" in the message', () => {
    expect(
      isNetworkError(new TypeError("Cannot read property of undefined")),
    ).toBe(false);
  });

  it("returns false for an ApiError", () => {
    expect(isNetworkError(new ApiError(500, "Internal Server Error"))).toBe(
      false,
    );
  });

  it("returns false for a generic Error", () => {
    expect(isNetworkError(new Error("Something went wrong"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isNetworkError(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isNetworkError(undefined)).toBe(false);
  });

  it("returns false for a plain string", () => {
    expect(isNetworkError("network error")).toBe(false);
  });
});

// ── isServerError ─────────────────────────────────────────────────────────────

describe("isServerError()", () => {
  it("returns true for a 500 ApiError", () => {
    expect(isServerError(new ApiError(500, "Internal Server Error"))).toBe(
      true,
    );
  });

  it("returns true for a 503 ApiError", () => {
    expect(isServerError(new ApiError(503, "Service Unavailable"))).toBe(true);
  });

  it("returns true for a 599 ApiError", () => {
    expect(isServerError(new ApiError(599, "Unknown"))).toBe(true);
  });

  it("returns false for a 4xx ApiError", () => {
    expect(isServerError(new ApiError(404, "Not Found"))).toBe(false);
  });

  it("returns false for a 200 ApiError", () => {
    expect(isServerError(new ApiError(200, "OK"))).toBe(false);
  });

  it("returns false for a TypeError", () => {
    expect(isServerError(new TypeError("Failed to fetch"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isServerError(null)).toBe(false);
  });
});

// ── isClientError ─────────────────────────────────────────────────────────────

describe("isClientError()", () => {
  it("returns true for a 400 ApiError", () => {
    expect(isClientError(new ApiError(400, "Bad Request"))).toBe(true);
  });

  it("returns true for a 403 ApiError", () => {
    expect(isClientError(new ApiError(403, "Forbidden"))).toBe(true);
  });

  it("returns true for a 404 ApiError", () => {
    expect(isClientError(new ApiError(404, "Not Found"))).toBe(true);
  });

  it("returns false for a 500 ApiError", () => {
    expect(isClientError(new ApiError(500, "Internal Server Error"))).toBe(
      false,
    );
  });

  it("returns false for non-ApiError", () => {
    expect(isClientError(new Error("oops"))).toBe(false);
  });
});

// ── isAuthError ───────────────────────────────────────────────────────────────

describe("isAuthError()", () => {
  it("returns true for a 401 ApiError", () => {
    expect(isAuthError(new ApiError(401, "Unauthorized"))).toBe(true);
  });

  it("returns false for a 403 ApiError", () => {
    expect(isAuthError(new ApiError(403, "Forbidden"))).toBe(false);
  });

  it("returns false for a TypeError", () => {
    expect(isAuthError(new TypeError("Failed to fetch"))).toBe(false);
  });
});

// ── getUserFriendlyMessage ────────────────────────────────────────────────────

describe("getUserFriendlyMessage()", () => {
  it("returns connection message for a network error", () => {
    const msg = getUserFriendlyMessage(new TypeError("Failed to fetch"));
    expect(msg).toBe(
      "Unable to reach the server. Please check your connection.",
    );
  });

  it("returns session expired message for 401", () => {
    expect(getUserFriendlyMessage(new ApiError(401, "Unauthorized"))).toBe(
      "Your session has expired. Please sign in again.",
    );
  });

  it("returns permission message for 403", () => {
    expect(getUserFriendlyMessage(new ApiError(403, "Forbidden"))).toBe(
      "You do not have permission to access this content.",
    );
  });

  it("returns not found message for 404", () => {
    expect(getUserFriendlyMessage(new ApiError(404, "Not Found"))).toBe(
      "The requested content was not found.",
    );
  });

  it("returns server error message for 500", () => {
    expect(
      getUserFriendlyMessage(new ApiError(500, "Internal Server Error")),
    ).toBe("A server error occurred. Please try again later.");
  });

  it("returns service unavailable message for 503", () => {
    expect(
      getUserFriendlyMessage(new ApiError(503, "Service Unavailable")),
    ).toBe("The service is temporarily unavailable. Please try again shortly.");
  });

  it("returns server error for unknown 5xx", () => {
    expect(getUserFriendlyMessage(new ApiError(502, "Bad Gateway"))).toBe(
      "A server error occurred. Please try again later.",
    );
  });

  it("returns generic message for unknown 4xx", () => {
    expect(
      getUserFriendlyMessage(new ApiError(422, "Unprocessable Entity")),
    ).toBe("Something went wrong. Please try again.");
  });

  it("returns generic message for a plain Error (no internal leakage)", () => {
    const err = new Error("/api/secret-endpoint returned 418");
    expect(getUserFriendlyMessage(err)).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });

  it("returns generic message for null", () => {
    expect(getUserFriendlyMessage(null)).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });

  it("returns generic message for undefined", () => {
    expect(getUserFriendlyMessage(undefined)).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });

  it("returns timeout message for 408", () => {
    expect(getUserFriendlyMessage(new ApiError(408, "Request Timeout"))).toBe(
      "The request timed out. Please try again.",
    );
  });

  it("returns rate limit message for 429", () => {
    expect(getUserFriendlyMessage(new ApiError(429, "Too Many Requests"))).toBe(
      "Too many requests. Please wait a moment and try again.",
    );
  });

  it("returns bad request message for 400", () => {
    expect(getUserFriendlyMessage(new ApiError(400, "Bad Request"))).toBe(
      "The request could not be processed. Please try again.",
    );
  });
});
