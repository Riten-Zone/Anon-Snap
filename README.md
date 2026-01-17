# Anon Snap

A privacy-preserving face anonymization app for iOS. Take photos, automatically detect and blur faces, add stickers, and share - all 100% offline with no data leaving your device.

## Features

- Camera support (front and back)
- Import photos from gallery
- On-device face detection (MLKit - no internet required)
- Automatic face blurring
- Snapchat-like sticker editing (move, rotate, scale, delete)
- Export to gallery, Twitter, or Telegram
- Fully offline - privacy first

## Prerequisites

- Node.js 18+
- Xcode 15+ with Command Line Tools
- CocoaPods (`sudo gem install cocoapods`)
- Physical iOS device (iOS 15.5+) - Face detection requires real device

## Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd Anon-Snap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install iOS pods:
   ```bash
   cd ios && pod install && cd ..
   ```

## Xcode Configuration (Required)

Before building, you must configure Xcode:

1. **Open the workspace** (NOT the .xcodeproj):
   ```bash
   open ios/AnonSnapTemp.xcworkspace
   ```

2. **Select the AnonSnapTemp target** in the left sidebar

3. **Go to "Signing & Capabilities" tab:**
   - Set your Development Team
   - Ensure "Automatically manage signing" is checked

4. **Go to "Build Settings" tab:**
   - Search for "User Script Sandboxing"
   - Set `ENABLE_USER_SCRIPT_SANDBOXING` to `NO` (fixes Hermes build)

## Running the App

1. Start Metro bundler:
   ```bash
   npm start
   ```

2. In a new terminal, build and run on device:
   ```bash
   npx react-native run-ios --device
   ```

3. If prompted, unlock your iPhone and trust the developer certificate:
   - Go to Settings → General → VPN & Device Management → Trust

## Troubleshooting

### Port 8081 already in use

Kill the existing process or use a different port:
```bash
lsof -i :8081
kill -9 <PID>

# Or use alternative port:
npm start -- --port 8082
```

### Code signing error

Open Xcode, select your target, and set your Development Team in Signing & Capabilities.

### Hermes sandbox build error

In Xcode Build Settings, search "User Script Sandboxing" and set to `NO`.

### "Connect to Metro" error on device

- Ensure Metro is running (`npm start`)
- Device and Mac must be on the same WiFi network
- Try shaking device → "Configure Bundler" → enter Mac's IP address

### Device shows as locked

Unlock your iPhone before running the build command.

## Tech Stack

| Library | Purpose |
|---------|---------|
| react-native-vision-camera | Camera access |
| react-native-vision-camera-face-detector | MLKit face detection |
| @shopify/react-native-skia | Drawing/compositing |
| react-native-gesture-handler | Sticker gestures |
| react-native-reanimated | Animations |

## Platform Requirements

- **iOS**: 15.5+ (VisionCamera requirement)
- **React Native**: 0.83+ (New Architecture)
- Physical device required for face detection
