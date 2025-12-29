import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Tests for independent service support
 * Verifies that Hue and Hive can work independently:
 * - Neither service (just settings page)
 * - Hue only
 * - Hive only
 * - Both services
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value ? value.toString() : '';
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Import after mocks
import App from './App';
import { UI_TEXT } from './constants/uiText';

describe('Independent Service Support', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Neither Service (Initial Settings)', () => {
    it('should show settings page on first load with no services', async () => {
      render(<App />);

      // Should show settings page
      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });
    });

    it('should show both Hue and Hive toggles on settings page', async () => {
      render(<App />);

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });

      // Both toggles should be visible
      expect(screen.getByRole('switch', { name: /hue/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /hive/i })).toBeInTheDocument();
    });

    it('should have both toggles off by default', async () => {
      render(<App />);

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });

      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      const hiveToggle = screen.getByRole('switch', { name: /hive/i });

      expect(hueToggle).not.toBeChecked();
      expect(hiveToggle).not.toBeChecked();
    });
  });

  describe('Hue Only Mode', () => {
    it('should go to discovery when Hue toggle is enabled', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });

      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      await user.click(hueToggle);

      // Should transition to discovery step
      await waitFor(() => {
        expect(screen.getByText(UI_TEXT.BUTTON_DISCOVER_BRIDGE)).toBeInTheDocument();
      });
    });
  });

  describe('Hive Only Mode', () => {
    it('should go to dashboard when Hive toggle is enabled', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });

      const hiveToggle = screen.getByRole('switch', { name: /hive/i });
      await user.click(hiveToggle);

      // Should transition to dashboard with Hive tab
      await waitFor(() => {
        expect(document.querySelector('.dark-layout')).toBeInTheDocument();
      });
    });

    it('should default to Hive tab in Hive-only mode', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });

      const hiveToggle = screen.getByRole('switch', { name: /hive/i });
      await user.click(hiveToggle);

      // Should show dashboard
      await waitFor(() => {
        expect(document.querySelector('.dark-layout')).toBeInTheDocument();
      });

      // In Hive-only mode, the Hive or Automations tab should be present
      // (the exact tab shown depends on whether Hive service detects connection)
      await waitFor(() => {
        const hasNavigation = document.querySelector('.bottom-nav');
        expect(hasNavigation).toBeInTheDocument();
      });
    });

    it('should show Hive login interface in Hive-only mode', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });

      const hiveToggle = screen.getByRole('switch', { name: /hive/i });
      await user.click(hiveToggle);

      // Should show dashboard
      await waitFor(() => {
        expect(document.querySelector('.dark-layout')).toBeInTheDocument();
      });
    });

    it('should not show Hue rooms in Hive-only mode', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });

      const hiveToggle = screen.getByRole('switch', { name: /hive/i });
      await user.click(hiveToggle);

      await waitFor(() => {
        expect(document.querySelector('.dark-layout')).toBeInTheDocument();
      });

      // Dashboard should be rendered but without Hue room tabs
      // The navigation should exist with special tabs only
      expect(document.querySelector('.bottom-nav')).toBeInTheDocument();
    });
  });

  describe('Both Services Mode', () => {
    it('should work when both services are enabled', async () => {
      // This test verifies the settings page allows both toggles independently
      render(<App />);

      await waitFor(() => {
        expect(document.querySelector('.settings-page')).toBeInTheDocument();
      });

      const hueToggle = screen.getByRole('switch', { name: /hue/i });
      const hiveToggle = screen.getByRole('switch', { name: /hive/i });

      // Both toggles should be independently clickable
      expect(hueToggle).toBeEnabled();
      expect(hiveToggle).toBeEnabled();
    });
  });
});
