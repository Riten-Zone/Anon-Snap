import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {ALL_STICKERS} from '../data/stickerRegistry';

/**
 * Preloads all sticker images by rendering them hidden.
 * This forces React Native to decode the images into memory
 * so they appear instantly when the picker opens.
 */
const StickerPreloader: React.FC = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      {ALL_STICKERS.map(sticker => (
        <Image
          key={sticker.id}
          source={sticker.source}
          style={styles.image}
          fadeDuration={0}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 0,
    height: 0,
    overflow: 'hidden',
    opacity: 0,
  },
  image: {
    width: 1,
    height: 1,
  },
});

export default StickerPreloader;
