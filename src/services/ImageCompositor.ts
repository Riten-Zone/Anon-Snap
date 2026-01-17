import {Skia, BlurMask, rect, rrect} from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';
import type {StickerData} from '../types';

// This service handles compositing stickers onto images using Skia's offscreen canvas

export async function compositeImage(
  sourceImagePath: string,
  stickers: StickerData[],
  outputWidth: number,
  outputHeight: number,
): Promise<string> {
  try {
    // Normalize the path
    const normalizedPath = sourceImagePath.replace('file://', '');

    // Read the source image
    const imageData = await RNFS.readFile(normalizedPath, 'base64');
    const data = Skia.Data.fromBase64(imageData);
    const image = Skia.Image.MakeImageFromEncoded(data);

    if (!image) {
      throw new Error('Failed to load source image');
    }

    const imgWidth = image.width();
    const imgHeight = image.height();

    // Create an offscreen surface
    const surface = Skia.Surface.Make(imgWidth, imgHeight);
    if (!surface) {
      throw new Error('Failed to create offscreen surface');
    }

    const canvas = surface.getCanvas();

    // Draw the original image
    canvas.drawImage(image, 0, 0);

    // Draw each sticker
    for (const sticker of stickers) {
      canvas.save();

      // Calculate center point for transformations
      const centerX = sticker.x + (sticker.width * sticker.scale) / 2;
      const centerY = sticker.y + (sticker.height * sticker.scale) / 2;

      // Apply transformations
      canvas.translate(centerX, centerY);
      canvas.rotate(sticker.rotation);
      canvas.scale(sticker.scale, sticker.scale);
      canvas.translate(-sticker.width / 2, -sticker.height / 2);

      if (sticker.type === 'blur') {
        // Draw blur effect
        const blurPaint = Skia.Paint();
        blurPaint.setMaskFilter(BlurMask.Normal(25));

        // Sample the region and draw it blurred
        const sourceRect = rect(
          sticker.x,
          sticker.y,
          sticker.width,
          sticker.height,
        );
        const destRect = rect(0, 0, sticker.width, sticker.height);

        // Create a rounded rect for nicer blur edges
        const roundedRect = rrect(destRect, 10, 10);
        canvas.clipRRect(roundedRect);

        // Draw the blurred region
        canvas.drawImageRect(image, sourceRect, destRect, blurPaint);
      } else if (sticker.type === 'emoji' && typeof sticker.source === 'string') {
        // Draw emoji text
        const paint = Skia.Paint();
        const fontSize = Math.min(sticker.width, sticker.height) * 0.8;

        const font = Skia.Font(null, fontSize);
        const textWidth = font.measureText(sticker.source).width;

        // Center the emoji
        const textX = (sticker.width - textWidth) / 2;
        const textY = sticker.height * 0.75;

        canvas.drawText(sticker.source, textX, textY, paint, font);
      }

      canvas.restore();
    }

    // Flush and get snapshot
    surface.flush();
    const snapshot = surface.makeImageSnapshot();

    // Convert to base64 using Skia's encodeToBase64
    const base64Output = snapshot.encodeToBase64();
    if (!base64Output) {
      throw new Error('Failed to encode image');
    }

    // Write to file
    const outputPath = `${RNFS.CachesDirectoryPath}/anon_snap_${Date.now()}.png`;
    await RNFS.writeFile(outputPath, base64Output, 'base64');

    return outputPath;
  } catch (error) {
    console.error('Image compositing error:', error);
    throw error;
  }
}

// Helper to get image dimensions
export async function getImageDimensions(
  imagePath: string,
): Promise<{width: number; height: number}> {
  try {
    const normalizedPath = imagePath.replace('file://', '');
    const imageData = await RNFS.readFile(normalizedPath, 'base64');
    const data = Skia.Data.fromBase64(imageData);
    const image = Skia.Image.MakeImageFromEncoded(data);

    if (!image) {
      throw new Error('Failed to load image');
    }

    return {
      width: image.width(),
      height: image.height(),
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return {width: 0, height: 0};
  }
}
