/**
 * Vitest setup file — polyfills missing browser APIs in jsdom
 * and configures MSW for API mocking.
 */

import "@testing-library/jest-dom";
import { server } from "./mocks/server";

// ── MSW server lifecycle ────────────────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── jsdom polyfills ─────────────────────────────────────────────────────────

// jsdom does not implement PointerEvent — polyfill it as a subclass of MouseEvent
if (typeof globalThis.PointerEvent === "undefined") {
  // @ts-expect-error -- intentional polyfill for test environment
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    readonly pointerId: number;
    readonly width: number;
    readonly height: number;
    readonly pressure: number;
    readonly tangentialPressure: number;
    readonly tiltX: number;
    readonly tiltY: number;
    readonly twist: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.width = params.width ?? 1;
      this.height = params.height ?? 1;
      this.pressure = params.pressure ?? 0;
      this.tangentialPressure = params.tangentialPressure ?? 0;
      this.tiltX = params.tiltX ?? 0;
      this.tiltY = params.tiltY ?? 0;
      this.twist = params.twist ?? 0;
      this.pointerType = params.pointerType ?? "";
      this.isPrimary = params.isPrimary ?? false;
    }
  };
}
