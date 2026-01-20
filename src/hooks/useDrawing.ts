import {useCallback, useState} from 'react';
import type {DrawingPoint, DrawingStroke} from '../types';
import {generateId} from '../utils';

const DEFAULT_BRUSH_SIZE = 20;

export function useDrawing() {
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [undoneStrokes, setUndoneStrokes] = useState<DrawingStroke[]>([]);

  const toggleDrawingMode = useCallback(() => {
    setIsDrawingMode(prev => !prev);
  }, []);

  const startStroke = useCallback((x: number, y: number) => {
    setCurrentStroke([{x, y}]);
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    setCurrentStroke(prev => [...prev, {x, y}]);
  }, []);

  // Returns the created stroke for action history tracking, or null if no points
  const endStroke = useCallback((): DrawingStroke | null => {
    if (currentStroke.length > 0) {
      const newStroke: DrawingStroke = {
        id: generateId(),
        points: currentStroke,
        brushSize: DEFAULT_BRUSH_SIZE,
      };
      setStrokes(prev => [...prev, newStroke]);
      setCurrentStroke([]);
      return newStroke;
    }
    return null;
  }, [currentStroke]);

  const undoLastStroke = useCallback(() => {
    setStrokes(prev => {
      if (prev.length === 0) return prev;
      const removedStroke = prev[prev.length - 1];
      setUndoneStrokes(undone => [...undone, removedStroke]);
      return prev.slice(0, -1);
    });
  }, []);

  const redoLastStroke = useCallback(() => {
    setUndoneStrokes(prev => {
      if (prev.length === 0) return prev;
      const strokeToRestore = prev[prev.length - 1];
      setStrokes(s => [...s, strokeToRestore]);
      return prev.slice(0, -1);
    });
  }, []);

  const clearAll = useCallback(() => {
    setStrokes([]);
    setCurrentStroke([]);
  }, []);

  return {
    strokes,
    currentStroke,
    isDrawingMode,
    toggleDrawingMode,
    startStroke,
    addPoint,
    endStroke,
    undoLastStroke,
    redoLastStroke,
    undoneStrokes,
    clearAll,
  };
}
