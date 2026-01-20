import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {ChevronLeft, Undo2, Redo2, Shuffle, Plus, Pencil} from 'lucide-react-native';
import {colors} from '../../theme';

interface TopToolbarProps {
  onAddSticker: () => void;
  onSwitchSticker: () => void;
  onClose: () => void;
  isAddMode: boolean;
  isSwitchMode: boolean;
  onExitAddMode: () => void;
  onExitSwitchMode: () => void;
  isDrawingMode: boolean;
  onToggleDrawing: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  pendingSticker?: {source: number; type: 'image' | 'blur'} | null;
  onOpenPicker?: () => void;
}

const TopToolbar: React.FC<TopToolbarProps> = ({
  onAddSticker,
  onSwitchSticker,
  onClose,
  isAddMode,
  isSwitchMode,
  onExitAddMode,
  onExitSwitchMode,
  isDrawingMode,
  onToggleDrawing,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  pendingSticker,
  onOpenPicker,
}) => {
  const isInMode = isAddMode || isDrawingMode || isSwitchMode;

  // Determine which mode is active
  const activeMode = isDrawingMode ? 'draw' : isAddMode ? 'add' : isSwitchMode ? 'switch' : null;

  // Handle back button - exit mode if in one, otherwise close editor
  const handleBackPress = () => {
    if (isDrawingMode) {
      onToggleDrawing();
    } else if (isAddMode) {
      onExitAddMode();
    } else if (isSwitchMode) {
      onExitSwitchMode();
    } else {
      onClose();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleBackPress}>
        <ChevronLeft size={24} color={colors.white} strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.rightButtons}>
        {isInMode ? (
          // Active mode view - undo (if available), selected tool, and emoji preview
          <>
            <View style={styles.activeModeRow}>
              {/* Undo button - always visible, greyed out when disabled */}
              <TouchableOpacity
                style={[styles.undoButton, {opacity: canUndo ? 1 : 0.3}]}
                onPress={onUndo}
                activeOpacity={0.7}
                disabled={!canUndo}>
                <Undo2 size={22} color={colors.white} strokeWidth={2} />
              </TouchableOpacity>

              {/* Redo button - always visible, greyed out when disabled */}
              <TouchableOpacity
                style={[styles.undoButton, {opacity: canRedo ? 1 : 0.3}]}
                onPress={onRedo}
                activeOpacity={0.7}
                disabled={!canRedo}>
                <Redo2 size={22} color={colors.white} strokeWidth={2} />
              </TouchableOpacity>

              {/* Selected tool button */}
              {activeMode === 'add' && (
                <TouchableOpacity
                  style={[styles.toolButton, styles.toolButtonActive]}
                  onPress={onExitAddMode}
                  activeOpacity={0.7}>
                  <Plus size={24} color={colors.black} strokeWidth={1.5} />
                  <Text style={[styles.toolLabel, styles.toolLabelActive]}>Add</Text>
                </TouchableOpacity>
              )}
              {activeMode === 'switch' && (
                <TouchableOpacity
                  style={[styles.toolButton, styles.toolButtonActive]}
                  onPress={onExitSwitchMode}
                  activeOpacity={0.7}>
                  <Shuffle size={24} color={colors.black} strokeWidth={1.5} />
                  <Text style={[styles.toolLabel, styles.toolLabelActive]}>Switch</Text>
                </TouchableOpacity>
              )}
              {activeMode === 'draw' && (
                <TouchableOpacity
                  style={[styles.toolButton, styles.toolButtonActive]}
                  onPress={onToggleDrawing}
                  activeOpacity={0.7}>
                  <Pencil size={24} color={colors.black} strokeWidth={1.5} />
                  <Text style={[styles.toolLabel, styles.toolLabelActive]}>Draw</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sticker preview - shows below Add button when sticker is selected */}
            {activeMode === 'add' && pendingSticker && onOpenPicker && (
              <TouchableOpacity
                style={styles.stickerPreview}
                onPress={onOpenPicker}
                activeOpacity={0.7}>
                <Image
                  source={pendingSticker.source}
                  style={styles.stickerPreviewImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </>
        ) : (
          // Default view - all tools listed vertically
          <>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={onSwitchSticker}
              activeOpacity={0.7}>
              <Shuffle size={24} color={colors.white} strokeWidth={1.5} />
              <Text style={styles.toolLabel}>Switch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              onPress={onAddSticker}
              activeOpacity={0.7}>
              <Plus size={24} color={colors.white} strokeWidth={1.5} />
              <Text style={styles.toolLabel}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              onPress={onToggleDrawing}
              activeOpacity={0.7}>
              <Pencil size={24} color={colors.white} strokeWidth={1.5} />
              <Text style={styles.toolLabel}>Draw</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    zIndex: 100,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtons: {
    alignItems: 'flex-end',
    gap: 10,
  },
  activeModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 60,
    gap: 4,
  },
  toolButtonActive: {
    backgroundColor: colors.white,
  },
  toolLabel: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '500',
  },
  toolLabelActive: {
    color: colors.black,
  },
  undoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stickerPreviewImage: {
    width: 36,
    height: 36,
  },
});

export default TopToolbar;
