/**
 * Hierarchy Utilities
 * Shared functions for building room/zone hierarchies and calculating statistics
 */

/**
 * Build a map from device IDs to their light IDs
 * @param {Object} devicesData - Devices data from Hue API
 * @returns {Object} Map of device ID to array of light IDs
 */
export function buildDeviceToLightsMap(devicesData) {
  if (!devicesData?.data) {
    return {};
  }

  const deviceToLights = {};

  devicesData.data.forEach(device => {
    const lightUuids = device.services
      ?.filter(s => s.rtype === 'light')
      .map(s => s.rid) || [];
    deviceToLights[device.id] = lightUuids;
  });

  return deviceToLights;
}

/**
 * Get light IDs from a list of children (devices or lights)
 * @param {Array} children - Array of child references
 * @param {Object} deviceToLights - Map of device ID to light IDs
 * @returns {Array} Array of light IDs
 */
export function getLightsFromChildren(children, deviceToLights) {
  if (!children || children.length === 0) {
    return [];
  }

  const lightUuids = [];

  children.forEach(child => {
    if (child.rtype === 'device') {
      const deviceLights = deviceToLights[child.rid] || [];
      lightUuids.push(...deviceLights);
    } else if (child.rtype === 'light') {
      lightUuids.push(child.rid);
    }
  });

  return lightUuids;
}

/**
 * Calculate statistics for a group of lights
 * @param {Array} lights - Array of light objects
 * @returns {Object} Stats object with lightsOnCount, totalLights, averageBrightness
 */
export function calculateLightStats(lights) {
  if (!lights || lights.length === 0) {
    return { lightsOnCount: 0, totalLights: 0, averageBrightness: 0 };
  }

  const lightsOn = lights.filter(light => light.on?.on);
  const lightsOnCount = lightsOn.length;
  const totalLights = lights.length;

  // Calculate average brightness of lights that are on
  const averageBrightness = lightsOnCount > 0
    ? lightsOn.reduce((sum, light) => {
        // Use 50% as default during scene transitions when brightness data is loading
        const brightness = light.dimming?.brightness ?? 50;
        return sum + brightness;
      }, 0) / lightsOnCount
    : 0;

  return { lightsOnCount, totalLights, averageBrightness };
}

/**
 * Get scenes for a specific group (room or zone)
 * @param {Object} scenesData - Scenes data from Hue API
 * @param {string} groupUuid - Group UUID to filter by
 * @param {string} [groupType] - Optional group type to match (e.g., 'zone')
 * @returns {Array} Array of scene objects with id and name
 */
export function getScenesForGroup(scenesData, groupUuid, groupType = null) {
  if (!scenesData?.data) {
    return [];
  }

  return scenesData.data
    .filter(scene => {
      const matchesId = scene.group?.rid === groupUuid;
      const matchesType = groupType ? scene.group?.rtype === groupType : true;
      return matchesId && matchesType;
    })
    .map(scene => ({
      id: scene.id,
      name: scene.metadata?.name || 'Unknown Scene'
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
