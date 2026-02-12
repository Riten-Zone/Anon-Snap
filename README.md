# Anon Snap

A privacy-preserving photo app for iOS. Take photos, automatically detect faces and apply Hypurr stickers, customize with your own uploads, and share - all 100% offline with no data leaving your device.

## What's New ✨

**Custom Sticker Enhancements:**
- Custom stickers now available in both Add and Switch modes
- Randomise button for custom stickers (when you have 2+ uploaded)
- Full feature parity between built-in and custom stickers

## Features
- Fully offline - privacy first
- Camera support (front and back)
- Import photos from gallery
- On-device face detection (MLKit - no internet required)
- Automatic face detection with Hypurr stickers applied by default
- Customizable default sticker (set any sticker as the default for detected faces)
- 21 built-in stickers across 5 themed collections + custom sticker upload
- Upload custom stickers with automatic background removal (iOS VisionKit)
- Snapchat-like sticker editing (move, rotate, scale, delete)
- Magnifier loupe when dragging stickers (see what's under your finger)
- Switch stickers - replace individual or all stickers at once
- Add stickers manually to any part of the image
- Randomize by collection or all stickers at once
- Set custom default sticker for auto-detected faces
- Freehand drawing mode
- Undo/Redo for all editing actions
- Export to gallery or share via native iOS share sheet

## Sticker Collections

| Collection | Count | Stickers |
|------------|-------|----------|
| Blur | 1 | Circle blur |
| Emoji | 1 | PoopEmoji |
| HypurrLiquid | 6 | Hypurr faces (1-6) |
| HypurrCo | 8 | Hypurr variants (wagmi, zzz, macdonald, and more) |
| Meme | 5 | Chad, PepeAngry, PepeSad, WojakMonkey, WojakVoid |
| Custom | Variable | User-uploaded stickers with background removed |

**Total: 21 built-in stickers + Custom stickers**

*More collections coming soon!*

## Key Features

### Auto Face Detection & Stickering
- Faces detected automatically using on-device ML (MLKit)
- **Default:** Hypurr stickers applied to detected faces
- **Customizable:** Set any sticker (built-in or custom) as the default

### Custom Stickers
- Upload your own stickers from gallery
- Automatic background removal using iOS VisionKit
- Save and reuse across photos
- Set as default for auto-detected faces

### Sticker Management
- **Switch One:** Replace individual sticker by tapping
- **Switch All:** Replace all stickers at once with the same sticker
- **Randomise All:** Randomize all stickers from entire collection
- **Randomise Collection:** Randomize stickers from a specific collection
- **Add to Crowd:** Manually add stickers anywhere on the image

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
