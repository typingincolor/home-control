import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * Session management hook
 * Handles session token storage, validation, and expiration
 */
export const useSession = () => {
  const [sessionToken, setSessionToken] = useState(null);
  const [bridgeIp, setBridgeIp] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    const storedBridgeIp = localStorage.getItem(STORAGE_KEYS.BRIDGE_IP);
    const storedExpiresAt = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT);

    if (storedToken && storedBridgeIp && storedExpiresAt) {
      const expiryTime = parseInt(storedExpiresAt, 10);
      const now = Date.now();

      if (now < expiryTime) {
        setSessionToken(storedToken);
        setBridgeIp(storedBridgeIp);
        setExpiresAt(expiryTime);
        setIsExpired(false);
      } else {
        // Session expired, clear it
        clearSession();
        setIsExpired(true);
      }
    }
  }, []);

  // Check for expiration periodically
  useEffect(() => {
    if (!expiresAt) return;

    const checkExpiration = () => {
      const now = Date.now();
      if (now >= expiresAt) {
        setIsExpired(true);
        clearSession();
      }
    };

    // Check every minute
    const intervalId = setInterval(checkExpiration, 60000);

    return () => clearInterval(intervalId);
  }, [expiresAt]);

  /**
   * Create a new session
   * @param {string} token - Session token from backend
   * @param {string} ip - Bridge IP address
   * @param {number} expiresIn - Seconds until expiration
   */
  const createSession = useCallback((token, ip, expiresIn) => {
    const expiryTime = Date.now() + (expiresIn * 1000);

    // Store in state
    setSessionToken(token);
    setBridgeIp(ip);
    setExpiresAt(expiryTime);
    setIsExpired(false);

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, ip);
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, expiryTime.toString());

    // Remove old username-based auth (migration)
    localStorage.removeItem(STORAGE_KEYS.USERNAME);

    console.log('[Session] Created session, expires in', expiresIn, 'seconds');
  }, []);

  /**
   * Clear the current session
   */
  const clearSession = useCallback(() => {
    setSessionToken(null);
    setBridgeIp(null);
    setExpiresAt(null);
    setIsExpired(false);

    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
    // Keep bridgeIp for re-auth
    // localStorage.removeItem(STORAGE_KEYS.BRIDGE_IP);

    console.log('[Session] Cleared session');
  }, []);

  /**
   * Check if session is valid
   */
  const isValid = useCallback(() => {
    if (!sessionToken || !expiresAt) return false;
    return Date.now() < expiresAt;
  }, [sessionToken, expiresAt]);

  /**
   * Get time remaining until expiration (in seconds)
   */
  const getTimeRemaining = useCallback(() => {
    if (!expiresAt) return 0;
    const remaining = Math.floor((expiresAt - Date.now()) / 1000);
    return Math.max(0, remaining);
  }, [expiresAt]);

  return {
    sessionToken,
    bridgeIp,
    isExpired,
    isValid: isValid(),
    timeRemaining: getTimeRemaining(),
    createSession,
    clearSession
  };
};
