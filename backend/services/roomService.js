import {
  buildDeviceToLightsMap,
  getLightsFromChildren,
  calculateLightStats,
  getScenesForGroup
} from '../utils/hierarchyUtils.js';

/**
 * RoomService - Room hierarchy and statistics
 * Handles room organization, scene filtering, and statistics calculation
 */
class RoomService {
  /**
   * Build room → device → lights hierarchy
   * @param {Object} lightsData - Lights data object with data array
   * @param {Object} roomsData - Rooms data object with data array
   * @param {Object} devicesData - Devices data object with data array
   * @returns {Object} Room map with light assignments
   */
  buildRoomHierarchy(lightsData, roomsData, devicesData) {
    if (!lightsData?.data || !roomsData?.data || !devicesData?.data) return null;

    // Helper to get light by UUID
    const getLightByUuid = uuid => {
      return lightsData.data.find(light => light.id === uuid);
    };

    // Build device → lights map using shared utility
    const deviceToLights = buildDeviceToLightsMap(devicesData);

    const roomMap = {};

    // Build rooms with their lights
    roomsData.data.forEach(room => {
      // Get lights from room's children using shared utility
      const lightUuids = getLightsFromChildren(room.children, deviceToLights);

      if (lightUuids.length > 0) {
        roomMap[room.metadata?.name || 'Unknown Room'] = {
          roomUuid: room.id,
          lightUuids: [...new Set(lightUuids)], // Deduplicate
          lights: lightUuids.map(uuid => getLightByUuid(uuid)).filter(Boolean)
        };
      }
    });

    // Add unassigned lights
    const assignedLightUuids = new Set(Object.values(roomMap).flatMap(r => r.lightUuids));
    const unassignedLights = lightsData.data.filter(light => !assignedLightUuids.has(light.id));

    if (unassignedLights.length > 0) {
      roomMap['Unassigned'] = {
        roomUuid: null,
        lightUuids: unassignedLights.map(l => l.id),
        lights: unassignedLights
      };
    }

    return roomMap;
  }

  /**
   * Get scenes for a specific room UUID
   * @param {Object} scenesData - Scenes data object with data array
   * @param {string} roomUuid - Room UUID
   * @returns {Array} Array of scene objects with id and name
   */
  getScenesForRoom(scenesData, roomUuid) {
    return getScenesForGroup(scenesData, roomUuid);
  }

  /**
   * Calculate room statistics (lights on/off, average brightness)
   * @param {Array} roomLights - Array of light objects
   * @returns {Object} Stats object with lightsOnCount, totalLights, averageBrightness
   */
  calculateRoomStats(roomLights) {
    return calculateLightStats(roomLights);
  }

  /**
   * Find unassigned lights (lights not in any room)
   * @param {Object} lightsData - Lights data object
   * @param {Object} roomMap - Room map from buildRoomHierarchy
   * @returns {Array} Array of unassigned lights
   */
  findUnassignedLights(lightsData, roomMap) {
    if (!lightsData?.data || !roomMap) return [];

    const assignedLightUuids = new Set(
      Object.values(roomMap)
        .filter(room => room.roomUuid !== null) // Exclude already-created Unassigned room
        .flatMap(r => r.lightUuids)
    );

    return lightsData.data.filter(light => !assignedLightUuids.has(light.id));
  }
}

// Export singleton instance
export default new RoomService();
