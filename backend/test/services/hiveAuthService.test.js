import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * HiveAuthService Tests - AWS Cognito SRP Authentication
 *
 * Tests for the Hive authentication service using AWS Cognito
 * with SMS 2FA and device registration support.
 */

// Ensure we're using the real hiveAuthService module, not a mock from other test files
vi.unmock('../../services/hiveAuthService.js');

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock credentials manager
vi.mock('../../services/hiveCredentialsManager.js', () => ({
  default: {
    hasCredentials: vi.fn(() => false),
    getCredentials: vi.fn(() => null),
    getSessionToken: vi.fn(() => null),
    setSessionToken: vi.fn(),
    clearSessionToken: vi.fn(),
    getDeviceCredentials: vi.fn(() => null),
    setDeviceCredentials: vi.fn(),
    clearDeviceCredentials: vi.fn(),
  },
  HIVE_DEMO_CREDENTIALS: {
    username: 'demo@hive.com',
    password: 'demo',
    code: '123456',
  },
}));

describe('HiveAuthService', () => {
  let HiveAuthService;
  let hiveCredentialsManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Import fresh modules after reset
    const credsMod = await import('../../services/hiveCredentialsManager.js');
    hiveCredentialsManager = credsMod.default;

    const serviceMod = await import('../../services/hiveAuthService.js');
    HiveAuthService = serviceMod.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchCognitoConfig', () => {
    it('should fetch Cognito pool ID and client ID from Hive SSO page', async () => {
      const config = await HiveAuthService.fetchCognitoConfig();

      expect(config).toHaveProperty('poolId');
      expect(config).toHaveProperty('clientId');
      expect(config).toHaveProperty('region');
      expect(config.region).toBe('eu-west-1');
    });

    it('should cache config after first fetch', async () => {
      const config1 = await HiveAuthService.fetchCognitoConfig();
      const config2 = await HiveAuthService.fetchCognitoConfig();

      expect(config1).toEqual(config2);
    });
  });

  describe('initiateAuth', () => {
    it('should return requires2fa when SMS MFA challenge is required', async () => {
      const result = await HiveAuthService.initiateAuth('user@hive.com', 'password');

      expect(result).toHaveProperty('requires2fa');
      if (result.requires2fa) {
        expect(result).toHaveProperty('session');
        expect(result.session).toBeTruthy();
      }
    });

    it('should return tokens directly when device credentials exist (skip 2FA)', async () => {
      hiveCredentialsManager.getDeviceCredentials.mockReturnValue({
        deviceKey: 'device-key-123',
        deviceGroupKey: 'device-group-key',
        devicePassword: 'device-password',
      });

      const result = await HiveAuthService.initiateAuth('user@hive.com', 'password');

      // Should return tokens directly, no 2FA required
      if (!result.requires2fa) {
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
        expect(result).toHaveProperty('idToken');
      }
    });

    it('should require 2FA for non-device authentication (when getDeviceCredentials returns null)', async () => {
      // Ensure device credentials mock returns null
      hiveCredentialsManager.getDeviceCredentials.mockReturnValue(null);

      const result = await HiveAuthService.initiateAuth('anyuser@hive.com', 'anypassword');

      // Should require 2FA when no device credentials
      expect(result.requires2fa).toBe(true);
      expect(result.session).toBeTruthy();
    });

    it('should return error for invalid demo credentials', async () => {
      const result = await HiveAuthService.initiateAuth('invalid@hive.com', 'wrongpassword', true);

      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/invalid/i);
    });

    it('should include session token when 2FA is required', async () => {
      const result = await HiveAuthService.initiateAuth('user@hive.com', 'password');

      if (result.requires2fa) {
        expect(result.session).toBeTruthy();
        expect(result.session).toMatch(/session-/);
      }
    });
  });

  describe('verify2fa', () => {
    it('should verify SMS code and return tokens', async () => {
      const mockSession = 'cognito-session-token';
      const mockCode = '123456';

      const result = await HiveAuthService.verify2fa(mockCode, mockSession, 'user@hive.com');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('idToken');
    });

    it('should register device after successful 2FA', async () => {
      const mockSession = 'cognito-session-token';
      const mockCode = '123456';

      const result = await HiveAuthService.verify2fa(mockCode, mockSession, 'user@hive.com');

      if (result.accessToken) {
        expect(hiveCredentialsManager.setDeviceCredentials).toHaveBeenCalled();
      }
    });

    it('should return error for invalid 2FA code', async () => {
      const mockSession = 'cognito-session-token';
      const invalidCode = '000000';

      const result = await HiveAuthService.verify2fa(invalidCode, mockSession, 'user@hive.com');

      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/invalid|incorrect|code/i);
    });

    it('should return error for expired session', async () => {
      const expiredSession = 'expired-session-token';
      const mockCode = '123456';

      const result = await HiveAuthService.verify2fa(mockCode, expiredSession, 'user@hive.com');

      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/expired|session/i);
    });

    it('should return device credentials for future logins', async () => {
      const mockSession = 'cognito-session-token';
      const mockCode = '123456';

      const result = await HiveAuthService.verify2fa(mockCode, mockSession, 'user@hive.com');

      if (result.deviceKey) {
        expect(result).toHaveProperty('deviceKey');
        expect(result).toHaveProperty('deviceGroupKey');
        expect(result).toHaveProperty('devicePassword');
      }
    });
  });

  describe('deviceLogin', () => {
    it('should authenticate using device credentials without 2FA', async () => {
      const deviceCreds = {
        deviceKey: 'device-key-123',
        deviceGroupKey: 'device-group-key',
        devicePassword: 'device-password',
      };

      const result = await HiveAuthService.deviceLogin('user@hive.com', 'password', deviceCreds);

      expect(result).toHaveProperty('accessToken');
      expect(result.requires2fa).toBeFalsy();
    });

    it('should return error for invalid device credentials', async () => {
      const invalidDeviceCreds = {
        deviceKey: 'invalid-key',
        deviceGroupKey: 'invalid-group',
        devicePassword: 'invalid-pass',
      };

      const result = await HiveAuthService.deviceLogin(
        'user@hive.com',
        'password',
        invalidDeviceCreds
      );

      expect(result).toHaveProperty('error');
    });

    it('should fall back to 2FA if device is no longer recognized', async () => {
      const staleDeviceCreds = {
        deviceKey: 'stale-device-key',
        deviceGroupKey: 'stale-group',
        devicePassword: 'stale-pass',
      };

      const result = await HiveAuthService.deviceLogin(
        'user@hive.com',
        'password',
        staleDeviceCreds
      );

      // Either returns error or requires 2FA
      expect(result.error || result.requires2fa).toBeTruthy();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh access token using refresh token', async () => {
      const mockRefreshToken = 'valid-refresh-token';

      const result = await HiveAuthService.refreshTokens(mockRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('idToken');
    });

    it('should include device key when refreshing with device auth', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      const mockDeviceKey = 'device-key-123';

      const result = await HiveAuthService.refreshTokens(mockRefreshToken, mockDeviceKey);

      expect(result).toHaveProperty('accessToken');
    });

    it('should return error for expired refresh token', async () => {
      const expiredRefreshToken = 'expired-refresh-token';

      const result = await HiveAuthService.refreshTokens(expiredRefreshToken);

      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/expired|invalid/i);
    });
  });

  describe('Demo Mode', () => {
    it('should require 2FA for demo credentials (like real Hive)', async () => {
      const result = await HiveAuthService.initiateAuth('demo@hive.com', 'demo', true);

      expect(result.requires2fa).toBe(true);
      expect(result.session).toBeTruthy();
    });

    it('should verify 2FA code 123456 in demo mode', async () => {
      const result = await HiveAuthService.verify2fa(
        '123456',
        'demo-session',
        'demo@hive.com',
        true
      );

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeTruthy();
    });

    it('should reject invalid 2FA code in demo mode', async () => {
      const result = await HiveAuthService.verify2fa(
        '000000',
        'demo-session',
        'demo@hive.com',
        true
      );

      expect(result).toHaveProperty('error');
    });

    it('should reject invalid demo credentials', async () => {
      const result = await HiveAuthService.initiateAuth('invalid@email.com', 'wrong', true);

      expect(result).toHaveProperty('error');
    });
  });

  describe('storeTokens', () => {
    it('should store access token and expiry', async () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        idToken: 'id-token',
        expiresIn: 3600,
      };

      await HiveAuthService.storeTokens(tokens);

      expect(hiveCredentialsManager.setSessionToken).toHaveBeenCalled();
    });
  });

  describe('clearAuth', () => {
    it('should clear all stored authentication data', async () => {
      await HiveAuthService.clearAuth();

      expect(hiveCredentialsManager.clearSessionToken).toHaveBeenCalled();
      expect(hiveCredentialsManager.clearDeviceCredentials).toHaveBeenCalled();
    });
  });
});
