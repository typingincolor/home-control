import { getHueClientForBridge } from './hueClientFactory.js';

/**
 * AutomationService - Automation and behavior instance handling
 * Handles fetching and parsing automation data (behavior_instances)
 */
class AutomationService {
  /**
   * Check if a behavior_instance is a motion-related behavior
   * @param {Object} behavior - Behavior instance object
   * @returns {boolean} True if motion-related
   */
  isMotionBehavior(behavior) {
    return behavior.configuration?.motion?.motion_service?.rtype === 'convenience_area_motion';
  }

  /**
   * Extract trigger time from behavior configuration
   * @param {Object} configuration - Behavior configuration object
   * @returns {Object|undefined} Time object with hour and minute, or undefined
   */
  extractTriggerTime(configuration) {
    const time = configuration?.when?.time_point?.time;
    if (time && typeof time.hour === 'number' && typeof time.minute === 'number') {
      return { hour: time.hour, minute: time.minute };
    }
    return undefined;
  }

  /**
   * Extract recurrence days from behavior configuration
   * @param {Object} configuration - Behavior configuration object
   * @returns {Array|undefined} Array of day strings or undefined
   */
  extractRecurrenceDays(configuration) {
    const days = configuration?.when?.recurrence_days;
    if (Array.isArray(days) && days.length > 0) {
      return days;
    }
    return undefined;
  }

  /**
   * Extract target info (rooms/lights) from behavior configuration
   * @param {Object} configuration - Behavior configuration object
   * @returns {Object|undefined} Target info with groupIds and lightIds
   */
  extractTargets(configuration) {
    const where = configuration?.where;
    if (!Array.isArray(where) || where.length === 0) return undefined;

    const groupIds = [];
    const lightIds = [];

    for (const target of where) {
      if (target.group?.rid) {
        groupIds.push({ id: target.group.rid, type: target.group.rtype });
      }
      if (Array.isArray(target.items)) {
        for (const item of target.items) {
          if (item.rtype === 'light') {
            lightIds.push(item.rid);
          }
        }
      }
    }

    return groupIds.length > 0 || lightIds.length > 0
      ? { groups: groupIds, lights: lightIds }
      : undefined;
  }

  /**
   * Extract style and transition info from behavior configuration
   * @param {Object} configuration - Behavior configuration object
   * @returns {Object|undefined} Style info
   */
  extractStyleInfo(configuration) {
    const style = configuration?.style;
    const fadeOutSeconds = configuration?.fade_out_duration?.seconds;
    const endState = configuration?.end_state;

    if (!style && !fadeOutSeconds && !endState) return undefined;

    return {
      style: style || undefined,
      fadeOutMinutes: fadeOutSeconds ? Math.round(fadeOutSeconds / 60) : undefined,
      endState: endState || undefined,
    };
  }

  /**
   * Parse behavior_instances into automation format
   * @param {Object} behaviorsData - Behaviors data object with data array
   * @returns {Array} Array of automation objects
   */
  parseAutomations(behaviorsData) {
    if (!behaviorsData?.data) return [];

    return behaviorsData.data
      .filter((behavior) => !this.isMotionBehavior(behavior))
      .map((behavior) => ({
        id: behavior.id,
        name: behavior.metadata?.name || 'Unknown Automation',
        type: 'behavior_instance',
        scriptId: behavior.script_id,
        enabled: behavior.enabled !== false,
        triggerTime: this.extractTriggerTime(behavior.configuration),
        recurrenceDays: this.extractRecurrenceDays(behavior.configuration),
        targets: this.extractTargets(behavior.configuration),
        styleInfo: this.extractStyleInfo(behavior.configuration),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Build lookup maps for rooms and lights
   * @param {Object} roomsData - Rooms data from API
   * @param {Object} lightsData - Lights data from API
   * @returns {Object} Maps of id -> name
   */
  buildNameMaps(roomsData, lightsData) {
    const roomNames = {};
    const lightNames = {};

    if (roomsData?.data) {
      for (const room of roomsData.data) {
        roomNames[room.id] = room.metadata?.name || 'Unknown Room';
      }
    }

    if (lightsData?.data) {
      for (const light of lightsData.data) {
        lightNames[light.id] = light.metadata?.name || 'Unknown Light';
      }
    }

    return { roomNames, lightNames };
  }

  /**
   * Enrich targets with names
   * @param {Object} targets - Targets object with groups and lights arrays
   * @param {Object} roomNames - Map of room id -> name
   * @param {Object} lightNames - Map of light id -> name
   * @returns {Object} Enriched targets with names
   */
  enrichTargets(targets, roomNames, lightNames) {
    if (!targets) return undefined;

    const enrichedGroups = targets.groups?.map((g) => ({
      ...g,
      name: roomNames[g.id] || 'Unknown',
    }));

    const enrichedLights = targets.lights?.map((id) => ({
      id,
      name: lightNames[id] || 'Unknown',
    }));

    return {
      groups: enrichedGroups || [],
      lights: enrichedLights || [],
    };
  }

  /**
   * Get all automations (fetches and parses data)
   * @param {string} bridgeIp - Bridge IP address
   * @param {string} username - Hue username
   * @returns {Object} Object with automations array
   */
  async getAutomations(bridgeIp, username) {
    try {
      const hueClient = getHueClientForBridge(bridgeIp);

      // Fetch behaviors, rooms, and lights in parallel
      const [behaviorsData, roomsData, lightsData] = await Promise.all([
        hueClient.getResource(bridgeIp, username, 'behavior_instance'),
        hueClient.getResource(bridgeIp, username, 'room'),
        hueClient.getResource(bridgeIp, username, 'light'),
      ]);

      // Build name lookup maps
      const { roomNames, lightNames } = this.buildNameMaps(roomsData, lightsData);

      // Parse automations and enrich with names
      const automations = this.parseAutomations(behaviorsData).map((automation) => ({
        ...automation,
        targets: this.enrichTargets(automation.targets, roomNames, lightNames),
      }));

      return { automations };
    } catch (error) {
      throw new Error(`Failed to get automations: ${error.message}`);
    }
  }

  /**
   * Get raw behavior_instance data for debugging
   * @param {string} bridgeIp - Bridge IP address
   * @param {string} username - Hue username
   * @returns {Object} Raw behavior_instance data from bridge
   */
  async getRawBehaviors(bridgeIp, username) {
    try {
      const hueClient = getHueClientForBridge(bridgeIp);
      const behaviorsData = await hueClient.getResource(bridgeIp, username, 'behavior_instance');

      // Filter out motion behaviors and return raw data
      const automationBehaviors = (behaviorsData?.data || []).filter(
        (behavior) => !this.isMotionBehavior(behavior)
      );

      return { raw: automationBehaviors };
    } catch (error) {
      throw new Error(`Failed to get raw behaviors: ${error.message}`);
    }
  }

  /**
   * Trigger an automation (smart scene)
   * @param {string} bridgeIp - Bridge IP address
   * @param {string} username - Hue username
   * @param {string} automationId - Automation ID to trigger
   * @returns {Object} Result of the trigger operation
   */
  async triggerAutomation(bridgeIp, username, automationId) {
    try {
      const hueClient = getHueClientForBridge(bridgeIp);

      const result = await hueClient.triggerSmartScene(bridgeIp, username, automationId);

      return result;
    } catch (error) {
      throw new Error(`Failed to trigger automation: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new AutomationService();
