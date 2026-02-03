import React, {useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {X} from 'lucide-react-native';
import {colors} from '../../theme';
import StickerGrid from './StickerGrid';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

interface HypurrPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (imageSource: number, stickerType: 'image' | 'blur') => void;
  onSwitchOne: (imageSource: number, stickerType: 'image' | 'blur') => void;
  onSwitchAll: (imageSource: number, stickerType: 'image' | 'blur') => void;
  onRandomiseAll: () => void;
  hasStickers: boolean;
  hasSelectedSticker: boolean;
  lastChosenSticker: {source: number; type: 'image' | 'blur'};
}

const HypurrPicker: React.FC<HypurrPickerProps> = ({
  visible,
  onClose,
  onSelectSticker,
  onSwitchOne,
  onSwitchAll,
  onRandomiseAll,
  hasStickers,
  hasSelectedSticker,
  lastChosenSticker,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  // Select a sticker (just highlight it, don't close the picker)
  const handleSelectImage = (source: number, type: 'image' | 'blur') => {
    onSelectSticker(source, type);
    // Don't close - user can then click Switch One/All/Randomise buttons
  };

  const handleSwitchOne = () => {
    onSwitchOne(lastChosenSticker.source, lastChosenSticker.type);
    onClose();
  };

  const handleSwitchAll = () => {
    onSwitchAll(lastChosenSticker.source, lastChosenSticker.type);
    onClose();
  };

  const handleRandomiseAll = () => {
    onRandomiseAll();
    onClose();
  };

  return (
    <View style={styles.wrapper} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View style={[styles.container, {transform: [{translateY: slideAnim}]}]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Switch Mode</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={16} color={colors.white} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {hasStickers
            ? 'Tap a hypurr, then tap stickers to switch'
            : 'No stickers to replace'}
        </Text>

        {/* Grid of stickers by collection */}
        <StickerGrid
          onSelectSticker={handleSelectImage}
          selectedSource={lastChosenSticker.source}
          showSelectionHighlight={true}
        />

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              (!hasStickers || !hasSelectedSticker) && styles.buttonDisabled,
            ]}
            onPress={handleSwitchOne}
            disabled={!hasStickers || !hasSelectedSticker}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.buttonText,
                (!hasStickers || !hasSelectedSticker) && styles.buttonTextDisabled,
              ]}>
              Switch One
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              !hasStickers && styles.buttonDisabled,
            ]}
            onPress={handleSwitchAll}
            disabled={!hasStickers}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.buttonText,
                !hasStickers && styles.buttonTextDisabled,
              ]}>
              Switch All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.randomButton,
              !hasStickers && styles.buttonDisabled,
            ]}
            onPress={handleRandomiseAll}
            disabled={!hasStickers}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.buttonText,
                styles.randomButtonText,
                !hasStickers && styles.buttonTextDisabled,
              ]}>
              Randomise All
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    backgroundColor: colors.gray900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray700,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray400,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  randomButton: {
    backgroundColor: colors.gray600,
  },
  buttonDisabled: {
    backgroundColor: colors.gray700,
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
  },
  randomButtonText: {
    color: colors.white,
  },
  buttonTextDisabled: {
    color: colors.gray500,
  },
});

export default HypurrPicker;
