import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { load } from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Application Configuration', () => {
  const configPath = resolve(__dirname, '../../config.yaml');

  it('should have config.yaml file', () => {
    expect(existsSync(configPath)).toBe(true);
  });

  it('should have valid server configuration', () => {
    const config = load(readFileSync(configPath, 'utf-8'));

    // Server configuration - test structure and valid types
    expect(config.server).toBeDefined();
    expect(typeof config.server.port).toBe('number');
    expect(config.server.port).toBeGreaterThan(0);
    expect(config.server.port).toBeLessThan(65536);
    expect(typeof config.server.host).toBe('string');
    expect(config.server.host.length).toBeGreaterThan(0);
    expect(typeof config.server.corsEnabled).toBe('boolean');
  });

  it('should have valid Hue configuration', () => {
    const config = load(readFileSync(configPath, 'utf-8'));

    // Hue configuration - test structure
    expect(config.hue).toBeDefined();
    expect(typeof config.hue.discoveryEndpoint).toBe('string');
    expect(config.hue.discoveryEndpoint).toMatch(/^https?:\/\//);
  });

  it('should have valid development configuration', () => {
    const config = load(readFileSync(configPath, 'utf-8'));

    // Development configuration - test valid port numbers
    expect(config.development).toBeDefined();
    expect(typeof config.development.frontendPort).toBe('number');
    expect(config.development.frontendPort).toBeGreaterThan(0);
    expect(config.development.frontendPort).toBeLessThan(65536);
    expect(typeof config.development.backendPort).toBe('number');
    expect(config.development.backendPort).toBeGreaterThan(0);
    expect(config.development.backendPort).toBeLessThan(65536);
  });

  it('should have different ports for frontend and backend in development', () => {
    const config = load(readFileSync(configPath, 'utf-8'));

    // Ensure ports don't conflict
    expect(config.development.frontendPort).not.toBe(config.development.backendPort);
  });
});
