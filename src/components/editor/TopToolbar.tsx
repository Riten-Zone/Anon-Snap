import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {X, Undo2, Shuffle, Plus, Pencil} from 'lucide-react-native';
import {colors} from '../../theme';

interface TopToolbarProps {
  onAddSticker: () => void;
  onSwitchBlur: () => void;
  onClose: () => void;
  isAddMode: boolean;
  onExitAddMode: () => void;
  isDrawingMode: boolean;
  onToggleDrawing: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

const TopToolbar: React.FC<TopToolbarProps> = ({
  onAddSticker,
  onSwitchBlur,
  onClose,
  isAddMode,
  onExitAddMode,
  isDrawingMode,
  onToggleDrawing,
  onUndo,
  canUndo,
}) => {
  const showUndo = (isAddMode || isDrawingMode) && canUndo;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onClose}>
        <X size={18} color={colors.white} strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.rightButtons}>
        {/* Undo button - only shows when in add/draw mode and there's something to undo */}
        {showUndo && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={onUndo}
            activeOpacity={0.7}>
            <Undo2 size={22} color={colors.white} strokeWidth={2} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.toolButton}
          onPress={onSwitchBlur}
          activeOpacity={0.7}>
          <Shuffle size={24} color={colors.white} strokeWidth={1.5} />
          <Text style={styles.toolLabel}>Switch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, isAddMode && styles.toolButtonActive]}
          onPress={isAddMode ? onExitAddMode : onAddSticker}
          activeOpacity={0.7}>
          <Plus
            size={24}
            color={isAddMode ? colors.black : colors.white}
            strokeWidth={1.5}
          />
          <Text style={[styles.toolLabel, isAddMode && styles.toolLabelActive]}>
            {isAddMode ? 'Done' : 'Add'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, isDrawingMode && styles.toolButtonActive]}
          onPress={onToggleDrawing}
          activeOpacity={0.7}>
          <Pencil
            size={24}
            color={isDrawingMode ? colors.black : colors.white}
            strokeWidth={1.5}
          />
          <Text
            style={[styles.toolLabel, isDrawingMode && styles.toolLabelActive]}>
            {isDrawingMode ? 'Done' : 'Draw'}
          </Text>
        </TouchableOpacity>
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
});

export default TopToolbar;
