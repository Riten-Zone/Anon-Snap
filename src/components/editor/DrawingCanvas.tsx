import React, {useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import type {DrawingStroke, DrawingPoint} from '../../types';

const PIXEL_COLORS = [
  '#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0',
  '#b0b0b0', '#909090', '#707070', '#505050',
  '#383838', '#202020',
];

const PIXEL_SIZE = 10;

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  currentStroke: DrawingPoint[];
  width: number;
  height: number;
}

// Simple seeded random for consistent colors
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

interface PixelData {
  x: number;
  y: number;
  color: string;
  key: string;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  strokes,
  currentStroke,
  width,
  height,
}) => {
  const pixels = useMemo(() => {
    const pixelMap = new Map<string, PixelData>();

    const addPixelsForPoint = (px: number, py: number, brushSize: number) => {
      const halfBrush = brushSize / 2;
      const startX = Math.floor((px - halfBrush) / PIXEL_SIZE) * PIXEL_SIZE;
      const startY = Math.floor((py - halfBrush) / PIXEL_SIZE) * PIXEL_SIZE;
      const endX = px + halfBrush;
      const endY = py + halfBrush;

      for (let x = startX; x < endX; x += PIXEL_SIZE) {
        for (let y = startY; y < endY; y += PIXEL_SIZE) {
          const key = `${x},${y}`;
          if (!pixelMap.has(key)) {
            // Use position-based seed for stable colors across re-renders
            const seed = x * 10000 + y;
            const colorIndex = Math.floor(seededRandom(seed) * PIXEL_COLORS.length);
            pixelMap.set(key, {
              x,
              y,
              color: PIXEL_COLORS[colorIndex],
              key,
            });
          }
        }
      }
    };

    // Process completed strokes
    strokes.forEach(stroke => {
      stroke.points.forEach(point => {
        addPixelsForPoint(point.x, point.y, stroke.brushSize);
      });
    });

    // Process current stroke (while drawing)
    currentStroke.forEach(point => {
      addPixelsForPoint(point.x, point.y, 20); // Default brush size
    });

    return Array.from(pixelMap.values());
  }, [strokes, currentStroke]);

  if (pixels.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, {width, height}]} pointerEvents="none">
      {pixels.map(pixel => (
        <View
          key={pixel.key}
          style={[
            styles.pixel,
            {
              left: pixel.x,
              top: pixel.y,
              backgroundColor: pixel.color,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  pixel: {
    position: 'absolute',
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
  },
});

export default DrawingCanvas;
