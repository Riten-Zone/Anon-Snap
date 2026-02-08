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
import StickerGrid from '../editor/StickerGrid';
import type {StickerItem} from '../../data/stickerRegistry';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

interface DefaultStickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (source: number | string, type: 'image' | 'blur') => void;
  selectedSource: number | string;
  customStickers: StickerItem[];
  onUploadCustomSticker: () => void;
  onDeleteCustomSticker?: (id: string) => void;
}

const DefaultStickerPicker: React.FC<DefaultStickerPickerProps> = ({
  visible,
  onClose,
  onSelectSticker,
  selectedSource,
  customStickers,
  onUploadCustomSticker,
  onDeleteCustomSticker,
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

  const handleSelectSticker = useCallback(
    (source: number | string, type: 'image' | 'blur') => {
      onSelectSticker(source, type);
      onClose();
    },
    [onSelectSticker, onClose],
  );

  return (
    <View style={styles.wrapper} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View
        style={[styles.container, {transform: [{translateY: slideAnim}]}]}>
        <View style={styles.header}>
          <Text style={styles.title}>Default Face Sticker</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={16} color={colors.white} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Choose the sticker that auto-covers detected faces
        </Text>
        <StickerGrid
          onSelectSticker={handleSelectSticker}
          selectedSource={selectedSource}
          showSelectionHighlight={true}
          customStickers={customStickers}
          onUploadCustomSticker={onUploadCustomSticker}
          onDeleteCustomSticker={onDeleteCustomSticker}
        />
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
    maxHeight: '80%',
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
});

export default DefaultStickerPicker;
