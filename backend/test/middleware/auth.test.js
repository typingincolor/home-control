import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractCredentials, requireSession } from '../../middleware/auth.js';

// Mock sessionManager
vi.mock('../../services/sessionManager.js', () => ({
  default: {
    getSession: vi.fn(),
    hasBridgeCredentials: vi.fn(),
    storeBridgeCredentials: vi.fn()
  }
}));

import sessionManager from '../../services/sessionManager.js';

describe('Auth Middleware', () => {
  let req, res, next;
  const bridgeIp = '192.168.1.100';
  const username = 'test-user-abc123';
  const sessionToken = 'hue_sess_test123';

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      headers: {},
      query: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractCredentials', () => {
    describe('session token auth', () => {
      it('should extract credentials from session token', () => {
        req.headers.authorization = `Bearer ${sessionToken}`;
        sessionManager.getSession.mockReturnValue({ bridgeIp, username });
        sessionManager.hasBridgeCredentials.mockReturnValue(true);

        extractCredentials(req, res, next);

        expect(sessionManager.getSession).toHaveBeenCalledWith(sessionToken);
        expect(req.hue).toEqual({
          bridgeIp,
          username,
          authMethod: 'session'
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should store credentials if not already stored', () => {
        req.headers.authorization = `Bearer ${sessionToken}`;
        sessionManager.getSession.mockReturnValue({ bridgeIp, username });
        sessionManager.hasBridgeCredentials.mockReturnValue(false);

        extractCredentials(req, res, next);

        expect(sessionManager.hasBridgeCredentials).toHaveBeenCalledWith(bridgeIp);
        expect(sessionManager.storeBridgeCredentials).toHaveBeenCalledWith(bridgeIp, username);
      });

      it('should not store credentials if already stored', () => {
        req.headers.authorization = `Bearer ${sessionToken}`;
        sessionManager.getSession.mockReturnValue({ bridgeIp, username });
        sessionManager.hasBridgeCredentials.mockReturnValue(true);

        extractCredentials(req, res, next);

        expect(sessionManager.storeBridgeCredentials).not.toHaveBeenCalled();
      });

      it('should call next with error for invalid session', () => {
        req.headers.authorization = `Bearer invalid-token`;
        sessionManager.getSession.mockReturnValue(null);

        extractCredentials(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('header auth', () => {
      it('should extract credentials from headers', () => {
        req.headers['x-bridge-ip'] = bridgeIp;
        req.headers['x-hue-username'] = username;
        sessionManager.hasBridgeCredentials.mockReturnValue(true);

        extractCredentials(req, res, next);

        expect(req.hue).toEqual({
          bridgeIp,
          username,
          authMethod: 'headers'
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should store credentials from header auth if not stored', () => {
        req.headers['x-bridge-ip'] = bridgeIp;
        req.headers['x-hue-username'] = username;
        sessionManager.hasBridgeCredentials.mockReturnValue(false);

        extractCredentials(req, res, next);

        expect(sessionManager.storeBridgeCredentials).toHaveBeenCalledWith(bridgeIp, username);
      });
    });

    describe('query param auth', () => {
      it('should extract credentials from query params', () => {
        req.query.bridgeIp = bridgeIp;
        req.query.username = username;
        sessionManager.hasBridgeCredentials.mockReturnValue(true);

        extractCredentials(req, res, next);

        expect(req.hue).toEqual({
          bridgeIp,
          username,
          authMethod: 'query'
        });
        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('missing credentials', () => {
      it('should call next with error when no credentials provided', () => {
        extractCredentials(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('requireSession', () => {
    it('should extract credentials from valid session', () => {
      req.headers.authorization = `Bearer ${sessionToken}`;
      sessionManager.getSession.mockReturnValue({ bridgeIp, username });
      sessionManager.hasBridgeCredentials.mockReturnValue(true);

      requireSession(req, res, next);

      expect(req.hue).toEqual({
        bridgeIp,
        username,
        authMethod: 'session',
        sessionToken
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should store credentials if not already stored', () => {
      req.headers.authorization = `Bearer ${sessionToken}`;
      sessionManager.getSession.mockReturnValue({ bridgeIp, username });
      sessionManager.hasBridgeCredentials.mockReturnValue(false);

      requireSession(req, res, next);

      expect(sessionManager.storeBridgeCredentials).toHaveBeenCalledWith(bridgeIp, username);
    });

    it('should not store credentials if already stored', () => {
      req.headers.authorization = `Bearer ${sessionToken}`;
      sessionManager.getSession.mockReturnValue({ bridgeIp, username });
      sessionManager.hasBridgeCredentials.mockReturnValue(true);

      requireSession(req, res, next);

      expect(sessionManager.storeBridgeCredentials).not.toHaveBeenCalled();
    });

    it('should call next with error for missing auth header', () => {
      requireSession(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with error for invalid session', () => {
      req.headers.authorization = `Bearer invalid-token`;
      sessionManager.getSession.mockReturnValue(null);

      requireSession(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
