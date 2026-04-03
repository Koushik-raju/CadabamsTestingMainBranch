# Phase 11 — Capacitor Hardening

## What was implemented

Phase 11 introduces a structured `lib/capacitor/` utility layer that centralises every Capacitor plugin interaction. The existing ad-hoc code in `components/common/capacitor-init.tsx` was replaced with a component that delegates to these utilities.

Key capabilities added:
- **Platform detection** — sync and async helpers to detect native/iOS/Android
- **Status bar** — light/dark style, show/hide
- **Safe area** — reads plugin insets on native and writes CSS custom properties; falls back to `env()` on web
- **Keyboard** — adds/removes `keyboard-open` class on `<body>` and updates `--keyboard-height` CSS var
- **Push notifications** — permission request, FCM registration, Firebase RTDB token storage, foreground and tap handling
- **Camera** — camera capture and gallery pick returning base64 data URLs
- **Deep links** — `App.addListener('appUrlOpen')` with route mapping, using `next/navigation` router
- **Razorpay** — native `@capacitor-community/razorpay` with web fallback via script tag
- **TextZoom** — forces zoom to 1.0 on iOS to prevent accessibility settings from breaking layout
- **CSS utilities** — `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`, `keyboard-open .bottom-nav { display: none }`

## Files created

| File | Purpose |
|---|---|
| `lib/capacitor/platform.ts` | `isNative()`, `isIOS()`, `isAndroid()`, `isNativeSync()` |
| `lib/capacitor/status-bar.ts` | `setStatusBarLight/Dark/hide/show` |
| `lib/capacitor/safe-area.ts` | `applySafeAreaVars()` |
| `lib/capacitor/keyboard.ts` | `setupKeyboardListeners()` → cleanup fn |
| `lib/capacitor/push-notifications.ts` | `initPushNotifications()`, `updateFcmToken()` |
| `lib/capacitor/camera.ts` | `capturePhoto()`, `pickFromGallery()` |
| `lib/capacitor/deep-links.ts` | `setupDeepLinks(router)` → cleanup fn |
| `lib/capacitor/razorpay.ts` | `openRazorpayNative(options)` |
| `lib/capacitor/text-zoom.ts` | `preventTextZoom()` |
| `lib/capacitor/index.ts` | Barrel re-export of all above |
| `types/razorpay.d.ts` | Shared `Window.Razorpay` global type declaration |
| `components/capacitor/capacitor-init.tsx` | Re-export shim pointing to `components/common/` |

## Files modified

| File | Change |
|---|---|
| `components/common/capacitor-init.tsx` | Full rewrite — delegates to lib utilities; adds push-notifications and deep-link setup |
| `app/globals.css` | Added `--keyboard-height`, env()-backed safe area vars, `.pt-safe`, `.pb-safe`, `.pl-safe`, `.pr-safe`, `.keyboard-open .bottom-nav` |

## Deviations from plan

1. **`components/common/capacitor-init.tsx` already existed** (it was a minimal stub from Phase 10). It was upgraded in-place rather than creating a new file in `components/capacitor/`. A re-export shim was added at `components/capacitor/capacitor-init.tsx` for the spec's reference path.

2. **`@capacitor-community/razorpay` not installed** — this optional native package is not in `package.json`. The native Razorpay path uses `new Function('return import(...)')()` to avoid a TypeScript module-resolution error at build time. The web path uses the standard Razorpay JS SDK script tag and works fully without the package.

3. **`Window.Razorpay` type conflict** — `app/(public)/checkout/page.tsx` previously had a local `declare global` block that conflicted with our global augmentation. It was removed from the page file and centralised in `types/razorpay.d.ts`.

4. **`app/layout.tsx` already had `<CapacitorInit />`** — no changes needed to the layout. The import path `@/components/common/capacitor-init` was already correct.

5. **Safe area vars in `globals.css`** — the existing vars used `0px` literals. They were updated to `env(safe-area-inset-*, 0px)` so iOS Safari also respects them without a native plugin.

## How to test on iOS/Android

### Safe area
- Run on a device with a notch / Dynamic Island / home indicator
- Inspect `document.documentElement.style` — `--safe-area-inset-*` should be non-zero
- Bottom navigation should not overlap the home indicator

### Keyboard
- Tap a text input — `document.body.classList` should gain `keyboard-open`
- `--keyboard-height` should equal the software keyboard height in px
- Bottom navigation (`bottom-nav` class) should disappear while keyboard is open

### Push notifications
- Log in as a user
- Accept the push permission prompt on first launch
- Verify `users/{lead_id}/fcmToken` is written in Firebase RTDB
- Send a test notification from Firebase Console — it should route to the correct page on tap

### Camera
```tsx
import { capturePhoto, pickFromGallery } from '@/lib/capacitor';
const url = await capturePhoto();   // opens camera
const url = await pickFromGallery(); // opens photo library
// url is a data: string or null
```

### Deep links
Configure an associated domain (iOS) / intent filter (Android) for `consult.cadabams.com`.
Open a universal link — the app should navigate to the mapped route without a full reload.

### Razorpay (native)
Install `@capacitor-community/razorpay` and sync:
```bash
pnpm add @capacitor-community/razorpay
npx cap sync
```
Then call `openRazorpayNative(options)` from a payment screen.

### TextZoom
On iOS, set Settings > Accessibility > Display & Text Size > Larger Text to a large value.
Launch the app — text sizes should remain unchanged.

## Known limitations

- `@capacitor-community/razorpay` is not installed; the native Razorpay path will throw at runtime on real devices until the package is added and `npx cap sync` is run.
- Push notification foreground display is not implemented (no local notification is shown). The `pushNotificationReceived` listener only logs. Components must poll SWR keys to react to incoming data.
- `capacitor-plugin-safe-area` v5 API (`getSafeAreaInsets`) is assumed. If the plugin API changes, `lib/capacitor/safe-area.ts` needs updating.
- Deep link routing covers the three explicit paths specified. Any other path on `consult.cadabams.com` is passed through as-is; ensure Next.js has matching routes or add more cases to `setupDeepLinks`.
