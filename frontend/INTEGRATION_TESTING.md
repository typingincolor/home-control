# Integration Testing Strategy

## What We Learned

During real-world testing with a Hue Bridge, we discovered several bugs that unit tests didn't catch:

1. **Missing Content-Type header** - Backend received `undefined` for `req.body`
2. **Infinite authentication loop** - Unmemoized `authenticate` callback caused infinite re-renders
3. **WebSocket error flash** - Error state not cleared when data arrived successfully
4. **Scene activation delay** - No optimistic updates, users waited up to 5 seconds
5. **Session persistence** - Username not saved for automatic recovery after server restart

## Why Unit Tests Didn't Catch These

### 1. No API Service Tests

- `hueApi.js` had **zero tests** initially
- No verification of HTTP headers, request bodies, or methods
- Added `hueApi.test.js` (15 tests) **after** discovering the bug

### 2. Component Tests Too Isolated

- No tests for `Authentication` component
- No tests for `useHueBridge` hook memoization
- Tests didn't verify callback stability across re-renders

### 3. No Integration Tests

- All tests were unit tests with heavy mocking
- Real-world integration scenarios weren't tested
- Timing issues and race conditions weren't caught

### 4. Mock-Heavy Tests Hid Real Behavior

- Tests verified **expected behavior**, not **actual behavior**
- Mocked `fetch`, `WebSocket`, `localStorage` completely
- Integration bugs slipped through

### 5. No Edge Case Testing

- Server restart → session recovery
- WebSocket disconnect → reconnect
- Optimistic updates → reconciliation
- Loading → error → success state transitions

## Integration Test Framework

We've created an integration test suite (`integration.test.jsx`) that uses:

- **MSW (Mock Service Worker)** - Realistic API mocking at the network level
- **Real components** - No component mocking
- **Real hooks** - No hook mocking
- **Real localStorage** - Proper persistence testing
- **Mock WebSocket** - Simulates connection lifecycle

### Test Categories

1. **Full Authentication Flow**
   - Discovery → Pairing → Session → Dashboard
   - Verifies Content-Type headers (regression test)

2. **Session Management**
   - Persists session to localStorage
   - Restores session on page reload
   - Auto-recovers after server restart

3. **WebSocket Connection**
   - Connects and receives initial state
   - No error flash during handshake (regression test)

4. **Scene Activation**
   - Optimistic updates (regression test)
   - Immediate UI feedback

5. **Error Handling**
   - 401 errors trigger auto-recovery
   - Network errors shown gracefully

6. **Regression Tests**
   - No infinite authentication loop (regression test)

## Test Status

**Current Status:**

- ✅ Framework setup complete
- ✅ localStorage mocking working
- ✅ MSW server configured
- ✅ WebSocket mocking implemented
- ⚠️ UI selectors need adjustment (tests expect specific button text/labels)

**Next Steps:**

1. Adjust test selectors to match actual UI
2. Add more edge cases
3. Add E2E tests with Playwright/Cypress
4. Run integration tests in CI/CD

## Running Integration Tests

```bash
# Run all integration tests
npm run test:run -- integration.test.jsx

# Run in watch mode
npm test -- integration.test.jsx

# Run with UI
npm run test:ui
```

## Test Coverage Strategy

Going forward, we should have:

1. **Unit Tests (70%)** - Pure functions, utilities, isolated components
2. **Integration Tests (25%)** - User flows, component + hook + API integration
3. **E2E Tests (5%)** - Critical paths with real backend

### What to Unit Test

- Pure utility functions (`colorConversion.js`, `validation.js`)
- Isolated component rendering
- Hook logic in isolation

### What to Integration Test

- Authentication flows
- Session management and persistence
- WebSocket connection lifecycle
- Optimistic updates + reconciliation
- Error handling and recovery

### What to E2E Test

- Complete user journeys with real backend
- Cross-browser compatibility
- Performance under load

## Key Takeaways

1. **Unit tests are necessary but not sufficient**
2. **Integration tests catch bugs that slip through mocks**
3. **Test user-facing behavior, not implementation details**
4. **Use realistic mocking (MSW) instead of jest.fn()**
5. **Test edge cases and error conditions**
6. **Verify state transitions, not just happy paths**

## Bugs That Would Have Been Caught

If these integration tests existed from the start:

| Bug                         | Test That Would Catch It                              |
| --------------------------- | ----------------------------------------------------- |
| Missing Content-Type header | "includes Content-Type header in pairing request"     |
| Infinite auth loop          | "does not create infinite authentication loop"        |
| WebSocket error flash       | "does not show error flash during initial connection" |
| Scene activation delay      | "updates lights immediately (optimistic update)"      |
| Session not persisting      | "persists session to localStorage"                    |
| No session recovery         | "auto-recovers session after server restart"          |

## Recommendations

1. **Add integration tests for new features** before implementation
2. **Test with real (mocked) API** using MSW, not jest.fn()
3. **Test state transitions** (loading → error → success)
4. **Test edge cases** (network errors, server restarts, race conditions)
5. **Run integration tests in CI** to catch regressions
6. **Add E2E tests** for critical user paths

## Resources

- [MSW Documentation](https://mswjs.io/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about#priority)
- [Kent C. Dodds - Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
