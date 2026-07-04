# Roadmap

What's planned next for Anon Snap.

## In-App Photo Gallery (Memories-style)
Saving to the iOS Camera Roll already works today (`src/services/GalleryService.ts`), but there's no way to browse past snaps without leaving the app. Goal: a Snapchat Memories-style gallery built into the app.

- [ ] Store anonymized snaps locally (thumbnails + originals)
- [ ] Grid view to browse past snaps from within the app
- [ ] Re-open a past snap to re-edit, re-share, or delete
- [ ] Keep this separate from / in addition to the existing Camera Roll save

## More Sticker Collections
- [ ] Additional themed sticker packs beyond the current 5 collections

## Android Polish
- [ ] Finish and test the gallery-save permission flow on Android (`WRITE_EXTERNAL_STORAGE` handling in `GalleryService.ts` is currently unverified on Android)
