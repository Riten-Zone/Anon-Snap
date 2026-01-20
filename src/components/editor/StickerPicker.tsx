import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {X} from 'lucide-react-native';
import {HYPURR_FACE_STICKERS} from '../../hooks/useStickers';
import {colors} from '../../theme';

interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (imageSource: number) => void;
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
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {HYPURR_FACE_STICKERS.map(sticker => (
          <TouchableOpacity
            key={sticker.id}
            style={styles.stickerItem}
            onPress={() => {
              onSelectSticker(sticker.source);
              onClose();
            }}
            activeOpacity={0.7}>
            <Image
              source={sticker.source}
              style={styles.stickerImage}
              resizeMode="contain"
            />
            <Text style={styles.stickerLabel}>{sticker.label}</Text>
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
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 15,
  },
  stickerItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.gray700,
    minWidth: 80,
  },
  stickerImage: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  stickerLabel: {
    fontSize: 12,
    color: colors.gray300,
  },
});

export default StickerPicker;
