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
  const [isAddMode, setIsAddMode] = useState(false);
  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null);

  // Initialize blur stickers for detected faces
  const initializeBlurStickers = useCallback((faces: DetectedFace[]) => {
    const blurStickers: StickerData[] = faces.map(face => {
      // Make the blur area more oval-shaped (faces are taller than wide)
      const width = face.bounds.width;
      const height = face.bounds.height * 1.3; // Extend height for oval shape
      const y = face.bounds.y - (height - face.bounds.height) / 2; // Center vertically

      return {
        id: generateId(),
        type: 'blur',
        source: 'blur',
        x: face.bounds.x,
        y: y,
        width: width,
        height: height,
        rotation: 0,
        scale: 1,
        isSelected: false,
      };
    });
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

  // Enter add mode (without emoji yet - picker will be shown)
  const enterAddMode = useCallback(() => {
    setIsAddMode(true);
  }, []);

  // Add sticker at center of screen and set as pending for more placements
  const addStickerAtCenter = useCallback(
    (emoji: string, centerX: number, centerY: number) => {
      addSticker(emoji, centerX, centerY);
      setPendingEmoji(emoji); // Set as pending so tapping screen adds more
    },
    [addSticker],
  );

  // Exit add mode
  const exitAddMode = useCallback(() => {
    setPendingEmoji(null);
    setIsAddMode(false);
  }, []);

  // Add sticker at position (used when tapping in add mode)
  const addStickerAtPosition = useCallback(
    (x: number, y: number) => {
      if (!pendingEmoji) return;
      addSticker(pendingEmoji, x, y);
    },
    [pendingEmoji, addSticker],
  );

  // Undo last added sticker (removes the most recently added emoji sticker)
  const undoLastSticker = useCallback(() => {
    setStickers(prev => {
      // Find the last emoji sticker (not blur)
      const lastEmojiIndex = prev.map(s => s.type).lastIndexOf('emoji');
      if (lastEmojiIndex === -1) return prev;
      return prev.filter((_, index) => index !== lastEmojiIndex);
    });
  }, []);

  return {
    stickers,
    selectedStickerId,
    isAddMode,
    pendingEmoji,
    initializeBlurStickers,
    addSticker,
    replaceWithEmoji,
    updateStickerPosition,
    updateStickerScale,
    updateStickerRotation,
    deleteSticker,
    selectSticker,
    deselectAll,
    enterAddMode,
    exitAddMode,
    addStickerAtPosition,
    addStickerAtCenter,
    undoLastSticker,
  };
}
