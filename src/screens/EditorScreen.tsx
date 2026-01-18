import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  Blur,
  Group,
  Rect,
  RoundedRect,
  Text as SkiaText,
  useFont,
  matchFont,
} from '@shopify/react-native-skia';
import type {EditorScreenProps} from '../types';
import type {StickerData, DetectedFace} from '../types';
import {useStickers, EMOJI_STICKERS} from '../hooks';
import {detectFacesInImage} from '../services/FaceDetectionService';
import {saveToGallery} from '../services/GalleryService';
import {shareImage, shareToTwitter, shareToTelegram} from '../services/ShareService';
import {compositeImage} from '../services/ImageCompositor';
import Sticker from '../components/editor/Sticker';
import StickerPicker from '../components/editor/StickerPicker';
import TopToolbar from '../components/editor/TopToolbar';
import ShareSheet from '../components/share/ShareSheet';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const EditorScreen: React.FC<EditorScreenProps> = ({navigation, route}) => {
  const {photoUri} = route.params;
  const [imageSize, setImageSize] = useState({width: 0, height: 0});
  const [displaySize, setDisplaySize] = useState({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});
  const [isLoading, setIsLoading] = useState(true);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);

  const {
    stickers,
    selectedStickerId,
    initializeBlurStickers,
    addSticker,
    replaceWithEmoji,
    updateStickerPosition,
    updateStickerScale,
    updateStickerRotation,
    deleteSticker,
    selectSticker,
    deselectAll,
  } = useStickers();

  // Get image dimensions and detect faces
  useEffect(() => {
    const loadImage = async () => {
      try {
        console.log('[Editor] Loading photo:', photoUri);

        // Get image dimensions
        Image.getSize(
          photoUri,
          (width, height) => {
            console.log('[Editor] Image dimensions:', width, 'x', height);
            setImageSize({width, height});

            // Calculate display size maintaining aspect ratio
            const aspectRatio = width / height;
            let displayWidth = SCREEN_WIDTH;
            let displayHeight = SCREEN_WIDTH / aspectRatio;

            if (displayHeight > SCREEN_HEIGHT * 0.7) {
              displayHeight = SCREEN_HEIGHT * 0.7;
              displayWidth = displayHeight * aspectRatio;
            }

            setDisplaySize({width: displayWidth, height: displayHeight});
          },
          error => {
            console.error('[Editor] Error getting image size:', error);
          },
        );

        // Detect faces
        const faces = await detectFacesInImage(photoUri);
        console.log('[Editor] Faces detected:', faces.length);
        setDetectedFaces(faces);

        // Scale face bounds to display size
        if (faces.length > 0) {
          Image.getSize(photoUri, (width, height) => {
            const aspectRatio = width / height;
            let displayWidth = SCREEN_WIDTH;
            let displayHeight = SCREEN_WIDTH / aspectRatio;

            if (displayHeight > SCREEN_HEIGHT * 0.7) {
              displayHeight = SCREEN_HEIGHT * 0.7;
              displayWidth = displayHeight * aspectRatio;
            }

            const scaleX = displayWidth / width;
            const scaleY = displayHeight / height;

            const scaledFaces: DetectedFace[] = faces.map(face => ({
              ...face,
              bounds: {
                x: face.bounds.x * scaleX,
                y: face.bounds.y * scaleY,
                width: face.bounds.width * scaleX,
                height: face.bounds.height * scaleY,
              },
            }));

            console.log('[Editor] Initializing blur stickers for', scaledFaces.length, 'faces');
            initializeBlurStickers(scaledFaces);
          });
        } else {
          console.log('[Editor] No faces detected, skipping blur initialization');
        }

        setIsLoading(false);
      } catch (error) {
        console.error('[Editor] Error loading image:', error);
        setIsLoading(false);
      }
    };

    loadImage();
  }, [photoUri, initializeBlurStickers]);

  const handleStickerUpdate = useCallback(
    (id: string, updates: Partial<StickerData>) => {
      if (updates.x !== undefined && updates.y !== undefined) {
        updateStickerPosition(id, updates.x, updates.y);
      }
      if (updates.scale !== undefined) {
        updateStickerScale(id, updates.scale);
      }
      if (updates.rotation !== undefined) {
        updateStickerRotation(id, updates.rotation);
      }
    },
    [updateStickerPosition, updateStickerScale, updateStickerRotation],
  );

  const handleAddSticker = useCallback(
    (emoji: string) => {
      // Add sticker at center of image
      const centerX = displaySize.width / 2;
      const centerY = displaySize.height / 2;
      addSticker(emoji, centerX, centerY);
    },
    [addSticker, displaySize],
  );

  const handleSwitchBlur = useCallback(() => {
    // Find a blur sticker and switch it to emoji
    const blurSticker = stickers.find(s => s.type === 'blur');
    if (blurSticker) {
      const randomEmoji =
        EMOJI_STICKERS[Math.floor(Math.random() * EMOJI_STICKERS.length)].emoji;
      replaceWithEmoji(blurSticker.id, randomEmoji);
    } else {
      Alert.alert('No blur to switch', 'All blurs have been replaced with stickers.');
    }
  }, [stickers, replaceWithEmoji]);

  const handleBackgroundTap = useCallback(() => {
    deselectAll();
    setShowStickerPicker(false);
  }, [deselectAll]);

  const handleClose = useCallback(() => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to go back? Your edits will be lost.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Discard', style: 'destructive', onPress: () => navigation.goBack()},
      ],
    );
  }, [navigation]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // Scale stickers back to original image coordinates
      const scaleX = imageSize.width / displaySize.width;
      const scaleY = imageSize.height / displaySize.height;

      const scaledStickers = stickers.map(s => ({
        ...s,
        x: s.x * scaleX,
        y: s.y * scaleY,
        width: s.width * scaleX,
        height: s.height * scaleY,
      }));

      const outputPath = await compositeImage(
        photoUri.replace('file://', ''),
        scaledStickers,
        imageSize.width,
        imageSize.height,
      );

      return outputPath;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [photoUri, stickers, imageSize, displaySize]);

  const handleSave = useCallback(async () => {
    try {
      const outputPath = await handleExport();
      await saveToGallery(outputPath);
      Alert.alert('Saved!', 'Photo saved to your gallery.');
      setShowShareSheet(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo.');
    }
  }, [handleExport]);

  const handleShareTwitter = useCallback(async () => {
    try {
      const outputPath = await handleExport();
      await shareToTwitter(outputPath);
      setShowShareSheet(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to share to Twitter.');
    }
  }, [handleExport]);

  const handleShareTelegram = useCallback(async () => {
    try {
      const outputPath = await handleExport();
      await shareToTelegram(outputPath);
      setShowShareSheet(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to share to Telegram.');
    }
  }, [handleExport]);

  const handleShareOther = useCallback(async () => {
    try {
      const outputPath = await handleExport();
      await shareImage({url: outputPath});
      setShowShareSheet(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to share photo.');
    }
  }, [handleExport]);

  const imageOffsetX = (SCREEN_WIDTH - displaySize.width) / 2;
  const imageOffsetY = (SCREEN_HEIGHT - displaySize.height) / 2 - 50; // Offset for toolbar

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <TouchableWithoutFeedback onPress={handleBackgroundTap}>
        <View style={styles.canvasContainer}>
          {/* Background image */}
          <Image
            source={{uri: photoUri}}
            style={[
              styles.backgroundImage,
              {
                width: displaySize.width,
                height: displaySize.height,
                left: imageOffsetX,
                top: imageOffsetY,
              },
            ]}
            resizeMode="contain"
          />

          {/* Stickers layer */}
          <View
            style={[
              styles.stickersLayer,
              {
                width: displaySize.width,
                height: displaySize.height,
                left: imageOffsetX,
                top: imageOffsetY,
              },
            ]}>
            {stickers.map(sticker => (
              <Sticker
                key={sticker.id}
                sticker={sticker}
                onUpdate={handleStickerUpdate}
                onDelete={deleteSticker}
                onSelect={selectSticker}
              />
            ))}
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Top Toolbar */}
      <TopToolbar
        onAddSticker={() => setShowStickerPicker(true)}
        onSwitchBlur={handleSwitchBlur}
        onClose={handleClose}
      />

      {/* Bottom action button */}
      <View style={styles.bottomBar}>
        <View style={styles.exportButton}>
          <TouchableWithoutFeedback onPress={() => setShowShareSheet(true)}>
            <View style={styles.exportButtonInner}>
              <Image
                source={{uri: photoUri}}
                style={styles.thumbnailImage}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>

      {/* Sticker Picker */}
      <StickerPicker
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={handleAddSticker}
      />

      {/* Share Sheet */}
      <ShareSheet
        visible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        onSave={handleSave}
        onShareTwitter={handleShareTwitter}
        onShareTelegram={handleShareTelegram}
        onShareOther={handleShareOther}
        isLoading={isExporting}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  canvasContainer: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
  },
  stickersLayer: {
    position: 'absolute',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  exportButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  exportButtonInner: {
    flex: 1,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});

export default EditorScreen;
