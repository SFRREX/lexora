---
name: frontend-ux-review
description: Guidance for reviewing accessibility (WCAG 2.2 AA), keyboard navigation, theme persistence, touch targets, and mobile responsiveness across Lexora's four primary views.
---

# Frontend UX & Accessibility Review for Lexora

Follow this procedure when assessing or refactoring UI components in Lexora:

## 1. Accessibility Checks (WCAG 2.2 AA)
- **Keyboard Navigation**:
  - Ensure all interactive elements (`<button>`, interactive `<mark>`, chips, and tabs) have `tabIndex={0}`, `role="button"`, and both `Enter` and `Space` key event handlers.
  - Visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#4fa3a8]`).
  - No keyboard traps inside modals or dialogs (ensure `Escape` dismisses drawers and popovers).
- **Accessible Names & ARIA**:
  - Every icon-only button must have an explicit `aria-label`.
  - Dynamic status changes must use appropriate `aria-live` or status labels.
- **Color Contrast**:
  - Text must meet minimum 4.5:1 contrast against background in both Light mode (`#ffffff`, `#f8fafc`) and Dark mode (`#0f1115`, `#14171f`).
  - Do not convey information solely through color (pair colored badges with text descriptions and icons).

## 2. Responsive Layout Inspection
- Test layouts across standard viewport widths:
  - 320px (compact mobile)
  - 375px / 390px (standard mobile)
  - 768px (tablet)
  - 1024px (desktop)
  - 1440px (wide desktop)
- Guard against horizontal overflow (`max-w-full`, `overflow-x-hidden`).
- Ensure navigation drawer collapses cleanly on mobile.

## 3. Interaction & State Hygiene
- **Empty & Error States**: Verify that every view provides constructive feedback when no input is provided or when an API error occurs.
- **Outdated Results**: Invalidate or clearly mark scan results when user edits text after an initial run.
- **Touch Ergonomics**: Ensure primary buttons meet minimum touch target sizes (≥ 44×44px where possible, minimum 24×24px).
