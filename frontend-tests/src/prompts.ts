/**
 * Interactive CLI prompts for production smoke tests
 *
 * Uses @inquirer/prompts for user input during tests.
 * These prompts are used for:
 * - Entering credentials (Hue bridge IP, Hive username/password)
 * - Confirming physical actions (press Hue link button)
 * - Entering 2FA codes
 * - Confirming system state
 */

import { input, confirm, password } from '@inquirer/prompts';

/**
 * Prompt user to confirm they're ready to proceed
 */
export async function confirmReady(message: string): Promise<boolean> {
  return confirm({
    message,
    default: true,
  });
}

/**
 * Prompt user to perform a physical action and confirm when done
 */
export async function confirmAction(message: string): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('ACTION REQUIRED');
  console.log('='.repeat(60));
  console.log(message);
  console.log('='.repeat(60) + '\n');

  await confirm({
    message: 'Press Enter when ready to continue...',
    default: true,
  });
}

/**
 * Prompt for Hue bridge IP address
 */
export async function promptBridgeIp(): Promise<string> {
  return input({
    message: 'Enter the Hue Bridge IP address:',
    validate: (value) => {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(value)) {
        return 'Please enter a valid IP address (e.g., 192.168.1.100)';
      }
      return true;
    },
  });
}

/**
 * Prompt for Hive credentials
 */
export async function promptHiveCredentials(): Promise<{
  username: string;
  password: string;
}> {
  const username = await input({
    message: 'Enter your Hive email address:',
    validate: (value) => {
      if (!value.includes('@')) {
        return 'Please enter a valid email address';
      }
      return true;
    },
  });

  const pwd = await password({
    message: 'Enter your Hive password:',
    mask: '*',
  });

  return { username, password: pwd };
}

/**
 * Prompt for 2FA verification code
 */
export async function prompt2FACode(): Promise<string> {
  console.log('\n' + '='.repeat(60));
  console.log('2FA CODE REQUIRED');
  console.log('Check your phone for the SMS verification code from Hive');
  console.log('='.repeat(60) + '\n');

  return input({
    message: 'Enter the 6-digit verification code:',
    validate: (value) => {
      if (!/^\d{6}$/.test(value)) {
        return 'Please enter a 6-digit code';
      }
      return true;
    },
  });
}

/**
 * Prompt to confirm system is in expected state
 */
export async function confirmState(
  expectedState: string,
  instructions: string
): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  console.log(`EXPECTED STATE: ${expectedState}`);
  console.log('='.repeat(60));
  console.log(instructions);
  console.log('='.repeat(60) + '\n');

  return confirm({
    message: `Is the system in the "${expectedState}" state?`,
    default: true,
  });
}

/**
 * Display an informational message to the user
 */
export function showInfo(title: string, message: string): void {
  console.log('\n' + '-'.repeat(60));
  console.log(title);
  console.log('-'.repeat(60));
  console.log(message);
  console.log('-'.repeat(60) + '\n');
}

/**
 * Display a warning message to the user
 */
export function showWarning(message: string): void {
  console.log('\n' + '!'.repeat(60));
  console.log('WARNING: ' + message);
  console.log('!'.repeat(60) + '\n');
}
