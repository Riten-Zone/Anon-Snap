// Auto-generated file - do not edit manually
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
export const BLUR_STICKER: StickerItem = {
  id: 'blur',
  source: require('../../assets/stickers/blur_icon_oval.png'),
  type: 'blur',
};

// Sticker collections
export const STICKER_COLLECTIONS: StickerCollection[] = [
  {
    name: 'Emoji',
    stickers: [
      {
        id: 'emoji_ClownEmoji',
        source: require('../../assets/stickers/Emoji/ClownEmoji.png'),
        type: 'image',
      },
      {
        id: 'emoji_PoopEmoji',
        source: require('../../assets/stickers/Emoji/PoopEmoji.png'),
        type: 'image',
      },
      {
        id: 'emoji_beans',
        source: require('../../assets/stickers/Emoji/beans.png'),
        type: 'image',
      },
    ],
  },
  {
    name: 'HypurrCo',
    stickers: [
      {
        id: 'hypurrco_hypurr11_no_bg_smaller',
        source: require('../../assets/stickers/HypurrCo/hypurr11_no_bg_smaller.png'),
        type: 'image',
      },
      {
        id: 'hypurrco_hypurr12_no_bg_macdonald',
        source: require('../../assets/stickers/HypurrCo/hypurr12_no_bg_macdonald.png'),
        type: 'image',
      },
      {
        id: 'hypurrco_hypurr13_no_bg',
        source: require('../../assets/stickers/HypurrCo/hypurr13_no_bg.png'),
        type: 'image',
      },
      {
        id: 'hypurrco_hypurr14_no_bg_wagmi',
        source: require('../../assets/stickers/HypurrCo/hypurr14_no_bg_wagmi.png'),
        type: 'image',
      },
      {
        id: 'hypurrco_hypurr15_no_bg_zzz_cropped',
        source: require('../../assets/stickers/HypurrCo/hypurr15_no_bg_zzz_cropped.png'),
        type: 'image',
      },
      {
        id: 'hypurrco_hypurr16_no_bg',
        source: require('../../assets/stickers/HypurrCo/hypurr16_no_bg.png'),
        type: 'image',
      },
      {
        id: 'hypurrco_hypurr7_big_face_no_bg',
        source: require('../../assets/stickers/HypurrCo/hypurr7_big_face_no_bg.png'),
        type: 'image',
      },
      {
        id: 'hypurrco_hypurr8_no_bg',
        source: require('../../assets/stickers/HypurrCo/hypurr8_no_bg.png'),
        type: 'image',
      },
    ],
  },
  {
    name: 'HypurrLiquid',
    stickers: [
      {
        id: 'hypurrliquid_hypurr1_big_face_no_bg',
        source: require('../../assets/stickers/HypurrLiquid/hypurr1_big_face_no_bg.png'),
        type: 'image',
      },
      {
        id: 'hypurrliquid_hypurr2_big_face_no_bg',
        source: require('../../assets/stickers/HypurrLiquid/hypurr2_big_face_no_bg.png'),
        type: 'image',
      },
      {
        id: 'hypurrliquid_hypurr3_big_face__no_bg',
        source: require('../../assets/stickers/HypurrLiquid/hypurr3_big_face__no_bg.png'),
        type: 'image',
      },
      {
        id: 'hypurrliquid_hypurr4_big_face_no_bg',
        source: require('../../assets/stickers/HypurrLiquid/hypurr4_big_face_no_bg.png'),
        type: 'image',
      },
      {
        id: 'hypurrliquid_hypurr5_big_face_no_bg',
        source: require('../../assets/stickers/HypurrLiquid/hypurr5_big_face_no_bg.png'),
        type: 'image',
      },
      {
        id: 'hypurrliquid_hypurr6_big_face_no_bg',
        source: require('../../assets/stickers/HypurrLiquid/hypurr6_big_face_no_bg.png'),
        type: 'image',
      },
    ],
  },
  {
    name: 'Meme',
    stickers: [
      {
        id: 'meme_Chad',
        source: require('../../assets/stickers/Meme/Chad.png'),
        type: 'image',
      },
      {
        id: 'meme_PepeAngry',
        source: require('../../assets/stickers/Meme/PepeAngry.png'),
        type: 'image',
      },
      {
        id: 'meme_PepeSad',
        source: require('../../assets/stickers/Meme/PepeSad.png'),
        type: 'image',
      },
      {
        id: 'meme_WojakMonkey',
        source: require('../../assets/stickers/Meme/WojakMonkey.png'),
        type: 'image',
      },
      {
        id: 'meme_WojakVoid',
        source: require('../../assets/stickers/Meme/WojakVoid.png'),
        type: 'image',
      },
    ],
  },
];

// Flat list of all stickers (blur first, then by collection)
export const ALL_STICKERS: StickerItem[] = [
  BLUR_STICKER,
  ...STICKER_COLLECTIONS.flatMap(c => c.stickers),
];
