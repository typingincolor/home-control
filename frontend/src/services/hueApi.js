// Use relative URLs - works with Vite proxy in dev and same-origin in production
const PROXY_URL = '';

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
  async createUser(bridgeIp, appName = 'hue_verification_app') {
    try {
      const url = `${PROXY_URL}/api/hue/api?bridgeIp=${bridgeIp}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devicetype: appName })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check for error (link button not pressed)
      if (data[0]?.error) {
        throw new Error(data[0].error.description);
      }

      // Return username
      if (data[0]?.success?.username) {
        return data[0].success.username;
      }

      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Authentication error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  },


  /**
   * Get all resources using Hue API
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @param {string} resourceType - The resource type (e.g., 'device', 'zone', 'room', 'behavior_instance')
   * @returns {Promise<Object>} Object containing resource data
   */
  async getResource(bridgeIp, username, resourceType) {
    try {
      const url = `${PROXY_URL}/api/hue/clip/v2/resource/${resourceType}?bridgeIp=${bridgeIp}`;
      const response = await fetch(url, {
        headers: {
          'hue-application-key': username
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // V2 API returns errors differently
      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].description);
      }

      return data;
    } catch (error) {
      console.error(`Get resource v2 (${resourceType}) error:`, error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  },

  /**
   * Get all lights using Hue API
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @returns {Promise<Object>} Object containing light data
   */
  async getLights(bridgeIp, username) {
    try {
      const url = `${PROXY_URL}/api/hue/clip/v2/resource/light?bridgeIp=${bridgeIp}`;
      const response = await fetch(url, {
        headers: {
          'hue-application-key': username
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // V2 API returns errors differently
      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].description);
      }

      return data;
    } catch (error) {
      console.error('Get lights v2 error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  },

  /**
   * Get all rooms using Hue API
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @returns {Promise<Object>} Object containing room data
   */
  async getRooms(bridgeIp, username) {
    try {
      const url = `${PROXY_URL}/api/hue/clip/v2/resource/room?bridgeIp=${bridgeIp}`;
      const response = await fetch(url, {
        headers: {
          'hue-application-key': username
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // V2 API returns errors differently
      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].description);
      }

      return data;
    } catch (error) {
      console.error('Get rooms v2 error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  },

  /**
   * Get all scenes using Hue API
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @returns {Promise<Object>} Object containing scene data
   */
  async getScenes(bridgeIp, username) {
    try {
      const url = `${PROXY_URL}/api/hue/clip/v2/resource/scene?bridgeIp=${bridgeIp}`;
      const response = await fetch(url, {
        headers: {
          'hue-application-key': username
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // V2 API returns errors differently
      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].description);
      }

      return data;
    } catch (error) {
      console.error('Get scenes v2 error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  },

  /**
   * Set light state using Hue API
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @param {string} lightId - The light UUID
   * @param {Object} state - The state to set (e.g., { on: { on: true } })
   * @returns {Promise<Object>} Response from the bridge
   */
  async setLightState(bridgeIp, username, lightId, state) {
    try {
      const url = `${PROXY_URL}/api/hue/clip/v2/resource/light/${lightId}?bridgeIp=${bridgeIp}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'hue-application-key': username
        },
        body: JSON.stringify(state)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // V2 API returns errors differently
      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].description);
      }

      return data;
    } catch (error) {
      console.error('Set light state v2 error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  },

  /**
   * Activate a scene using Hue API
   * @param {string} bridgeIp - The IP address of the bridge
   * @param {string} username - The authenticated username (used as application key)
   * @param {string} sceneId - The scene UUID
   * @returns {Promise<Object>} Response from the bridge
   */
  async activateScene(bridgeIp, username, sceneId) {
    try {
      const url = `${PROXY_URL}/api/hue/clip/v2/resource/scene/${sceneId}?bridgeIp=${bridgeIp}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'hue-application-key': username
        },
        body: JSON.stringify({ recall: { action: 'active' } })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // V2 API returns errors differently
      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].description);
      }

      return data;
    } catch (error) {
      console.error('Activate scene v2 error:', error);

      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Could not connect to proxy server. Make sure it is running.');
      }

      throw error;
    }
  }
};
