import {useCallback, useState} from 'react';
import type {StickerData, DetectedFace} from '../types';
import {generateId} from '../utils';
import {ALL_STICKERS, STICKER_COLLECTIONS} from '../data/stickerRegistry';

// Default sticker for detected faces (hypurr13_no_bg)
const DEFAULT_FACE_STICKER = STICKER_COLLECTIONS[0].stickers[2];

// Re-export for backward compatibility
export const HYPURR_FACE_STICKERS = ALL_STICKERS;

export function useStickers(initialFaces: DetectedFace[] = []) {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null,
  );
  const [isAddMode, setIsAddMode] = useState(false);
  const [isSwitchMode, setIsSwitchMode] = useState(false);
  const [pendingSticker, setPendingSticker] = useState<{source: number; type: 'image' | 'blur'} | null>(null);
  const [largestFaceSize, setLargestFaceSize] = useState<{width: number; height: number}>({width: 100, height: 100});
  const [undoneStickers, setUndoneStickers] = useState<StickerData[]>([]);

  // Initialize stickers for detected faces (uses hypurr13 by default)
  const initializeBlurStickers = useCallback((faces: DetectedFace[]) => {
    // Find the largest face by area
    let largestArea = 0;
    let largestSize = {width: 100, height: 100};

    const faceStickers: StickerData[] = faces.map(face => {
      const width = face.bounds.width;
      const height = face.bounds.height * 1.3;
      const y = face.bounds.y - (height - face.bounds.height) / 2;

      // Track the largest face
      const area = width * height;
      if (area > largestArea) {
        largestArea = area;
        largestSize = {width, height};
      }

      return {
        id: generateId(),
        type: 'image',
        source: DEFAULT_FACE_STICKER.source,
        x: face.bounds.x,
        y: y,
        width: width,
        height: height,
        rotation: 0,
        scale: 1,
        isSelected: false,
      };
    });

    setLargestFaceSize(largestSize);
    setStickers(faceStickers);
  }, []);

  // Add a new sticker (image or blur) - uses largest face size
  const addSticker = useCallback(
    (imageSource: number, x: number, y: number, stickerType: 'image' | 'blur' = 'image') => {
      const newSticker: StickerData = {
        id: generateId(),
        type: stickerType,
        source: stickerType === 'blur' ? 'blur' : imageSource,
        x: x - largestFaceSize.width / 2, // Center the sticker
        y: y - largestFaceSize.height / 2,
        width: largestFaceSize.width,
        height: largestFaceSize.height,
        rotation: 0,
        scale: 1,
        isSelected: true,
      };

      setStickers(prev =>
        prev.map(s => ({...s, isSelected: false})).concat(newSticker),
      );
      setSelectedStickerId(newSticker.id);
    },
    [largestFaceSize],
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
      // Save the undone sticker for redo
      const undoneSticker = prev[lastImageIndex];
      setUndoneStickers(undone => [...undone, undoneSticker]);
      return prev.filter((_, index) => index !== lastImageIndex);
    });
  }, []);

  // Redo last undone sticker
  const redoLastSticker = useCallback(() => {
    setUndoneStickers(prev => {
      if (prev.length === 0) return prev;
      const stickerToRestore = prev[prev.length - 1];
      setStickers(stickers => [...stickers, stickerToRestore]);
      return prev.slice(0, -1);
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
    redoLastSticker,
    undoneStickers,
  };
}
