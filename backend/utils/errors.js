import { ERROR_CODES, ERROR_MESSAGES, ERROR_SUGGESTIONS } from '../constants/errorMessages.js';

/**
 * Custom error classes for client-friendly error messages
 */

export class ApiError extends Error {
  constructor(code, message, suggestion = null, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.suggestion = suggestion;
    this.statusCode = statusCode;
  }
}

// Authentication errors
export class AuthenticationError extends ApiError {
  constructor(message, suggestion = ERROR_SUGGESTIONS.CHECK_CREDENTIALS) {
    super(ERROR_CODES.AUTHENTICATION_ERROR, message, suggestion, 401);
  }
}

export class MissingCredentialsError extends ApiError {
  constructor(missing) {
    super(
      ERROR_CODES.MISSING_CREDENTIALS,
      `Missing required parameter: ${missing}`,
      ERROR_SUGGESTIONS.MISSING_PARAM(missing),
      400
    );
  }
}

// Bridge connection errors
export class BridgeConnectionError extends ApiError {
  constructor(bridgeIp, originalError) {
    const message = ERROR_MESSAGES.BRIDGE_CONNECTION(bridgeIp);
    let suggestion = ERROR_SUGGESTIONS.BRIDGE_POWERED_ON;

    if (originalError?.code === 'ETIMEDOUT') {
      suggestion = ERROR_SUGGESTIONS.BRIDGE_TIMEOUT;
    } else if (originalError?.code === 'ECONNREFUSED') {
      suggestion = ERROR_SUGGESTIONS.BRIDGE_REFUSED;
    }

    super(ERROR_CODES.BRIDGE_CONNECTION_ERROR, message, suggestion, 503);
  }
}

// Resource errors
export class ResourceNotFoundError extends ApiError {
  constructor(resourceType, resourceId) {
    super(
      ERROR_CODES.RESOURCE_NOT_FOUND,
      `The ${resourceType} '${resourceId}' was not found`,
      ERROR_SUGGESTIONS.CHECK_RESOURCE(resourceType),
      404
    );
  }
}

export class InvalidResourceError extends ApiError {
  constructor(resourceType, reason) {
    super(
      ERROR_CODES.INVALID_RESOURCE,
      `Invalid ${resourceType}: ${reason}`,
      ERROR_SUGGESTIONS.CHECK_RESOURCE_FORMAT(resourceType),
      400
    );
  }
}

// Data processing errors
export class DataProcessingError extends ApiError {
  constructor(operation, originalError) {
    super(
      ERROR_CODES.DATA_PROCESSING_ERROR,
      `Failed to ${operation}`,
      ERROR_SUGGESTIONS.TRY_AGAIN,
      500
    );
    this.originalError = originalError?.message;
  }
}

// Session errors
export class InvalidSessionError extends ApiError {
  constructor() {
    super(
      ERROR_CODES.INVALID_SESSION,
      ERROR_MESSAGES.SESSION_EXPIRED,
      ERROR_SUGGESTIONS.AUTHENTICATE_AGAIN,
      401
    );
  }
}

export class SessionNotFoundError extends ApiError {
  constructor() {
    super(
      ERROR_CODES.SESSION_NOT_FOUND,
      ERROR_MESSAGES.SESSION_NOT_FOUND,
      ERROR_SUGGESTIONS.CREATE_SESSION,
      401
    );
  }
}

// Validation errors
export class ValidationError extends ApiError {
  constructor(field, reason) {
    super(
      ERROR_CODES.VALIDATION_ERROR,
      `Invalid ${field}: ${reason}`,
      `Check the ${field} format and try again`,
      400
    );
  }
}

// Rate limiting
export class RateLimitError extends ApiError {
  constructor(retryAfter = 60) {
    super(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      ERROR_MESSAGES.RATE_LIMIT,
      ERROR_SUGGESTIONS.RATE_LIMIT(retryAfter),
      429
    );
    this.retryAfter = retryAfter;
  }
}

/**
 * Convert any error to a standardized API error response
 */
export function toApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  // Bridge connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    // Try to extract bridge IP from error message
    const bridgeIpMatch = error.message.match(/(\d+\.\d+\.\d+\.\d+)/);
    const bridgeIp = bridgeIpMatch ? bridgeIpMatch[1] : 'unknown';
    return new BridgeConnectionError(bridgeIp, error);
  }

  // Hue API errors
  if (error.message?.includes('Bridge returned')) {
    return new AuthenticationError(
      ERROR_MESSAGES.UNABLE_TO_COMMUNICATE,
      ERROR_SUGGESTIONS.CHECK_API_KEY
    );
  }

  if (error.message?.includes('Hue API error')) {
    return new DataProcessingError('communicate with the bridge', error);
  }

  // Generic errors
  return new ApiError(
    ERROR_CODES.INTERNAL_ERROR,
    ERROR_MESSAGES.INTERNAL_ERROR,
    ERROR_SUGGESTIONS.CONTACT_SUPPORT,
    500
  );
}
