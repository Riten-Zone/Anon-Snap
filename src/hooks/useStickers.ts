import {useCallback, useState} from 'react';
import type {StickerData, DetectedFace} from '../types';
import {generateId} from '../utils';

// Emoji sticker sources - these will be rendered as text
export const EMOJI_STICKERS = [
  {id: 'smile', emoji: '😊', label: 'Smile'},
  {id: 'sunglasses', emoji: '😎', label: 'Cool'},
  {id: 'mask', emoji: '🎭', label: 'Mask'},
  {id: 'robot', emoji: '🤖', label: 'Robot'},
  {id: 'star', emoji: '⭐', label: 'Star'},
  {id: 'heart', emoji: '❤️', label: 'Heart'},
  {id: 'fire', emoji: '🔥', label: 'Fire'},
  {id: 'ghost', emoji: '👻', label: 'Ghost'},
];

export function useStickers(initialFaces: DetectedFace[] = []) {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null,
  );

  // Initialize blur stickers for detected faces
  const initializeBlurStickers = useCallback((faces: DetectedFace[]) => {
    const blurStickers: StickerData[] = faces.map(face => ({
      id: generateId(),
      type: 'blur',
      source: 'blur',
      x: face.bounds.x,
      y: face.bounds.y,
      width: face.bounds.width,
      height: face.bounds.height,
      rotation: 0,
      scale: 1,
      isSelected: false,
    }));
    setStickers(blurStickers);
  }, []);

  // Add a new sticker
  const addSticker = useCallback(
    (emoji: string, x: number, y: number) => {
      const newSticker: StickerData = {
        id: generateId(),
        type: 'emoji',
        source: emoji,
        x: x - 50, // Center the sticker
        y: y - 50,
        width: 100,
        height: 100,
        rotation: 0,
        scale: 1,
        isSelected: true,
      };

      setStickers(prev =>
        prev.map(s => ({...s, isSelected: false})).concat(newSticker),
      );
      setSelectedStickerId(newSticker.id);
    },
    [],
  );

  // Replace a blur sticker with an emoji
  const replaceWithEmoji = useCallback((stickerId: string, emoji: string) => {
    setStickers(prev =>
      prev.map(s =>
        s.id === stickerId ? {...s, type: 'emoji', source: emoji} : s,
      ),
    );
  }, []);

  // Update sticker position
  const updateStickerPosition = useCallback((id: string, x: number, y: number) => {
    setStickers(prev =>
      prev.map(s => (s.id === id ? {...s, x, y} : s)),
    );
  }, []);

  // Update sticker scale
  const updateStickerScale = useCallback((id: string, scale: number) => {
    setStickers(prev =>
      prev.map(s => (s.id === id ? {...s, scale: Math.max(0.2, Math.min(3, scale))} : s)),
    );
  }, []);

  // Update sticker rotation
  const updateStickerRotation = useCallback((id: string, rotation: number) => {
    setStickers(prev =>
      prev.map(s => (s.id === id ? {...s, rotation} : s)),
    );
  }, []);

  // Delete a sticker
  const deleteSticker = useCallback((id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    if (selectedStickerId === id) {
      setSelectedStickerId(null);
    }
  }, [selectedStickerId]);

  // Select a sticker
  const selectSticker = useCallback((id: string | null) => {
    setSelectedStickerId(id);
    setStickers(prev =>
      prev.map(s => ({...s, isSelected: s.id === id})),
    );
  }, []);

  // Deselect all stickers
  const deselectAll = useCallback(() => {
    setSelectedStickerId(null);
    setStickers(prev => prev.map(s => ({...s, isSelected: false})));
  }, []);

  return {
    stickers,
    selectedStickerId,
    initializeBlurStickers,
    addSticker,
    replaceWithEmoji,
    updateStickerPosition,
    updateStickerScale,
    updateStickerRotation,
    deleteSticker,
    selectSticker,
    deselectAll,
  };
}
