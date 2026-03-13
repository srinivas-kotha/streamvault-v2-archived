# StreamVault Fire TV — Native WebView Wrapper

A native Android WebView wrapper that loads the StreamVault PWA on Fire Stick with proper D-pad remote support.

## Why This Exists

PWABuilder's TWA (Trusted Web Activity) requires Chrome, which is **not available on Fire OS**. Without Chrome, the TWA falls back to Silk browser where D-pad key events never reach JavaScript. This native wrapper gives us full control over the WebView and key event dispatch chain.

## How It Works

- Single Activity (`MainActivity.kt`) with a fullscreen WebView
- Loads `https://streamvault.srinivaskotha.uk`
- `dispatchKeyEvent()` override ensures D-pad events flow to WebView → JavaScript
- WebView has `isFocusable = true` + `requestFocus()` so key events are dispatched
- Back button navigates WebView history (or exits app if no history)
- Cookies enabled for JWT httpOnly auth
- DOM storage enabled for localStorage/sessionStorage

## Build (Option A: Android Studio)

1. Install [Android Studio](https://developer.android.com/studio)
2. Open the `fire-tv/` directory as an Android project
3. Build > Build Bundle(s) / APK(s) > Build APK(s)
4. Output: `app/build/outputs/apk/debug/app-debug.apk`

## Build (Option B: Command Line)

```bash
# Requires Android SDK + JDK 17
export ANDROID_HOME=$HOME/Android/Sdk

cd fire-tv
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

## Build Release APK (Signed)

```bash
# Generate a keystore (one time)
keytool -genkey -v -keystore streamvault.keystore \
  -alias streamvault -keyalg RSA -keysize 2048 -validity 10000

# Build release
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=$PWD/streamvault.keystore \
  -Pandroid.injected.signing.store.password=YOUR_PASSWORD \
  -Pandroid.injected.signing.key.alias=streamvault \
  -Pandroid.injected.signing.key.password=YOUR_PASSWORD

# Output: app/build/outputs/apk/release/app-release.apk
```

## Install on Fire Stick

### Via ADB (recommended)
```bash
# Enable ADB on Fire Stick: Settings > My Fire TV > Developer Options > ADB debugging
adb connect <fire-stick-ip>:5555
adb install app-release.apk
```

### Via Downloader App
1. Host the APK on a URL (e.g., GitHub release, or temporary file server)
2. On Fire Stick: Open Downloader app > enter URL > install

## Key Event Flow

```
Fire Stick Remote
  → Android KeyEvent (KEYCODE_DPAD_UP, etc.)
  → MainActivity.dispatchKeyEvent()
  → WebView.dispatchKeyEvent()
  → JavaScript window keydown event
  → LRUDProvider handleKeyDown()
  → lrud.handleKeyEvent({ direction: 'up' })
```

## Replacing the Old TWA APK

1. Uninstall the old StreamVault TWA APK from Fire Stick
2. Install this native WebView APK
3. The app appears on the Fire Stick home screen (LEANBACK_LAUNCHER intent)
