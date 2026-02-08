import {useState, useEffect, useCallback} from 'react';
import {ALL_STICKERS, BLUR_STICKER} from '../data/stickerRegistry';
import type {StickerItem} from '../data/stickerRegistry';
import {getDefaultStickerId, setDefaultStickerId} from '../services/StorageService';
import {loadCustomStickersAsStickerItems} from '../services/CustomStickerService';

const FALLBACK =
  ALL_STICKERS.find(s => s.id === 'hypurrco_hypurr13_no_bg') ??
  ALL_STICKERS.find(s => s.type === 'image') ??
  BLUR_STICKER;

export function useDefaultSticker() {
  const [defaultSticker, setDefaultSticker] = useState<StickerItem>(FALLBACK);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const savedId = await getDefaultStickerId();
        if (savedId) {
          // Check built-in stickers first
          let found = ALL_STICKERS.find(s => s.id === savedId);
          if (!found) {
            // Check custom stickers
            const customs = await loadCustomStickersAsStickerItems();
            found = customs.find(s => s.id === savedId);
          }
          if (found) {
            setDefaultSticker(found);
          }
        }
      } catch (error) {
        console.error('[useDefaultSticker] Error loading default:', error);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const updateDefault = useCallback(async (sticker: StickerItem) => {
    setDefaultSticker(sticker);
    await setDefaultStickerId(sticker.id);
  }, []);

  return {defaultSticker, isLoaded, updateDefault};
}
