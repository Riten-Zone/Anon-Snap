import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  DEFAULT_STICKER_ID: '@anonsnap/default_sticker_id',
  CUSTOM_STICKERS: '@anonsnap/custom_stickers',
} as const;

export interface CustomStickerMeta {
  id: string;
  uri: string;
  createdAt: number;
}

export async function getDefaultStickerId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.DEFAULT_STICKER_ID);
}

export async function setDefaultStickerId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.DEFAULT_STICKER_ID, id);
}

export async function getCustomStickers(): Promise<CustomStickerMeta[]> {
  const json = await AsyncStorage.getItem(KEYS.CUSTOM_STICKERS);
  return json ? JSON.parse(json) : [];
}

export async function addCustomSticker(meta: CustomStickerMeta): Promise<void> {
  const existing = await getCustomStickers();
  existing.push(meta);
  await AsyncStorage.setItem(KEYS.CUSTOM_STICKERS, JSON.stringify(existing));
}

export async function removeCustomSticker(id: string): Promise<void> {
  const existing = await getCustomStickers();
  const filtered = existing.filter(s => s.id !== id);
  await AsyncStorage.setItem(KEYS.CUSTOM_STICKERS, JSON.stringify(filtered));
}
