import { describe, it, expect } from 'vitest';
import {
  ApiError,
  AuthenticationError,
  MissingCredentialsError,
  BridgeConnectionError,
  ResourceNotFoundError,
  InvalidResourceError,
  DataProcessingError,
  InvalidSessionError,
  SessionNotFoundError,
  ValidationError,
  RateLimitError,
  toApiError
} from '../../utils/errors.js';
import { ERROR_CODES, ERROR_MESSAGES, ERROR_SUGGESTIONS } from '../../constants/errorMessages.js';

describe('errors', () => {
  describe('ApiError', () => {
    it('should create error with all properties', () => {
      const error = new ApiError('test_code', 'Test message', 'Test suggestion', 400);

      expect(error.code).toBe('test_code');
      expect(error.message).toBe('Test message');
      expect(error.suggestion).toBe('Test suggestion');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ApiError');
    });

    it('should default to 500 status code', () => {
      const error = new ApiError('test', 'Test');
      expect(error.statusCode).toBe(500);
    });

    it('should be an instance of Error', () => {
      const error = new ApiError('test', 'Test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('AuthenticationError', () => {
    it('should use authentication_error code', () => {
      const error = new AuthenticationError('Invalid credentials');

      expect(error.code).toBe(ERROR_CODES.AUTHENTICATION_ERROR);
      expect(error.statusCode).toBe(401);
    });

    it('should use default suggestion', () => {
      const error = new AuthenticationError('Test');
      expect(error.suggestion).toBe(ERROR_SUGGESTIONS.CHECK_CREDENTIALS);
    });

    it('should allow custom suggestion', () => {
      const error = new AuthenticationError('Test', 'Custom suggestion');
      expect(error.suggestion).toBe('Custom suggestion');
    });
  });

  describe('MissingCredentialsError', () => {
    it('should use missing_credentials code', () => {
      const error = new MissingCredentialsError('bridgeIp');

      expect(error.code).toBe(ERROR_CODES.MISSING_CREDENTIALS);
      expect(error.statusCode).toBe(400);
    });

    it('should include missing parameter in message', () => {
      const error = new MissingCredentialsError('username');
      expect(error.message).toContain('username');
    });

    it('should include parameter in suggestion', () => {
      const error = new MissingCredentialsError('bridgeIp');
      expect(error.suggestion).toContain('bridgeIp');
    });
  });

  describe('BridgeConnectionError', () => {
    it('should use bridge_connection_error code', () => {
      const error = new BridgeConnectionError('192.168.1.100');

      expect(error.code).toBe(ERROR_CODES.BRIDGE_CONNECTION_ERROR);
      expect(error.statusCode).toBe(503);
    });

    it('should include bridge IP in message', () => {
      const error = new BridgeConnectionError('192.168.1.100');
      expect(error.message).toContain('192.168.1.100');
    });

    it('should use timeout suggestion for ETIMEDOUT', () => {
      const error = new BridgeConnectionError('192.168.1.100', { code: 'ETIMEDOUT' });
      expect(error.suggestion).toBe(ERROR_SUGGESTIONS.BRIDGE_TIMEOUT);
    });

    it('should use refused suggestion for ECONNREFUSED', () => {
      const error = new BridgeConnectionError('192.168.1.100', { code: 'ECONNREFUSED' });
      expect(error.suggestion).toBe(ERROR_SUGGESTIONS.BRIDGE_REFUSED);
    });

    it('should use default suggestion for other errors', () => {
      const error = new BridgeConnectionError('192.168.1.100');
      expect(error.suggestion).toBe(ERROR_SUGGESTIONS.BRIDGE_POWERED_ON);
    });
  });

  describe('ResourceNotFoundError', () => {
    it('should use resource_not_found code', () => {
      const error = new ResourceNotFoundError('light', 'abc-123');

      expect(error.code).toBe(ERROR_CODES.RESOURCE_NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });

    it('should include resource type and id in message', () => {
      const error = new ResourceNotFoundError('scene', 'xyz-789');
      expect(error.message).toContain('scene');
      expect(error.message).toContain('xyz-789');
    });
  });

  describe('InvalidResourceError', () => {
    it('should use invalid_resource code', () => {
      const error = new InvalidResourceError('light', 'missing brightness');

      expect(error.code).toBe(ERROR_CODES.INVALID_RESOURCE);
      expect(error.statusCode).toBe(400);
    });

    it('should include reason in message', () => {
      const error = new InvalidResourceError('room', 'invalid format');
      expect(error.message).toContain('invalid format');
    });
  });

  describe('DataProcessingError', () => {
    it('should use data_processing_error code', () => {
      const error = new DataProcessingError('fetch lights');

      expect(error.code).toBe(ERROR_CODES.DATA_PROCESSING_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it('should include operation in message', () => {
      const error = new DataProcessingError('parse response');
      expect(error.message).toContain('parse response');
    });

    it('should store original error message', () => {
      const originalError = new Error('Network failed');
      const error = new DataProcessingError('fetch data', originalError);
      expect(error.originalError).toBe('Network failed');
    });
  });

  describe('InvalidSessionError', () => {
    it('should use invalid_session code', () => {
      const error = new InvalidSessionError();

      expect(error.code).toBe(ERROR_CODES.INVALID_SESSION);
      expect(error.statusCode).toBe(401);
    });

    it('should have session expired message', () => {
      const error = new InvalidSessionError();
      expect(error.message).toBe(ERROR_MESSAGES.SESSION_EXPIRED);
    });

    it('should suggest re-authentication', () => {
      const error = new InvalidSessionError();
      expect(error.suggestion).toBe(ERROR_SUGGESTIONS.AUTHENTICATE_AGAIN);
    });
  });

  describe('SessionNotFoundError', () => {
    it('should use session_not_found code', () => {
      const error = new SessionNotFoundError();

      expect(error.code).toBe(ERROR_CODES.SESSION_NOT_FOUND);
      expect(error.statusCode).toBe(401);
    });

    it('should have session not found message', () => {
      const error = new SessionNotFoundError();
      expect(error.message).toBe(ERROR_MESSAGES.SESSION_NOT_FOUND);
    });
  });

  describe('ValidationError', () => {
    it('should use validation_error code', () => {
      const error = new ValidationError('brightness', 'must be 0-100');

      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it('should include field and reason in message', () => {
      const error = new ValidationError('color', 'invalid hex format');
      expect(error.message).toContain('color');
      expect(error.message).toContain('invalid hex format');
    });
  });

  describe('RateLimitError', () => {
    it('should use rate_limit_exceeded code', () => {
      const error = new RateLimitError();

      expect(error.code).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(429);
    });

    it('should default to 60 seconds', () => {
      const error = new RateLimitError();
      expect(error.retryAfter).toBe(60);
    });

    it('should allow custom retry time', () => {
      const error = new RateLimitError(30);
      expect(error.retryAfter).toBe(30);
      expect(error.suggestion).toContain('30');
    });
  });

  describe('toApiError', () => {
    it('should return ApiError instances unchanged', () => {
      const original = new ApiError('test', 'Test message');
      const result = toApiError(original);
      expect(result).toBe(original);
    });

    it('should convert ECONNREFUSED to BridgeConnectionError', () => {
      const error = new Error('connect ECONNREFUSED 192.168.1.100:443');
      error.code = 'ECONNREFUSED';

      const result = toApiError(error);

      expect(result).toBeInstanceOf(BridgeConnectionError);
      expect(result.code).toBe(ERROR_CODES.BRIDGE_CONNECTION_ERROR);
    });

    it('should convert ETIMEDOUT to BridgeConnectionError', () => {
      const error = new Error('connect ETIMEDOUT 10.0.0.1:443');
      error.code = 'ETIMEDOUT';

      const result = toApiError(error);

      expect(result).toBeInstanceOf(BridgeConnectionError);
    });

    it('should convert "Bridge returned" errors to AuthenticationError', () => {
      const error = new Error('Bridge returned 403: unauthorized');

      const result = toApiError(error);

      expect(result).toBeInstanceOf(AuthenticationError);
    });

    it('should convert "Hue API error" to DataProcessingError', () => {
      const error = new Error('Hue API error: invalid parameter');

      const result = toApiError(error);

      expect(result).toBeInstanceOf(DataProcessingError);
    });

    it('should convert unknown errors to generic ApiError', () => {
      const error = new Error('Something unexpected');

      const result = toApiError(error);

      expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(result.statusCode).toBe(500);
    });

    it('should extract IP from error message', () => {
      const error = new Error('Failed to connect to 192.168.1.50');
      error.code = 'ECONNREFUSED';

      const result = toApiError(error);

      expect(result.message).toContain('192.168.1.50');
    });
  });
});
