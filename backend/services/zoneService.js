import {
  buildDeviceToLightsMap,
  getLightsFromChildren,
  calculateLightStats,
  getScenesForGroup
} from '../utils/hierarchyUtils.js';

/**
 * ZoneService - Zone hierarchy building and statistics
 * Handles zone data processing (zones are custom light groupings that can span rooms)
 */
class ZoneService {
  /**
   * Build zone hierarchy mapping zone names to their lights
   * @param {Object} lightsData - Lights data from Hue API
   * @param {Object} zonesData - Zones data from Hue API
   * @param {Object} devicesData - Devices data from Hue API
   * @returns {Object|null} Zone map or null if data is missing
   */
  buildZoneHierarchy(lightsData, zonesData, devicesData) {
    if (!lightsData?.data || !zonesData?.data) return null;

    // Create light lookup map
    const lightMap = new Map();
    lightsData.data.forEach(light => {
      lightMap.set(light.id, light);
    });

    // Build device → lights map using shared utility
    const deviceToLights = buildDeviceToLightsMap(devicesData);

    const zoneMap = {};

    // Process each zone
    zonesData.data.forEach(zone => {
      const zoneName = zone.metadata?.name || 'Unknown Zone';

      // Get lights from zone's children using shared utility
      const lightUuids = getLightsFromChildren(zone.children, deviceToLights);

      // Deduplicate and filter existing lights
      const uniqueLightUuids = [...new Set(lightUuids)];
      const lights = uniqueLightUuids
        .map(uuid => lightMap.get(uuid))
        .filter(Boolean);

      if (uniqueLightUuids.length > 0) {
        zoneMap[zoneName] = {
          zoneUuid: zone.id,
          lightUuids: uniqueLightUuids,
          lights
        };
      }
    });

    return zoneMap;
  }

  /**
   * Calculate statistics for a zone's lights
   * @param {Array} lights - Array of light objects
   * @returns {Object} Stats object with lightsOnCount, totalLights, averageBrightness
   */
  calculateZoneStats(lights) {
    const stats = calculateLightStats(lights);
    // Zone stats round the average brightness
    return {
      ...stats,
      averageBrightness: Math.round(stats.averageBrightness)
    };
  }

  /**
   * Get scenes for a specific zone
   * @param {Object} scenesData - Scenes data from Hue API
   * @param {string} zoneUuid - Zone UUID to filter by
   * @returns {Array} Array of scene objects for the zone
   */
  getScenesForZone(scenesData, zoneUuid) {
    return getScenesForGroup(scenesData, zoneUuid, 'zone');
  }
}

// Export singleton instance
export default new ZoneService();
