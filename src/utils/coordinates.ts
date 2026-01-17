import type {FaceBounds} from '../types';

export function scaleBoundsToScreen(
  bounds: FaceBounds,
  imageWidth: number,
  imageHeight: number,
  screenWidth: number,
  screenHeight: number,
): FaceBounds {
  const scaleX = screenWidth / imageWidth;
  const scaleY = screenHeight / imageHeight;

  return {
    x: bounds.x * scaleX,
    y: bounds.y * scaleY,
    width: bounds.width * scaleX,
    height: bounds.height * scaleY,
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
