#!/usr/bin/env node
/* global console, process */
/**
 * Quick test script to verify Hive Cognito authentication
 * Usage: node scripts/test-hive-auth.mjs <email> <password>
 */

import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

// Hive's Cognito configuration (from https://sso.hivehome.com/)
const POOL_DATA = {
  UserPoolId: 'eu-west-1_SamNfoWtf',
  ClientId: '3rl4i0ajrmtdm8sbre54p9dvd9',
};

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/test-hive-auth.mjs <email> <password>');
  process.exit(1);
}

console.log(`Testing Hive authentication for: ${email}`);
console.log('Cognito Pool:', POOL_DATA.UserPoolId);
console.log('Cognito Client:', POOL_DATA.ClientId);
console.log('');

const userPool = new CognitoUserPool(POOL_DATA);

const authDetails = new AuthenticationDetails({
  Username: email,
  Password: password,
});

const cognitoUser = new CognitoUser({
  Username: email,
  Pool: userPool,
});

cognitoUser.authenticateUser(authDetails, {
  onSuccess: (result) => {
    console.log('SUCCESS - No MFA required (unexpected for Hive)');
    console.log('Access Token:', result.getAccessToken().getJwtToken().slice(0, 50) + '...');
  },

  onFailure: (err) => {
    console.error('FAILURE:', err.message || err);
    if (err.code) {
      console.error('Error code:', err.code);
    }
  },

  mfaRequired: (challengeName, challengeParameters) => {
    console.log('SUCCESS - MFA Required! SMS should be sent.');
    console.log('Challenge:', challengeName);
    console.log('Parameters:', JSON.stringify(challengeParameters, null, 2));
    console.log('');
    console.log('Check your phone for the SMS code.');
    console.log('');
    console.log('To complete auth, you would call:');
    console.log('  cognitoUser.sendMFACode(code, callbacks)');

    // Exit successfully - we proved the SMS was triggered
    process.exit(0);
  },

  newPasswordRequired: (userAttributes) => {
    console.log('NEW PASSWORD REQUIRED');
    console.log('Attributes:', userAttributes);
  },

  mfaSetup: (challengeName) => {
    console.log('MFA SETUP REQUIRED');
    console.log('Challenge:', challengeName);
  },

  totpRequired: (challengeName) => {
    console.log('TOTP REQUIRED (not SMS)');
    console.log('Challenge:', challengeName);
  },

  customChallenge: (challengeParameters) => {
    console.log('CUSTOM CHALLENGE');
    console.log('Parameters:', challengeParameters);
  },
});
