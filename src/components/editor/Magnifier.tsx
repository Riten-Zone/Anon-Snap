import React, {useMemo} from 'react';
import {View, StyleSheet, Image, Text, Dimensions} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import {useMagnifier} from '../../context/MagnifierContext';
import {colors} from '../../theme';
import type {StickerData} from '../../types';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const DIAMETER = 140;
const RADIUS = DIAMETER / 2;
const ZOOM = 2;
const OFFSET_Y = 100; // Vertical offset from finger
const OFFSET_X = 60; // Horizontal offset when flipping left/right
const BORDER_WIDTH = 3;

// Pixel colors for blur sticker preview (same as Sticker.tsx)
const PIXEL_COLORS = [
  '#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0',
  '#b0b0b0', '#909090', '#707070', '#505050',
  '#383838', '#202020',
];

interface MiniPixelGridProps {
  width: number;
  height: number;
  seed: string;
}

const MiniPixelGrid: React.FC<MiniPixelGridProps> = ({width, height, seed}) => {
  const pixelSize = 10;
  const cols = Math.floor(width / pixelSize);
  const rows = Math.floor(height / pixelSize);

  const pixels = useMemo(() => {
    const result: string[] = [];
    let seedNum = 0;
    for (let i = 0; i < seed.length; i++) {
      seedNum = ((seedNum << 5) - seedNum + seed.charCodeAt(i)) | 0;
    }

    let current = Math.abs(seedNum) || 1;
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);

    for (let i = 0; i < rows * cols; i++) {
      current = (a * current + c) % m;
      const colorIndex = Math.floor((current / m) * PIXEL_COLORS.length);
      result.push(PIXEL_COLORS[colorIndex]);
    }
    return result;
  }, [seed, cols, rows]);

  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: cols * pixelSize,
      height: rows * pixelSize,
      backgroundColor: colors.gray400,
    }}>
      {pixels.map((color, i) => (
        <View key={i} style={{width: pixelSize, height: pixelSize, backgroundColor: color}} />
      ))}
    </View>
  );
};

// Animated sticker preview component for magnifier
interface AnimatedStickerPreviewProps {
  sticker: StickerData;
  dragStickerId: SharedValue<string | null>;
  dragPositionX: SharedValue<number>;
  dragPositionY: SharedValue<number>;
}

const AnimatedStickerPreview: React.FC<AnimatedStickerPreviewProps> = ({
  sticker,
  dragStickerId,
  dragPositionX,
  dragPositionY,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isDraggingThis = dragStickerId.value === sticker.id;

    // For the dragging sticker, use live position from context
    // dragPosition is center of sticker, so subtract half width/height
    const x = isDraggingThis
      ? dragPositionX.value - sticker.width / 2
      : sticker.x;
    const y = isDraggingThis
      ? dragPositionY.value - sticker.height / 2
      : sticker.y;

    return {
      transform: [
        {translateX: x},
        {translateY: y},
        {scale: sticker.scale},
        {rotate: `${sticker.rotation}deg`},
      ],
    };
  });

  return (
    <Animated.View style={[styles.stickerContainer, animatedStyle]}>
      <View style={[styles.stickerBox, {
        width: sticker.width,
        height: sticker.height,
      }]}>
        {sticker.type === 'blur' ? (
          <View style={styles.blurPreview}>
            <MiniPixelGrid
              width={sticker.width}
              height={sticker.height}
              seed={sticker.id}
            />
          </View>
        ) : sticker.type === 'image' ? (
          <Image
            source={sticker.source as number}
            style={styles.stickerImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.emoji}>{sticker.source as string}</Text>
        )}
      </View>
    </Animated.View>
  );
};

interface MagnifierProps {
  photoUri: string;
  displaySize: {width: number; height: number};
  imageOffset: {x: number; y: number};
  stickers: StickerData[];
}

const Magnifier: React.FC<MagnifierProps> = ({
  photoUri,
  displaySize,
  imageOffset,
  stickers,
}) => {
  const {isDragging, dragPositionX, dragPositionY, dragStickerId} = useMagnifier();

  // Calculate smart position that flips based on edges
  const positionX = useDerivedValue(() => {
    const fingerX = dragPositionX.value + imageOffset.x;

    // Check if too close to edges
    if (fingerX < DIAMETER) {
      // Too far left - show to the right
      return fingerX + OFFSET_X;
    } else if (fingerX > SCREEN_WIDTH - DIAMETER) {
      // Too far right - show to the left
      return fingerX - OFFSET_X - DIAMETER;
    } else {
      // Center horizontally on finger
      return fingerX - RADIUS;
    }
  });

  const positionY = useDerivedValue(() => {
    const fingerY = dragPositionY.value + imageOffset.y;

    // Check if too close to top
    if (fingerY < DIAMETER + OFFSET_Y) {
      // Too close to top - show below finger
      return fingerY + OFFSET_Y;
    } else {
      // Show above finger (default)
      return fingerY - OFFSET_Y - DIAMETER;
    }
  });

  // Animated style for container position and opacity
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: positionX.value},
        {translateY: positionY.value},
      ],
      opacity: withSpring(isDragging.value ? 1 : 0, {
        damping: 20,
        stiffness: 300,
      }),
    };
  });

  // Animated style for zoomed content positioning
  const animatedContentStyle = useAnimatedStyle(() => {
    // Calculate offset to center the zoomed view on the finger position
    const centerX = dragPositionX.value;
    const centerY = dragPositionY.value;

    return {
      transform: [
        {scale: ZOOM},
        // Offset to center the finger position in the magnifier
        {translateX: -centerX + RADIUS / ZOOM},
        {translateY: -centerY + RADIUS / ZOOM},
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.container, animatedContainerStyle]}
      pointerEvents="none">
      <View style={styles.circleClip}>
        <Animated.View style={[styles.zoomedContent, animatedContentStyle]}>
          {/* Background image */}
          <Image
            source={{uri: photoUri}}
            style={{
              width: displaySize.width,
              height: displaySize.height,
            }}
            resizeMode="contain"
          />

          {/* Stickers layer */}
          <View style={[styles.stickersLayer, {
            width: displaySize.width,
            height: displaySize.height,
          }]}>
            {stickers.map(sticker => (
              <AnimatedStickerPreview
                key={sticker.id}
                sticker={sticker}
                dragStickerId={dragStickerId}
                dragPositionX={dragPositionX}
                dragPositionY={dragPositionY}
              />
            ))}
          </View>
        </Animated.View>
      </View>

      {/* White border */}
      <View style={styles.border} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: DIAMETER,
    height: DIAMETER,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  circleClip: {
    width: DIAMETER - BORDER_WIDTH * 2,
    height: DIAMETER - BORDER_WIDTH * 2,
    borderRadius: (DIAMETER - BORDER_WIDTH * 2) / 2,
    overflow: 'hidden',
    marginLeft: BORDER_WIDTH,
    marginTop: BORDER_WIDTH,
    backgroundColor: colors.black,
  },
  zoomedContent: {
    position: 'absolute',
    transformOrigin: 'top left',
  },
  stickersLayer: {
    position: 'absolute',
  },
  stickerContainer: {
    position: 'absolute',
  },
  stickerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  blurPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray300,
  },
  stickerImage: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 60,
  },
  border: {
    position: 'absolute',
    width: DIAMETER,
    height: DIAMETER,
    borderRadius: RADIUS,
    borderWidth: BORDER_WIDTH,
    borderColor: colors.white,
  },
});

export default Magnifier;
