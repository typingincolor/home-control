import { describe, it, expect } from 'vitest';
import {
  buildDeviceToLightsMap,
  getLightsFromChildren,
  calculateLightStats,
  getScenesForGroup
} from '../../utils/hierarchyUtils.js';

describe('hierarchyUtils', () => {
  describe('buildDeviceToLightsMap', () => {
    it('should build device to lights mapping', () => {
      const devicesData = {
        data: [
          { id: 'device-1', services: [{ rid: 'light-1', rtype: 'light' }, { rid: 'light-2', rtype: 'light' }] },
          { id: 'device-2', services: [{ rid: 'light-3', rtype: 'light' }] }
        ]
      };

      const result = buildDeviceToLightsMap(devicesData);

      expect(result['device-1']).toEqual(['light-1', 'light-2']);
      expect(result['device-2']).toEqual(['light-3']);
    });

    it('should filter out non-light services', () => {
      const devicesData = {
        data: [
          { id: 'device-1', services: [
            { rid: 'light-1', rtype: 'light' },
            { rid: 'button-1', rtype: 'button' },
            { rid: 'sensor-1', rtype: 'motion' }
          ]}
        ]
      };

      const result = buildDeviceToLightsMap(devicesData);

      expect(result['device-1']).toEqual(['light-1']);
    });

    it('should return empty object when devicesData is null', () => {
      expect(buildDeviceToLightsMap(null)).toEqual({});
    });

    it('should return empty object when devicesData.data is missing', () => {
      expect(buildDeviceToLightsMap({})).toEqual({});
    });

    it('should handle devices without services', () => {
      const devicesData = {
        data: [{ id: 'device-1' }]
      };

      const result = buildDeviceToLightsMap(devicesData);

      expect(result['device-1']).toEqual([]);
    });
  });

  describe('getLightsFromChildren', () => {
    const deviceToLights = {
      'device-1': ['light-1', 'light-2'],
      'device-2': ['light-3']
    };

    it('should get lights from device children', () => {
      const children = [
        { rid: 'device-1', rtype: 'device' }
      ];

      const result = getLightsFromChildren(children, deviceToLights);

      expect(result).toEqual(['light-1', 'light-2']);
    });

    it('should get lights from multiple devices', () => {
      const children = [
        { rid: 'device-1', rtype: 'device' },
        { rid: 'device-2', rtype: 'device' }
      ];

      const result = getLightsFromChildren(children, deviceToLights);

      expect(result).toEqual(['light-1', 'light-2', 'light-3']);
    });

    it('should handle direct light references', () => {
      const children = [
        { rid: 'light-4', rtype: 'light' }
      ];

      const result = getLightsFromChildren(children, deviceToLights);

      expect(result).toEqual(['light-4']);
    });

    it('should handle mixed device and light children', () => {
      const children = [
        { rid: 'device-1', rtype: 'device' },
        { rid: 'light-4', rtype: 'light' }
      ];

      const result = getLightsFromChildren(children, deviceToLights);

      expect(result).toEqual(['light-1', 'light-2', 'light-4']);
    });

    it('should return empty array when children is null', () => {
      expect(getLightsFromChildren(null, deviceToLights)).toEqual([]);
    });

    it('should return empty array when children is empty', () => {
      expect(getLightsFromChildren([], deviceToLights)).toEqual([]);
    });

    it('should handle unknown device references', () => {
      const children = [
        { rid: 'unknown-device', rtype: 'device' }
      ];

      const result = getLightsFromChildren(children, deviceToLights);

      expect(result).toEqual([]);
    });
  });

  describe('calculateLightStats', () => {
    it('should calculate stats for lights that are on', () => {
      const lights = [
        { on: { on: true }, dimming: { brightness: 80 } },
        { on: { on: true }, dimming: { brightness: 60 } },
        { on: { on: false }, dimming: { brightness: 0 } }
      ];

      const result = calculateLightStats(lights);

      expect(result.lightsOnCount).toBe(2);
      expect(result.totalLights).toBe(3);
      expect(result.averageBrightness).toBe(70);
    });

    it('should return zeros for empty array', () => {
      const result = calculateLightStats([]);

      expect(result).toEqual({
        lightsOnCount: 0,
        totalLights: 0,
        averageBrightness: 0
      });
    });

    it('should return zeros for null', () => {
      const result = calculateLightStats(null);

      expect(result).toEqual({
        lightsOnCount: 0,
        totalLights: 0,
        averageBrightness: 0
      });
    });

    it('should use 50% fallback when brightness is missing', () => {
      const lights = [
        { on: { on: true } }, // missing dimming
        { on: { on: true }, dimming: { brightness: 100 } }
      ];

      const result = calculateLightStats(lights);

      expect(result.averageBrightness).toBe(75); // (50 + 100) / 2
    });

    it('should return 0 average when all lights are off', () => {
      const lights = [
        { on: { on: false }, dimming: { brightness: 50 } },
        { on: { on: false }, dimming: { brightness: 80 } }
      ];

      const result = calculateLightStats(lights);

      expect(result.lightsOnCount).toBe(0);
      expect(result.averageBrightness).toBe(0);
    });
  });

  describe('getScenesForGroup', () => {
    const scenesData = {
      data: [
        { id: 'scene-1', group: { rid: 'room-1', rtype: 'room' }, metadata: { name: 'Bright' } },
        { id: 'scene-2', group: { rid: 'room-1', rtype: 'room' }, metadata: { name: 'Dim' } },
        { id: 'scene-3', group: { rid: 'room-2', rtype: 'room' }, metadata: { name: 'Relax' } },
        { id: 'scene-4', group: { rid: 'zone-1', rtype: 'zone' }, metadata: { name: 'Party' } }
      ]
    };

    it('should filter scenes by group UUID', () => {
      const result = getScenesForGroup(scenesData, 'room-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Bright');
      expect(result[1].name).toBe('Dim');
    });

    it('should filter scenes by group UUID and type', () => {
      const result = getScenesForGroup(scenesData, 'zone-1', 'zone');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Party');
    });

    it('should return empty array when no scenes match', () => {
      const result = getScenesForGroup(scenesData, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should sort scenes alphabetically', () => {
      const unsortedScenes = {
        data: [
          { id: 'scene-1', group: { rid: 'room-1' }, metadata: { name: 'Zebra' } },
          { id: 'scene-2', group: { rid: 'room-1' }, metadata: { name: 'Apple' } },
          { id: 'scene-3', group: { rid: 'room-1' }, metadata: { name: 'Mango' } }
        ]
      };

      const result = getScenesForGroup(unsortedScenes, 'room-1');

      expect(result[0].name).toBe('Apple');
      expect(result[1].name).toBe('Mango');
      expect(result[2].name).toBe('Zebra');
    });

    it('should return empty array when scenesData is null', () => {
      expect(getScenesForGroup(null, 'room-1')).toEqual([]);
    });

    it('should return empty array when scenesData.data is missing', () => {
      expect(getScenesForGroup({}, 'room-1')).toEqual([]);
    });

    it('should handle scenes without metadata', () => {
      const scenesWithoutMetadata = {
        data: [
          { id: 'scene-1', group: { rid: 'room-1' } }
        ]
      };

      const result = getScenesForGroup(scenesWithoutMetadata, 'room-1');

      expect(result[0].name).toBe('Unknown Scene');
    });
  });
});
