import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
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

interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (imageSource: number, stickerType: 'image' | 'blur') => void;
}

const StickerPicker: React.FC<StickerPickerProps> = ({
  visible,
  onClose,
  onSelectSticker,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Sticker</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={16} color={colors.white} strokeWidth={2} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}>
        {ALL_STICKERS.map(sticker => (
          <TouchableOpacity
            key={sticker.id}
            style={styles.gridItem}
            onPress={() => {
              onSelectSticker(sticker.source, sticker.type);
              onClose();
            }}
            activeOpacity={0.7}>
            <Image
              source={sticker.source}
              style={styles.stickerImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray600,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gray700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    maxHeight: 300,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 12,
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    backgroundColor: colors.gray800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerImage: {
    width: ITEM_SIZE - 12,
    height: ITEM_SIZE - 12,
  },
});

export default StickerPicker;
