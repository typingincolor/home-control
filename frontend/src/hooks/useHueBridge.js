import { useState, useEffect } from 'react';
import { hueApi } from '../services/hueApi';
import { STORAGE_KEYS } from '../constants/storage';
import { useSession } from './useSession';

export const useHueBridge = () => {
  const [state, setState] = useState({
    step: 'discovery', // 'discovery' | 'authentication' | 'connected'
    bridgeIp: null,
    username: null, // Legacy, kept for compatibility
    lights: null,
    loading: false,
    error: null
  });

  const { sessionToken, bridgeIp: sessionBridgeIp, createSession, clearSession, isValid } = useSession();

  // Load saved credentials on mount (supports both session and legacy)
  useEffect(() => {
    // Check for existing session first (preferred)
    if (sessionToken && isValid) {
      setState(prev => ({
        ...prev,
        bridgeIp: sessionBridgeIp,
        step: 'connected'
      }));
      console.log('[Auth] Restored session from storage');
    }
    // Fallback to legacy username-based auth
    else {
      const savedIp = localStorage.getItem(STORAGE_KEYS.BRIDGE_IP);
      const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);

      if (savedIp && savedUsername) {
        console.log('[Auth] Found legacy credentials, migrating to session...');
        // Attempt to create session from legacy credentials
        migrateToSession(savedIp, savedUsername);
      }
    }
  }, []);

  // Helper to migrate from legacy auth to session auth
  const migrateToSession = async (bridgeIp, username) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const sessionInfo = await hueApi.createSession(bridgeIp, username);
      createSession(sessionInfo.sessionToken, bridgeIp, sessionInfo.expiresIn);
      setState(prev => ({
        ...prev,
        bridgeIp,
        loading: false,
        step: 'connected'
      }));
      console.log('[Auth] Successfully migrated to session auth');
    } catch (error) {
      console.error('[Auth] Failed to migrate to session:', error);
      // Fall back to legacy mode
      setState(prev => ({
        ...prev,
        bridgeIp,
        username,
        loading: false,
        step: 'connected'
      }));
    }
  };

  const setBridgeIp = (ip) => {
    localStorage.setItem(STORAGE_KEYS.BRIDGE_IP, ip);
    setState(prev => ({
      ...prev,
      bridgeIp: ip,
      step: 'authentication',
      error: null
    }));
  };

  const authenticate = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Step 1: Pair with bridge (get username)
      const username = await hueApi.createUser(state.bridgeIp);
      console.log('[Auth] Pairing successful, creating session...');

      // Step 2: Create session token
      const sessionInfo = await hueApi.createSession(state.bridgeIp, username);
      createSession(sessionInfo.sessionToken, state.bridgeIp, sessionInfo.expiresIn);

      setState(prev => ({
        ...prev,
        loading: false,
        step: 'connected'
      }));

      console.log('[Auth] Authentication complete with session token');
    } catch (error) {
      let errorMessage = error.message;

      // Handle CORS error specifically
      if (error.message === 'CORS_ERROR') {
        errorMessage = 'Browser security is blocking the request. See troubleshooting tips below.';
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  const testConnection = async () => {
    // Connection testing is now handled by ConnectionTest component
    // This function is kept for compatibility but does nothing
    setState(prev => ({ ...prev, loading: false, error: null }));
  };

  const reset = () => {
    // Clear session
    clearSession();

    // Clear legacy storage (for migration)
    localStorage.removeItem(STORAGE_KEYS.BRIDGE_IP);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);

    setState({
      step: 'discovery',
      bridgeIp: null,
      username: null,
      lights: null,
      loading: false,
      error: null
    });

    console.log('[Auth] Reset authentication');
  };

  return {
    ...state,
    sessionToken, // Expose session token for API calls
    setBridgeIp,
    authenticate,
    testConnection,
    reset
  };
};
