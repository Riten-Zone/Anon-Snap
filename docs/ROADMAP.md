# Roadmap

What's planned next for Anon Snap.

## Private Album (Encrypted In-App Gallery)
Two save destinations: "Save to Photo Album" (existing — device Camera Roll, `GalleryService.ts`) and a new "Save to Private Album" — a second, private save destination that stores photos as encrypted, app-only data instead of the Camera Roll, browsable like a Snapchat Memories-style gallery.

- [ ] "Save to Private Album" as a second save option alongside "Save to Photo Album" in the share sheet
- [ ] Photos encrypted at rest (AES-256-GCM, key held in iOS Keychain) — never touches the Camera Roll
- [ ] Face ID / Touch ID unlock to open the album, falling back to the device passcode
- [ ] Grid view to browse album photos from within the app
- [ ] Per-photo actions: view full-size, share, delete, copy to the device Camera Roll

(Implemented in code; pending on-device verification before checking off.)

## More Sticker Collections
- [ ] Additional themed sticker packs beyond the current 5 collections

## Android Polish
- [ ] Finish and test the gallery-save permission flow on Android (`WRITE_EXTERNAL_STORAGE` handling in `GalleryService.ts` is currently unverified on Android)
