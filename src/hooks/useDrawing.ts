import {useCallback, useState} from 'react';
import type {DrawingPoint, DrawingStroke} from '../types';
import {generateId} from '../utils';

const DEFAULT_BRUSH_SIZE = 20;

export function useDrawing() {
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const toggleDrawingMode = useCallback(() => {
    setIsDrawingMode(prev => !prev);
  }, []);

  const startStroke = useCallback((x: number, y: number) => {
    setCurrentStroke([{x, y}]);
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    setCurrentStroke(prev => [...prev, {x, y}]);
  }, []);

  const endStroke = useCallback(() => {
    if (currentStroke.length > 0) {
      const newStroke: DrawingStroke = {
        id: generateId(),
        points: currentStroke,
        brushSize: DEFAULT_BRUSH_SIZE,
      };
      setStrokes(prev => [...prev, newStroke]);
      setCurrentStroke([]);
    }
  }, [currentStroke]);

  const undoLastStroke = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1));
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
    clearAll,
  };
}
