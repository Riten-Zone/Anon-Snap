import React, {useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import type {StickerData} from '../../types';

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
      onSelect(sticker.id);
    })
    .onUpdate(event => {
      translateX.value = sticker.x + event.translationX;
      translateY.value = sticker.y + event.translationY;
    })
    .onEnd(event => {
      const newX = sticker.x + event.translationX;
      const newY = sticker.y + event.translationY;
      onUpdate(sticker.id, {x: newX, y: newY});
    });

  // Pinch gesture for scaling
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate(event => {
      scale.value = Math.max(0.2, Math.min(3, savedScale.value * event.scale));
    })
    .onEnd(() => {
      onUpdate(sticker.id, {scale: scale.value});
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      savedRotation.value = rotation.value;
    })
    .onUpdate(event => {
      rotation.value = savedRotation.value + (event.rotation * 180) / Math.PI;
    })
    .onEnd(() => {
      onUpdate(sticker.id, {rotation: rotation.value});
    });

  const composedGestures = Gesture.Simultaneous(
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
    .onUpdate(event => {
      const newScale = sticker.scale + event.translationY * -0.005;
      scale.value = Math.max(0.2, Math.min(3, newScale));
    })
    .onEnd(() => {
      onUpdate(sticker.id, {scale: scale.value});
    });

  const handleRotateStart = Gesture.Pan()
    .onUpdate(event => {
      rotation.value = sticker.rotation + event.translationX * 0.5;
    })
    .onEnd(() => {
      onUpdate(sticker.id, {rotation: rotation.value});
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
              <Text style={styles.blurText}>BLUR</Text>
            </View>
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
              <Text style={styles.controlText}>✕</Text>
            </TouchableOpacity>

            {/* Rotate handle */}
            <GestureDetector gesture={handleRotateStart}>
              <Animated.View style={[styles.controlButton, styles.rotateButton]}>
                <Text style={styles.controlText}>↻</Text>
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
    borderRadius: 8,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#ff9500',
    borderStyle: 'dashed',
  },
  blurPreview: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(100, 100, 100, 0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  blurText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    opacity: 0.7,
  },
  emoji: {
    fontSize: 60,
  },
  controlButton: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff9500',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  deleteButton: {
    top: -14,
    left: -14,
    backgroundColor: '#ff3b30',
  },
  rotateButton: {
    top: -14,
    right: -14,
  },
  scaleButton: {
    bottom: -14,
    right: -14,
  },
  controlText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  scaleCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
});

export default Sticker;
