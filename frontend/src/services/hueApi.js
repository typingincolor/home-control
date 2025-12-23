// Use relative URLs - works with Vite proxy in dev and same-origin in production
const PROXY_URL = '';

/**
 * Centralized request handler for Hue API calls
 * Handles HTTP errors, V2 API errors, and network errors consistently
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {string} sessionToken - Optional session token for Authorization header
 * @returns {Promise<Object>} Response data
 */
const request = async (url, options = {}, sessionToken = null) => {
  try {
    // Add session token to Authorization header if provided
    if (sessionToken) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${sessionToken}`
      };
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      // Check for session expiration (401 Unauthorized)
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
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
   * @param {string} sessionToken - Session token (preferred) OR bridgeIp (legacy)
   * @param {string} username - Username (only needed if using legacy auth)
   * @returns {Promise<Object>} Dashboard data with summary and rooms
   */
  async getDashboard(sessionToken, username = null) {
    // If sessionToken looks like an IP, it's legacy mode
    const isLegacyMode = sessionToken && sessionToken.includes('.');

    const url = isLegacyMode
      ? `${PROXY_URL}/api/v1/dashboard?bridgeIp=${sessionToken}&username=${username}`
      : `${PROXY_URL}/api/v1/dashboard`;

    return request(url, {}, isLegacyMode ? null : sessionToken);
  },

  /**
   * Get motion zones (V1 API)
   * Returns parsed MotionAware zones with status
   * @param {string} sessionToken - Session token (preferred) OR bridgeIp (legacy)
   * @param {string} username - Username (only needed if using legacy auth)
   * @returns {Promise<Object>} Motion zones data
   */
  async getMotionZones(sessionToken, username = null) {
    const isLegacyMode = sessionToken && sessionToken.includes('.');

    const url = isLegacyMode
      ? `${PROXY_URL}/api/v1/motion-zones?bridgeIp=${sessionToken}&username=${username}`
      : `${PROXY_URL}/api/v1/motion-zones`;

    return request(url, {}, isLegacyMode ? null : sessionToken);
  },

  /**
   * Update a light (V1 API - simplified)
   * @param {string} sessionToken - Session token (preferred) OR bridgeIp (legacy)
   * @param {string} username - Username (only needed if using legacy auth)
   * @param {string} lightId - The light UUID
   * @param {Object} state - Simplified state { on: boolean, brightness: number }
   * @returns {Promise<Object>} Updated light with pre-computed color/shadow
   */
  async updateLight(sessionToken, username, lightId, state) {
    const isLegacyMode = sessionToken && sessionToken.includes('.');

    const url = isLegacyMode
      ? `${PROXY_URL}/api/v1/lights/${lightId}?bridgeIp=${sessionToken}&username=${username}`
      : `${PROXY_URL}/api/v1/lights/${lightId}`;

    return request(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }, isLegacyMode ? null : sessionToken);
  },

  /**
   * Update all lights in a room (V1 API)
   * @param {string} sessionToken - Session token (preferred) OR bridgeIp (legacy)
   * @param {string} username - Username (only needed if using legacy auth)
   * @param {string} roomId - The room UUID
   * @param {Object} state - Simplified state { on: boolean, brightness: number }
   * @returns {Promise<Object>} Updated lights with pre-computed colors/shadows
   */
  async updateRoomLights(sessionToken, username, roomId, state) {
    const isLegacyMode = sessionToken && sessionToken.includes('.');

    const url = isLegacyMode
      ? `${PROXY_URL}/api/v1/rooms/${roomId}/lights?bridgeIp=${sessionToken}&username=${username}`
      : `${PROXY_URL}/api/v1/rooms/${roomId}/lights`;

    return request(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }, isLegacyMode ? null : sessionToken);
  },

  /**
   * Activate a scene (V1 API)
   * @param {string} sessionToken - Session token (preferred) OR bridgeIp (legacy)
   * @param {string} username - Username (only needed if using legacy auth)
   * @param {string} sceneId - The scene UUID
   * @returns {Promise<Object>} Affected lights with pre-computed colors/shadows
   */
  async activateSceneV1(sessionToken, username, sceneId) {
    const isLegacyMode = sessionToken && sessionToken.includes('.');

    const url = isLegacyMode
      ? `${PROXY_URL}/api/v1/scenes/${sceneId}/activate?bridgeIp=${sessionToken}&username=${username}`
      : `${PROXY_URL}/api/v1/scenes/${sceneId}/activate`;

    return request(url, { method: 'POST' }, isLegacyMode ? null : sessionToken);
  },

  /**
   * Revoke current session (logout)
   * @param {string} sessionToken - Session token to revoke
   * @returns {Promise<Object>} Success response
   */
  async revokeSession(sessionToken) {
    const url = `${PROXY_URL}/api/v1/auth/session`;
    return request(url, { method: 'DELETE' }, sessionToken);
  }
};
