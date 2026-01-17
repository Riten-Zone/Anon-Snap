import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  onShareTwitter: () => void;
  onShareTelegram: () => void;
  onShareOther: () => void;
  isLoading?: boolean;
}

const ShareSheet: React.FC<ShareSheetProps> = ({
  visible,
  onClose,
  onSave,
  onShareTwitter,
  onShareTelegram,
  onShareOther,
  isLoading,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Share or Save</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4a3f8a" />
              <Text style={styles.loadingText}>Processing image...</Text>
            </View>
          ) : (
            <>
              <View style={styles.mainOptions}>
                <TouchableOpacity
                  style={[styles.mainButton, styles.saveButton]}
                  onPress={onSave}>
                  <Text style={styles.mainButtonIcon}>💾</Text>
                  <Text style={styles.mainButtonText}>Save to Gallery</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Share to</Text>

              <View style={styles.shareOptions}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={onShareTwitter}>
                  <Text style={styles.shareIcon}>🐦</Text>
                  <Text style={styles.shareLabel}>Twitter</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={onShareTelegram}>
                  <Text style={styles.shareIcon}>✈️</Text>
                  <Text style={styles.shareLabel}>Telegram</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={onShareOther}>
                  <Text style={styles.shareIcon}>📤</Text>
                  <Text style={styles.shareLabel}>Other</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#4a4a6a',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#a0a0a0',
  },
  mainOptions: {
    marginBottom: 24,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4a3f8a',
  },
  mainButtonIcon: {
    fontSize: 24,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#808090',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  shareButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#2d2d44',
    minWidth: 90,
  },
  shareIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  shareLabel: {
    fontSize: 14,
    color: '#ffffff',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#808090',
  },
});

export default ShareSheet;
