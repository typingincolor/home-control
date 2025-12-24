# Session-Based Authentication Guide

## Overview

As of v2.0.0, the application supports **session-based authentication** using time-limited tokens. This provides better security than passing raw credentials on every request.

## How It Works

### 1. Initial Pairing (One-Time Setup)

When a user first connects:

```javascript
1. User enters bridge IP
2. User presses link button on physical Hue Bridge
3. Frontend: POST /api/v1/auth/pair
   Request:  { bridgeIp, appName }
   Response: { username: "permanent-api-key" }
4. Frontend: POST /api/v1/auth/session
   Request:  { bridgeIp, username }
   Response: { sessionToken: "hue_sess_...", expiresIn: 86400 }
5. Store session token in localStorage
```

### 2. Subsequent Visits

On returning visits:

```javascript
1. Load sessionToken from localStorage
2. Check if token is still valid (not expired)
3. If valid: Use token in Authorization header
4. If expired: Show login screen
```

### 3. API Requests

All v1 API endpoints support **three authentication methods** (in priority order):

#### Method 1: Session Token (Preferred)

```javascript
GET / api / v1 / dashboard;
Headers: {
  Authorization: 'Bearer hue_sess_abc123...';
}
```

#### Method 2: Custom Headers

```javascript
GET /api/v1/dashboard
Headers: {
  X-Bridge-IP: "192.168.1.100",
  X-Hue-Username: "permanent-api-key"
}
```

#### Method 3: Query Parameters (Legacy)

```javascript
GET /api/v1/dashboard?bridgeIp=192.168.1.100&username=permanent-api-key
```

### 4. WebSocket Authentication

WebSocket connections also support dual authentication:

#### Session Token Mode (Preferred)

```javascript
ws.send(
  JSON.stringify({
    type: 'auth',
    sessionToken: 'hue_sess_abc123...'
  })
);
```

#### Legacy Mode (Backward Compatible)

```javascript
ws.send(
  JSON.stringify({
    type: 'auth',
    bridgeIp: '192.168.1.100',
    username: 'permanent-api-key'
  })
);
```

## Frontend Architecture

### useSession Hook

Manages session lifecycle:

```javascript
import { useSession } from './hooks/useSession';

const {
  sessionToken, // Current session token
  bridgeIp, // Bridge IP from session
  isExpired, // Whether token expired
  isValid, // Whether session is valid
  timeRemaining, // Seconds until expiration
  createSession, // Create new session
  clearSession // Clear current session
} = useSession();
```

**Features:**

- Stores token + expiry in localStorage
- Automatically checks expiration every minute
- Removes legacy username from storage
- Persists bridgeIp for re-authentication

### useHueBridge Hook

Updated to create sessions automatically:

```javascript
const {
  step, // 'discovery' | 'authentication' | 'connected'
  bridgeIp,
  sessionToken, // Session token for API calls
  authenticate, // Pair + create session
  reset // Logout + clear session
} = useHueBridge();
```

**Authentication Flow:**

1. User pairs with bridge → gets username
2. Hook automatically creates session → gets token
3. Token stored in localStorage
4. Returns sessionToken for use in components

### API Client (hueApi.js)

All v1 methods accept session tokens:

```javascript
// Session mode (preferred)
await hueApi.getDashboard(sessionToken);
await hueApi.updateLight(sessionToken, null, lightId, state);

// Legacy mode (backward compatible)
await hueApi.getDashboard(bridgeIp, username);
await hueApi.updateLight(bridgeIp, username, lightId, state);
```

**Auto-detection:**

- If first param contains "." → treat as IP (legacy mode)
- Otherwise → treat as session token

### WebSocket (useWebSocket)

```javascript
// Session mode
const { dashboard, isConnected } = useWebSocket(sessionToken);

// Legacy mode
const { dashboard, isConnected } = useWebSocket(bridgeIp, username);
```

## Backend Architecture

### Session Manager Service

Manages session tokens server-side:

```javascript
// Create session
const session = sessionManager.createSession(bridgeIp, username);
// Returns: { sessionToken, expiresIn: 86400, bridgeIp }

// Get session
const session = sessionManager.getSession(sessionToken);
// Returns: { bridgeIp, username, createdAt } or null

// Revoke session
sessionManager.revokeSession(sessionToken);
```

**Features:**

- Generates cryptographically secure tokens
- 24-hour expiration (86400 seconds)
- In-memory storage (cleared on server restart)
- Automatic cleanup of expired sessions

### Auth Middleware

`extractCredentials` middleware extracts auth from:

1. `Authorization: Bearer <token>` header → looks up session
2. `X-Bridge-IP` + `X-Hue-Username` headers → uses directly
3. `bridgeIp` + `username` query params → uses directly

```javascript
// Attaches to req.hue:
{
  (bridgeIp, username, authMethod); // 'session' | 'headers' | 'query'
}
```

All v1 routes use this middleware:

```javascript
router.get('/dashboard', extractCredentials, async (req, res) => {
  const { bridgeIp, username } = req.hue;
  // authMethod tells you how they authenticated
});
```

## Migration from Legacy Auth

### Automatic Migration

When users with old username-based auth visit:

1. `useSession` hook runs on mount
2. Checks for `sessionToken` in localStorage
3. If not found, checks for legacy `username`
4. If legacy found → calls `createSession(bridgeIp, username)`
5. Stores new session token
6. Removes old username from storage

**Result:** Seamless upgrade from v1.x to v2.0.0

### Manual Migration

To force migration:

```javascript
const savedUsername = localStorage.getItem('hue_username');
const savedBridgeIp = localStorage.getItem('hue_bridge_ip');

if (savedUsername && savedBridgeIp) {
  const session = await hueApi.createSession(savedBridgeIp, savedUsername);
  createSession(session.sessionToken, savedBridgeIp, session.expiresIn);
  localStorage.removeItem('hue_username'); // Clean up
}
```

## Security Benefits

### Session Tokens vs Raw Credentials

**Old approach (username in every request):**

- ❌ Permanent API key exposed on every call
- ❌ No expiration - stolen key works forever
- ❌ Can't revoke without re-pairing bridge
- ❌ Visible in browser network tab
- ❌ Logged in server logs

**New approach (session tokens):**

- ✅ Temporary tokens (24-hour expiration)
- ✅ Can revoke specific sessions
- ✅ Token ≠ bridge credentials
- ✅ Automatic expiration + refresh
- ✅ Server controls token lifetime

### Best Practices

1. **Never log session tokens** - treat like passwords
2. **Use HTTPS in production** - prevent token interception
3. **Set appropriate expiration** - balance security vs UX
4. **Implement refresh tokens** (future) - seamless re-auth
5. **Rate limit session creation** - prevent brute force

## Session Expiration Handling

### Current Behavior

**When token expires:**

1. `useSession` hook detects expiration (checked every minute)
2. Sets `isExpired = true`
3. Calls `clearSession()` automatically
4. User redirected to login screen

**On API calls with expired token:**

1. Backend returns `401 Unauthorized`
2. `request()` function catches error
3. Throws "Session expired. Please log in again."
4. Frontend shows error, redirects to auth

### Future: Auto-Refresh

To implement seamless token refresh:

```javascript
// In useSession hook
useEffect(() => {
  if (!expiresAt) return;

  // Refresh 5 minutes before expiration
  const refreshTime = expiresAt - 5 * 60 * 1000;
  const now = Date.now();

  if (refreshTime > now) {
    const timeoutId = setTimeout(async () => {
      try {
        // Call refresh endpoint (to be implemented)
        const newSession = await hueApi.refreshSession(sessionToken);
        createSession(newSession.sessionToken, bridgeIp, newSession.expiresIn);
      } catch (error) {
        console.error('Failed to refresh session:', error);
        clearSession();
      }
    }, refreshTime - now);

    return () => clearTimeout(timeoutId);
  }
}, [expiresAt, sessionToken, bridgeIp]);
```

## Logout

To log out and clear session:

```javascript
const { reset } = useHueBridge();

// Client-side logout
reset(); // Clears session from localStorage

// Server-side revoke (optional)
await hueApi.revokeSession(sessionToken);
```

## Session Storage

**localStorage keys:**

```javascript
{
  "hue_session_token": "hue_sess_abc123...",
  "hue_session_expires_at": "1703347200000",  // Unix timestamp (ms)
  "hue_bridge_ip": "192.168.1.100"             // For re-auth
}
```

**Legacy keys (removed on migration):**

```javascript
{
  "hue_username": "old-permanent-key"  // Removed after session created
}
```

## Testing Session Auth

### Manual Testing

1. **Clear storage:**

   ```javascript
   localStorage.clear();
   ```

2. **Pair with bridge:**
   - Enter bridge IP
   - Press link button
   - Click "Connect"

3. **Verify session created:**

   ```javascript
   localStorage.getItem('hue_session_token');
   // Should return: "hue_sess_..."
   ```

4. **Test API calls:**

   ```javascript
   // Check network tab - should see Authorization header
   fetch('/api/v1/dashboard', {
     headers: { Authorization: 'Bearer hue_sess_...' }
   });
   ```

5. **Test expiration:**
   ```javascript
   // Set expiry to past
   localStorage.setItem('hue_session_expires_at', Date.now() - 1000);
   // Refresh page - should redirect to login
   ```

### Backward Compatibility Testing

1. **Simulate legacy user:**

   ```javascript
   localStorage.setItem('hue_bridge_ip', '192.168.1.100');
   localStorage.setItem('hue_username', 'old-key-abc123');
   localStorage.removeItem('hue_session_token');
   ```

2. **Refresh page** - should auto-migrate to session

3. **Verify:**
   ```javascript
   localStorage.getItem('hue_session_token'); // Should exist
   localStorage.getItem('hue_username'); // Should be removed
   ```

## API Reference

### POST /api/v1/auth/session

Create new session token

**Request:**

```json
{
  "bridgeIp": "192.168.1.100",
  "username": "permanent-api-key"
}
```

**Response:**

```json
{
  "sessionToken": "hue_sess_abc123...",
  "expiresIn": 86400,
  "bridgeIp": "192.168.1.100"
}
```

### DELETE /api/v1/auth/session

Revoke current session

**Headers:**

```
Authorization: Bearer hue_sess_abc123...
```

**Response:**

```json
{
  "success": true,
  "message": "Session revoked"
}
```

### GET /api/v1/auth/session

Get current session info

**Headers:**

```
Authorization: Bearer hue_sess_abc123...
```

**Response:**

```json
{
  "bridgeIp": "192.168.1.100",
  "active": true
}
```

## Troubleshooting

### "Session expired" errors

- Token has exceeded 24-hour lifetime
- Solution: Log in again (will get new token)

### "Invalid session token" errors

- Token doesn't exist in server memory
- Happens after server restart
- Solution: Log in again

### WebSocket won't connect

- Check if using correct auth method
- Verify token hasn't expired
- Check browser console for errors

### API calls returning 401

- Token expired or invalid
- Check localStorage for valid token
- Try logging out and back in

## Summary

Session-based authentication provides:

- ✅ Better security (temporary tokens)
- ✅ Server-side control (revocation)
- ✅ Backward compatibility (legacy mode)
- ✅ Automatic migration (seamless upgrade)
- ✅ Clean API (Authorization header)
- ✅ WebSocket support (both modes)

All authentication is now centralized and secure by default while maintaining 100% backward compatibility with v1.x.
