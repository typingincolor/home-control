import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Unmock the hook we're testing (globally mocked in setup.js)
vi.unmock('./useSettings');

import { useSettings } from './useSettings';
import { hueApi } from '../services/hueApi';

// Mock hueApi
vi.mock('../services/hueApi', () => ({
  hueApi: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

describe('useSettings', () => {
  const mockSettings = {
    units: 'celsius',
    location: { lat: 51.5074, lon: -0.1278, name: 'London' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return default settings when not enabled', () => {
      const { result } = renderHook(() => useSettings(false));

      expect(result.current.settings).toEqual({
        units: 'celsius',
        location: null,
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should fetch settings when enabled', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(hueApi.getSettings).toHaveBeenCalledWith();
      expect(result.current.settings).toEqual(mockSettings);
    });

    it('should set isLoading while fetching', async () => {
      hueApi.getSettings.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });

    it('should handle API error gracefully', async () => {
      hueApi.getSettings.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      // Should keep default settings on error
      expect(result.current.settings).toEqual({
        units: 'celsius',
        location: null,
      });
    });

    it('should handle missing fields in API response', async () => {
      hueApi.getSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toEqual({
        units: 'celsius',
        location: null,
      });
    });
  });

  describe('updateSettings', () => {
    it('should optimistically update settings', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettings);
      hueApi.updateSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSettings({ units: 'fahrenheit' });
      });

      expect(result.current.settings.units).toBe('fahrenheit');
      expect(hueApi.updateSettings).toHaveBeenCalledWith({
        ...mockSettings,
        units: 'fahrenheit',
      });
    });

    it('should rollback on API error', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettings);
      hueApi.updateSettings.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSettings({ units: 'fahrenheit' });
      });

      // Should rollback to original settings
      expect(result.current.settings.units).toBe('celsius');
      expect(result.current.error).toBe('Update failed');
    });

    it('should call API even when default settings (always enabled)', async () => {
      hueApi.updateSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(false));

      await act(async () => {
        await result.current.updateSettings({ units: 'fahrenheit' });
      });

      // API is called even when disabled, just won't fetch on init
      expect(hueApi.updateSettings).toHaveBeenCalledWith({
        units: 'fahrenheit',
        location: null,
      });
    });

    it('should merge partial updates with existing settings', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettings);
      hueApi.updateSettings.mockResolvedValue({});

      const { result } = renderHook(() => useSettings(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSettings({ units: 'fahrenheit' });
      });

      // Location should be preserved
      expect(result.current.settings.location).toEqual(mockSettings.location);
      expect(result.current.settings.units).toBe('fahrenheit');
    });
  });

  describe('enabled changes', () => {
    it('should refetch when enabled changes from false to true', async () => {
      hueApi.getSettings.mockResolvedValue(mockSettings);

      const { result, rerender } = renderHook(({ enabled }) => useSettings(enabled), {
        initialProps: { enabled: false },
      });

      expect(hueApi.getSettings).not.toHaveBeenCalled();

      rerender({ enabled: true });

      await waitFor(() => {
        expect(hueApi.getSettings).toHaveBeenCalledWith();
      });

      expect(result.current.settings).toEqual(mockSettings);
    });
  });
});
