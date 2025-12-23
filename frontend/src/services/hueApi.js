// Use relative URLs - works with Vite proxy in dev and same-origin in production
const PROXY_URL = '';

/**
 * Centralized request handler for Hue API calls
 * Handles HTTP errors, V2 API errors, and network errors consistently
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
const request = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // V2 API error handling
    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].description);
    }

    return data;
  } catch (error) {
    console.error(`[HueApi] Request failed:`, error);

    // Network error detection
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('Could not connect to proxy server. Make sure it is running.');
    }
    throw error;
  }
};

export const hueApi = {
  /**
   * Discover Hue bridges on the network
   * @returns {Promise<Array>} Array of bridge objects with id and internalipaddress
   */
  async discoverBridge() {
    try {
      const response = await fetch(`${PROXY_URL}/api/discovery`);
      if (!response.ok) throw new Error('Discovery failed');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Bridge discovery error:', error);
      throw new Error('Could not discover bridges. Please enter IP manually.');
    }
  },

  /**
   * Create a new user (requires link button press)
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} appName - The application name for device type
   * @returns {Promise<string>} The generated username
   */
  async createUser(bridgeIp, appName = 'hue_control_app') {
    const url = `${PROXY_URL}/api/v1/auth/pair`;
    return request(url, {
      method: 'POST',
      body: JSON.stringify({ bridgeIp, appName })
    }).then(data => data.username);
  },

  // ============================================================
  // V1 API Methods (Simplified, Pre-computed Data)
  // ============================================================

  /**
   * Create a session token (V1 API)
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @returns {Promise<Object>} Session info with token
   */
  async createSession(bridgeIp, username) {
    const url = `${PROXY_URL}/api/v1/auth/session`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bridgeIp, username })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create session');
    }

    return response.json();
  },

  /**
   * Get unified dashboard data (V1 API)
   * Returns pre-computed colors, shadows, room hierarchy, and statistics in a single call
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @returns {Promise<Object>} Dashboard data with summary and rooms
   */
  async getDashboard(bridgeIp, username) {
    const url = `${PROXY_URL}/api/v1/dashboard?bridgeIp=${bridgeIp}&username=${username}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch dashboard');
    }

    return response.json();
  },

  /**
   * Get motion zones (V1 API)
   * Returns parsed MotionAware zones with status
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @returns {Promise<Object>} Motion zones data
   */
  async getMotionZones(bridgeIp, username) {
    const url = `${PROXY_URL}/api/v1/motion-zones?bridgeIp=${bridgeIp}&username=${username}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch motion zones');
    }

    return response.json();
  },

  /**
   * Update a light (V1 API - simplified)
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @param {string} lightId - The light UUID
   * @param {Object} state - Simplified state { on: boolean, brightness: number }
   * @returns {Promise<Object>} Updated light with pre-computed color/shadow
   */
  async updateLight(bridgeIp, username, lightId, state) {
    const url = `${PROXY_URL}/api/v1/lights/${lightId}?bridgeIp=${bridgeIp}&username=${username}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update light');
    }

    return response.json();
  },

  /**
   * Update all lights in a room (V1 API)
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @param {string} roomId - The room UUID
   * @param {Object} state - Simplified state { on: boolean, brightness: number }
   * @returns {Promise<Object>} Updated lights with pre-computed colors/shadows
   */
  async updateRoomLights(bridgeIp, username, roomId, state) {
    const url = `${PROXY_URL}/api/v1/rooms/${roomId}/lights?bridgeIp=${bridgeIp}&username=${username}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update room lights');
    }

    return response.json();
  },

  /**
   * Activate a scene (V1 API)
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username
   * @param {string} sceneId - The scene UUID
   * @returns {Promise<Object>} Affected lights with pre-computed colors/shadows
   */
  async activateSceneV1(bridgeIp, username, sceneId) {
    const url = `${PROXY_URL}/api/v1/scenes/${sceneId}/activate?bridgeIp=${bridgeIp}&username=${username}`;
    const response = await fetch(url, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to activate scene');
    }

    return response.json();
  }
};
