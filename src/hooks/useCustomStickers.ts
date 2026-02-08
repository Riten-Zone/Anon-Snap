import {useState, useEffect, useCallback} from 'react';
import type {StickerItem} from '../data/stickerRegistry';
import {
  loadCustomStickersAsStickerItems,
  saveCustomStickerImage,
  deleteCustomStickerImage,
} from '../services/CustomStickerService';

export function useCustomStickers() {
  const [customStickers, setCustomStickers] = useState<StickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomStickersAsStickerItems()
      .then(setCustomStickers)
      .catch(error => console.error('[useCustomStickers] Error loading:', error))
      .finally(() => setIsLoading(false));
  }, []);

  const addCustom = useCallback(async (processedImageUri: string) => {
    const meta = await saveCustomStickerImage(processedImageUri);
    const newItem: StickerItem = {
      id: meta.id,
      source: meta.uri,
      type: 'image',
    };
    setCustomStickers(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const removeCustom = useCallback(async (id: string) => {
    await deleteCustomStickerImage(id);
    setCustomStickers(prev => prev.filter(s => s.id !== id));
  }, []);

  return {customStickers, isLoading, addCustom, removeCustom};
}
