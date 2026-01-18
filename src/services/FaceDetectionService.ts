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
    // Ensure path has file:// prefix (required by the library)
    const normalizedPath = imagePath.startsWith('file://')
      ? imagePath
      : `file://${imagePath}`;

    console.log('[FaceDetection] Processing image:', normalizedPath);

    const result = await detectFaces({
      image: normalizedPath,
      options: {
        performanceMode: options.performanceMode || 'accurate',
        landmarkMode: 'none',
        contourMode: 'none',
        classificationMode: 'none',
      },
    });

    console.log('[FaceDetection] Raw result:', JSON.stringify(result, null, 2));

    if (!result || !Array.isArray(result)) {
      console.log('[FaceDetection] No faces detected or invalid result');
      return [];
    }

    console.log('[FaceDetection] Detected', result.length, 'face(s)');

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
    console.error('[FaceDetection] Error:', error);
    return [];
  }
}
