import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import {Image as ImageIcon, Camera} from 'lucide-react-native';
import type {HomeScreenProps} from '../types';
import {pickImageFromGallery} from '../services';
import {colors} from '../theme';
import {toImageSource} from '../utils/imageSource';
import {useDefaultSticker} from '../hooks/useDefaultSticker';
import {useCustomStickers} from '../hooks/useCustomStickers';
import {ALL_STICKERS} from '../data/stickerRegistry';
import type {StickerItem} from '../data/stickerRegistry';
import DefaultStickerPicker from '../components/home/DefaultStickerPicker';
import CustomStickerUploadModal from '../components/home/CustomStickerUploadModal';

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const {defaultSticker, updateDefault} = useDefaultSticker();
  const {customStickers, addCustom, removeCustom} = useCustomStickers();
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadImageUri, setUploadImageUri] = useState<string | null>(null);

  const handleImportPhoto = async () => {
    const uri = await pickImageFromGallery();
    if (uri) {
      navigation.navigate('Editor', {photoUri: uri});
    }
  };

  const handleTakePhoto = () => {
    navigation.navigate('Camera');
  };

  const handleSelectDefaultSticker = useCallback(
    async (source: number | string, type: 'image' | 'blur') => {
      const allItems: StickerItem[] = [...ALL_STICKERS, ...customStickers];
      const found = allItems.find(s => s.source === source);
      if (found) {
        await updateDefault(found);
      }
      setShowStickerPicker(false);
    },
    [customStickers, updateDefault],
  );

  const handleUploadCustomSticker = useCallback(async () => {
    const uri = await pickImageFromGallery();
    if (uri) {
      setUploadImageUri(uri);
      setShowUploadModal(true);
    }
  }, []);

  const handleSaveCustomSticker = useCallback(
    async (processedUri: string) => {
      const newItem = await addCustom(processedUri);
      await updateDefault(newItem);
      setShowUploadModal(false);
      setShowStickerPicker(false);
    },
    [addCustom, updateDefault],
  );

  const handleDeleteCustomSticker = useCallback(
    async (id: string) => {
      Alert.alert(
        'Delete Custom Sticker',
        'Are you sure you want to delete this sticker?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              // If deleting the current default, reset to fallback
              if (defaultSticker.id === id) {
                const fallback =
                  ALL_STICKERS.find(s => s.id === 'hypurrco_hypurr13_no_bg') ??
                  ALL_STICKERS.find(s => s.type === 'image');
                if (fallback) {
                  await updateDefault(fallback);
                }
              }
              await removeCustom(id);
            },
          },
        ],
      );
    },
    [defaultSticker, updateDefault, removeCustom],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />

      <View style={styles.header}>
        <Image
          source={require('../../assets/logo/anon_snap_logo_main.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Anon Snap</Text>
        <Text style={styles.subtitle}>Protect your privacy</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.importButton]}
          onPress={handleImportPhoto}
          activeOpacity={0.8}>
          <ImageIcon size={40} color={colors.white} strokeWidth={1.5} />
          <Text style={styles.buttonText}>Import Photo</Text>
          <Text style={styles.buttonHint}>Choose from your gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={handleTakePhoto}
          activeOpacity={0.8}>
          <Camera size={40} color={colors.black} strokeWidth={1.5} />
          <Text style={styles.cameraButtonText}>Take Photo</Text>
          <Text style={styles.cameraButtonHint}>Use camera to capture</Text>
        </TouchableOpacity>

        {/* Default Sticker Selector */}
        <TouchableOpacity
          style={[styles.button, styles.defaultStickerButton]}
          onPress={() => setShowStickerPicker(true)}
          activeOpacity={0.8}>
          <View style={styles.defaultStickerRow}>
            <View style={styles.defaultStickerPreview}>
              <Image
                source={toImageSource(defaultSticker.source)}
                style={styles.defaultStickerImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.defaultStickerInfo}>
              <Text style={styles.buttonText}>Default Face Sticker</Text>
              <Text style={styles.buttonHint}>Tap to change</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.privacyNote}>
        All processing happens on your device.{'\n'}
        No data is ever uploaded.
      </Text>

      {/* Default Sticker Picker Modal */}
      <DefaultStickerPicker
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={handleSelectDefaultSticker}
        selectedSource={defaultSticker.source}
        customStickers={customStickers}
        onUploadCustomSticker={handleUploadCustomSticker}
        onDeleteCustomSticker={handleDeleteCustomSticker}
      />

      {/* Custom Sticker Upload Modal */}
      <CustomStickerUploadModal
        visible={showUploadModal}
        imageUri={uploadImageUri}
        onClose={() => setShowUploadModal(false)}
        onSave={handleSaveCustomSticker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
    gap: 12,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray300,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  defaultStickerButton: {
    backgroundColor: colors.gray700,
    borderWidth: 2,
    borderColor: colors.gray500,
    padding: 16,
  },
  defaultStickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  defaultStickerPreview: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.gray800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultStickerImage: {
    width: 44,
    height: 44,
  },
  defaultStickerInfo: {
    flex: 1,
    gap: 4,
  },
  importButton: {
    backgroundColor: colors.gray700,
    borderWidth: 2,
    borderColor: colors.gray600,
  },
  cameraButton: {
    backgroundColor: colors.white,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  buttonHint: {
    fontSize: 14,
    color: colors.gray300,
  },
  cameraButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.black,
  },
  cameraButtonHint: {
    fontSize: 14,
    color: colors.gray500,
  },
  privacyNote: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.gray500,
    marginBottom: 40,
    lineHeight: 18,
  },
});

export default HomeScreen;
