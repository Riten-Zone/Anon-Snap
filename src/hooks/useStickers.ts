import {useCallback, useState} from 'react';
import type {StickerData, DetectedFace} from '../types';
import {generateId} from '../utils';
import {ALL_STICKERS, BLUR_STICKER} from '../data/stickerRegistry';

// Default sticker for detected faces - hypurr13_no_bg from HypurrCo
const DEFAULT_FACE_STICKER =
  ALL_STICKERS.find(s => s.id === 'hypurrco_hypurr13_no_bg') ??
  ALL_STICKERS.find(s => s.type === 'image') ??
  BLUR_STICKER;

// Re-export for backward compatibility
export const HYPURR_FACE_STICKERS = ALL_STICKERS;

export function useStickers(initialFaces: DetectedFace[] = []) {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null,
  );
  const [isAddMode, setIsAddMode] = useState(false);
  const [isSwitchMode, setIsSwitchMode] = useState(false);
  const [lastChosenSticker, setLastChosenSticker] = useState<{source: number; type: 'image' | 'blur'}>({
    source: DEFAULT_FACE_STICKER.source,
    type: 'image',
  });
  const [largestFaceSize, setLargestFaceSize] = useState<{width: number; height: number}>({width: 100, height: 100});
  const [smallestFaceSize, setSmallestFaceSize] = useState<{width: number; height: number}>({width: 100, height: 100});
  const [lastUsedScale, setLastUsedScale] = useState<number | null>(null);
  const [undoneStickers, setUndoneStickers] = useState<StickerData[]>([]);

  // Initialize stickers for detected faces (uses hypurr13 by default)
  const initializeBlurStickers = useCallback((faces: DetectedFace[]) => {
    if (faces.length === 0) {
      setStickers([]);
      return;
    }

    // First pass: find largest and smallest face by area
    let largestArea = 0;
    let largestSize = {width: 100, height: 100};
    let smallestArea = Infinity;
    let smallestSize = {width: 100, height: 100};

    const faceBounds = faces.map(face => {
      const width = face.bounds.width;
      const height = face.bounds.height * 1.3;
      const y = face.bounds.y - (height - face.bounds.height) / 2;
      const area = width * height;

      if (area > largestArea) {
        largestArea = area;
        largestSize = {width, height};
      }
      if (area < smallestArea) {
        smallestArea = area;
        smallestSize = {width, height};
      }

      return {x: face.bounds.x, y, width, height};
    });

    // Second pass: create stickers using largestFaceSize for dimensions
    // and calculate scale based on each face's actual size
    const faceStickers: StickerData[] = faceBounds.map(bounds => {
      // Calculate scale so visual size matches the actual face bounds
      const faceScale = bounds.width / largestSize.width;

      // Center position: adjust x,y to account for using largestSize dimensions
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;

      return {
        id: generateId(),
        type: 'image',
        source: DEFAULT_FACE_STICKER.source,
        x: centerX - largestSize.width / 2,
        y: centerY - largestSize.height / 2,
        width: largestSize.width,
        height: largestSize.height,
        rotation: 0,
        scale: faceScale,
        isSelected: false,
      };
    });

    setLargestFaceSize(largestSize);
    setSmallestFaceSize(smallestSize);
    setStickers(faceStickers);
  }, []);

  // Add a new sticker (image or blur) - uses largest face size
  // Scale defaults to match smallest detected face, or user's last used scale
  // Returns the created sticker for action history tracking
  const addSticker = useCallback(
    (imageSource: number, x: number, y: number, stickerType: 'image' | 'blur' = 'image'): StickerData => {
      // Calculate default scale from smallest/largest face ratio
      const defaultScale = smallestFaceSize.width / largestFaceSize.width;
      const scaleToUse = lastUsedScale ?? defaultScale;

      const newSticker: StickerData = {
        id: generateId(),
        type: stickerType,
        source: stickerType === 'blur' ? 'blur' : imageSource,
        x: x - largestFaceSize.width / 2, // Center the sticker
        y: y - largestFaceSize.height / 2,
        width: largestFaceSize.width,
        height: largestFaceSize.height,
        rotation: 0,
        scale: Math.max(0.01, Math.min(3, scaleToUse)),
        isSelected: true,
      };

      setStickers(prev =>
        prev.map(s => ({...s, isSelected: false})).concat(newSticker),
      );
      setSelectedStickerId(newSticker.id);
      return newSticker;
    },
    [largestFaceSize, smallestFaceSize, lastUsedScale],
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

  // Replace ALL stickers with specified image sources (one per sticker)
  // Used for applying pre-computed random or specific assignments
  const replaceAllWithSources = useCallback((sources: number[]) => {
    setStickers(prev =>
      prev.map((s, i) => ({...s, type: 'image' as const, source: sources[i % sources.length]})),
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
      prev.map(s => (s.id === id ? {...s, scale: Math.max(0.01, Math.min(3, scale))} : s)),
    );
  }, []);

  // Save last used scale for new stickers
  const saveLastUsedScale = useCallback((scale: number) => {
    setLastUsedScale(Math.max(0.01, Math.min(3, scale)));
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

  // Select a sticker (moves it to end of array so it renders on top)
  const selectSticker = useCallback((id: string | null) => {
    setSelectedStickerId(id);
    setStickers(prev => {
      // Find the selected sticker and move it to the end (so it renders on top)
      const selectedIndex = prev.findIndex(s => s.id === id);
      if (selectedIndex === -1 || id === null) {
        // No sticker selected, just update isSelected flags
        return prev.map(s => ({...s, isSelected: false}));
      }
      // Remove from current position and add to end
      const selected = prev[selectedIndex];
      const others = prev.filter((_, i) => i !== selectedIndex);
      return [...others.map(s => ({...s, isSelected: false})), {...selected, isSelected: true}];
    });
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

  // Exit add mode (keep lastChosenSticker for next time)
  const exitAddMode = useCallback(() => {
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

  // Add sticker at center of screen and set as last chosen for more placements
  // Returns the created sticker for action history tracking
  const addStickerAtCenter = useCallback(
    (imageSource: number, centerX: number, centerY: number, stickerType: 'image' | 'blur' = 'image'): StickerData => {
      const newSticker = addSticker(imageSource, centerX, centerY, stickerType);
      setLastChosenSticker({source: imageSource, type: stickerType}); // Set as last chosen so tapping screen adds more
      return newSticker;
    },
    [addSticker],
  );

  // Add sticker at position (used when tapping in add mode)
  // Returns the created sticker for action history tracking
  const addStickerAtPosition = useCallback(
    (x: number, y: number): StickerData => {
      return addSticker(lastChosenSticker.source, x, y, lastChosenSticker.type);
    },
    [lastChosenSticker, addSticker],
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

  // Restore a specific sticker (used for undo of delete)
  const restoreSticker = useCallback((stickerData: StickerData) => {
    setStickers(prev => [...prev, stickerData]);
  }, []);

  // Update a sticker with full state (used for undo/redo of transforms)
  const updateStickerState = useCallback((id: string, state: Partial<StickerData>) => {
    setStickers(prev =>
      prev.map(s => (s.id === id ? {...s, ...state} : s)),
    );
  }, []);

  return {
    stickers,
    selectedStickerId,
    isAddMode,
    isSwitchMode,
    lastChosenSticker,
    setLastChosenSticker,
    initializeBlurStickers,
    addSticker,
    replaceWithImage,
    replaceAllWithImage,
    replaceAllWithSources,
    updateStickerPosition,
    updateStickerScale,
    saveLastUsedScale,
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
    restoreSticker,
    updateStickerState,
  };
}
