import RNFS from 'react-native-fs';
import type {StickerItem} from '../data/stickerRegistry';
import {
  addCustomSticker,
  removeCustomSticker,
  getCustomStickers,
  type CustomStickerMeta,
} from './StorageService';

const CUSTOM_STICKER_DIR = `${RNFS.DocumentDirectoryPath}/custom_stickers`;
const RELATIVE_DIR = 'custom_stickers';

async function ensureCustomStickerDir(): Promise<void> {
  const exists = await RNFS.exists(CUSTOM_STICKER_DIR);
  if (!exists) {
    await RNFS.mkdir(CUSTOM_STICKER_DIR);
  }
}

/** Reconstruct a valid file:// URI from sticker ID, using the current DocumentDirectoryPath */
function resolveUri(id: string): string {
  return `file://${RNFS.DocumentDirectoryPath}/${RELATIVE_DIR}/${id}.png`;
}

export async function saveCustomStickerImage(
  sourceUri: string,
): Promise<CustomStickerMeta> {
  await ensureCustomStickerDir();
  const id = `custom_${Date.now()}`;
  const destPath = `${CUSTOM_STICKER_DIR}/${id}.png`;

  const normalizedSource = sourceUri.replace('file://', '');
  await RNFS.copyFile(normalizedSource, destPath);

  const meta: CustomStickerMeta = {
    id,
    uri: `${RELATIVE_DIR}/${id}.png`,
    createdAt: Date.now(),
  };

  await addCustomSticker(meta);

  // Return with full resolved URI for immediate use
  return {...meta, uri: resolveUri(id)};
}

export async function deleteCustomStickerImage(id: string): Promise<void> {
  const stickers = await getCustomStickers();
  const sticker = stickers.find(s => s.id === id);
  if (sticker) {
    const filePath = `${RNFS.DocumentDirectoryPath}/${RELATIVE_DIR}/${id}.png`;
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
    }
    await removeCustomSticker(id);
  }
}

export async function loadCustomStickersAsStickerItems(): Promise<StickerItem[]> {
  const metas = await getCustomStickers();
  const items: StickerItem[] = [];
  for (const meta of metas) {
    const fullPath = `${RNFS.DocumentDirectoryPath}/${RELATIVE_DIR}/${meta.id}.png`;
    const exists = await RNFS.exists(fullPath);
    if (exists) {
      items.push({
        id: meta.id,
        source: `file://${fullPath}`,
        type: 'image' as const,
      });
    }
  }
  return items;
}
