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
import {useStickers} from '../hooks';
import {ALL_STICKERS} from '../data/stickerRegistry';
import {useDrawing} from '../hooks/useDrawing';
import {useActionHistory} from '../hooks/useActionHistory';
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
    lastChosenSticker,
    setLastChosenSticker,
    initializeBlurStickers,
    replaceWithImage,
    replaceAllWithImage,
    replaceAllWithSources,
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
    restoreSticker,
    updateStickerState,
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
    redoLastStroke,
  } = useDrawing();

  // Global action history for undo/redo
  const {
    recordAction,
    getUndoAction,
    getRedoAction,
    confirmUndo,
    confirmRedo,
    canUndo: historyCanUndo,
    canRedo: historyCanRedo,
  } = useActionHistory();

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
    (id: string, updates: Partial<StickerData>, beforeState?: StickerData) => {
      // Find the current sticker to create afterState
      const currentSticker = stickers.find(s => s.id === id);
      if (!currentSticker) return;

      // Apply updates
      if (updates.x !== undefined && updates.y !== undefined) {
        updateStickerPosition(id, updates.x, updates.y);
      }
      if (updates.scale !== undefined) {
        updateStickerScale(id, updates.scale);
      }
      if (updates.rotation !== undefined) {
        updateStickerRotation(id, updates.rotation);
      }

      // Record action for undo/redo if we have a before state
      if (beforeState) {
        const afterState = {...currentSticker, ...updates};
        recordAction({
          type: 'TRANSFORM_STICKER',
          payload: {
            stickerId: id,
            before: beforeState,
            after: afterState,
          },
        });
      }
    },
    [stickers, updateStickerPosition, updateStickerScale, updateStickerRotation, recordAction],
  );

  // Handle sticker deletion with history recording
  const handleDeleteSticker = useCallback(
    (id: string, deletedSticker: StickerData) => {
      deleteSticker(id);
      recordAction({
        type: 'DELETE_STICKER',
        payload: {
          stickerId: id,
          before: deletedSticker,
          after: null,
        },
      });
    },
    [deleteSticker, recordAction],
  );

  // Global undo handler
  const handleUndo = useCallback(() => {
    const action = getUndoAction();
    if (!action) return;

    switch (action.type) {
      case 'TRANSFORM_STICKER':
        // Restore sticker to before state
        if (action.payload.before && action.payload.stickerId) {
          const before = action.payload.before as StickerData;
          updateStickerState(action.payload.stickerId, {
            x: before.x,
            y: before.y,
            scale: before.scale,
            rotation: before.rotation,
          });
        }
        break;
      case 'DELETE_STICKER':
        // Restore deleted sticker
        if (action.payload.before) {
          restoreSticker(action.payload.before as StickerData);
        }
        break;
      case 'ADD_STICKER':
        // Remove the added sticker
        if (action.payload.stickerId) {
          deleteSticker(action.payload.stickerId);
        }
        break;
      case 'SWITCH_STICKER':
        // Restore single sticker to before state
        if (action.payload.before && action.payload.stickerId) {
          const before = action.payload.before as StickerData;
          updateStickerState(action.payload.stickerId, {
            type: before.type,
            source: before.source,
          });
        }
        break;
      case 'SWITCH_ALL_STICKERS':
        // Restore all stickers to before states
        if (action.payload.beforeStickers) {
          action.payload.beforeStickers.forEach(before => {
            updateStickerState(before.id, {
              type: before.type,
              source: before.source,
            });
          });
        }
        break;
      case 'ADD_STROKE':
        // Remove the added stroke
        undoLastStroke();
        break;
    }
    confirmUndo();
  }, [getUndoAction, confirmUndo, updateStickerState, restoreSticker, deleteSticker, undoLastStroke]);

  // Global redo handler
  const handleRedo = useCallback(() => {
    const action = getRedoAction();
    if (!action) return;

    switch (action.type) {
      case 'TRANSFORM_STICKER':
        // Apply the after state
        if (action.payload.after && action.payload.stickerId) {
          const after = action.payload.after as StickerData;
          updateStickerState(action.payload.stickerId, {
            x: after.x,
            y: after.y,
            scale: after.scale,
            rotation: after.rotation,
          });
        }
        break;
      case 'DELETE_STICKER':
        // Delete the sticker again
        if (action.payload.stickerId) {
          deleteSticker(action.payload.stickerId);
        }
        break;
      case 'ADD_STICKER':
        // Re-add the sticker
        if (action.payload.after) {
          restoreSticker(action.payload.after as StickerData);
        }
        break;
      case 'SWITCH_STICKER':
        // Apply after state to single sticker
        if (action.payload.after && action.payload.stickerId) {
          const after = action.payload.after as StickerData;
          updateStickerState(action.payload.stickerId, {
            type: after.type,
            source: after.source,
          });
        }
        break;
      case 'SWITCH_ALL_STICKERS':
        // Apply after states to all stickers
        if (action.payload.afterStickers) {
          action.payload.afterStickers.forEach(after => {
            updateStickerState(after.id, {
              type: after.type,
              source: after.source,
            });
          });
        }
        break;
      case 'ADD_STROKE':
        // Redo the stroke
        redoLastStroke();
        break;
    }
    confirmRedo();
  }, [getRedoAction, confirmRedo, updateStickerState, deleteSticker, restoreSticker, redoLastStroke]);

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
      const newSticker = addStickerAtCenter(imageSource, centerX, centerY, stickerType);
      // Record action for undo/redo
      recordAction({
        type: 'ADD_STICKER',
        payload: {
          stickerId: newSticker.id,
          before: null,
          after: newSticker,
        },
      });
      // Keep picker open so user can add more stickers
    },
    [displaySize, addStickerAtCenter, recordAction],
  );

  const handleSwitchMode = useCallback(() => {
    // Enter switch mode and open the hypurr picker modal
    enterSwitchMode();
    // Auto-select the first sticker so Switch One button is immediately usable
    if (stickers.length > 0) {
      selectSticker(stickers[0].id);
    }
    setShowHypurrPicker(true);
  }, [enterSwitchMode, stickers, selectSticker]);

  // Handle switching one sticker when tapped in Switch mode
  const handleSwitchOneSticker = useCallback((stickerId: string) => {
    const stickerToSwitch = stickers.find(s => s.id === stickerId);
    if (stickerToSwitch) {
      // Record before state
      const beforeState = {...stickerToSwitch};
      replaceWithImage(stickerId, lastChosenSticker.source, lastChosenSticker.type);
      // Record action for undo/redo
      recordAction({
        type: 'SWITCH_STICKER',
        payload: {
          stickerId: stickerId,
          before: beforeState,
          after: {...stickerToSwitch, type: lastChosenSticker.type, source: lastChosenSticker.type === 'blur' ? 'blur' : lastChosenSticker.source},
        },
      });
    }
  }, [stickers, lastChosenSticker, replaceWithImage, recordAction]);

  // Handle switching all stickers with selected hypurr
  const handleSwitchAll = useCallback((imageSource: number, stickerType: 'image' | 'blur') => {
    // Record before states for all stickers
    const beforeStickers = stickers.map(s => ({...s}));
    replaceAllWithImage(imageSource, stickerType);
    // Record after states
    const afterStickers = stickers.map(s => ({
      ...s,
      type: stickerType,
      source: stickerType === 'blur' ? 'blur' : imageSource,
    }));
    // Record action for undo/redo
    recordAction({
      type: 'SWITCH_ALL_STICKERS',
      payload: {
        beforeStickers,
        afterStickers,
      },
    });
  }, [stickers, replaceAllWithImage, recordAction]);

  // Handle randomizing all stickers with random hypurr images (excludes blur)
  const handleRandomiseAll = useCallback(() => {
    // Record before states for all stickers
    const beforeStickers = stickers.map(s => ({...s}));
    const imageSources = ALL_STICKERS.filter(s => s.type === 'image').map(s => s.source);

    // Generate the random assignments ahead of time so we can record them
    const randomAssignments = stickers.map(() => {
      return imageSources[Math.floor(Math.random() * imageSources.length)];
    });

    // Create after states with the random assignments
    const afterStickers = stickers.map((s, i) => ({
      ...s,
      type: 'image' as const,
      source: randomAssignments[i],
    }));

    // Apply the pre-computed random assignments
    replaceAllWithSources(randomAssignments);

    // Record action for undo/redo
    recordAction({
      type: 'SWITCH_ALL_STICKERS',
      payload: {
        beforeStickers,
        afterStickers,
      },
    });
  }, [stickers, replaceAllWithSources, recordAction]);

  // Check if there are any stickers
  const hasStickers = useMemo(() => stickers.length > 0, [stickers]);

  const handleBackgroundTapWithPosition = useCallback(
    (x: number, y: number) => {
      if (isDrawingMode) {
        // Don't handle taps in drawing mode
        return;
      }
      if (isAddMode) {
        // Adjust for image layer offset
        const adjustedX = x - imageOffsetX;
        const adjustedY = y - imageOffsetY;
        const newSticker = addStickerAtPosition(adjustedX, adjustedY);
        // Record action for undo/redo
        recordAction({
          type: 'ADD_STICKER',
          payload: {
            stickerId: newSticker.id,
            before: null,
            after: newSticker,
          },
        });
      } else {
        // Deselect stickers and close picker, but stay in current mode
        deselectAll();
        setShowStickerPicker(false);
      }
    },
    [isDrawingMode, isAddMode, addStickerAtPosition, deselectAll, imageOffsetX, imageOffsetY, recordAction],
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
    const newStroke = endStroke();
    // Record action for undo/redo
    if (newStroke) {
      recordAction({
        type: 'ADD_STROKE',
        payload: {
          strokeId: newStroke.id,
          before: null,
          after: newStroke,
        },
      });
    }
  }, [endStroke, recordAction]);

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
                onDelete={handleDeleteSticker}
                onSelect={(id) => {
                  if (isSwitchMode && !showHypurrPicker) {
                    // Picker closed: switch sticker directly using lastChosenSticker
                    handleSwitchOneSticker(id);
                  } else {
                    // Picker open or not in switch mode: just select
                    selectSticker(id);
                  }
                }}
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
        onUndo={handleUndo}
        canUndo={historyCanUndo}
        onRedo={handleRedo}
        canRedo={historyCanRedo}
        lastChosenSticker={lastChosenSticker}
        onOpenPicker={() => isSwitchMode ? setShowHypurrPicker(true) : setShowStickerPicker(true)}
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
        }}
        onSelectSticker={(source, type) => {
          setLastChosenSticker({source, type});
        }}
        onSwitchOne={(source, type) => {
          if (selectedStickerId) {
            const stickerToSwitch = stickers.find(s => s.id === selectedStickerId);
            if (stickerToSwitch) {
              const beforeState = {...stickerToSwitch};
              replaceWithImage(selectedStickerId, source, type);
              recordAction({
                type: 'SWITCH_STICKER',
                payload: {
                  stickerId: selectedStickerId,
                  before: beforeState,
                  after: {...stickerToSwitch, type, source: type === 'blur' ? 'blur' : source},
                },
              });
            }
          }
        }}
        onSwitchAll={handleSwitchAll}
        onRandomiseAll={handleRandomiseAll}
        hasStickers={hasStickers}
        hasSelectedSticker={selectedStickerId !== null}
        lastChosenSticker={lastChosenSticker}
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
