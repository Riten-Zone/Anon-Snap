import {Skia} from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';

/**
 * Normalizes image orientation by re-encoding through Skia.
 * This bakes any EXIF rotation into the actual pixel data,
 * so the image displays correctly without relying on EXIF metadata.
 */
export async function normalizeImageOrientation(imagePath: string): Promise<string> {
  try {
    // Normalize the path (remove file:// prefix if present)
    const normalizedPath = imagePath.startsWith('file://')
      ? imagePath.replace('file://', '')
      : imagePath;

    console.log('[ImageNormalizer] Processing:', normalizedPath);

    // Read the source image as base64
    const imageData = await RNFS.readFile(normalizedPath, 'base64');
    const data = Skia.Data.fromBase64(imageData);
    const image = Skia.Image.MakeImageFromEncoded(data);

    if (!image) {
      throw new Error('Failed to decode image');
    }

    const width = image.width();
    const height = image.height();
    console.log('[ImageNormalizer] Image dimensions:', width, 'x', height);

    // Create an offscreen surface with the image dimensions
    const surface = Skia.Surface.Make(width, height);
    if (!surface) {
      throw new Error('Failed to create offscreen surface');
    }

    const canvas = surface.getCanvas();

    // Draw the image - Skia handles EXIF orientation internally
    canvas.drawImage(image, 0, 0);

    // Flush and get snapshot
    surface.flush();
    const snapshot = surface.makeImageSnapshot();

    // Encode to base64 (JPEG format for smaller file size)
    const base64Output = snapshot.encodeToBase64();
    if (!base64Output) {
      throw new Error('Failed to encode normalized image');
    }

    // Write to cache directory
    const outputPath = `${RNFS.CachesDirectoryPath}/normalized_${Date.now()}.jpg`;
    await RNFS.writeFile(outputPath, base64Output, 'base64');

    console.log('[ImageNormalizer] Saved normalized image:', outputPath);

    return `file://${outputPath}`;
  } catch (error) {
    console.error('[ImageNormalizer] Error:', error);
    throw error;
  }
}
