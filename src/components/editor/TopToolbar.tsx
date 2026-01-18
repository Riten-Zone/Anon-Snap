import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';

interface TopToolbarProps {
  onAddSticker: () => void;
  onSwitchBlur: () => void;
  onClose: () => void;
  isAddMode: boolean;
  onExitAddMode: () => void;
}

const TopToolbar: React.FC<TopToolbarProps> = ({
  onAddSticker,
  onSwitchBlur,
  onClose,
  isAddMode,
  onExitAddMode,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onClose}>
        <Text style={styles.buttonText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.rightButtons}>
        <TouchableOpacity
          style={styles.toolButton}
          onPress={onSwitchBlur}
          activeOpacity={0.7}>
          <Text style={styles.toolIcon}>🎭</Text>
          <Text style={styles.toolLabel}>Switch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, isAddMode && styles.toolButtonActive]}
          onPress={isAddMode ? onExitAddMode : onAddSticker}
          activeOpacity={0.7}>
          <Text style={styles.toolIcon}>😀</Text>
          <Text style={styles.toolLabel}>{isAddMode ? 'Done' : 'Add'}</Text>
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
  buttonText: {
    fontSize: 18,
    color: '#ffffff',
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
  },
  toolButtonActive: {
    backgroundColor: '#ff9500',
  },
  toolIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  toolLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default TopToolbar;
