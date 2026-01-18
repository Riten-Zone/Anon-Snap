import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {GestureHandlerRootView, Gesture, GestureDetector} from 'react-native-gesture-handler';
import {runOnJS} from 'react-native-reanimated';
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

// Full screen display area for the image
const DISPLAY_AREA_WIDTH = SCREEN_WIDTH;
const DISPLAY_AREA_HEIGHT = SCREEN_HEIGHT;

const EditorScreen: React.FC<EditorScreenProps> = ({navigation, route}) => {
  const {photoUri} = route.params;
  const [imageSize, setImageSize] = useState({width: 0, height: 0});
  const [displaySize, setDisplaySize] = useState({width: DISPLAY_AREA_WIDTH, height: DISPLAY_AREA_HEIGHT});
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  // Handle image load - get correct dimensions after EXIF orientation is applied
  const handleImageLoad = useCallback((event: {nativeEvent: {source: {width: number; height: number}}}) => {
    const {width, height} = event.nativeEvent.source;
    console.log('[Editor] Image loaded with dimensions:', width, 'x', height);

    setImageSize({width, height});

    // Calculate actual display size within our fixed area
    const aspectRatio = width / height;
    let displayWidth = DISPLAY_AREA_WIDTH;
    let displayHeight = DISPLAY_AREA_WIDTH / aspectRatio;

    if (displayHeight > DISPLAY_AREA_HEIGHT) {
      displayHeight = DISPLAY_AREA_HEIGHT;
      displayWidth = DISPLAY_AREA_HEIGHT * aspectRatio;
    }

    setDisplaySize({width: displayWidth, height: displayHeight});

    // Now detect faces and scale them
    detectAndScaleFaces(width, height, displayWidth, displayHeight);
  }, []);

  // Detect faces and scale to display coordinates
  const detectAndScaleFaces = useCallback(async (
    sourceWidth: number,
    sourceHeight: number,
    displayWidth: number,
    displayHeight: number,
  ) => {
    try {
      const faces = await detectFacesInImage(photoUri);
      console.log('[Editor] Faces detected:', faces.length);

      if (faces.length > 0) {
        const scaleX = displayWidth / sourceWidth;
        const scaleY = displayHeight / sourceHeight;

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
      } else {
        console.log('[Editor] No faces detected');
      }
    } catch (error) {
      console.error('[Editor] Face detection error:', error);
    }
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

  // Background tap gesture - only triggers when tapping empty space
  const backgroundTapGesture = Gesture.Tap()
    .onEnd(() => {
      'worklet';
      runOnJS(handleBackgroundTap)();
    });

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
  const imageOffsetY = (SCREEN_HEIGHT - displaySize.height) / 2;

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <GestureDetector gesture={backgroundTapGesture}>
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
            onLoad={handleImageLoad}
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
      </GestureDetector>

      {/* Top Toolbar */}
      <TopToolbar
        onAddSticker={() => setShowStickerPicker(true)}
        onSwitchBlur={handleSwitchBlur}
        onClose={handleClose}
      />

      {/* Share button overlay */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => setShowShareSheet(true)}
        activeOpacity={0.8}>
        <Text style={styles.shareButtonText}>Share</Text>
      </TouchableOpacity>

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
  shareButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

export default EditorScreen;
