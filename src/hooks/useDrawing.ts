import {useCallback, useState, useRef} from 'react';
import type {DrawingPoint, DrawingStroke} from '../types';
import {generateId} from '../utils';

const DEFAULT_BRUSH_SIZE = 20;

export function useDrawing() {
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [undoneStrokes, setUndoneStrokes] = useState<DrawingStroke[]>([]);

  // Use ref to track current stroke synchronously - this avoids race conditions
  // when gesture events fire faster than React state updates can propagate
  const currentStrokeRef = useRef<DrawingPoint[]>([]);

  const toggleDrawingMode = useCallback(() => {
    setIsDrawingMode(prev => !prev);
  }, []);

  const startStroke = useCallback((x: number, y: number) => {
    const point = {x, y};
    currentStrokeRef.current = [point];  // Sync update
    setCurrentStroke([point]);            // Async update for render
  }, []);

  const addPoint = useCallback((x: number, y: number) => {
    const point = {x, y};
    currentStrokeRef.current = [...currentStrokeRef.current, point];  // Sync
    setCurrentStroke([...currentStrokeRef.current]);                   // Async
  }, []);

  // Returns the created stroke for action history tracking, or null if no points
  const endStroke = useCallback((): DrawingStroke | null => {
    const points = currentStrokeRef.current;  // Read from ref, not state
    if (points.length > 0) {
      const newStroke: DrawingStroke = {
        id: generateId(),
        points: points,
        brushSize: DEFAULT_BRUSH_SIZE,
      };
      setStrokes(prev => [...prev, newStroke]);
      currentStrokeRef.current = [];  // Clear ref
      setCurrentStroke([]);
      // Clear undone strokes when creating a new stroke - this keeps the drawing
      // undo stack in sync with the global action history which also truncates
      // future actions when a new action is recorded after an undo
      setUndoneStrokes([]);
      return newStroke;
    }
    return null;
  }, []);

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
