import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { encrypt, decrypt, getEncryptionKey } from '../utils/encryption.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('HiveCredentials');

// Get the directory of this module for default credentials path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * HiveCredentialsManager - Manages Hive heating system credentials
 * Stores credentials globally (shared by all clients) with encrypted password
 */
class HiveCredentialsManager {
  constructor() {
    // In-memory credentials storage
    this.username = null;
    this.password = null;

    // Session token cache (Hive API session)
    this.sessionToken = null;
    this.sessionExpiresAt = null;

    // Default path for credentials file
    this.credentialsFilePath = path.join(__dirname, '..', 'data', 'hive-credentials.json');

    // Load persisted credentials on startup
    this._loadCredentials();
  }

  /**
   * Store Hive credentials
   * @param {string} username - Hive account email
   * @param {string} password - Hive account password
   */
  storeCredentials(username, password) {
    // Validate inputs
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error('Invalid username: username is required');
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
      throw new Error('Invalid password: password is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      throw new Error('Invalid username: must be a valid email address');
    }

    // Store in memory
    this.username = username;
    this.password = password;

    // Clear cached session token (new credentials = new session needed)
    this.sessionToken = null;
    this.sessionExpiresAt = null;

    // Persist to file
    this._saveCredentials();

    logger.info('Stored Hive credentials', { username });
  }

  /**
   * Get stored credentials
   * @returns {Object|null} { username, password } or null if not stored
   */
  getCredentials() {
    if (!this.username || !this.password) {
      return null;
    }

    return {
      username: this.username,
      password: this.password,
    };
  }

  /**
   * Check if credentials are stored
   * @returns {boolean} True if credentials exist
   */
  hasCredentials() {
    return !!(this.username && this.password);
  }

  /**
   * Clear all credentials
   */
  clearCredentials() {
    this.username = null;
    this.password = null;
    this.sessionToken = null;
    this.sessionExpiresAt = null;

    // Clear from file
    this._saveCredentials();

    logger.info('Cleared Hive credentials');
  }

  /**
   * Set cached Hive API session token
   * @param {string} token - Hive session token
   * @param {number} expiresAt - Expiry timestamp in milliseconds
   */
  setSessionToken(token, expiresAt) {
    this.sessionToken = token;
    this.sessionExpiresAt = expiresAt;

    // Persist session token to file
    this._saveCredentials();

    logger.debug('Cached Hive session token', { expiresAt: new Date(expiresAt).toISOString() });
  }

  /**
   * Get cached session token if still valid
   * @returns {string|null} Session token or null if expired/not set
   */
  getSessionToken() {
    if (!this.sessionToken || !this.sessionExpiresAt) {
      return null;
    }

    // Check if expired
    if (Date.now() >= this.sessionExpiresAt) {
      // Clear expired token
      this.sessionToken = null;
      this.sessionExpiresAt = null;
      this._saveCredentials();
      logger.debug('Hive session token expired');
      return null;
    }

    return this.sessionToken;
  }

  /**
   * Clear cached session token
   */
  clearSessionToken() {
    this.sessionToken = null;
    this.sessionExpiresAt = null;
    this._saveCredentials();
    logger.debug('Cleared Hive session token');
  }

  /**
   * Save credentials to file (encrypted)
   * @private
   */
  _saveCredentials() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.credentialsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Build data object
      const data = {};

      if (this.username && this.password) {
        data.username = this.username;

        // Encrypt password
        const key = getEncryptionKey();
        const encrypted = encrypt(this.password, key);
        data.encryptedPassword = encrypted.encrypted;
        data.iv = encrypted.iv;
        data.authTag = encrypted.authTag;
      }

      // Add session token if present
      if (this.sessionToken && this.sessionExpiresAt) {
        data.sessionToken = this.sessionToken;
        data.sessionExpiresAt = this.sessionExpiresAt;
      }

      fs.writeFileSync(this.credentialsFilePath, JSON.stringify(data, null, 2), { mode: 0o600 });
      logger.debug('Saved Hive credentials to file');
    } catch (error) {
      logger.warn('Failed to save Hive credentials', { error: error.message });
    }
  }

  /**
   * Load credentials from file
   * @private
   */
  _loadCredentials() {
    try {
      if (!fs.existsSync(this.credentialsFilePath)) {
        logger.debug('No Hive credentials file found');
        return;
      }

      const contents = fs.readFileSync(this.credentialsFilePath, 'utf8');
      if (!contents || contents.trim() === '') {
        logger.debug('Hive credentials file is empty');
        return;
      }

      const data = JSON.parse(contents);

      // Load username
      if (data.username) {
        this.username = data.username;
      }

      // Decrypt password if present
      if (data.encryptedPassword && data.iv && data.authTag) {
        try {
          const key = getEncryptionKey();
          this.password = decrypt(data.encryptedPassword, data.iv, data.authTag, key);
        } catch (decryptError) {
          logger.warn('Failed to decrypt Hive password', { error: decryptError.message });
          this.username = null;
          this.password = null;
        }
      }

      // Load session token if present and not expired
      if (data.sessionToken && data.sessionExpiresAt) {
        if (Date.now() < data.sessionExpiresAt) {
          this.sessionToken = data.sessionToken;
          this.sessionExpiresAt = data.sessionExpiresAt;
        }
      }

      if (this.hasCredentials()) {
        logger.info('Loaded Hive credentials from file', { username: this.username });
      }
    } catch (error) {
      logger.warn('Failed to load Hive credentials', { error: error.message });
      // Start with empty credentials on error
      this.username = null;
      this.password = null;
    }
  }
}

// Export singleton instance
export default new HiveCredentialsManager();
