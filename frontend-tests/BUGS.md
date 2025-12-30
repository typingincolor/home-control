# Bug Reports - Frontend Layout Issues

Issues discovered by automated layout tests running against Raspberry Pi 7" viewport (800x480).

---

## BUG-001: Settings page exceeds viewport height on Raspberry Pi 7"

**Severity:** High
**Component:** Frontend - Settings Page
**Test File:** `tests/01-layout-settings.spec.ts`
**Test:** `should display settings page within viewport`

### Description
The Settings page content extends beyond the 480px viewport height of the Raspberry Pi 7" touchscreen, requiring users to scroll to access all settings.

### Expected Behavior
All settings page content should fit within the 480px viewport height without requiring scrolling.

### Actual Behavior
- Settings page height: 569px
- Viewport height: 480px
- Overflow: 89px

### Steps to Reproduce
1. Start the application with a clean state (no stored credentials)
2. View the Settings page on an 800x480 viewport
3. Observe that the "Temperature Units" section is partially cut off

### Screenshot
See: `test-results/01-layout-settings-Setting-0aec4-ttings-page-within-viewport-raspberry-pi/test-failed-1.png`

### Suggested Fix
- Reduce vertical spacing between settings sections
- Consider a more compact layout for small viewports
- Use CSS media queries for viewport height <= 480px

---

## BUG-002: Settings page has no left edge padding

**Severity:** Medium
**Component:** Frontend - Settings Page
**Test File:** `tests/01-layout-settings.spec.ts`
**Test:** `should have minimum edge spacing for content`

### Description
The `.settings-page` container extends to the very left edge of the viewport (0px), violating the minimum 16px edge spacing requirement for touch-friendly interfaces.

### Expected Behavior
The settings page content should have at least 16px padding from the left edge of the viewport.

### Actual Behavior
- Left edge spacing: 0px
- Required minimum: 16px

### Steps to Reproduce
1. Start the application with a clean state
2. View the Settings page on an 800x480 viewport
3. Observe that the page container starts at x=0

### Suggested Fix
Add horizontal padding to the `.settings-page` container:
```css
.settings-page {
  padding-left: 16px;
  padding-right: 16px;
}
```

Or use a max-width with auto margins for centering.

---

## BUG-003: Settings page content is cut off on Raspberry Pi viewport

**Severity:** High
**Component:** Frontend - Settings Page
**Test File:** `tests/01-layout-settings.spec.ts`
**Test:** `should not have any elements cut off`

### Description
Settings page elements extend beyond the visible viewport area, causing content to be cut off and inaccessible without scrolling.

### Expected Behavior
All interactive elements should be fully visible within the viewport without requiring scroll.

### Actual Behavior
The settings page extends 89px past the bottom of the 480px viewport, cutting off the Temperature Units section and potentially the footer.

### Steps to Reproduce
1. Start the application with a clean state
2. View the Settings page on an 800x480 viewport
3. Observe the Temperature Units section is partially or fully hidden

### Impact
Users on Raspberry Pi touchscreens may not realize there are additional settings below the fold, or may have difficulty accessing them on a touch interface where scrolling is less intuitive.

### Related
- BUG-001 (same root cause)

---

## BUG-004: Settings page requires scrolling on Raspberry Pi 7" display

**Severity:** High
**Component:** Frontend - Settings Page
**Test File:** `tests/01-layout-settings.spec.ts`
**Test:** `should fit all content without scrolling on Raspberry Pi viewport`

### Description
The Settings page requires vertical scrolling on the Raspberry Pi 7" touchscreen (800x480), which degrades the user experience on a dedicated touch panel.

### Expected Behavior
For a dedicated touchscreen kiosk display, all essential settings should be accessible without scrolling.

### Actual Behavior
- `document.documentElement.scrollHeight` > `document.documentElement.clientHeight`
- Page requires vertical scroll to access all content

### Steps to Reproduce
1. Start the application with a clean state
2. View the Settings page on an 800x480 viewport
3. Attempt to access all settings - scrolling is required

### User Impact
- Touch scrolling is less intuitive than desktop scrolling
- Users may miss settings below the fold
- Degrades the "appliance-like" experience for a dedicated home control panel

### Suggested Fix
Design a compact settings layout for small viewports:
1. Use smaller font sizes for section labels
2. Reduce vertical margins/padding between sections
3. Consider collapsible sections or a tabbed interface
4. Use viewport-height-aware CSS (vh units or media queries)

Example media query:
```css
@media (max-height: 480px) {
  .settings-section {
    margin-bottom: 8px;
  }
  .settings-section-label {
    font-size: 12px;
    margin-bottom: 4px;
  }
}
```

---

## Summary

| Bug ID | Issue | Severity | Status |
|--------|-------|----------|--------|
| BUG-001 | Settings page exceeds viewport height | High | Open |
| BUG-002 | No left edge padding | Medium | Open |
| BUG-003 | Content cut off | High | Open |
| BUG-004 | Requires scrolling | High | Open |

### Root Cause Analysis
All four bugs stem from the same underlying issue: the Settings page was not designed with the Raspberry Pi 7" touchscreen (800x480) as a primary target viewport. The layout assumes a taller viewport where scrolling is acceptable.

### Recommended Priority
Fix BUG-001/003/004 together as they share the same root cause. BUG-002 can be fixed independently with a simple CSS padding change.

### Test Commands
```bash
# Run all settings layout tests
npm run test:layout -- --grep "Settings Page"

# Run specific failing tests
npm run test:layout -- --grep "within viewport"
npm run test:layout -- --grep "edge spacing"
npm run test:layout -- --grep "cut off"
npm run test:layout -- --grep "without scrolling"
```
