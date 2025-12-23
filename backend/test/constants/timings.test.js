import { describe, it, expect } from 'vitest';
import {
  CACHE_TTL_MS,
  WEBSOCKET_POLL_INTERVAL_MS,
  WEBSOCKET_HEARTBEAT_INTERVAL_MS,
  WEBSOCKET_CLEANUP_INTERVAL_MS,
  SESSION_EXPIRY_MS,
  SESSION_CLEANUP_INTERVAL_MS,
  SCENE_APPLY_DELAY_MS
} from '../../constants/timings.js';

describe('Timing Constants', () => {
  describe('Cache settings', () => {
    it('should have cache TTL of 5 minutes', () => {
      expect(CACHE_TTL_MS).toBe(5 * 60 * 1000);
    });
  });

  describe('WebSocket settings', () => {
    it('should have poll interval of 15 seconds', () => {
      expect(WEBSOCKET_POLL_INTERVAL_MS).toBe(15000);
    });

    it('should have heartbeat interval of 30 seconds', () => {
      expect(WEBSOCKET_HEARTBEAT_INTERVAL_MS).toBe(30000);
    });

    it('should have cleanup interval of 60 seconds', () => {
      expect(WEBSOCKET_CLEANUP_INTERVAL_MS).toBe(60000);
    });
  });

  describe('Session settings', () => {
    it('should have session expiry of 24 hours', () => {
      expect(SESSION_EXPIRY_MS).toBe(24 * 60 * 60 * 1000);
    });

    it('should have cleanup interval of 1 hour', () => {
      expect(SESSION_CLEANUP_INTERVAL_MS).toBe(60 * 60 * 1000);
    });
  });

  describe('Scene settings', () => {
    it('should have scene apply delay of 500ms', () => {
      expect(SCENE_APPLY_DELAY_MS).toBe(500);
    });
  });

  describe('Value sanity checks', () => {
    it('should have poll interval less than heartbeat interval', () => {
      expect(WEBSOCKET_POLL_INTERVAL_MS).toBeLessThan(WEBSOCKET_HEARTBEAT_INTERVAL_MS);
    });

    it('should have heartbeat interval less than cleanup interval', () => {
      expect(WEBSOCKET_HEARTBEAT_INTERVAL_MS).toBeLessThan(WEBSOCKET_CLEANUP_INTERVAL_MS);
    });

    it('should have session cleanup interval less than session expiry', () => {
      expect(SESSION_CLEANUP_INTERVAL_MS).toBeLessThan(SESSION_EXPIRY_MS);
    });
  });
});
