import {useCallback, useState} from 'react';
import type {StickerData, DetectedFace} from '../types';
import {generateId} from '../utils';

// Sticker sources - blur and hypurr faces
export const HYPURR_FACE_STICKERS = [
  {id: 'blur', source: require('../../assets/hypurr_face/blur_icon.png'), label: 'Blur', type: 'blur' as const},
  {id: 'face1', source: require('../../assets/hypurr_face/hypurr1_big_face_no_bg.png'), label: 'Hypurr 1', type: 'image' as const},
  {id: 'face2', source: require('../../assets/hypurr_face/hypurr2_big_face_no_bg.png'), label: 'Hypurr 2', type: 'image' as const},
  {id: 'face3', source: require('../../assets/hypurr_face/hypurr3_big_face__no_bg.png'), label: 'Hypurr 3', type: 'image' as const},
  {id: 'face4', source: require('../../assets/hypurr_face/hypurr4_big_face_no_bg.png'), label: 'Hypurr 4', type: 'image' as const},
];

export function useStickers(initialFaces: DetectedFace[] = []) {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null,
  );
  const [isAddMode, setIsAddMode] = useState(false);
  const [isSwitchMode, setIsSwitchMode] = useState(false);
  const [pendingSticker, setPendingSticker] = useState<{source: number; type: 'image' | 'blur'} | null>(null);

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

  // Add a new sticker (image or blur)
  const addSticker = useCallback(
    (imageSource: number, x: number, y: number, stickerType: 'image' | 'blur' = 'image') => {
      const newSticker: StickerData = {
        id: generateId(),
        type: stickerType,
        source: stickerType === 'blur' ? 'blur' : imageSource,
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

  // Replace a single sticker with another (image or blur)
  const replaceWithImage = useCallback((stickerId: string, imageSource: number, stickerType: 'image' | 'blur' = 'image') => {
    setStickers(prev =>
      prev.map(s =>
        s.id === stickerId ? {...s, type: stickerType, source: stickerType === 'blur' ? 'blur' : imageSource} : s,
      ),
    );
  }, []);

  // Replace ALL stickers with the same sticker (image or blur)
  const replaceAllWithImage = useCallback((imageSource: number, stickerType: 'image' | 'blur' = 'image') => {
    setStickers(prev =>
      prev.map(s => ({...s, type: stickerType, source: stickerType === 'blur' ? 'blur' : imageSource})),
    );
  }, []);

  // Replace ALL stickers with random hypurr images
  const replaceAllWithRandomImages = useCallback((imageSources: number[]) => {
    setStickers(prev =>
      prev.map(s => {
        const randomSource = imageSources[Math.floor(Math.random() * imageSources.length)];
        return {...s, type: 'image' as const, source: randomSource};
      }),
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

  // Enter add mode (without sticker yet - picker will be shown)
  const enterAddMode = useCallback(() => {
    setIsAddMode(true);
    setIsSwitchMode(false);
  }, []);

  // Exit add mode
  const exitAddMode = useCallback(() => {
    setPendingSticker(null);
    setIsAddMode(false);
  }, []);

  // Enter switch mode
  const enterSwitchMode = useCallback(() => {
    setIsSwitchMode(true);
    setIsAddMode(false);
  }, []);

  // Exit switch mode
  const exitSwitchMode = useCallback(() => {
    setIsSwitchMode(false);
  }, []);

  // Add sticker at center of screen and set as pending for more placements
  const addStickerAtCenter = useCallback(
    (imageSource: number, centerX: number, centerY: number, stickerType: 'image' | 'blur' = 'image') => {
      addSticker(imageSource, centerX, centerY, stickerType);
      setPendingSticker({source: imageSource, type: stickerType}); // Set as pending so tapping screen adds more
    },
    [addSticker],
  );

  // Add sticker at position (used when tapping in add mode)
  const addStickerAtPosition = useCallback(
    (x: number, y: number) => {
      if (!pendingSticker) return;
      addSticker(pendingSticker.source, x, y, pendingSticker.type);
    },
    [pendingSticker, addSticker],
  );

  // Undo last added sticker (removes the most recently added image sticker)
  const undoLastSticker = useCallback(() => {
    setStickers(prev => {
      // Find the last image sticker (not blur)
      const lastImageIndex = prev.map(s => s.type).lastIndexOf('image');
      if (lastImageIndex === -1) return prev;
      return prev.filter((_, index) => index !== lastImageIndex);
    });
  }, []);

  return {
    stickers,
    selectedStickerId,
    isAddMode,
    isSwitchMode,
    pendingSticker,
    initializeBlurStickers,
    addSticker,
    replaceWithImage,
    replaceAllWithImage,
    replaceAllWithRandomImages,
    updateStickerPosition,
    updateStickerScale,
    updateStickerRotation,
    deleteSticker,
    selectSticker,
    deselectAll,
    enterAddMode,
    exitAddMode,
    enterSwitchMode,
    exitSwitchMode,
    addStickerAtPosition,
    addStickerAtCenter,
    undoLastSticker,
  };
}
