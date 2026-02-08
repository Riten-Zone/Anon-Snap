import React, {useState, useCallback, useMemo, useRef} from 'react';
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
import {runOnJS, useSharedValue} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import type {EditorScreenProps} from '../types';
import type {StickerData, DetectedFace} from '../types';
import {useStickers} from '../hooks';
import {ALL_STICKERS, STICKER_COLLECTIONS} from '../data/stickerRegistry';
import {useDrawing} from '../hooks/useDrawing';
import {useActionHistory} from '../hooks/useActionHistory';
import {detectFacesInImage} from '../services/FaceDetectionService';
import {saveToGallery} from '../services/GalleryService';
import {shareImage} from '../services/ShareService';
import Sticker from '../components/editor/Sticker';
import StickerPicker from '../components/editor/StickerPicker';
import TopToolbar from '../components/editor/TopToolbar';
import ShareSheet from '../components/share/ShareSheet';
import DrawingCanvas from '../components/editor/DrawingCanvas';
import HypurrPicker from '../components/editor/HypurrPicker';
import Magnifier from '../components/editor/Magnifier';
import {MagnifierProvider} from '../context/MagnifierContext';

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
  const [isUIHidden, setIsUIHidden] = useState(false);
  const [shouldPreloadStickers, setShouldPreloadStickers] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  // Shared values for screen-level pinch/rotate gestures on selected sticker
  const gestureScale = useSharedValue(1);
  const gestureRotation = useSharedValue(0);
  const savedGestureScale = useSharedValue(1);
  const savedGestureRotation = useSharedValue(0);
  const gestureStartState = useRef<StickerData | null>(null);

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
    saveLastUsedScale,
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
    } finally {
      // Preload sticker images after face detection is done
      setShouldPreloadStickers(true);
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
        saveLastUsedScale(updates.scale);
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
    [stickers, updateStickerPosition, updateStickerScale, saveLastUsedScale, updateStickerRotation, recordAction],
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
    // Auto-select the first sticker only if none is currently selected
    if (stickers.length > 0 && !selectedStickerId) {
      selectSticker(stickers[0].id);
    }
    setShowHypurrPicker(true);
  }, [enterSwitchMode, stickers, selectSticker, selectedStickerId]);

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

  // Handle randomizing all stickers with random images from a specific collection
  const handleRandomiseCollection = useCallback((collectionName: string) => {
    const collection = STICKER_COLLECTIONS.find(c => c.name === collectionName);
    if (!collection || stickers.length === 0) return;

    const beforeStickers = stickers.map(s => ({...s}));
    const collectionSources = collection.stickers.map(s => s.source);

    const randomAssignments = stickers.map(() => {
      return collectionSources[Math.floor(Math.random() * collectionSources.length)];
    });

    const afterStickers = stickers.map((s, i) => ({
      ...s,
      type: 'image' as const,
      source: randomAssignments[i],
    }));

    replaceAllWithSources(randomAssignments);

    // Set selected sticker to a random one from this collection
    const randomSticker = collection.stickers[Math.floor(Math.random() * collection.stickers.length)];
    setLastChosenSticker({source: randomSticker.source, type: randomSticker.type});

    recordAction({
      type: 'SWITCH_ALL_STICKERS',
      payload: {
        beforeStickers,
        afterStickers,
      },
    });
  }, [stickers, replaceAllWithSources, setLastChosenSticker, recordAction]);

  // Check if there are any stickers
  const hasStickers = useMemo(() => stickers.length > 0, [stickers]);

  // Handler to hide UI
  const handleHideUI = useCallback(() => {
    setIsUIHidden(true);
  }, []);

  const handleBackgroundTapWithPosition = useCallback(
    (x: number, y: number) => {
      // If UI is hidden, show it on tap
      if (isUIHidden) {
        setIsUIHidden(false);
        return;
      }
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
    [isUIHidden, isDrawingMode, isAddMode, addStickerAtPosition, deselectAll, imageOffsetX, imageOffsetY, recordAction],
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

  // Screen-level pinch/rotate handlers for selected sticker
  const handleScreenPinchStart = useCallback(() => {
    const selectedSticker = stickers.find(s => s.id === selectedStickerId);
    if (selectedSticker) {
      gestureStartState.current = {...selectedSticker};
      gestureScale.value = selectedSticker.scale;
      savedGestureScale.value = selectedSticker.scale;
    }
  }, [stickers, selectedStickerId, gestureScale, savedGestureScale]);

  const handleScreenPinchUpdate = useCallback((newScale: number) => {
    if (selectedStickerId) {
      const clampedScale = Math.max(0.01, Math.min(3, newScale));
      gestureScale.value = clampedScale;
      updateStickerScale(selectedStickerId, clampedScale);
    }
  }, [selectedStickerId, gestureScale, updateStickerScale]);

  const handleScreenPinchEnd = useCallback(() => {
    if (selectedStickerId && gestureStartState.current) {
      saveLastUsedScale(gestureScale.value);
      // Record for undo/redo
      const currentSticker = stickers.find(s => s.id === selectedStickerId);
      if (currentSticker) {
        recordAction({
          type: 'TRANSFORM_STICKER',
          payload: {
            stickerId: selectedStickerId,
            before: gestureStartState.current,
            after: {...currentSticker, scale: gestureScale.value},
          },
        });
      }
      gestureStartState.current = null;
    }
  }, [selectedStickerId, stickers, gestureScale, saveLastUsedScale, recordAction]);

  const handleScreenRotateStart = useCallback(() => {
    const selectedSticker = stickers.find(s => s.id === selectedStickerId);
    if (selectedSticker) {
      if (!gestureStartState.current) {
        gestureStartState.current = {...selectedSticker};
      }
      gestureRotation.value = selectedSticker.rotation;
      savedGestureRotation.value = selectedSticker.rotation;
    }
  }, [stickers, selectedStickerId, gestureRotation, savedGestureRotation]);

  const handleScreenRotateUpdate = useCallback((newRotation: number) => {
    if (selectedStickerId) {
      gestureRotation.value = newRotation;
      updateStickerRotation(selectedStickerId, newRotation);
    }
  }, [selectedStickerId, gestureRotation, updateStickerRotation]);

  const handleScreenRotateEnd = useCallback(() => {
    if (selectedStickerId && gestureStartState.current) {
      const currentSticker = stickers.find(s => s.id === selectedStickerId);
      if (currentSticker) {
        recordAction({
          type: 'TRANSFORM_STICKER',
          payload: {
            stickerId: selectedStickerId,
            before: gestureStartState.current,
            after: {...currentSticker, rotation: gestureRotation.value},
          },
        });
      }
      gestureStartState.current = null;
    }
  }, [selectedStickerId, stickers, gestureRotation, recordAction]);

  // Screen-level pinch gesture for selected sticker
  const screenPinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      runOnJS(handleScreenPinchStart)();
    })
    .onUpdate(event => {
      'worklet';
      const newScale = savedGestureScale.value * event.scale;
      runOnJS(handleScreenPinchUpdate)(newScale);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(handleScreenPinchEnd)();
    });

  // Screen-level rotation gesture for selected sticker
  const screenRotationGesture = Gesture.Rotation()
    .onStart(() => {
      'worklet';
      runOnJS(handleScreenRotateStart)();
    })
    .onUpdate(event => {
      'worklet';
      const newRotation = savedGestureRotation.value + (event.rotation * 180) / Math.PI;
      runOnJS(handleScreenRotateUpdate)(newRotation);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(handleScreenRotateEnd)();
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

  // Combine pinch and rotation gestures (can happen simultaneously)
  const screenTransformGestures = Gesture.Simultaneous(screenPinchGesture, screenRotationGesture);

  // Combine gestures - drawing takes priority, then screen transforms, then tap
  const combinedGesture = Gesture.Simultaneous(
    Gesture.Race(drawingPanGesture, backgroundTapGesture),
    screenTransformGestures,
  );

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
      // Use ViewShot to capture the canvas exactly as displayed
      if (!viewShotRef.current?.capture) {
        throw new Error('ViewShot ref not ready');
      }
      const outputPath = await viewShotRef.current.capture();
      return outputPath;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

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

  const handleShare = useCallback(async () => {
    try {
      const outputPath = await handleExport();
      await shareImage({url: outputPath});
      setShowShareSheet(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to share photo.');
    }
  }, [handleExport]);

  const handleBackToMenu = useCallback(() => {
    setShowShareSheet(false);
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to go back? Your edits will be lost.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Discard', style: 'destructive', onPress: () => navigation.navigate('Home')},
      ],
    );
  }, [navigation]);

  return (
    <MagnifierProvider>
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <GestureDetector gesture={combinedGesture}>
        <View style={styles.canvasContainer}>
          {/* ViewShot wrapper for screenshot capture */}
          <ViewShot
            ref={viewShotRef}
            options={{format: 'png', quality: 1}}
            style={[
              styles.viewShotContainer,
              {
                width: displaySize.width,
                height: displaySize.height,
                left: imageOffsetX,
                top: imageOffsetY,
              },
            ]}>
            {/* Background image */}
            <Image
              source={{uri: photoUri}}
              style={[
                styles.backgroundImage,
                {
                  width: displaySize.width,
                  height: displaySize.height,
                },
              ]}
              resizeMode="contain"
              onLoad={handleImageLoad}
            />

            {/* Stickers layer - rendered first (bottom) */}
            <View
              style={[
                styles.stickersLayer,
                {
                  width: displaySize.width,
                  height: displaySize.height,
                },
              ]}
              pointerEvents={isDrawingMode ? 'none' : 'auto'}>
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

            {/* Drawing layer - rendered second (top) */}
            <View
              style={[
                styles.stickersLayer,
                {
                  width: displaySize.width,
                  height: displaySize.height,
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
          </ViewShot>
        </View>
      </GestureDetector>

      {/* Top Toolbar */}
      {!isUIHidden && (
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
          onHideUI={handleHideUI}
        />
      )}

      {/* Share button overlay */}
      {!isUIHidden && (
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {
            deselectAll();
            setShowShareSheet(true);
          }}
          activeOpacity={0.8}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      )}

      {/* Sticker Picker - only render after stickers preloaded */}
      {shouldPreloadStickers && (
        <StickerPicker
          visible={showStickerPicker}
          onClose={() => setShowStickerPicker(false)}
          onSelectSticker={handleSelectSticker}
        />
      )}

      {/* Share Sheet */}
      <ShareSheet
        visible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        onSave={handleSave}
        onShare={handleShare}
        onBackToMenu={handleBackToMenu}
        isLoading={isExporting}
      />

      {/* Hypurr Picker - only render after stickers preloaded */}
      {shouldPreloadStickers && (
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
        onRandomiseCollection={handleRandomiseCollection}
        hasStickers={hasStickers}
        hasSelectedSticker={selectedStickerId !== null}
        lastChosenSticker={lastChosenSticker}
        />
      )}

      {/* Magnifier overlay - outside ViewShot so it won't be captured */}
      <Magnifier
        photoUri={photoUri}
        displaySize={displaySize}
        imageOffset={{x: imageOffsetX, y: imageOffsetY}}
        stickers={stickers}
      />

      {/* Hidden sticker preloader - renders after face detection to cache images */}
      {shouldPreloadStickers && (
        <View style={styles.hiddenPreloader} pointerEvents="none">
          {ALL_STICKERS.map(sticker => (
            <Image
              key={sticker.id}
              source={sticker.source}
              style={styles.preloadImage}
              fadeDuration={0}
            />
          ))}
        </View>
      )}
    </GestureHandlerRootView>
    </MagnifierProvider>
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
  viewShotContainer: {
    position: 'absolute',
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
  hiddenPreloader: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  preloadImage: {
    width: 1,
    height: 1,
  },
});

export default EditorScreen;
