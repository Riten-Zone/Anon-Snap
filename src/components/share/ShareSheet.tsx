import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {Download, Share2, Home, X} from 'lucide-react-native';
import {colors} from '../../theme';

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  onShare: () => void;
  onBackToMenu: () => void;
  isLoading?: boolean;
}

const ShareSheet: React.FC<ShareSheetProps> = ({
  visible,
  onClose,
  onSave,
  onShare,
  onBackToMenu,
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
          <View style={styles.header}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.gray400} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Share or Save</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.loadingText}>Processing image...</Text>
            </View>
          ) : (
            <>
              <View style={styles.mainOptions}>
                <TouchableOpacity
                  style={[styles.mainButton, styles.saveButton]}
                  onPress={onSave}>
                  <Download size={24} color={colors.black} strokeWidth={2} />
                  <Text style={styles.saveButtonText}>Save Locally</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mainButton, styles.shareButton]}
                  onPress={onShare}>
                  <Share2 size={24} color={colors.white} strokeWidth={2} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.menuButton} onPress={onBackToMenu}>
                <Home size={20} color={colors.gray400} strokeWidth={2} />
                <Text style={styles.menuText}>Back to Menu</Text>
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
    backgroundColor: colors.gray900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray500,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
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
    color: colors.gray300,
  },
  mainOptions: {
    gap: 12,
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
    backgroundColor: colors.white,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
  },
  shareButton: {
    backgroundColor: colors.gray700,
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 16,
    color: colors.gray400,
  },
});

export default ShareSheet;
