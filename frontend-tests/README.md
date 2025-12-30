# Frontend E2E Tests

Production smoke tests for the Home Control app, targeting **Raspberry Pi 7" touchscreen** (800x480 viewport).

These tests run against a **live production server** - not mocked - and have already uncovered several real bugs:

- Layout overflow on Raspberry Pi viewport
- Automations tab showing when only Hive connected
- Touch targets too small for touchscreen use
- Settings page requiring scroll on small screens

## Quick Start

```bash
# 1. Start the production server (in another terminal)
cd /path/to/home-control
npm run deploy  # Starts on port 3002

# 2. Run automated tests (no human input needed)
cd frontend-tests
npm install
PROD_URL=http://localhost:3002 npm run test:auto
```

## Test Categories

### Automated Tests (No Human Input)

These tests run completely automatically and verify layout, connectivity, and basic functionality.

| Script          | Tests | Description                                                 |
| --------------- | ----- | ----------------------------------------------------------- |
| `test:auto`     | 27    | Core tests: connectivity, settings layout, dashboard layout |
| `test:auto:all` | 32    | Extended: adds Hive login layout tests                      |

```bash
# Run core automated tests
PROD_URL=http://localhost:3002 npm run test:auto

# Run all automated tests including Hive layout
PROD_URL=http://localhost:3002 npm run test:auto:all
```

### Interactive Tests (Require Human Input)

These tests need user interaction - entering credentials, verifying physical lights changed, etc.

| Script                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `test:interactive:hue`  | Hue pairing and light control tests      |
| `test:interactive:hive` | Hive login with 2FA and thermostat tests |

## Environment Setup

### Using .env File (Recommended)

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Hive credentials for interactive tests
export HIVE_EMAIL=your-email@example.com
export HIVE_PASSWORD='your-password'

# Hue Bridge IP for interactive tests
export HUE_BRIDGE_IP=192.168.1.xxx

# Production URL
export PROD_URL=http://localhost:3002
```

**Important:** The `export` keyword is required for variables to be passed to Playwright.

Then source and run:

```bash
source .env && npm run test:interactive:hive
```

### Secure Password Entry

If you don't want to store passwords in a file:

```bash
# Prompt for password without echoing
read -sp "Hive Password: " HIVE_PASSWORD && \
  export HIVE_PASSWORD && \
  export HIVE_EMAIL=your@email.com && \
  export PROD_URL=http://localhost:3002 && \
  npm run test:interactive:hive
```

## Running Interactive Hive Tests

The Hive tests require real credentials and SMS 2FA verification.

```bash
source .env && npm run test:interactive:hive
```

**What happens:**

1. Test navigates to Settings → Hive toggle
2. Fills in email/password from environment variables
3. Submits login → Hive sends SMS with 2FA code
4. **Playwright Inspector opens** - test pauses
5. You enter the 6-digit code in the browser
6. Click "Verify" in the app
7. Click **"Resume"** in Playwright Inspector
8. Test verifies successful login

### Playwright Inspector Controls

When a test pauses with `page.pause()`:

- **Resume** (▶️) - Continue test execution
- **Step Over** - Execute next action
- **Pick Locator** - Inspect elements

## Running Interactive Hue Tests

The Hue tests require a real Hue Bridge on the same network.

```bash
export HUE_BRIDGE_IP=192.168.68.90
export PROD_URL=http://localhost:3002
npm run test:interactive:hue
```

**What happens:**

1. Tests navigate through Hue pairing flow
2. You may need to press the Hue Bridge button
3. Tests toggle lights and ask you to confirm they changed
4. Click "Resume" when prompted to continue

## Test Files

| File                          | Description                           |
| ----------------------------- | ------------------------------------- |
| `00-connectivity.spec.ts`     | Server health, WebSocket connectivity |
| `01-layout-settings.spec.ts`  | Settings page fits 800x480 viewport   |
| `02-layout-discovery.spec.ts` | Discovery page layout                 |
| `03-layout-auth.spec.ts`      | Authentication page layout            |
| `04-layout-dashboard.spec.ts` | Dashboard, rooms, zones layout        |
| `05-hue-pairing.spec.ts`      | Hue Bridge discovery and pairing      |
| `06-hue-controls.spec.ts`     | Light toggle, brightness, scenes      |
| `07-hive-login.spec.ts`       | Hive login with 2FA flow              |
| `08-hive-controls.spec.ts`    | Thermostat and hot water controls     |

## What These Tests Check

### Layout Tests

- **No scrolling required** on 800x480 viewport
- **Touch targets ≥ 44px** for fingers
- **No overlapping elements**
- **Content not cut off** at edges
- **Proper spacing** from screen edges

### Connectivity Tests

- Server health endpoint responds
- WebSocket connection establishes
- Session management works

### Functional Tests

- Service toggles work correctly
- Login flows complete successfully
- Controls respond to interaction
- Real-time updates via WebSocket

## Troubleshooting

### "net::ERR_CONNECTION_REFUSED"

The production server isn't running or wrong port:

```bash
# Check server is running
curl http://localhost:3002/api/health

# Start server if needed
cd /path/to/home-control && npm run deploy
```

### "HIVE_EMAIL or HIVE_PASSWORD not set"

Environment variables not exported:

```bash
# Make sure to use 'source' not 'sh'
source .env && npm run test:interactive:hive

# Or export manually
export HIVE_EMAIL=your@email.com
export HIVE_PASSWORD='yourpassword'
```

### Tests timeout waiting for selector

The app UI may have changed. Check:

1. Open `http://localhost:3002` in browser
2. Compare actual element classes/IDs with test selectors
3. Update selectors in test files if needed

### "page.pause() doesn't pause"

`page.pause()` only works in headed mode:

```bash
# Make sure you're using the interactive script (includes --headed)
npm run test:interactive:hive

# NOT the regular test command
npm test  # This runs headless
```

### Hive 2FA code doesn't work

Each test that submits credentials triggers a **new SMS code**. Make sure you:

1. Wait for the new SMS after test submits login
2. Enter the code from the **most recent** SMS
3. Don't use a code from a previous test run

## Bugs Found By These Tests

### BUG-001: Settings page exceeds viewport height

- **Found:** Layout test detected scrollHeight > clientHeight
- **Fixed:** Added responsive CSS for max-height: 480px

### BUG-002: Automations tab shows without Hue

- **Found:** Screenshot showed Automations when only Hive connected
- **Fixed:** Derive hueConnected from sessionToken presence

### BUG-003: Touch targets too small

- **Found:** Input fields only 38px height
- **Fixed:** Added min-height: 44px for touch accessibility

### BUG-004: Toggle selectors incorrect

- **Found:** Tests couldn't click service toggles
- **Fixed:** Use `.service-toggle-switch` not `.service-toggle`

## Development

### Adding New Tests

1. Create `XX-name.spec.ts` in `tests/`
2. Use `VIEWPORTS.raspberryPi` for consistent viewport
3. Add to appropriate npm script in `package.json`

### Test Utilities

- `src/constants.ts` - Viewport sizes, layout minimums
- `src/api-client.ts` - Backend API calls
- `src/prompts.ts` - Console output helpers

### Running Individual Tests

```bash
# Run specific test file
PROD_URL=http://localhost:3002 npx playwright test tests/01-layout-settings.spec.ts

# Run tests matching pattern
PROD_URL=http://localhost:3002 npx playwright test -g "Settings Page Layout"

# Run in headed mode for debugging
PROD_URL=http://localhost:3002 npx playwright test tests/01-layout-settings.spec.ts --headed
```

## CI Integration

For CI pipelines, use only automated tests:

```yaml
- name: Run E2E Tests
  run: |
    cd frontend-tests
    npm ci
    PROD_URL=${{ secrets.PROD_URL }} npm run test:auto
```

Interactive tests require human input and should only run locally.
