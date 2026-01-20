import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import {X} from 'lucide-react-native';
import {HYPURR_FACE_STICKERS} from '../../hooks/useStickers';
import {colors} from '../../theme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 12;
const NUM_COLUMNS = 4;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface HypurrPickerProps {
  visible: boolean;
  onClose: () => void;
  onSwitchOne: (imageSource: number) => void;
  onSwitchAll: (imageSource: number) => void;
  onRandomiseAll: () => void;
  hasStickers: boolean;
}

const HypurrPicker: React.FC<HypurrPickerProps> = ({
  visible,
  onClose,
  onSwitchOne,
  onSwitchAll,
  onRandomiseAll,
  hasStickers,
}) => {
  const [selectedSource, setSelectedSource] = useState<number | null>(null);

  const handleSelectImage = (source: number) => {
    setSelectedSource(source);
  };

  const handleSwitchOne = () => {
    if (selectedSource !== null) {
      onSwitchOne(selectedSource);
      onClose();
      setSelectedSource(null);
    }
  };

  const handleSwitchAll = () => {
    if (selectedSource !== null) {
      onSwitchAll(selectedSource);
      onClose();
      setSelectedSource(null);
    }
  };

  const handleRandomiseAll = () => {
    onRandomiseAll();
    onClose();
    setSelectedSource(null);
  };

  const handleClose = () => {
    setSelectedSource(null);
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Switch Mode</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={16} color={colors.white} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {hasStickers
              ? 'Select a hypurr to replace stickers'
              : 'No stickers to replace'}
          </Text>

          {/* Grid of hypurr images */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}>
            {HYPURR_FACE_STICKERS.map(sticker => (
              <TouchableOpacity
                key={sticker.id}
                style={[
                  styles.gridItem,
                  selectedSource === sticker.source && styles.gridItemSelected,
                ]}
                onPress={() => handleSelectImage(sticker.source)}
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
                (!selectedSource || !hasStickers) && styles.buttonDisabled,
              ]}
              onPress={handleSwitchOne}
              disabled={!selectedSource || !hasStickers}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.buttonText,
                  (!selectedSource || !hasStickers) &&
                    styles.buttonTextDisabled,
                ]}>
                Switch One
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                (!selectedSource || !hasStickers) && styles.buttonDisabled,
              ]}
              onPress={handleSwitchAll}
              disabled={!selectedSource || !hasStickers}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.buttonText,
                  (!selectedSource || !hasStickers) &&
                    styles.buttonTextDisabled,
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
  scrollView: {
    maxHeight: 200,
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
