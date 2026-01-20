import {useCallback, useState} from 'react';
import type {StickerData} from '../types';
import type {DrawingStroke} from '../types';

export type ActionType =
  | 'ADD_STICKER'
  | 'DELETE_STICKER'
  | 'TRANSFORM_STICKER'
  | 'SWITCH_STICKER'      // For single sticker switch
  | 'SWITCH_ALL_STICKERS' // For switch all / randomize all (batch operation)
  | 'ADD_STROKE';

export interface Action {
  type: ActionType;
  payload: {
    stickerId?: string;
    strokeId?: string;
    before?: StickerData | DrawingStroke | null;
    after?: StickerData | DrawingStroke | null;
    // For batch operations (SWITCH_ALL_STICKERS)
    beforeStickers?: StickerData[];
    afterStickers?: StickerData[];
  };
}

const MAX_HISTORY_SIZE = 50;

export function useActionHistory() {
  const [history, setHistory] = useState<Action[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Record a new action
  const recordAction = useCallback((action: Action) => {
    setHistory(prev => {
      // Remove any future actions (if we undid and then did something new)
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add the new action
      newHistory.push(action);
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [historyIndex]);

  // Get the action to undo (returns null if nothing to undo)
  const getUndoAction = useCallback((): Action | null => {
    if (historyIndex < 0 || history.length === 0) return null;
    return history[historyIndex];
  }, [history, historyIndex]);

  // Get the action to redo (returns null if nothing to redo)
  const getRedoAction = useCallback((): Action | null => {
    if (historyIndex >= history.length - 1) return null;
    return history[historyIndex + 1];
  }, [history, historyIndex]);

  // Move history index back (call after applying undo)
  const confirmUndo = useCallback(() => {
    setHistoryIndex(prev => Math.max(-1, prev - 1));
  }, []);

  // Move history index forward (call after applying redo)
  const confirmRedo = useCallback(() => {
    setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  // Clear history (e.g., when starting fresh)
  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    recordAction,
    getUndoAction,
    getRedoAction,
    confirmUndo,
    confirmRedo,
    canUndo,
    canRedo,
    clearHistory,
  };
}
