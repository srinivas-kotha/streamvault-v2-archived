import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── import from expected implementation paths (will fail until alpha implements) ─
import { LayoutSelector } from '../LayoutSelector';

// ── mock the device context hook ──────────────────────────────────────────────

const mockDeviceContext = {
  deviceType: 'desktop' as string,
  isTVMode: false,
  isMobile: false,
};

vi.mock('@/hooks/useDeviceContext', () => ({
  useDeviceContext: () => mockDeviceContext,
}));

// ── mock the layout components ────────────────────────────────────────────────

vi.mock('../TVLayout', () => ({
  TVLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tv-layout">{children}</div>
  ),
}));

vi.mock('../DesktopLayout', () => ({
  DesktopLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="desktop-layout">{children}</div>
  ),
}));

vi.mock('../MobileLayout', () => ({
  MobileLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mobile-layout">{children}</div>
  ),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function setDevice(deviceType: string, isTVMode: boolean, isMobile: boolean) {
  mockDeviceContext.deviceType = deviceType;
  mockDeviceContext.isTVMode = isTVMode;
  mockDeviceContext.isMobile = isMobile;
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  setDevice('desktop', false, false);
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('LayoutSelector — TV layouts', () => {
  it('renders TVLayout when device is "firetv"', () => {
    setDevice('firetv', true, false);
    render(<LayoutSelector><p>content</p></LayoutSelector>);

    expect(screen.getByTestId('tv-layout')).toBeTruthy();
    expect(screen.queryByTestId('desktop-layout')).toBeNull();
    expect(screen.queryByTestId('mobile-layout')).toBeNull();
  });

  it('renders TVLayout when device is "tizen"', () => {
    setDevice('tizen', true, false);
    render(<LayoutSelector><p>content</p></LayoutSelector>);

    expect(screen.getByTestId('tv-layout')).toBeTruthy();
  });

  it('renders TVLayout when device is "webos"', () => {
    setDevice('webos', true, false);
    render(<LayoutSelector><p>content</p></LayoutSelector>);

    expect(screen.getByTestId('tv-layout')).toBeTruthy();
  });
});

describe('LayoutSelector — desktop layout', () => {
  it('renders DesktopLayout when device is "desktop"', () => {
    setDevice('desktop', false, false);
    render(<LayoutSelector><p>content</p></LayoutSelector>);

    expect(screen.getByTestId('desktop-layout')).toBeTruthy();
    expect(screen.queryByTestId('tv-layout')).toBeNull();
    expect(screen.queryByTestId('mobile-layout')).toBeNull();
  });
});

describe('LayoutSelector — mobile layout', () => {
  it('renders MobileLayout when device is "mobile"', () => {
    setDevice('mobile', false, true);
    render(<LayoutSelector><p>content</p></LayoutSelector>);

    expect(screen.getByTestId('mobile-layout')).toBeTruthy();
    expect(screen.queryByTestId('desktop-layout')).toBeNull();
    expect(screen.queryByTestId('tv-layout')).toBeNull();
  });
});

describe('LayoutSelector — children passthrough', () => {
  it('passes children through to TVLayout', () => {
    setDevice('firetv', true, false);
    render(<LayoutSelector><p data-testid="child">Hello TV</p></LayoutSelector>);

    const tvLayout = screen.getByTestId('tv-layout');
    expect(tvLayout.querySelector('[data-testid="child"]')).toBeTruthy();
    expect(screen.getByText('Hello TV')).toBeTruthy();
  });

  it('passes children through to DesktopLayout', () => {
    setDevice('desktop', false, false);
    render(<LayoutSelector><p data-testid="child">Hello Desktop</p></LayoutSelector>);

    const desktopLayout = screen.getByTestId('desktop-layout');
    expect(desktopLayout.querySelector('[data-testid="child"]')).toBeTruthy();
    expect(screen.getByText('Hello Desktop')).toBeTruthy();
  });

  it('passes children through to MobileLayout', () => {
    setDevice('mobile', false, true);
    render(<LayoutSelector><p data-testid="child">Hello Mobile</p></LayoutSelector>);

    const mobileLayout = screen.getByTestId('mobile-layout');
    expect(mobileLayout.querySelector('[data-testid="child"]')).toBeTruthy();
    expect(screen.getByText('Hello Mobile')).toBeTruthy();
  });

  it('renders complex children trees', () => {
    setDevice('desktop', false, false);
    render(
      <LayoutSelector>
        <header data-testid="header">Header</header>
        <main data-testid="main">
          <section>Section 1</section>
          <section>Section 2</section>
        </main>
      </LayoutSelector>,
    );

    expect(screen.getByTestId('header')).toBeTruthy();
    expect(screen.getByTestId('main')).toBeTruthy();
    expect(screen.getByText('Section 1')).toBeTruthy();
    expect(screen.getByText('Section 2')).toBeTruthy();
  });
});
