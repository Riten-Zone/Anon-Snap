const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

// Configuration
const SIZE = 1024;
const PIXEL_SIZE = Math.floor(SIZE / 10); // 10x10 grid of pixels
const OUTPUT_PATH = path.join(__dirname, '../assets/hypurr_face/blur_icon.png');

// Grayscale colors used in the blur effect (same as in the app)
const PIXEL_COLORS = [
  '#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0',
  '#b0b0b0', '#909090', '#707070', '#505050',
  '#383838', '#202020',
];

// Parse hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 128, g: 128, b: 128 };
}

// Seeded random for consistent results
function seededRandom(seed) {
  let state = seed;
  return function() {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// Check if point is inside ellipse
function isInsideEllipse(x, y, cx, cy, rx, ry) {
  const dx = x - cx;
  const dy = y - cy;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}

// Create the PNG
const png = new PNG({
  width: SIZE,
  height: SIZE,
  filterType: -1
});

const random = seededRandom(42);
const centerX = SIZE / 2;
const centerY = SIZE / 2;
const radiusX = SIZE * 0.45; // 90% of half width
const radiusY = SIZE * 0.48; // 96% of half height (slightly taller)

// Pre-generate pixel colors for the grid
const gridCols = Math.ceil(SIZE / PIXEL_SIZE);
const gridRows = Math.ceil(SIZE / PIXEL_SIZE);
const pixelColorGrid = [];

for (let row = 0; row < gridRows; row++) {
  pixelColorGrid[row] = [];
  for (let col = 0; col < gridCols; col++) {
    const colorIndex = Math.floor(random() * PIXEL_COLORS.length);
    pixelColorGrid[row][col] = hexToRgb(PIXEL_COLORS[colorIndex]);
  }
}

// Fill pixels
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const idx = (SIZE * y + x) << 2;

    if (isInsideEllipse(x, y, centerX, centerY, radiusX, radiusY)) {
      // Inside ellipse - draw pixel grid
      const gridCol = Math.floor(x / PIXEL_SIZE);
      const gridRow = Math.floor(y / PIXEL_SIZE);
      const color = pixelColorGrid[gridRow][gridCol];

      png.data[idx] = color.r;     // R
      png.data[idx + 1] = color.g; // G
      png.data[idx + 2] = color.b; // B
      png.data[idx + 3] = 255;     // A (opaque)
    } else {
      // Outside ellipse - transparent
      png.data[idx] = 0;
      png.data[idx + 1] = 0;
      png.data[idx + 2] = 0;
      png.data[idx + 3] = 0; // A (transparent)
    }
  }
}

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write PNG file
png.pack().pipe(fs.createWriteStream(OUTPUT_PATH))
  .on('finish', () => {
    console.log(`PNG created at: ${OUTPUT_PATH}`);
  })
  .on('error', (err) => {
    console.error('Error writing PNG:', err);
  });
