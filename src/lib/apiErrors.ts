import { ApiError } from "./api";

/**
 * Typed error utilities for the StreamVault API layer.
 *
 * These functions provide safe, user-friendly error handling without
 * leaking internal details (stack traces, endpoint paths, server messages).
 */

/**
 * Returns true if the error is a network-level failure (no response received).
 * Typically a TypeError thrown by fetch() when the network is unavailable,
 * the request timed out, or DNS resolution failed.
 */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError && error.message.toLowerCase().includes("fetch")
  );
}

/**
 * Returns true if the error is an HTTP 5xx server error.
 */
export function isServerError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 500 && error.status < 600;
}

/**
 * Returns true if the error is an HTTP 4xx client error.
 */
export function isClientError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

/**
 * Returns true if the error is an HTTP 401 Unauthorized.
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/**
 * Maps any error to a user-friendly message string.
 * Never leaks internal server details, stack traces, or endpoint paths.
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return "Unable to reach the server. Please check your connection.";
  }

  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "The request could not be processed. Please try again.";
      case 401:
        return "Your session has expired. Please sign in again.";
      case 403:
        return "You do not have permission to access this content.";
      case 404:
        return "The requested content was not found.";
      case 408:
        return "The request timed out. Please try again.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 503:
        return "The service is temporarily unavailable. Please try again shortly.";
      default:
        if (error.status >= 500) {
          return "A server error occurred. Please try again later.";
        }
        return "Something went wrong. Please try again.";
    }
  }

  if (error instanceof Error) {
    // Generic Error — do not expose message (may contain paths/internals)
    return "An unexpected error occurred. Please try again.";
  }

  return "An unexpected error occurred. Please try again.";
}
