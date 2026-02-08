import RNFS from 'react-native-fs';
import type {StickerItem} from '../data/stickerRegistry';
import {
  addCustomSticker,
  removeCustomSticker,
  getCustomStickers,
  type CustomStickerMeta,
} from './StorageService';

const CUSTOM_STICKER_DIR = `${RNFS.DocumentDirectoryPath}/custom_stickers`;

async function ensureCustomStickerDir(): Promise<void> {
  const exists = await RNFS.exists(CUSTOM_STICKER_DIR);
  if (!exists) {
    await RNFS.mkdir(CUSTOM_STICKER_DIR);
  }
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
    uri: `file://${destPath}`,
    createdAt: Date.now(),
  };

  await addCustomSticker(meta);
  return meta;
}

export async function deleteCustomStickerImage(id: string): Promise<void> {
  const stickers = await getCustomStickers();
  const sticker = stickers.find(s => s.id === id);
  if (sticker) {
    const filePath = sticker.uri.replace('file://', '');
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
    }
    await removeCustomSticker(id);
  }
}

export async function loadCustomStickersAsStickerItems(): Promise<StickerItem[]> {
  const metas = await getCustomStickers();
  return metas.map(meta => ({
    id: meta.id,
    source: meta.uri,
    type: 'image' as const,
  }));
}
