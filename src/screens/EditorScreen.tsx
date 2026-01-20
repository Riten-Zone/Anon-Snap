import React, {useState, useCallback, useMemo} from 'react';
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
import {useStickers, HYPURR_FACE_STICKERS} from '../hooks';
import {useDrawing} from '../hooks/useDrawing';
import {detectFacesInImage} from '../services/FaceDetectionService';
import {saveToGallery} from '../services/GalleryService';
import {shareImage, shareToTwitter, shareToTelegram} from '../services/ShareService';
import {compositeImage} from '../services/ImageCompositor';
import Sticker from '../components/editor/Sticker';
import StickerPicker from '../components/editor/StickerPicker';
import TopToolbar from '../components/editor/TopToolbar';
import ShareSheet from '../components/share/ShareSheet';
import DrawingCanvas from '../components/editor/DrawingCanvas';
import HypurrPicker from '../components/editor/HypurrPicker';

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
  const [showHypurrPicker, setShowHypurrPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const {
    stickers,
    isAddMode,
    isSwitchMode,
    pendingSticker,
    initializeBlurStickers,
    replaceWithImage,
    replaceAllWithImage,
    replaceAllWithRandomImages,
    updateStickerPosition,
    updateStickerScale,
    updateStickerRotation,
    deleteSticker,
    selectSticker,
    selectedStickerId,
    deselectAll,
    enterAddMode,
    exitAddMode,
    enterSwitchMode,
    exitSwitchMode,
    addStickerAtCenter,
    addStickerAtPosition,
    undoLastSticker,
  } = useStickers();

  const {
    strokes,
    currentStroke,
    isDrawingMode,
    toggleDrawingMode,
    startStroke,
    addPoint,
    endStroke,
    undoLastStroke,
  } = useDrawing();

  // Calculate image offset early so it can be used in callbacks
  const imageOffsetX = (SCREEN_WIDTH - displaySize.width) / 2;
  const imageOffsetY = (SCREEN_HEIGHT - displaySize.height) / 2;

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

  // Called when tapping Add button - enter mode and show picker
  const handleOpenAddMode = useCallback(() => {
    enterAddMode();
    setShowStickerPicker(true);
  }, [enterAddMode]);

  // Called when selecting a sticker from picker - place at center, keep picker open
  const handleSelectSticker = useCallback(
    (imageSource: number, stickerType: 'image' | 'blur' = 'image') => {
      const centerX = displaySize.width / 2;
      const centerY = displaySize.height / 2;
      addStickerAtCenter(imageSource, centerX, centerY, stickerType);
      // Keep picker open so user can add more stickers
    },
    [displaySize, addStickerAtCenter],
  );

  const handleSwitchMode = useCallback(() => {
    // Enter switch mode and open the hypurr picker modal
    enterSwitchMode();
    setShowHypurrPicker(true);
  }, [enterSwitchMode]);

  // Handle switching one sticker with selected hypurr (selected or first available)
  const handleSwitchOne = useCallback((imageSource: number, stickerType: 'image' | 'blur') => {
    // If a sticker is selected, switch that one; otherwise switch the first sticker
    const stickerToSwitch = selectedStickerId
      ? stickers.find(s => s.id === selectedStickerId)
      : stickers[0];
    if (stickerToSwitch) {
      replaceWithImage(stickerToSwitch.id, imageSource, stickerType);
    }
  }, [stickers, selectedStickerId, replaceWithImage]);

  // Handle switching all stickers with selected hypurr
  const handleSwitchAll = useCallback((imageSource: number, stickerType: 'image' | 'blur') => {
    replaceAllWithImage(imageSource, stickerType);
  }, [replaceAllWithImage]);

  // Handle randomizing all stickers with random hypurr images (excludes blur)
  const handleRandomiseAll = useCallback(() => {
    const imageSources = HYPURR_FACE_STICKERS.filter(s => s.type === 'image').map(s => s.source);
    replaceAllWithRandomImages(imageSources);
  }, [replaceAllWithRandomImages]);

  // Check if there are any stickers
  const hasStickers = useMemo(() => stickers.length > 0, [stickers]);

  const handleBackgroundTapWithPosition = useCallback(
    (x: number, y: number) => {
      if (isDrawingMode) {
        // Don't handle taps in drawing mode
        return;
      }
      if (isAddMode && pendingSticker) {
        // Adjust for image layer offset
        const adjustedX = x - imageOffsetX;
        const adjustedY = y - imageOffsetY;
        addStickerAtPosition(adjustedX, adjustedY);
      } else {
        // Normal mode, deselect all and exit switch mode
        deselectAll();
        exitSwitchMode();
        setShowStickerPicker(false);
      }
    },
    [isDrawingMode, isAddMode, pendingSticker, addStickerAtPosition, deselectAll, exitSwitchMode, imageOffsetX, imageOffsetY],
  );

  // Drawing gesture handlers
  const handleDrawStart = useCallback(
    (x: number, y: number) => {
      const adjustedX = x - imageOffsetX;
      const adjustedY = y - imageOffsetY;
      startStroke(adjustedX, adjustedY);
    },
    [imageOffsetX, imageOffsetY, startStroke],
  );

  const handleDrawMove = useCallback(
    (x: number, y: number) => {
      const adjustedX = x - imageOffsetX;
      const adjustedY = y - imageOffsetY;
      addPoint(adjustedX, adjustedY);
    },
    [imageOffsetX, imageOffsetY, addPoint],
  );

  const handleDrawEnd = useCallback(() => {
    endStroke();
  }, [endStroke]);

  // Background tap gesture - only triggers when tapping empty space
  const backgroundTapGesture = Gesture.Tap()
    .onEnd(event => {
      'worklet';
      runOnJS(handleBackgroundTapWithPosition)(event.x, event.y);
    });

  // Drawing pan gesture
  const drawingPanGesture = Gesture.Pan()
    .enabled(isDrawingMode)
    .onStart(event => {
      'worklet';
      runOnJS(handleDrawStart)(event.x, event.y);
    })
    .onUpdate(event => {
      'worklet';
      runOnJS(handleDrawMove)(event.x, event.y);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(handleDrawEnd)();
    });

  // Combine gestures - drawing takes priority when in drawing mode
  const combinedGesture = Gesture.Race(drawingPanGesture, backgroundTapGesture);

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

      // Scale drawing strokes to original image coordinates
      const scaledStrokes = strokes.map(stroke => ({
        ...stroke,
        points: stroke.points.map(p => ({
          x: p.x * scaleX,
          y: p.y * scaleY,
        })),
        brushSize: stroke.brushSize * Math.max(scaleX, scaleY),
      }));

      const outputPath = await compositeImage(
        photoUri.replace('file://', ''),
        scaledStickers,
        imageSize.width,
        imageSize.height,
        scaledStrokes,
      );

      return outputPath;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [photoUri, stickers, strokes, imageSize, displaySize]);

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

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <GestureDetector gesture={combinedGesture}>
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

          {/* Drawing layer */}
          <View
            style={[
              styles.stickersLayer,
              {
                width: displaySize.width,
                height: displaySize.height,
                left: imageOffsetX,
                top: imageOffsetY,
              },
            ]}
            pointerEvents="none">
            <DrawingCanvas
              strokes={strokes}
              currentStroke={currentStroke}
              width={displaySize.width}
              height={displaySize.height}
            />
          </View>

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
        onAddSticker={handleOpenAddMode}
        onSwitchSticker={handleSwitchMode}
        onClose={handleClose}
        isAddMode={isAddMode}
        isSwitchMode={isSwitchMode}
        onExitAddMode={exitAddMode}
        onExitSwitchMode={exitSwitchMode}
        isDrawingMode={isDrawingMode}
        onToggleDrawing={toggleDrawingMode}
        onUndo={isDrawingMode ? undoLastStroke : undoLastSticker}
        canUndo={isDrawingMode ? strokes.length > 0 : stickers.filter(s => s.type === 'image').length > 0}
        pendingSticker={pendingSticker}
        onOpenPicker={() => setShowStickerPicker(true)}
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
        onSelectSticker={handleSelectSticker}
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

      {/* Hypurr Picker */}
      <HypurrPicker
        visible={showHypurrPicker}
        onClose={() => {
          setShowHypurrPicker(false);
          exitSwitchMode();
        }}
        onSwitchOne={handleSwitchOne}
        onSwitchAll={handleSwitchAll}
        onRandomiseAll={handleRandomiseAll}
        hasStickers={hasStickers}
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
