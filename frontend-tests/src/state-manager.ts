/**
 * State manager for production smoke tests
 *
 * Manages system state transitions:
 * - Queries current state via API
 * - Transitions to target state (via API or user guidance)
 * - Caches credentials entered during test session
 */

import { SystemState } from './constants';
import * as api from './api-client';
import * as prompts from './prompts';

/**
 * Cached credentials from user input during session
 */
interface CredentialsCache {
  bridgeIp?: string;
  hiveUsername?: string;
  hivePassword?: string;
}

let credentialsCache: CredentialsCache = {};

/**
 * Clear cached credentials
 */
export function clearCredentials(): void {
  credentialsCache = {};
}

/**
 * Get cached bridge IP or prompt user
 */
export async function getBridgeIp(): Promise<string> {
  if (!credentialsCache.bridgeIp) {
    credentialsCache.bridgeIp = await prompts.promptBridgeIp();
  }
  return credentialsCache.bridgeIp;
}

/**
 * Get cached Hive credentials or prompt user
 */
export async function getHiveCredentials(): Promise<{
  username: string;
  password: string;
}> {
  if (!credentialsCache.hiveUsername || !credentialsCache.hivePassword) {
    const creds = await prompts.promptHiveCredentials();
    credentialsCache.hiveUsername = creds.username;
    credentialsCache.hivePassword = creds.password;
  }
  return {
    username: credentialsCache.hiveUsername,
    password: credentialsCache.hivePassword,
  };
}

/**
 * Options for state transition
 */
interface EnsureStateOptions {
  /** Force reset even if already in target state */
  forceReset?: boolean;
  /** Callback for manual action prompts */
  onManualAction?: (message: string) => Promise<void>;
}

/**
 * Ensure system is in the target state
 *
 * Will attempt to:
 * 1. Check current state
 * 2. If already in target state, return
 * 3. Otherwise, transition via API or prompt user
 */
export async function ensureState(
  targetState: SystemState,
  options: EnsureStateOptions = {}
): Promise<void> {
  const currentState = await api.getCurrentState();

  if (!options.forceReset && currentState === targetState) {
    prompts.showInfo('State Check', `System is already in ${targetState} state`);
    return;
  }

  prompts.showInfo(
    'State Transition',
    `Current: ${currentState}\nTarget: ${targetState}`
  );

  switch (targetState) {
    case SystemState.FRESH:
      await transitionToFresh();
      break;

    case SystemState.HUE_DISCOVERED:
      await transitionToHueDiscovered(options);
      break;

    case SystemState.HUE_CONNECTED:
      await transitionToHueConnected(options);
      break;

    case SystemState.HIVE_PENDING_2FA:
      await transitionToHivePending2FA(options);
      break;

    case SystemState.HIVE_CONNECTED:
      await transitionToHiveConnected(options);
      break;

    case SystemState.FULLY_CONNECTED:
      await transitionToFullyConnected(options);
      break;

    default:
      throw new Error(`Unknown target state: ${targetState}`);
  }
}

/**
 * Transition to fresh state (no services connected)
 */
async function transitionToFresh(): Promise<void> {
  prompts.showInfo('Resetting', 'Disconnecting all services...');
  await api.resetToFresh();
  prompts.showInfo('Reset Complete', 'System is now in fresh state');
}

/**
 * Transition to Hue discovered (bridge IP entered, not paired)
 */
async function transitionToHueDiscovered(
  options: EnsureStateOptions
): Promise<void> {
  // First ensure fresh state
  await transitionToFresh();

  // Prompt for bridge IP
  const bridgeIp = await getBridgeIp();

  if (options.onManualAction) {
    await options.onManualAction(
      `Please navigate to the app and:\n` +
        `1. Enable Hue from the Settings page\n` +
        `2. Enter the bridge IP: ${bridgeIp}\n` +
        `3. Stop at the authentication screen (don't press link button yet)`
    );
  }
}

/**
 * Transition to Hue connected
 */
async function transitionToHueConnected(
  options: EnsureStateOptions
): Promise<void> {
  // First get to discovered state
  await transitionToHueDiscovered(options);

  if (options.onManualAction) {
    await options.onManualAction(
      `Please complete Hue pairing:\n` +
        `1. Press the link button on your Hue Bridge\n` +
        `2. Click the Authenticate button in the app\n` +
        `3. Wait for the dashboard to appear`
    );
  }
}

/**
 * Transition to Hive pending 2FA
 */
async function transitionToHivePending2FA(
  options: EnsureStateOptions
): Promise<void> {
  // Get credentials
  const creds = await getHiveCredentials();

  if (options.onManualAction) {
    await options.onManualAction(
      `Please start Hive login:\n` +
        `1. Go to Settings and enable Hive\n` +
        `2. Enter email: ${creds.username}\n` +
        `3. Enter password and click Connect\n` +
        `4. Stop at the 2FA code entry screen`
    );
  }
}

/**
 * Transition to Hive connected
 */
async function transitionToHiveConnected(
  options: EnsureStateOptions
): Promise<void> {
  // First get to 2FA pending
  await transitionToHivePending2FA(options);

  if (options.onManualAction) {
    await options.onManualAction(
      `Please complete Hive login:\n` +
        `1. Check your phone for the SMS 2FA code\n` +
        `2. Enter the code in the app\n` +
        `3. Wait for Hive to connect`
    );
  }
}

/**
 * Transition to fully connected (both Hue and Hive)
 */
async function transitionToFullyConnected(
  options: EnsureStateOptions
): Promise<void> {
  await transitionToHueConnected(options);
  await transitionToHiveConnected(options);
}
