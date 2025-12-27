import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createLogger } from './logger.js';

const logger = createLogger('Encryption');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 32 bytes = 256 bits
const IV_LENGTH = 12; // 12 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes

// The encryption module object - all methods use this.keyFilePath
const encryption = {
  // Default key file path (can be overridden for testing)
  keyFilePath: path.join(process.cwd(), 'data', 'encryption-key'),

  // Cached key to avoid repeated file reads (must be cleared when keyFilePath changes)
  _cachedKey: null,

  /**
   * Generate a cryptographically secure random key
   * @returns {string} 64-character hex string (32 bytes)
   */
  generateKey() {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  },

  /**
   * Encrypt plaintext using AES-256-GCM
   * @param {string} plaintext - The text to encrypt
   * @param {string} key - 64-character hex key
   * @returns {Object} Object with encrypted (base64), iv (base64), authTag (base64)
   */
  encrypt(plaintext, key) {
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  },

  /**
   * Decrypt ciphertext using AES-256-GCM
   * @param {string} encrypted - Base64 encoded ciphertext
   * @param {string} iv - Base64 encoded initialization vector
   * @param {string} authTag - Base64 encoded authentication tag
   * @param {string} key - 64-character hex key
   * @returns {string} Decrypted plaintext
   */
  decrypt(encrypted, iv, authTag, key) {
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  },

  /**
   * Validate a hex key string
   * @param {string} key - Key to validate
   * @throws {Error} If key is invalid
   * @private
   */
  _validateKey(key) {
    if (!key || key.length !== 64) {
      throw new Error('Invalid key length: must be 64 hex characters (32 bytes)');
    }
    if (!/^[a-f0-9]{64}$/.test(key)) {
      throw new Error('Invalid key format: must be lowercase hex characters');
    }
  },

  /**
   * Get or generate the encryption key
   * Priority: environment variable > file > generate new
   * @returns {string} 64-character hex key
   */
  getEncryptionKey() {
    // Return cached key if available
    if (this._cachedKey) {
      return this._cachedKey;
    }

    // Check environment variable first
    const envKey = process.env.HIVE_ENCRYPTION_KEY;
    if (envKey) {
      this._validateKey(envKey);
      this._cachedKey = envKey;
      logger.debug('Using encryption key from environment variable');
      return this._cachedKey;
    }

    // Try to load from file
    try {
      if (fs.existsSync(this.keyFilePath)) {
        const fileKey = fs.readFileSync(this.keyFilePath, 'utf8').trim();
        this._validateKey(fileKey);
        this._cachedKey = fileKey;
        logger.debug('Loaded encryption key from file');
        return this._cachedKey;
      }
    } catch (error) {
      logger.warn('Failed to load key from file, generating new key', {
        error: error.message,
      });
    }

    // Generate new key and save to file
    const newKey = this.generateKey();

    // Ensure directory exists
    const keyDir = path.dirname(this.keyFilePath);
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true });
    }

    fs.writeFileSync(this.keyFilePath, newKey, { mode: 0o600 });
    logger.info('Generated and saved new encryption key');

    this._cachedKey = newKey;
    return this._cachedKey;
  },
};

// Named exports that are bound to the encryption object
export function generateKey() {
  return encryption.generateKey();
}

export function encrypt(plaintext, key) {
  return encryption.encrypt(plaintext, key);
}

export function decrypt(encryptedData, iv, authTag, key) {
  return encryption.decrypt(encryptedData, iv, authTag, key);
}

export function getEncryptionKey() {
  return encryption.getEncryptionKey();
}

// Export the object so tests can set keyFilePath
// The named exports above will use the modified keyFilePath via 'this'
export default encryption;
