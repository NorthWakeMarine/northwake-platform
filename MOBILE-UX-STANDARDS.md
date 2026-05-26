# NorthWake Mobile UX Standards

Enforce these rules on every page change. Claude should audit any modified or newly created file against this spec before marking a task complete.

---

## Viewport Rules

- `maximumScale: 1` in the viewport export (prevents accidental pinch-zoom without breaking accessibility user zoom).
- `viewportFit: "cover"` for iOS notch support.
- Never set `user-scalable=no` — it fails WCAG 2.1 Success Criterion 1.4.4.

---

## Touch Targets

- All buttons, inputs, tab bar items, and links must have a minimum touch target of 44x44px.
- Verify with padding: a `text-xs` link needs at least `py-2.5 px-4` to reach 44px height.
- The ProShell bottom tab bar items are already 44px (`h-16` bar with `py-2` icons).

---

## CSS Touch Feel

- `-webkit-tap-highlight-color: transparent` is set globally in globals.css — do not remove.
- `.pro-shell { overscroll-behavior: none }` prevents rubber-band bounce on the dashboard — do not remove.
- `.chrome-btn:active { transform: scale(0.95) }` provides haptic-like visual feedback — keep on all CTA buttons.

---

## Dashboard Mobile Patterns

- Navigation: fixed bottom tab bar in ProShell (`md:hidden`, h-16, 5 primary tabs + More drawer).
- Kanban: MobileBoard stage-tab design (one stage at a time, horizontal tab scroll) — do NOT add horizontal column scroll on mobile.
- Content padding: all pro pages use `pb-16 md:pb-0` to clear the fixed bottom bar.
- Layout: `.pro-shell` root div has `flex min-h-screen` and `overscroll-behavior: none` — maintain this.

---

## Landing Page Mobile Patterns

- Hero form comes FIRST on mobile: form column uses `order-1 md:order-2`, logo column uses `order-2 md:order-1`.
- Input font-size is forced to 16px on mobile (globals.css) to prevent iOS auto-zoom — never drop below 16px on mobile inputs.
- Lead form card uses `chrome-stage-light bg-white/95 backdrop-blur-md` — do not change on mobile.
- The mobile menu max-height is `max-h-96` — if adding new nav links, verify they still fit.

---

## PWA Rules

- Service worker caching strategy (configured in next.config.ts):
  - `/pro/**` and `/api/**`: NetworkOnly — CRM data must never be stale or cached.
  - `/brand/`, `/images/`, `/icons/`: CacheFirst with 7-day TTL — static assets.
  - Never cache auth state or session tokens in the service worker.
- Manifest start_url is `/pro/pipeline` — do not change without updating the manifest.
- Icons live in `/public/icons/` — regenerate with `node scripts/generate-pwa-icons.mjs` if the logo changes.

---

## Regression Checklist

Before shipping any page change, verify:

1. Touch targets: every interactive element is at least 44x44px.
2. Landing page: lead form appears above the logo on a 375px viewport.
3. Dashboard: bottom tab bar is visible and content does not scroll behind it.
4. No new overflow on mobile that causes horizontal scroll.
5. Input font-size is not below 16px on mobile.
6. No new `overscroll-behavior` changes to `.pro-shell`.
