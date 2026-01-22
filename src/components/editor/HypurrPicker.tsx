import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import {X} from 'lucide-react-native';
import {ALL_STICKERS} from '../../data/stickerRegistry';
import {colors} from '../../theme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 12;
const NUM_COLUMNS = 4;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

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

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
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

      {/* Grid of hypurr images */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}>
        {ALL_STICKERS.map(sticker => (
          <TouchableOpacity
            key={sticker.id}
            style={[
              styles.gridItem,
              lastChosenSticker.source === sticker.source && styles.gridItemSelected,
            ]}
            onPress={() => handleSelectImage(sticker.source, sticker.type)}
            activeOpacity={0.7}>
            <Image
              source={sticker.source}
              style={styles.hypurrImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 17, 17, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '50%',
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
  scrollView: {
    maxHeight: 300,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 8,
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    backgroundColor: colors.gray800,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemSelected: {
    borderColor: colors.white,
    backgroundColor: colors.gray700,
  },
  hypurrImage: {
    width: ITEM_SIZE - 12,
    height: ITEM_SIZE - 12,
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
