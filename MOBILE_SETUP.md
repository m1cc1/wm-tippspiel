# 📱 micci WC2026 – Mobile App Setup (Capacitor)

Turn your Next.js website into a native Android and iOS app using Capacitor.

---

## Prerequisites

### For Android
- [Node.js](https://nodejs.org) installed (you likely already have this)
- [Android Studio](https://developer.android.com/studio) installed (free)
- A Google Play Developer account ($25 one-time fee) to publish

### For iOS
- A **Mac** is required (Xcode only runs on macOS)
- [Xcode](https://apps.apple.com/app/xcode/id497799835) installed (free from App Store)
- An Apple Developer account ($99/year) to publish

---

## Step 1 — Install dependencies

Open a terminal in your project folder (`wm-tippspiel/`) and run:

```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

---

## Step 2 — Build the web app

Capacitor needs a static export of your Next.js app.

**First**, open `next.config.js` and uncomment the output line:

```js
const nextConfig = {
  reactStrictMode: true,
  output: 'export',   // ← uncomment this line
}
```

**Then build:**

```bash
npm run build
```

This creates an `out/` folder with your static site.

> ⚠️ Note: `output: 'export'` disables server-side API routes.
> Your `/api/scores` sync endpoint will only work on Vercel (not in the app).
> The app uses Supabase directly for all data — this is fine.

---

## Step 3 — Initialize Capacitor

```bash
npx cap init "micci WC2026" "ch.micci.wc2026" --web-dir out
```

- `"micci WC2026"` — app display name
- `"ch.micci.wc2026"` — bundle ID (reverse domain, use your own domain)
- `out` — the folder Next.js built into

---

## Step 4 — Add platforms

```bash
# Android
npx cap add android

# iOS (Mac only)
npx cap add ios
```

---

## Step 5 — Sync web code to native projects

Every time you change the web code and rebuild, run:

```bash
npm run build
npx cap sync
```

---

## Step 6 — Open in Android Studio / Xcode

```bash
# Open Android project
npx cap open android

# Open iOS project (Mac only)
npx cap open ios
```

### Android Studio
1. Wait for Gradle to sync (1-2 minutes)
2. Click the **▶ Run** button to test on emulator or real device
3. To build an APK for release: **Build → Generate Signed Bundle / APK**

### Xcode
1. Select your Team (Apple Developer account) in Signing & Capabilities
2. Click **▶** to run on simulator or real device
3. For App Store: **Product → Archive → Distribute App**

---

## App Icon

Replace the placeholder icons with real ones:

1. Create a **1024×1024 PNG** of the micci logo
2. Use [appicon.co](https://appicon.co) to generate all sizes automatically
3. **Android**: replace files in `android/app/src/main/res/mipmap-*/`
4. **iOS**: replace files in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Or place `icon-192.png` and `icon-512.png` in your `public/` folder (already configured in manifest).

---

## Splash Screen (optional)

```bash
npm install @capacitor/splash-screen
npx cap sync
```

Configure in `capacitor.config.ts`:

```ts
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ch.micci.wc2026',
  appName: 'micci WC2026',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
```

---

## Push Notifications (optional, for live score alerts)

```bash
npm install @capacitor/push-notifications
npx cap sync
```

This requires additional setup with Firebase (Android) and APNs (iOS).

---

## Publishing

### Google Play Store
1. Build a signed AAB: Android Studio → **Build → Generate Signed Bundle**
2. Go to [play.google.com/console](https://play.google.com/console)
3. Create new app → upload AAB → fill in store listing → publish

### Apple App Store
1. Archive in Xcode: **Product → Archive**
2. Upload to App Store Connect via Xcode Organizer
3. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
4. Fill in app details → submit for review (takes 1-3 days)

---

## Quick rebuild workflow (after code changes)

```bash
# 1. Make your changes to the Next.js code
# 2. Rebuild
npm run build

# 3. Sync to native
npx cap sync

# 4. Test
npx cap open android   # or ios
```

---

## Troubleshooting

**"Could not find the web assets directory"**
→ Make sure `npm run build` ran successfully and the `out/` folder exists

**Supabase auth not working in app**
→ Add your app's URL scheme to Supabase → Authentication → URL Configuration:
`ch.micci.wc2026://` as an allowed redirect URL

**White screen on launch**
→ Check that `webDir: 'out'` matches the actual output folder

---

*Built with [Capacitor](https://capacitorjs.com) · Next.js · Supabase*
