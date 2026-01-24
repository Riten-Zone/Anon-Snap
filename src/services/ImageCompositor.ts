import {Skia, BlurMask, rect, rrect} from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';
import {Image as RNImage} from 'react-native';
import type {StickerData, DrawingStroke} from '../types';

// Pixel colors for drawing (same as DrawingCanvas)
const PIXEL_COLORS = [
  '#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0',
  '#b0b0b0', '#909090', '#707070', '#505050',
  '#383838', '#202020',
];

const PIXEL_SIZE = 10;

// Simple seeded random for consistent colors
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Cache for loaded sticker images
const stickerImageCache = new Map<number, ReturnType<typeof Skia.Image.MakeImageFromEncoded>>();

// Helper to load image from require() source
async function loadStickerImage(source: number): Promise<ReturnType<typeof Skia.Image.MakeImageFromEncoded> | null> {
  // Check cache first
  if (stickerImageCache.has(source)) {
    return stickerImageCache.get(source) || null;
  }

  try {
    const resolved = RNImage.resolveAssetSource(source);
    if (!resolved?.uri) {
      return null;
    }

    // Fetch the image data
    const response = await fetch(resolved.uri);
    const arrayBuffer = await response.arrayBuffer();
    const data = Skia.Data.fromBytes(new Uint8Array(arrayBuffer));
    const image = Skia.Image.MakeImageFromEncoded(data);

    if (image) {
      stickerImageCache.set(source, image);
    }

    return image;
  } catch (error) {
    console.error('Failed to load sticker image:', error);
    return null;
  }
}

// This service handles compositing stickers onto images using Skia's offscreen canvas

export async function compositeImage(
  sourceImagePath: string,
  stickers: StickerData[],
  outputWidth: number,
  outputHeight: number,
  strokes: DrawingStroke[] = [],
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
        // Draw pixelated blur effect with solid background
        const destRect = rect(0, 0, sticker.width, sticker.height);

        // Create a rounded rect for oval shape
        const roundedRect = rrect(destRect, sticker.width / 2, sticker.height / 2);
        canvas.clipRRect(roundedRect);

        // Draw solid gray background first
        const bgPaint = Skia.Paint();
        bgPaint.setColor(Skia.Color('#808080'));
        canvas.drawRect(destRect, bgPaint);

        // Draw pixel grid on top
        const pixelPaint = Skia.Paint();
        const cols = Math.floor(sticker.width / PIXEL_SIZE);
        const rows = Math.floor(sticker.height / PIXEL_SIZE);

        // Use sticker id as seed for consistent colors
        let seedNum = 0;
        for (let i = 0; i < sticker.id.length; i++) {
          seedNum = ((seedNum << 5) - seedNum + sticker.id.charCodeAt(i)) | 0;
        }
        let current = Math.abs(seedNum) || 1;
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            current = (a * current + c) % m;
            const colorIndex = Math.floor((current / m) * PIXEL_COLORS.length);
            pixelPaint.setColor(Skia.Color(PIXEL_COLORS[colorIndex]));
            canvas.drawRect(
              rect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE),
              pixelPaint,
            );
          }
        }
      } else if (sticker.type === 'image' && typeof sticker.source === 'number') {
        // Draw image sticker
        const stickerImage = await loadStickerImage(sticker.source);
        if (stickerImage) {
          const destRect = rect(0, 0, sticker.width, sticker.height);

          // Create a rounded rect for oval/circular shape (same as blur stickers)
          const roundedRect = rrect(destRect, sticker.width / 2, sticker.height / 2);
          canvas.clipRRect(roundedRect);

          // Draw the image to fill the sticker bounds
          const srcRect = rect(0, 0, stickerImage.width(), stickerImage.height());
          canvas.drawImageRect(stickerImage, srcRect, destRect, Skia.Paint());
        }
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

    // Draw drawing strokes as pixelated lines
    if (strokes.length > 0) {
      const pixelMap = new Map<string, string>();
      let seedCounter = 0;

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
              const colorIndex = Math.floor(seededRandom(seedCounter++) * PIXEL_COLORS.length);
              pixelMap.set(key, PIXEL_COLORS[colorIndex]);
            }
          }
        }
      };

      // Process all strokes
      for (const stroke of strokes) {
        for (const point of stroke.points) {
          addPixelsForPoint(point.x, point.y, stroke.brushSize);
        }
      }

      // Draw all pixels (solid, no opacity)
      const paint = Skia.Paint();

      for (const [key, color] of pixelMap) {
        const [x, y] = key.split(',').map(Number);
        paint.setColor(Skia.Color(color));
        canvas.drawRect(rect(x, y, PIXEL_SIZE, PIXEL_SIZE), paint);
      }
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
