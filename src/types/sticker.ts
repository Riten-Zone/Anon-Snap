export interface StickerData {
  id: string;
  type: 'blur' | 'emoji';
  source: number | string; // require() for images or emoji string
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  isSelected: boolean;
}

export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedFace {
  bounds: FaceBounds;
  rollAngle?: number;
  yawAngle?: number;
  pitchAngle?: number;
}
