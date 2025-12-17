# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Philips Hue Light Control** web application built as a monorepo with separated frontend (React) and backend (Express) workspaces. The app controls Philips Hue lights locally through the Hue Bridge API, featuring **true color display** with mathematical color space conversion, **information-dense UI** with brightness indicators and room statistics, **responsive design** optimized for iPhone 14+ and iPad, room organization, scene management, and **MotionAware zone display** with real-time motion detection.

## Development Commands

### Start Development (Both Servers)
```bash
npm run dev
```
- Frontend runs on http://localhost:5173 (Vite dev server with hot reload)
- Backend runs on http://localhost:3001 (Express API proxy)
- **Always use port 5173 for development** - this is the Vite dev server with live reloading

### Run Only Frontend
```bash
npm run dev:frontend
```

### Run Only Backend
```bash
npm run dev:backend
```

### Production Build & Deploy
```bash
npm run deploy
```
This runs: build → build:backend → start

Or step-by-step:
```bash
npm run build              # Build frontend to frontend/dist/
npm run build:backend      # Copy frontend build to backend/public/
npm run start              # Start production server on port 3001
```

## Architecture

### Monorepo Structure
- **Root**: Workspace manager with shared config
- **Frontend workspace**: React 18 + Vite 6
- **Backend workspace**: Express 5 server

### Key Architectural Patterns

#### 1. Centralized Configuration
All configuration lives in **`config.json`** at the project root:
- Server ports and host settings
- Hue API endpoints
- Development ports

Both frontend (vite.config.js) and backend (server.js) read from this file. Environment variables can override these values.

#### 2. API Proxy Pattern
The backend acts as a **CORS proxy** for the Hue Bridge:
- Hue Bridge doesn't send CORS headers and uses self-signed HTTPS certificates
- Backend forwards all `/api/hue/*` requests to the bridge with proper headers
- Backend accepts self-signed certificates via custom HTTPS agent
- Wildcard route: `app.all(/^\/api\/hue\/(.*)/, ...)`

**Important**: The proxy extracts bridge IP from query parameter `?bridgeIp={ip}` on every request, allowing the frontend to control which bridge to connect to without hardcoding.

#### 3. Relative URL Strategy
Frontend uses **empty string `PROXY_URL = ''`** in hueApi.js:
- Development: Vite proxy forwards `/api/*` to backend automatically
- Production: Same-origin requests (backend serves both API and frontend)
- **No hardcoded localhost** - works on any machine/network

#### 4. Dual-Mode Serving
**Development**: Separate frontend (Vite) and backend (Express) servers
**Production**: Backend serves both API and static frontend files from `backend/public/`

### Hue API Integration

This app uses **Philips Hue API v2** (CLIP API) exclusively for all operations. API v1 methods have been removed.

#### API v2 Architecture
- **Base path**: `/clip/v2/resource/{resource_type}`
- **Authentication**: `hue-application-key` header (not URL-based)
- **IDs**: UUIDs instead of numeric strings
- **Response format**: `{ errors: [], data: [...] }` array structure
- **Resource types**: light, room, device, scene, behavior_instance, convenience_area_motion

#### Key Endpoints Used
- `/clip/v2/resource/light` - Get/control all lights
- `/clip/v2/resource/room` - Get rooms with device children
- `/clip/v2/resource/device` - Get devices with light service references
- `/clip/v2/resource/scene` - Get/activate scenes
- `/clip/v2/resource/behavior_instance` - MotionAware zone configurations
- `/clip/v2/resource/convenience_area_motion` - Real-time motion detection

#### V2 Data Structures

**Light**:
```javascript
{
  id: "uuid",                          // UUID identifier
  on: { on: true },                    // Nested on state
  dimming: { brightness: 100.0 },      // Percentage, not 0-254
  metadata: { name: "Living Room 1" }  // Name in metadata
}
```

**Room Hierarchy** (room → device → light):
```javascript
{
  id: "room-uuid",
  metadata: { name: "Living Room" },
  children: [
    { rid: "device-uuid", rtype: "device" }  // References to devices
  ]
}
```

**Device** (contains light references):
```javascript
{
  id: "device-uuid",
  services: [
    { rid: "light-uuid", rtype: "light" }  // Light service references
  ]
}
```

**Critical Pattern**: To get lights in a room:
1. Fetch rooms, devices, and lights
2. Build device→lights map from device.services
3. Walk room.children to find device references
4. Map device UUIDs to their light UUIDs

Example v2 request:
```javascript
fetch('/api/hue/clip/v2/resource/light?bridgeIp={ip}', {
  headers: { 'hue-application-key': username }
})
```

### Component Architecture

#### Main Flow Components
1. **App.jsx**: Manages 3-step authentication flow
   - Step 1: BridgeDiscovery (find/enter bridge IP)
   - Step 2: Authentication (link button press)
   - Step 3: LightControl (main UI with lights)

2. **LightControl.jsx**: Main control interface
   - Fetches lights, rooms, devices, scenes on mount using v2 API
   - 30-second auto-refresh polling for all data
   - Builds room→device→light hierarchy from v2 data
   - Groups lights by room in card layout
   - Integrates MotionZones component
   - Works natively with v2 data structures (no adapters)

3. **MotionZones.jsx**: MotionAware zone display
   - Polls every 30 seconds (same as lights)
   - Fetches from **two v2 endpoints** and combines data
   - Returns `null` if no MotionAware zones configured (auto-hide)
   - Shows green dot 🟢 (no motion) or red dot 🔴 (motion detected)

#### Data Flow
- **localStorage**: Persists bridgeIp and username across sessions
- **useHueBridge hook**: Manages bridge connection state
- **hueApi service**: All API calls go through this service layer
- **Polling pattern**: Both lights and motion zones use 30-second `setInterval` with cleanup

### CSS Architecture
- **Single CSS file**: `frontend/src/App.css` (no CSS modules)
- **Responsive grid**: CSS Grid with `repeat(auto-fill, minmax(440px, 1fr))`
- **Mobile optimization**: Reduced padding on iPhone 14+ (calc(100% - 16px) container width)
- **Dynamic sizing**: CSS `clamp()` for viewport-responsive buttons and icons
- **Modern design**: Tailwind-inspired color palette, layered shadows, cubic-bezier transitions
- **Component classes**: `.motion-zones`, `.room-group`, `.light-bulb-button`, `.lights-summary`, etc.

### UI Features & Patterns

#### Color Display System
Light buttons display actual bulb colors using mathematical color space conversions:

**Color Conversion Functions** (LightControl.jsx):
```javascript
// Convert Hue xy coordinates (CIE 1931) to RGB
xyToRgb(x, y, brightness) {
  // xy → XYZ → sRGB with gamma correction
  // Returns { r, g, b } in 0-255 range
}

// Convert color temperature (mirek) to RGB
mirekToRgb(mirek) {
  // mirek → Kelvin → RGB approximation
  // Returns { r, g, b } in 0-255 range
}

// Determine which conversion to use
getLightColor(light) {
  // Prefers xy color, falls back to temperature, returns null for basic bulbs
  // Returns CSS color string: "rgb(r, g, b)" or null
}
```

**Dynamic Button Styling**:
- Inline styles override default CSS when color data available
- Background gradient and box-shadow use actual bulb color
- Hover uses `filter: brightness(0.85)` for universal darkening
- Works with RGB colors, white temperatures, and default green

#### Information Density Features

**Dashboard Summary** (LightControl.jsx):
```javascript
// Overall statistics at top of page
<div className="lights-summary">
  <div className="summary-stat">
    <span className="stat-value">{totalLightsOn}</span>
    <span className="stat-label">lights on</span>
  </div>
  {/* Room count and scene count stats */}
</div>
```

**Room Status System**:
```javascript
// Helper function calculates room statistics
getRoomLightStats(roomLights) {
  const lightsOnCount = roomLights.filter(light => light.on?.on).length;
  const averageBrightness = /* average of light.dimming.brightness */;
  return { lightsOnCount, totalLights, averageBrightness };
}
```

**Visual Elements**:
- Status badges: "{X} of {Y} on" for each room
- Brightness bars: Horizontal progress bars showing average room brightness
- Per-light overlays: Brightness percentage on each button
- Responsive overflow: Ellipsis handling for long names

#### Responsive Design Strategy

**Breakpoints**:
- `max-width: 768px` - Mobile devices (reduced padding, smaller fonts)
- `min-width: 1800px` - Large screens (cap at 4 rooms per row)

**Mobile Optimizations**:
- Container: `calc(100% - 16px)` width, `8px` padding
- Header/footer: `12px` padding
- Button size: `clamp(60px, 4vw, 80px)` scales with viewport

**iPad Optimizations**:
- Buttons scale up to 82px on iPad Pro (1024px)
- Text labels increase to 100px max-width
- Logo scales with `clamp(60px, 15vw, 120px)`

**Layout Grid**:
- Room cards: `repeat(auto-fill, minmax(440px, 1fr))`
- Light buttons: `repeat(auto-fit, minmax(var(--button-size), 1fr))`
- Maximum 4 rooms per row via media query
- 5 light buttons per row when space allows

## Important Implementation Notes

### When Adding New Features

1. **Backend changes**: Restart backend server manually (no hot reload)
2. **Frontend changes**: Hot reload works automatically in Vite dev server
3. **New API endpoints**: Add to hueApi.js service, proxy through backend if needed
4. **v2 API features**: Remember to forward `hue-application-key` header in backend

### Common Patterns

#### Building Room→Device→Light Hierarchy
**Critical implementation pattern** for v2 API room organization:

```javascript
// In LightControl.jsx
const getLightsByRoom = () => {
  if (!lights?.data || !rooms?.data || !devices?.data) return null;

  // Step 1: Build device → lights map from services
  const deviceToLights = {};
  devices.data.forEach(device => {
    const lightUuids = device.services
      ?.filter(s => s.rtype === 'light')
      .map(s => s.rid) || [];
    deviceToLights[device.id] = lightUuids;
  });

  const roomMap = {};

  // Step 2: Walk room → device → light hierarchy
  rooms.data.forEach(room => {
    const lightUuids = [];

    room.children?.forEach(child => {
      if (child.rtype === 'device') {
        // Get lights from this device
        const deviceLights = deviceToLights[child.rid] || [];
        lightUuids.push(...deviceLights);
      } else if (child.rtype === 'light') {
        // Direct light reference (rare)
        lightUuids.push(child.rid);
      }
    });

    if (lightUuids.length > 0) {
      roomMap[room.metadata?.name || 'Unknown Room'] = {
        roomUuid: room.id,
        lightUuids: [...new Set(lightUuids)], // Deduplicate
        lights: lightUuids.map(uuid => getLightByUuid(uuid)).filter(Boolean)
      };
    }
  });

  return roomMap;
};
```

**Why this is necessary**: V2 API uses an indirect relationship where rooms contain devices, and devices contain lights. You cannot get lights directly from a room.

#### Adding New Hue API v2 Resource
```javascript
// In hueApi.js
async getResource(bridgeIp, username, resourceType) {
  const url = `${PROXY_URL}/api/hue/clip/v2/resource/${resourceType}?bridgeIp=${bridgeIp}`;
  const response = await fetch(url, {
    headers: { 'hue-application-key': username }
  });
  const data = await response.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0].description);
  }
  return data; // Returns { errors: [], data: [...] }
}
```

#### Component Polling Pattern
```javascript
// Initial fetch
useEffect(() => {
  if (bridgeIp && username) {
    fetchData();
  }
}, [bridgeIp, username]);

// Polling with cleanup
useEffect(() => {
  if (!bridgeIp || !username) return;

  const intervalId = setInterval(() => {
    fetchData();
  }, 30000); // 30 seconds

  return () => clearInterval(intervalId);
}, [bridgeIp, username]);
```

### Debugging

#### Check Backend Server
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","message":"Proxy server is running"}
```

#### Check Proxy Logs
Backend logs all proxied requests:
```
[PROXY] GET https://{bridge-ip}/api/{username}/lights
[PROXY] Response status: 200
```

#### Common Issues
- **"Nothing showing in console"**: Check you're on port 5173 (Vite dev), not 3001 (backend)
- **Backend changes not applying**: Restart backend server manually
- **CORS errors**: Ensure backend proxy is running and forwarding requests
- **v2 API 401 errors**: Check `hue-application-key` header is being forwarded in backend/server.js (line 65-68)

### MotionAware Implementation Details

The MotionAware zones feature is **NOT** available through traditional motion sensors. Key facts:

1. **No `/motion` sensors**: Traditional `/api/{username}/sensors` endpoint returns empty for MotionAware
2. **v2 API only**: MotionAware uses `convenience_area_motion` resource type
3. **Two-step data fetch**:
   - Fetch `behavior_instance` to get zone names
   - Fetch `convenience_area_motion` to get motion status
   - Match them via `configuration.motion.motion_service.rid`
4. **Motion state**: `motion.motion` boolean (true = motion detected)
5. **Validity**: `motion.motion_valid` indicates if sensor is reachable

## File Structure

```
/
├── config.json                          # Single source of truth for all config
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # 3-step flow controller
│   │   ├── App.css                      # All styles (single file)
│   │   ├── components/
│   │   │   ├── BridgeDiscovery.jsx      # Step 1: Find bridge
│   │   │   ├── Authentication.jsx       # Step 2: Link button auth
│   │   │   ├── LightControl.jsx         # Step 3: Main UI with native v2 data
│   │   │   └── MotionZones.jsx          # MotionAware display
│   │   ├── services/
│   │   │   └── hueApi.js                # All API calls (v2 API only)
│   │   └── hooks/
│   │       └── useHueBridge.js          # Bridge connection state
│   └── vite.config.js                   # Reads config.json, sets up proxy
└── backend/
    ├── server.js                        # Express proxy + static file server
    └── scripts/
        └── copy-frontend.js             # Build script for deployment
```

## Network Architecture

### Development
- Frontend: localhost:5173 (accessible only on dev machine)
- Backend: 0.0.0.0:3001 (accessible from network)
- Vite proxies `/api/*` to backend

### Production
- Single server: 0.0.0.0:3001 (accessible from entire network)
- Serves both API and static files
- Access from any device: `http://{server-ip}:3001`

**Critical**: Backend must be on same local network as Hue Bridge, but clients can connect from anywhere that can reach the backend server.
