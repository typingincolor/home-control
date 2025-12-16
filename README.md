# Philips Hue Light Control

A modern React web application for controlling Philips Hue lights locally. Features a responsive card-based interface with visual light controls, room organization, and scene management.

## Features

- **Visual Light Control**: Toggle lights with color-coded bulb buttons (green=on, red=off)
- **Room Organization**: Lights automatically grouped by room with horizontal card layout
- **Scene Management**: Select and activate scenes for each room
- **Master Controls**: Turn all lights in a room on/off with one button
- **Auto-Refresh**: Light states automatically refresh every 30 seconds
- **Responsive Design**: 4 cards on large screens, 3 on medium, 1 on small
- **Dynamic Sizing**: Buttons scale based on viewport width while maintaining readability
- **Bridge Discovery**: Automatically find your Hue Bridge or enter IP manually
- **Easy Authentication**: Simple guided flow with link button authentication
- **Persistent Credentials**: Bridge IP and username saved in browser localStorage
- **CORS Solution**: Built-in proxy server handles CORS and HTTPS certificate issues

## Prerequisites

- **Philips Hue Bridge** (v1 or v2) with lights configured
- **Node.js** (v16 or higher)
- Device on the **same local network** as your bridge
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Application

The app requires both the proxy server and the dev server to run:

```bash
npm start
```

This command starts both:
- **Proxy server** on http://localhost:3001 (handles CORS and bridge communication)
- **Dev server** on http://localhost:5173 (React app)

Alternatively, run them separately:

```bash
# Terminal 1
npm run proxy

# Terminal 2
npm run dev
```

### 3. Open the App

Open your browser and navigate to:
```
http://localhost:5173
```

### 4. Initial Setup

1. **Discover or Enter Bridge IP**: Use auto-discovery or manually enter your bridge's IP address
2. **Press Link Button**: Press the physical button on top of your Hue Bridge
3. **Authenticate**: Click "Create Username" within 30 seconds
4. **Control Your Lights**: View and control all your lights organized by room

## How It Works

### Application Flow

1. **Discovery** → Find your bridge's IP address
2. **Authentication** → Create an authenticated username with link button press
3. **Connected** → Full light control interface with rooms, scenes, and real-time status

### CORS Solution

The Philips Hue Bridge doesn't send CORS headers and uses self-signed HTTPS certificates. This app includes a Node.js proxy server (`proxy-server.js`) that:

- Forwards all API requests to your bridge
- Adds proper CORS headers for browser access
- Accepts the bridge's self-signed SSL certificate
- Runs on http://localhost:3001

**No browser extensions or workarounds needed!** The proxy handles everything automatically.

### Technology Stack

- **React 18** - UI framework with hooks
- **Vite** - Fast build tool and dev server
- **Express** - Proxy server for CORS handling
- **Axios** - HTTP client with HTTPS agent support
- **Philips Hue API v1** - Local bridge communication
- **localStorage** - Credential persistence
- **CSS Grid & Flexbox** - Responsive card layout
- **CSS Custom Properties** - Dynamic sizing with clamp()

### Key Files

- `proxy-server.js` - CORS proxy server with HTTPS support
- `src/services/hueApi.js` - API service layer (routes through proxy)
- `src/hooks/useHueBridge.js` - State management hook
- `src/components/BridgeDiscovery.jsx` - Bridge discovery UI
- `src/components/Authentication.jsx` - Authentication flow UI
- `src/components/ConnectionTest.jsx` - Main light control interface
- `src/App.jsx` - Main application component with responsive layout
- `src/App.css` - Responsive styles with CSS custom properties

## Project Structure

```
philips-hue-control/
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── proxy-server.js         # CORS proxy server
├── README.md              # This file
├── .gitignore             # Git ignore rules
└── src/
    ├── main.jsx           # React entry point
    ├── App.jsx            # Main app with step flow
    ├── App.css            # Responsive styles
    ├── components/
    │   ├── BridgeDiscovery.jsx     # Bridge discovery component
    │   ├── Authentication.jsx      # Authentication component
    │   └── ConnectionTest.jsx      # Light control interface
    ├── services/
    │   └── hueApi.js               # Hue API service (via proxy)
    └── hooks/
        └── useHueBridge.js         # Bridge state management hook
```

## Available Scripts

### `npm start`
Starts both the proxy server and dev server concurrently (recommended)

### `npm run dev`
Starts the React development server at http://localhost:5173

### `npm run proxy`
Starts the CORS proxy server at http://localhost:3001

### `npm run build`
Builds the app for production to the `dist` folder

### `npm run preview`
Preview the production build locally

## UI Features

### Responsive Card Layout

- **Large screens (>1200px)**: 4 cards per row
- **Medium screens (768px-1200px)**: 3 cards per row
- **Small screens (<768px)**: 1 card full width

### Dynamic Button Sizing

Buttons scale with viewport width:
- **Minimum**: 60px (maintains usability on small screens)
- **Maximum**: 80px (prevents oversized buttons on large displays)
- **Icons**: Scale to 90% of button size
- **Cards**: Always fit at least 5 buttons horizontally (4 on large screens)

### Visual Feedback

- **Green buttons**: Lights are on
- **Red buttons**: Lights are off
- **Loading indicators**: Show when toggling lights or activating scenes
- **Unreachable lights**: Warning indicator displayed
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

This app uses the **Philips Hue Local API v1**:

### Endpoints Used

- `GET https://discovery.meethue.com/` - Discover bridges on network
- `POST http://{bridge-ip}/api` - Create new user (requires link button)
- `GET http://{bridge-ip}/api/{username}/lights` - Get all lights
- `GET http://{bridge-ip}/api/{username}/groups` - Get rooms/zones
- `GET http://{bridge-ip}/api/{username}/scenes` - Get scenes
- `PUT http://{bridge-ip}/api/{username}/lights/{id}/state` - Control light
- `PUT http://{bridge-ip}/api/{username}/groups/{id}/action` - Activate scene
- `GET http://{bridge-ip}/api/config` - Get bridge config (unauthenticated)

### Official Documentation

- [Philips Hue Developer Portal](https://developers.meethue.com/)
- [Getting Started Guide](https://developers.meethue.com/develop/get-started-2/)
- [API Reference](https://developers.meethue.com/develop/hue-api/)

## Troubleshooting

### "Could not discover bridges"
- Ensure your device is on the same network as your Hue Bridge
- Try entering the IP address manually
- Check that your bridge is powered on and connected to your network

### "Could not connect to proxy server"
- Make sure the proxy server is running (`npm run proxy`)
- Check that nothing else is using port 3001
- Verify http://localhost:3001/health returns "ok"

### "Link button not pressed"
- Press the physical button on the bridge
- You have 30 seconds to click "Create Username"
- Try again if you missed the window

### Connection times out
- Verify the bridge IP address is correct
- Ensure your device and bridge are on the same network
- Check firewall settings
- Try restarting the bridge

### No lights showing up
- Ensure lights are paired with your bridge in the Hue app
- Check that lights are powered on
- Verify your credentials are correct
- Try refreshing the lights list

### Lights not responding
- Check that lights are powered on and reachable
- Unreachable lights show a warning icon (⚠️)
- Some lights may take a moment to respond
- Try toggling again if the first attempt fails

## Production Deployment

For production use:

1. **Build the React app**:
   ```bash
   npm run build
   ```

2. **Deploy the proxy server** on a server accessible to your network

3. **Update the proxy URL** in `src/services/hueApi.js` to point to your deployed proxy

4. **Serve the built files** from the `dist` folder

**Note**: The proxy server must be on the same network as your Hue Bridge for local API access.

## Security Notes

- Your bridge username is stored in browser localStorage
- The username acts as an API key - keep it secure
- Clear browser data to remove saved credentials
- The app communicates only with your local bridge
- The proxy server accepts self-signed certificates (required for Hue Bridge)
- No data is sent to external servers

## Contributing

This project demonstrates modern React patterns and responsive design. Feel free to fork and modify for your needs.

## License

MIT

## Acknowledgments

- Built with React, Vite, and Express
- Uses the Philips Hue Local API v1
- Responsive design with CSS Grid and Flexbox
- Dynamic sizing with CSS clamp() function

## Support

For issues related to:
- **This app**: Check the troubleshooting section above
- **Philips Hue Bridge**: Visit [Philips Hue Support](https://www.philips-hue.com/support)
- **Hue API**: Check the [Philips Hue Developer Portal](https://developers.meethue.com/)

---

**Built with ❤️ for the smart home community**
