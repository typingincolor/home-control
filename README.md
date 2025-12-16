# Philips Hue Light Control

A modern React web application for controlling Philips Hue lights locally using the official Hue API v2. Features a responsive interface with visual light controls, room organization, scene management, and real-time motion zone detection. Built with a separated frontend/backend architecture for easy deployment across multiple machines.

## Features

- **Visual Light Control**: Toggle lights with color-coded bulb buttons (yellow=on, gray=off)
- **Motion Zone Detection**: Real-time display of MotionAware zones with status indicators
- **Room Organization**: Lights automatically grouped by room with horizontal card layout
- **Scene Management**: Select and activate scenes for each room
- **Master Controls**: Turn all lights in a room on/off with one button
- **Auto-Refresh**: Light states and motion zones automatically refresh every 30 seconds
- **Responsive Design**: Adaptive layout for all screen sizes
- **Bridge Discovery**: Automatically find your Hue Bridge or enter IP manually
- **Easy Authentication**: Simple guided flow with link button authentication
- **Persistent Credentials**: Bridge IP and username saved in browser localStorage
- **CORS Solution**: Built-in proxy server handles CORS and HTTPS certificate issues
- **Multi-Machine Support**: Access from any device on your network
- **Centralized Configuration**: All settings managed through config.json
- **Modern API v2**: Uses the latest Philips Hue API for future-proof functionality

## Prerequisites

- **Philips Hue Bridge** (v2 recommended) with lights configured
- **Node.js** (v16 or higher)
- Server machine on the **same local network** as your bridge
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode

Run both frontend and backend servers with hot reload:

```bash
npm run dev
```

This starts:
- **Frontend** on http://localhost:5173 (React dev server with hot reload)
- **Backend** on http://localhost:3001 (API proxy server)

Open your browser to http://localhost:5173

### 3. Production Deployment

Build and start the production server:

```bash
npm run deploy
```

Or step by step:

```bash
npm run build              # Build frontend
npm run build:backend      # Copy frontend to backend
npm run start              # Start production server
```

The server runs on http://0.0.0.0:3001 and serves both the API and frontend.

### 4. Access from Other Devices

Once the server is running, access it from any device on your network:

```
http://192.168.68.86:3001
```

Replace `192.168.68.86` with your server's local IP address.

To find your server's IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 5. Initial Setup

1. **Discover or Enter Bridge IP**: Use auto-discovery or manually enter your bridge's IP address
2. **Press Link Button**: Press the physical button on top of your Hue Bridge
3. **Authenticate**: Click "Create Username" within 30 seconds
4. **Control Your Lights**: View and control all your lights organized by room

## Architecture

### Monorepo Structure

The app is organized as a monorepo with separate frontend and backend workspaces:

```
philips-hue-connector/
├── config.json                 # Centralized configuration
├── package.json                # Root workspace manager
├── frontend/                   # React frontend workspace
│   ├── package.json
│   ├── vite.config.js         # Vite config (reads config.json)
│   ├── index.html
│   ├── dist/                  # Build output (gitignored)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── components/
│       │   ├── BridgeDiscovery.jsx
│       │   ├── Authentication.jsx
│       │   ├── LightControl.jsx
│       │   └── MotionZones.jsx
│       ├── services/
│       │   └── hueApi.js      # API client (v2 native)
│       └── hooks/
│           └── useHueBridge.js
└── backend/                    # Express backend workspace
    ├── package.json
    ├── server.js              # Express server (API + static files)
    ├── scripts/
    │   └── copy-frontend.js   # Build script
    └── public/                # Served frontend (gitignored)
```

### Configuration File

All hostnames, IPs, and ports are centralized in `config.json`:

```json
{
  "server": {
    "port": 3001,
    "host": "0.0.0.0",
    "corsEnabled": true
  },
  "hue": {
    "discoveryEndpoint": "https://discovery.meethue.com/"
  },
  "development": {
    "frontendPort": 5173,
    "backendPort": 3001
  }
}
```

**Benefits:**
- Single source of truth for configuration
- Easy to modify without code changes
- Backend exposes `/api/config` endpoint for frontend access
- Can be overridden by environment variables

### How It Works

**Development Mode:**
- Frontend: Vite dev server on port 5173 with hot reload
- Backend: Express server on port 3001
- Vite proxies `/api/*` requests to backend automatically

**Production Mode:**
- Backend serves both API and frontend on single port (3001)
- Frontend uses relative URLs (same origin = no CORS issues)
- Access from any machine using server's IP address

**CORS Solution:**
The Philips Hue Bridge doesn't send CORS headers and uses self-signed HTTPS certificates. The backend server:
- Forwards all API requests to your bridge
- Adds proper CORS headers for browser access
- Accepts the bridge's self-signed SSL certificate
- Listens on all network interfaces (0.0.0.0)

**No browser extensions or workarounds needed!**

### Technology Stack

- **React 18** - UI framework with hooks
- **Vite 6** - Fast build tool and dev server
- **Express 5** - Backend server for CORS and static files
- **Axios** - HTTP client with HTTPS agent support
- **Philips Hue API v2** - Modern local bridge communication
- **localStorage** - Credential persistence
- **CSS Grid & Flexbox** - Responsive card layout
- **CSS Custom Properties** - Dynamic sizing with clamp()
- **npm workspaces** - Monorepo management

## Available Scripts

### Root Scripts (run from project root)

#### `npm run dev`
Starts both frontend and backend in development mode with hot reload

#### `npm run build`
Builds the frontend for production (output: `frontend/dist/`)

#### `npm run build:backend`
Copies frontend build to backend/public/ directory

#### `npm run start`
Starts the production server (backend serves API + frontend)

#### `npm run deploy`
Full deployment: builds frontend, copies to backend, starts server

### Workspace Scripts

#### `npm run dev:frontend`
Starts only the frontend dev server

#### `npm run dev:backend`
Starts only the backend server

## UI Features

### Motion Zone Detection

- **Real-time Status**: Green dot (🟢) = no motion, Red dot (🔴) = motion detected
- **MotionAware Integration**: Works with Philips Hue lights that have built-in motion detection
- **Auto-refresh**: Updates every 30 seconds
- **Room Association**: Motion zones linked to their respective rooms

### Responsive Layout

- Adaptive card layout for all screen sizes
- Visual feedback with color-coded buttons
- Loading indicators during operations
- Smooth animations and transitions

### Visual Feedback

- **Yellow buttons**: Lights are on
- **Gray buttons**: Lights are off
- **Loading indicators**: Show when toggling lights or activating scenes
- **Hover effects**: Cards and buttons have subtle animations

## Finding Your Bridge IP

If auto-discovery doesn't work, find your bridge IP:

### Method 1: Philips Hue App
1. Open the Philips Hue app
2. Go to **Settings** → **My Hue System** → **Bridge**
3. Note the IP address

### Method 2: Router Admin Panel
1. Log into your router's admin interface
2. Look for connected devices or DHCP clients
3. Find "Philips Hue Bridge"

### Method 3: Discovery Website
Visit: https://discovery.meethue.com/

## API Reference

This app uses the **Philips Hue Local API v2** (CLIP API):

### V2 Endpoints Used

- `GET https://discovery.meethue.com/` - Discover bridges on network
- `POST https://{bridge-ip}/api` - Create new user (requires link button)
- `GET https://{bridge-ip}/clip/v2/resource/light` - Get all lights
- `GET https://{bridge-ip}/clip/v2/resource/room` - Get rooms
- `GET https://{bridge-ip}/clip/v2/resource/device` - Get devices (for room hierarchy)
- `GET https://{bridge-ip}/clip/v2/resource/scene` - Get scenes
- `GET https://{bridge-ip}/clip/v2/resource/behavior_instance` - Get MotionAware zones
- `GET https://{bridge-ip}/clip/v2/resource/convenience_area_motion` - Get motion status
- `PUT https://{bridge-ip}/clip/v2/resource/light/{uuid}` - Control light
- `PUT https://{bridge-ip}/clip/v2/resource/scene/{uuid}` - Activate scene

All v2 API requests use the `hue-application-key` header for authentication.

### Backend Endpoints

- `GET /api/config` - Get safe configuration values
- `GET /api/discovery` - Proxy to Hue discovery service
- `GET /api/health` - Health check endpoint
- `ALL /api/hue/*` - Proxy all Hue Bridge API requests

### Official Documentation

- [Philips Hue Developer Portal](https://developers.meethue.com/)
- [CLIP API v2 Documentation](https://developers.meethue.com/develop/hue-api-v2/)
- [Getting Started Guide](https://developers.meethue.com/develop/get-started-2/)

## Deployment Guide

### Single Server Deployment (Recommended)

1. **Build the application:**
   ```bash
   npm run build
   npm run build:backend
   ```

2. **Start the server:**
   ```bash
   npm run start
   ```

3. **Access from any device:**
   ```
   http://<server-ip>:3001
   ```

### Configuration

Edit `config.json` to customize:
- Server port (default: 3001)
- Server host (default: 0.0.0.0 for all interfaces)
- Development ports
- Hue discovery endpoint

Environment variables override config.json:
```bash
PORT=8080 npm run start
```

### Network Requirements

- **Backend server** must be on the same local network as the Hue Bridge
- **Client devices** can be on any network that can reach the server
- **Firewall**: Ensure port 3001 (or your configured port) is accessible

## Troubleshooting

### "Could not discover bridges"
- Ensure your device is on the same network as your Hue Bridge
- Try entering the IP address manually
- Check that your bridge is powered on and connected to your network

### "Could not connect to proxy server"
- Make sure the backend server is running
- Check that nothing else is using the configured port
- Verify http://localhost:3001/api/health returns "ok"

### "Link button not pressed"
- Press the physical button on the bridge
- You have 30 seconds to click "Create Username"
- Try again if you missed the window

### Connection times out
- Verify the bridge IP address is correct
- Ensure server and bridge are on the same network
- Check firewall settings
- Try restarting the bridge

### No lights showing up
- Ensure lights are paired with your bridge in the Hue app
- Check that lights are powered on
- Verify your credentials are correct
- The app will retry automatically every 30 seconds

### No motion zones showing
- MotionAware requires compatible Hue lights with built-in motion detection
- Zones must be configured in the Philips Hue app first
- Motion zones auto-hide if none are configured

## Security Notes

- Your bridge username is stored in browser localStorage
- The username acts as an API key - keep it secure
- Clear browser data to remove saved credentials
- The app communicates only with your local bridge
- The backend accepts self-signed certificates (required for Hue Bridge)
- No data is sent to external servers
- CORS is open by default (configure in config.json if needed)

## Version History

### v0.3.0 (Current)
- **Migrated to Hue API v2** (CLIP API)
- **Motion zone detection** with MotionAware support
- **Component refactoring** - renamed ConnectionTest to LightControl
- **Removed adapter layer** - direct v2 data structures
- **Improved room hierarchy** - device-based organization
- **Real-time updates** - 30-second auto-refresh for all features

### v0.2.0
- **Separated frontend and backend** into monorepo structure
- **Added config.json** for centralized configuration
- **Multi-machine support** - access from any device on network
- **Single deployment** - backend serves both API and frontend
- **Express 5 compatibility** - fixed wildcard route pattern

### v0.1.0
- Initial release with full light control features
- Responsive card-based UI
- Bridge discovery and authentication
- Room organization and scene management

## Contributing

This project demonstrates modern React patterns, monorepo architecture, Hue API v2 integration, and responsive design. Feel free to fork and modify for your needs.

## License

MIT

## Acknowledgments

- Built with React, Vite, and Express
- Uses the Philips Hue Local API v2 (CLIP API)
- Responsive design with CSS Grid and Flexbox
- MotionAware integration for built-in motion detection

## Support

For issues related to:
- **This app**: Check the troubleshooting section above
- **Philips Hue Bridge**: Visit [Philips Hue Support](https://www.philips-hue.com/support)
- **Hue API**: Check the [Philips Hue Developer Portal](https://developers.meethue.com/)

---

**Built with ❤️ for the smart home community**
