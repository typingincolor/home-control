import { describe, it, expect } from 'vitest';
import { convertToHueState } from '../../utils/stateConversion.js';

describe('stateConversion', () => {
  describe('convertToHueState', () => {
    it('should convert on state to Hue API v2 format', () => {
      const result = convertToHueState({ on: true });
      expect(result).toEqual({ on: { on: true } });
    });

    it('should convert off state to Hue API v2 format', () => {
      const result = convertToHueState({ on: false });
      expect(result).toEqual({ on: { on: false } });
    });

    it('should convert brightness to Hue API v2 format', () => {
      const result = convertToHueState({ brightness: 75 });
      expect(result).toEqual({ dimming: { brightness: 75 } });
    });

    it('should convert both on and brightness', () => {
      const result = convertToHueState({ on: true, brightness: 50 });
      expect(result).toEqual({
        on: { on: true },
        dimming: { brightness: 50 },
      });
    });

    it('should return empty object when state is empty', () => {
      const result = convertToHueState({});
      expect(result).toEqual({});
    });

    it('should return empty object when state is null', () => {
      const result = convertToHueState(null);
      expect(result).toEqual({});
    });

    it('should return empty object when state is undefined', () => {
      const result = convertToHueState(undefined);
      expect(result).toEqual({});
    });

    it('should ignore unknown properties', () => {
      const result = convertToHueState({ on: true, unknownProp: 'value' });
      expect(result).toEqual({ on: { on: true } });
      expect(result.unknownProp).toBeUndefined();
    });

    it('should handle brightness of 0', () => {
      const result = convertToHueState({ brightness: 0 });
      expect(result).toEqual({ dimming: { brightness: 0 } });
    });

    it('should handle brightness of 100', () => {
      const result = convertToHueState({ brightness: 100 });
      expect(result).toEqual({ dimming: { brightness: 100 } });
    });
  });
});
