import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the player api module before importing the hook
const mockMutate = vi.fn();
vi.mock('../api', () => ({
  useUpdateHistory: () => ({ mutate: mockMutate }),
}));

// Import after mock setup
import { useProgressTracking } from '../hooks/useProgressTracking';

describe('useProgressTracking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMutate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultOptions = {
    contentId: 'ch-123',
    contentType: 'live' as const,
    contentName: 'Test Channel',
    contentIcon: 'icon.png',
    isLive: false,
  };

  it('calls saveProgress on interval', () => {
    const { result } = renderHook(() => useProgressTracking(defaultOptions));

    // Simulate time updates with enough difference
    act(() => {
      result.current.onTimeUpdate(30, 600);
    });

    // Advance past the 10s interval
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        contentId: 'ch-123',
        progress_seconds: 30,
        duration_seconds: 600,
      }),
    );
  });

  it('skips save when isLive=true', () => {
    const { result } = renderHook(() =>
      useProgressTracking({ ...defaultOptions, isLive: true }),
    );

    act(() => {
      result.current.onTimeUpdate(30, 600);
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('skips save when time diff < 5 seconds from last save', () => {
    const { result } = renderHook(() => useProgressTracking(defaultOptions));

    // First update and save
    act(() => {
      result.current.onTimeUpdate(30, 600);
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);
    mockMutate.mockClear();

    // Update with small difference (< 5s)
    act(() => {
      result.current.onTimeUpdate(33, 600);
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Should NOT save because diff is only 3s
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('saves progress on unmount', () => {
    const { result, unmount } = renderHook(() => useProgressTracking(defaultOptions));

    act(() => {
      result.current.onTimeUpdate(45, 600);
    });

    unmount();

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress_seconds: 45,
        duration_seconds: 600,
      }),
    );
  });

  it('does not save on unmount when isLive', () => {
    const { result, unmount } = renderHook(() =>
      useProgressTracking({ ...defaultOptions, isLive: true }),
    );

    act(() => {
      result.current.onTimeUpdate(45, 600);
    });

    unmount();

    expect(mockMutate).not.toHaveBeenCalled();
  });
});
