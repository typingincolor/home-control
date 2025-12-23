/**
 * State Conversion Utilities
 * Converts simplified state objects to Hue API v2 format
 */

/**
 * Convert simplified state to Hue API v2 format
 * @param {Object} state - Simplified state { on?: boolean, brightness?: number }
 * @returns {Object} Hue API v2 state { on?: { on: boolean }, dimming?: { brightness: number } }
 */
export function convertToHueState(state) {
  if (!state) {
    return {};
  }

  const hueState = {};

  if (typeof state.on !== 'undefined') {
    hueState.on = { on: state.on };
  }

  if (typeof state.brightness !== 'undefined') {
    hueState.dimming = { brightness: state.brightness };
  }

  return hueState;
}
