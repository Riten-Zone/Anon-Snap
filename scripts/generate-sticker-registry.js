const fs = require('fs');
const path = require('path');

const STICKERS_DIR = path.join(__dirname, '../assets/stickers');
const OUTPUT_FILE = path.join(__dirname, '../src/data/stickerRegistry.ts');

function scanStickers() {
  const collections = [];
  const blurSticker = null;

  // Read the stickers directory
  const items = fs.readdirSync(STICKERS_DIR);

  // First, find blur_icon.png at root level
  const rootFiles = items.filter(item => {
    const itemPath = path.join(STICKERS_DIR, item);
    return fs.statSync(itemPath).isFile() && item.endsWith('.png');
  });

  // Then, find collection folders
  const folders = items.filter(item => {
    const itemPath = path.join(STICKERS_DIR, item);
    return fs.statSync(itemPath).isDirectory();
  });

  // Sort folders alphabetically
  folders.sort();

  // Scan each collection folder
  for (const folder of folders) {
    const folderPath = path.join(STICKERS_DIR, folder);
    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.png'))
      .sort();

    if (files.length > 0) {
      collections.push({
        name: folder,
        stickers: files.map(file => ({
          id: `${folder.toLowerCase()}_${path.basename(file, '.png')}`,
          filename: file,
          path: `${folder}/${file}`,
        })),
      });
    }
  }

  return { rootFiles, collections };
}

function generateRegistry({ rootFiles, collections }) {
  let output = `// Auto-generated file - do not edit manually
// Run: node scripts/generate-sticker-registry.js

export interface StickerItem {
  id: string;
  source: number;
  type: 'blur' | 'image';
}

export interface StickerCollection {
  name: string;
  stickers: StickerItem[];
}

// Blur sticker (always first)
`;

  // Add blur sticker if exists
  const blurFile = rootFiles.find(f => f.includes('blur'));
  if (blurFile) {
    output += `export const BLUR_STICKER: StickerItem = {
  id: 'blur',
  source: require('../../assets/stickers/${blurFile}'),
  type: 'blur',
};

`;
  }

  // Add collections
  output += `// Sticker collections\n`;
  output += `export const STICKER_COLLECTIONS: StickerCollection[] = [\n`;

  for (const collection of collections) {
    output += `  {\n`;
    output += `    name: '${collection.name}',\n`;
    output += `    stickers: [\n`;
    for (const sticker of collection.stickers) {
      output += `      {\n`;
      output += `        id: '${sticker.id}',\n`;
      output += `        source: require('../../assets/stickers/${sticker.path}'),\n`;
      output += `        type: 'image',\n`;
      output += `      },\n`;
    }
    output += `    ],\n`;
    output += `  },\n`;
  }

  output += `];\n\n`;

  // Add flat list for easy access (blur first, then all collections)
  output += `// Flat list of all stickers (blur first, then by collection)\n`;
  output += `export const ALL_STICKERS: StickerItem[] = [\n`;

  if (blurFile) {
    output += `  BLUR_STICKER,\n`;
  }

  output += `  ...STICKER_COLLECTIONS.flatMap(c => c.stickers),\n`;
  output += `];\n`;

  return output;
}

// Main
const data = scanStickers();
const registry = generateRegistry(data);

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, registry);
console.log(`Generated sticker registry at: ${OUTPUT_FILE}`);
console.log(`Found ${data.rootFiles.length} root stickers and ${data.collections.length} collections:`);
data.collections.forEach(c => {
  console.log(`  - ${c.name}: ${c.stickers.length} stickers`);
});
