# Bug Reports - Frontend Layout Issues

Issues discovered by automated layout tests running against Raspberry Pi 7" viewport (800x480).

---

## Fixed Bugs

### BUG-001: Settings page exceeds viewport height on Raspberry Pi 7" ✓ FIXED

**Severity:** High
**Component:** Frontend - Settings Page
**Fixed in:** PR #25

CSS media query added for `@media (max-height: 480px)` to reduce padding, margins, and font sizes. Settings page now fits within 480px viewport.

---

### BUG-002: Settings page has no left edge padding ✓ FIXED

**Severity:** Medium
**Component:** Frontend - Settings Page
**Fixed in:** PR #25

Left padding added to settings page for compact viewports.

---

### BUG-003: Settings page content is cut off on Raspberry Pi viewport ✓ FIXED

**Severity:** High
**Component:** Frontend - Settings Page
**Fixed in:** PR #25

Same root cause as BUG-001. Now fixed.

---

### BUG-004: Settings page requires scrolling on Raspberry Pi 7" display ✓ FIXED

**Severity:** High
**Component:** Frontend - Settings Page
**Fixed in:** PR #25

Same root cause as BUG-001. Now fixed.

---

### BUG-007: Automations tab shows when only Hive is connected ✓ FIXED

**Severity:** Medium
**Component:** Frontend - Dashboard BottomNav
**Fixed in:** commit db4638c

The Automations tab (which is for Hue scenes/schedules) was showing in the bottom navigation even when only Hive was connected and Hue was disconnected.

**Root cause:** BottomNav had hardcoded `hueConnected={true}` with comment "Always true here - Dashboard only renders when Hue is connected" - but this assumption was wrong after Hive-only mode was added.

**Fix:** Changed to `hueConnected={!!sessionToken}` to derive from actual Hue connection state.

---

## Open Bugs

### BUG-005: Discovery page exceeds viewport height on Raspberry Pi 7"

**Severity:** High
**Component:** Frontend - Bridge Discovery Page
**Test File:** `tests/02-layout-discovery.spec.ts`
**Test:** `should display discovery page within viewport`

#### Description

The Bridge Discovery page content extends beyond the 480px viewport height of the Raspberry Pi 7" touchscreen.

#### Expected Behavior

All discovery page content should fit within the 480px viewport height without requiring scrolling.

#### Actual Behavior

- Discovery page height: 655px
- Viewport height: 480px
- Overflow: 175px

#### Suggested Fix

Apply similar CSS media query treatment as Settings page:

```css
@media (max-height: 480px) {
  .bridge-discovery {
    padding: 8px 16px;
  }
  /* Reduce other spacing... */
}
```

---

### BUG-006: Authentication page exceeds viewport height on Raspberry Pi 7"

**Severity:** High
**Component:** Frontend - Authentication Page
**Test File:** `tests/03-layout-auth.spec.ts`

#### Description

The Authentication/Pairing page extends beyond the 480px viewport when navigating from Discovery. The tests timeout trying to find elements that are cut off.

#### Suggested Fix

Apply CSS media query for compact height viewport.

---

## Summary

| Bug ID  | Issue                                 | Severity | Status            |
| ------- | ------------------------------------- | -------- | ----------------- |
| BUG-001 | Settings page exceeds viewport height | High     | ✓ Fixed (PR #25)  |
| BUG-002 | No left edge padding                  | Medium   | ✓ Fixed (PR #25)  |
| BUG-003 | Content cut off                       | High     | ✓ Fixed (PR #25)  |
| BUG-004 | Requires scrolling                    | High     | ✓ Fixed (PR #25)  |
| BUG-005 | Discovery page exceeds viewport       | High     | Open              |
| BUG-006 | Auth page exceeds viewport            | High     | Open              |
| BUG-007 | Automations tab shows without Hue     | Medium   | ✓ Fixed (db4638c) |

### Test Commands

```bash
# Run all layout tests
npm test

# Run specific tests
npm test -- --grep "Settings Page"
npm test -- --grep "Discovery Page"
npm test -- --grep "Authentication Page"
```
