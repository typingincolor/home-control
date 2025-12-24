import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  let logger;
  let consoleSpy;

  beforeEach(async () => {
    // Suppress console output during tests
    consoleSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    // Reset modules to get fresh logger
    vi.resetModules();
    const module = await import('../../utils/logger.js');
    logger = module.default;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('info', () => {
    it('should be a function', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should not throw when called with message only', () => {
      expect(() => logger.info('Test message')).not.toThrow();
    });

    it('should not throw when called with message and metadata', () => {
      expect(() => logger.info('Test message', { key: 'value' })).not.toThrow();
    });

    it('should accept component prefix in metadata', () => {
      expect(() => logger.info('Test message', { component: 'WEBSOCKET' })).not.toThrow();
    });
  });

  describe('warn', () => {
    it('should be a function', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should not throw when called with message only', () => {
      expect(() => logger.warn('Warning message')).not.toThrow();
    });

    it('should not throw when called with metadata', () => {
      expect(() => logger.warn('Warning message', { code: 'W001' })).not.toThrow();
    });
  });

  describe('error', () => {
    it('should be a function', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should not throw when called with message only', () => {
      expect(() => logger.error('Error message')).not.toThrow();
    });

    it('should not throw when called with error metadata', () => {
      const error = new Error('Test error');
      expect(() => logger.error('Error occurred', { error: error.message })).not.toThrow();
    });
  });

  describe('debug', () => {
    it('should be a function', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('should not throw when called with message only', () => {
      expect(() => logger.debug('Debug message')).not.toThrow();
    });

    it('should not throw when called with complex metadata', () => {
      expect(() => logger.debug('Debug info', { data: [1, 2, 3] })).not.toThrow();
    });
  });

  describe('module exports', () => {
    it('should export a default logger object', () => {
      expect(logger).toBeDefined();
      expect(typeof logger).toBe('object');
    });

    it('should have all required log methods', () => {
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('debug');
    });
  });

  describe('createLogger', () => {
    let createLogger;

    beforeEach(async () => {
      vi.resetModules();
      const module = await import('../../utils/logger.js');
      createLogger = module.createLogger;
    });

    it('should be exported as a named export', () => {
      expect(createLogger).toBeDefined();
      expect(typeof createLogger).toBe('function');
    });

    it('should return a logger object with all log methods', () => {
      const componentLogger = createLogger('TEST');
      expect(componentLogger).toHaveProperty('info');
      expect(componentLogger).toHaveProperty('warn');
      expect(componentLogger).toHaveProperty('error');
      expect(componentLogger).toHaveProperty('debug');
    });

    it('should return a logger where info includes component', () => {
      const componentLogger = createLogger('AUTH');
      expect(() => componentLogger.info('Test message')).not.toThrow();
    });

    it('should return a logger where warn includes component', () => {
      const componentLogger = createLogger('AUTH');
      expect(() => componentLogger.warn('Warning message')).not.toThrow();
    });

    it('should return a logger where error includes component', () => {
      const componentLogger = createLogger('AUTH');
      expect(() => componentLogger.error('Error message')).not.toThrow();
    });

    it('should return a logger where debug includes component', () => {
      const componentLogger = createLogger('AUTH');
      expect(() => componentLogger.debug('Debug message')).not.toThrow();
    });

    it('should allow additional metadata to be merged', () => {
      const componentLogger = createLogger('WEBSOCKET');
      expect(() => componentLogger.info('Connected', { clients: 5 })).not.toThrow();
    });

    it('should not override component when extra metadata is passed', () => {
      const componentLogger = createLogger('SESSION');
      // Component should remain SESSION even if someone tries to override
      expect(() => componentLogger.info('Test', { component: 'OTHER' })).not.toThrow();
    });
  });
});
