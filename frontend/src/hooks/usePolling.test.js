import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePolling } from './usePolling';

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should call callback at specified interval when enabled', () => {
    const callback = vi.fn();
    renderHook(() => usePolling(callback, 1000, true));

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should not call callback when disabled', () => {
    const callback = vi.fn();
    renderHook(() => usePolling(callback, 1000, false));

    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should stop polling when component unmounts', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => usePolling(callback, 1000, true));

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();

    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1); // Should not increase
  });

  it('should restart polling when enabled changes from false to true', () => {
    const callback = vi.fn();
    let enabled = false;
    const { rerender } = renderHook(() => usePolling(callback, 1000, enabled));

    vi.advanceTimersByTime(2000);
    expect(callback).not.toHaveBeenCalled();

    enabled = true;
    rerender();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should stop polling when enabled changes from true to false', () => {
    const callback = vi.fn();
    let enabled = true;
    const { rerender } = renderHook(() => usePolling(callback, 1000, enabled));

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    enabled = false;
    rerender();

    vi.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledTimes(1); // Should not increase
  });

  it('should handle callback changes', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    let currentCallback = callback1;

    const { rerender } = renderHook(() => usePolling(currentCallback, 1000, true));

    vi.advanceTimersByTime(1000);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();

    currentCallback = callback2;
    rerender();

    vi.advanceTimersByTime(1000);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should handle interval changes', () => {
    const callback = vi.fn();
    let interval = 1000;
    const { rerender } = renderHook(() => usePolling(callback, interval, true));

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    interval = 500;
    rerender();

    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should work with very short intervals', () => {
    const callback = vi.fn();
    renderHook(() => usePolling(callback, 100, true));

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should work with very long intervals', () => {
    const callback = vi.fn();
    renderHook(() => usePolling(callback, 60000, true));

    vi.advanceTimersByTime(59999);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle callback throwing errors', () => {
    const errorCallback = vi.fn(() => {
      throw new Error('Test error');
    });

    renderHook(() => usePolling(errorCallback, 1000, true));

    expect(() => {
      vi.advanceTimersByTime(1000);
    }).toThrow('Test error');

    // Should still be called again despite error
    expect(errorCallback).toHaveBeenCalledTimes(1);
  });
});
