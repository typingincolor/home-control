import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDemoMode } from './useDemoMode';

describe('useDemoMode', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location
    delete window.location;
    window.location = { search: '' };
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  it('should return false when demo param is not present', () => {
    window.location.search = '';
    const { result } = renderHook(() => useDemoMode());
    expect(result.current).toBe(false);
  });

  it('should return false when demo param is false', () => {
    window.location.search = '?demo=false';
    const { result } = renderHook(() => useDemoMode());
    expect(result.current).toBe(false);
  });

  it('should return true when demo param is true', () => {
    window.location.search = '?demo=true';
    const { result } = renderHook(() => useDemoMode());
    expect(result.current).toBe(true);
  });

  it('should return false when demo param has other value', () => {
    window.location.search = '?demo=yes';
    const { result } = renderHook(() => useDemoMode());
    expect(result.current).toBe(false);
  });

  it('should work with multiple query parameters', () => {
    window.location.search = '?foo=bar&demo=true&baz=qux';
    const { result } = renderHook(() => useDemoMode());
    expect(result.current).toBe(true);
  });

  it('should handle demo as first parameter', () => {
    window.location.search = '?demo=true&other=value';
    const { result } = renderHook(() => useDemoMode());
    expect(result.current).toBe(true);
  });

  it('should handle demo as last parameter', () => {
    window.location.search = '?other=value&demo=true';
    const { result } = renderHook(() => useDemoMode());
    expect(result.current).toBe(true);
  });

  it('should be case sensitive', () => {
    window.location.search = '?demo=True';
    const { result } = renderHook(() => useDemoMode());
    expect(result.current).toBe(false);
  });

  it('should not change value on re-render', () => {
    window.location.search = '?demo=true';
    const { result, rerender } = renderHook(() => useDemoMode());
    expect(result.current).toBe(true);

    // Change URL (simulate navigation)
    window.location.search = '?demo=false';
    rerender();

    // Should still be true (useState initialized once)
    expect(result.current).toBe(true);
  });
});
