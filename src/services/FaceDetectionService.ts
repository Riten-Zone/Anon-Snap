import {detectFaces, type Face} from 'react-native-vision-camera-face-detector';
import type {DetectedFace} from '../types';

export interface FaceDetectionOptions {
  performanceMode?: 'fast' | 'accurate';
}

export async function detectFacesInImage(
  imagePath: string,
  options: FaceDetectionOptions = {},
): Promise<DetectedFace[]> {
  try {
    // The API expects an object with image and options properties
    const result = await detectFaces({
      image: imagePath,
      options: {
        performanceMode: options.performanceMode || 'accurate',
        landmarkMode: 'none',
        contourMode: 'none',
        classificationMode: 'none',
      },
    });

    if (!result || !Array.isArray(result)) {
      return [];
    }

    return result.map((face: Face) => ({
      bounds: {
        x: face.bounds?.x ?? 0,
        y: face.bounds?.y ?? 0,
        width: face.bounds?.width ?? 0,
        height: face.bounds?.height ?? 0,
      },
      rollAngle: face.rollAngle,
      yawAngle: face.yawAngle,
      pitchAngle: face.pitchAngle,
    }));
  } catch (error) {
    console.warn('Face detection error:', error);
    return [];
  }
}
