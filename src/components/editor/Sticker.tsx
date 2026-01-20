import React, {useCallback, useMemo} from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import {X, RotateCw} from 'lucide-react-native';
import {Text} from 'react-native';
import type {StickerData} from '../../types';
import {colors} from '../../theme';

const PIXEL_COLORS = [
  '#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0',
  '#b0b0b0', '#909090', '#707070', '#505050',
  '#383838', '#202020',
];

interface PixelGridProps {
  width: number;
  height: number;
  seed: string;
}

const PixelGrid: React.FC<PixelGridProps> = ({width, height, seed}) => {
  const pixelSize = 10;
  const cols = Math.floor(width / pixelSize);
  const rows = Math.floor(height / pixelSize);

  const pixels = useMemo(() => {
    const result: string[] = [];
    // Use a simple LCG (Linear Congruential Generator) seeded by sticker id
    let seedNum = 0;
    for (let i = 0; i < seed.length; i++) {
      seedNum = ((seedNum << 5) - seedNum + seed.charCodeAt(i)) | 0;
    }

    // LCG parameters (common values for good randomness)
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
    <View style={{flexDirection: 'row', flexWrap: 'wrap', width: cols * pixelSize, height: rows * pixelSize, backgroundColor: colors.gray400}}>
      {pixels.map((color, i) => (
        <View key={i} style={{width: pixelSize, height: pixelSize, backgroundColor: color}} />
      ))}
    </View>
  );
};

interface StickerProps {
  sticker: StickerData;
  onUpdate: (id: string, updates: Partial<StickerData>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

const Sticker: React.FC<StickerProps> = ({
  sticker,
  onUpdate,
  onDelete,
  onSelect,
}) => {
  const translateX = useSharedValue(sticker.x);
  const translateY = useSharedValue(sticker.y);
  const scale = useSharedValue(sticker.scale);
  const rotation = useSharedValue(sticker.rotation);
  const savedScale = useSharedValue(sticker.scale);
  const savedRotation = useSharedValue(sticker.rotation);

  // Pan gesture for moving
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      runOnJS(onSelect)(sticker.id);
    })
    .onUpdate(event => {
      'worklet';
      translateX.value = sticker.x + event.translationX;
      translateY.value = sticker.y + event.translationY;
    })
    .onEnd(event => {
      'worklet';
      const newX = sticker.x + event.translationX;
      const newY = sticker.y + event.translationY;
      runOnJS(onUpdate)(sticker.id, {x: newX, y: newY});
    });

  // Pinch gesture for scaling
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      savedScale.value = scale.value;
    })
    .onUpdate(event => {
      'worklet';
      scale.value = Math.max(0.2, Math.min(3, savedScale.value * event.scale));
    })
    .onEnd(() => {
      'worklet';
      runOnJS(onUpdate)(sticker.id, {scale: scale.value});
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      'worklet';
      savedRotation.value = rotation.value;
    })
    .onUpdate(event => {
      'worklet';
      rotation.value = savedRotation.value + (event.rotation * 180) / Math.PI;
    })
    .onEnd(() => {
      'worklet';
      runOnJS(onUpdate)(sticker.id, {rotation: rotation.value});
    });

  // Tap gesture for selecting sticker
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      'worklet';
      runOnJS(onSelect)(sticker.id);
    });

  const composedGestures = Gesture.Simultaneous(
    tapGesture,
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotationGesture),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {scale: scale.value},
      {rotate: `${rotation.value}deg`},
    ],
  }));

  const handleDelete = useCallback(() => {
    onDelete(sticker.id);
  }, [sticker.id, onDelete]);

  const handleScaleStart = Gesture.Pan()
    .onStart(() => {
      'worklet';
      savedScale.value = scale.value;
    })
    .onUpdate(event => {
      'worklet';
      // Positive translationY (drag down) = bigger, negative (drag up) = smaller
      const newScale = savedScale.value + event.translationY * 0.005;
      scale.value = Math.max(0.2, Math.min(3, newScale));
    })
    .onEnd(() => {
      'worklet';
      runOnJS(onUpdate)(sticker.id, {scale: scale.value});
    });

  const handleRotateStart = Gesture.Pan()
    .onStart(() => {
      'worklet';
      savedRotation.value = rotation.value;
    })
    .onUpdate(event => {
      'worklet';
      rotation.value = savedRotation.value + event.translationX * 0.5;
    })
    .onEnd(() => {
      'worklet';
      runOnJS(onUpdate)(sticker.id, {rotation: rotation.value});
    });

  return (
    <GestureDetector gesture={composedGestures}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View
          style={[
            styles.stickerBox,
            {width: sticker.width, height: sticker.height},
            sticker.isSelected && styles.selected,
          ]}>
          {sticker.type === 'blur' ? (
            <View style={styles.blurPreview}>
              <PixelGrid width={sticker.width} height={sticker.height} seed={sticker.id} />
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

        {sticker.isSelected && (
          <>
            {/* Delete button */}
            <TouchableOpacity
              style={[styles.controlButton, styles.deleteButton]}
              onPress={handleDelete}>
              <X size={14} color={colors.white} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Rotate handle */}
            <GestureDetector gesture={handleRotateStart}>
              <Animated.View style={[styles.controlButton, styles.rotateButton]}>
                <RotateCw size={14} color={colors.black} strokeWidth={2.5} />
              </Animated.View>
            </GestureDetector>

            {/* Scale handle */}
            <GestureDetector gesture={handleScaleStart}>
              <Animated.View style={[styles.controlButton, styles.scaleButton]}>
                <View style={styles.scaleCircle} />
              </Animated.View>
            </GestureDetector>
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  stickerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  selected: {
    borderWidth: 2,
    borderColor: colors.white,
    borderStyle: 'dashed',
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
  emoji: {
    fontSize: 60,
  },
  stickerImage: {
    width: '100%',
    height: '100%',
  },
  controlButton: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  deleteButton: {
    top: -14,
    left: -14,
    backgroundColor: colors.danger,
  },
  rotateButton: {
    top: -14,
    right: -14,
  },
  scaleButton: {
    bottom: -14,
    right: -14,
  },
  scaleCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.black,
  },
});

export default Sticker;
