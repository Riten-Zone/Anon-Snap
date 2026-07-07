import React, {useEffect, useState, useCallback} from 'react';
import {
  Modal,
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Share2, Trash2, Download, X} from 'lucide-react-native';
import type {Buffer} from '@craftzdog/react-native-buffer';
import {shareImage} from '../../services/ShareService';
import {cleanupTempFile} from '../../services/AlbumService';
import {colors} from '../../theme';

interface PhotoViewerModalProps {
  visible: boolean;
  photoId: string | null;
  albumKey: Buffer | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  viewPhoto: (id: string, key: Buffer) => Promise<string>;
  exportPhotoToDevice: (id: string, key: Buffer) => Promise<string>;
}

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  visible,
  photoId,
  albumKey,
  onClose,
  onDelete,
  viewPhoto,
  exportPhotoToDevice,
}) => {
  const [uri, setUri] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!visible || !photoId || !albumKey) {
      return;
    }
    let tempUri: string | null = null;
    let cancelled = false;

    viewPhoto(photoId, albumKey)
      .then(result => {
        if (cancelled) {
          cleanupTempFile(result);
          return;
        }
        tempUri = result;
        setUri(result);
      })
      .catch(error => console.error('[PhotoViewerModal] decrypt failed:', error));

    return () => {
      cancelled = true;
      if (tempUri) {
        cleanupTempFile(tempUri);
      }
      setUri(null);
    };
  }, [visible, photoId, albumKey, viewPhoto]);

  const handleShare = useCallback(async () => {
    if (!uri) return;
    try {
      await shareImage({url: uri});
    } catch (error) {
      Alert.alert('Error', 'Failed to share photo.');
    }
  }, [uri]);

  const handleCopyToDevice = useCallback(async () => {
    if (!photoId || !albumKey) return;
    setIsBusy(true);
    try {
      await exportPhotoToDevice(photoId, albumKey);
      Alert.alert('Saved!', 'A copy was saved to your Photo Album.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save a copy to the device.');
    } finally {
      setIsBusy(false);
    }
  }, [photoId, albumKey, exportPhotoToDevice]);

  const handleDelete = useCallback(() => {
    if (!photoId) return;
    Alert.alert('Delete Photo', 'This cannot be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsBusy(true);
          try {
            await onDelete(photoId);
            onClose();
          } finally {
            setIsBusy(false);
          }
        },
      },
    ]);
  }, [photoId, onDelete, onClose]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color={colors.white} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.imageContainer}>
          {uri ? (
            <Image source={{uri}} style={styles.image} resizeMode="contain" />
          ) : (
            <ActivityIndicator size="large" color={colors.white} />
          )}
        </View>

        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            disabled={isBusy || !uri}>
            <Share2 size={22} color={colors.white} strokeWidth={2} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopyToDevice}
            disabled={isBusy || !uri}>
            <Download size={22} color={colors.white} strokeWidth={2} />
            <Text style={styles.actionText}>Copy to Device</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDelete}
            disabled={isBusy}>
            <Trash2 size={22} color={colors.danger} strokeWidth={2} />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.gray800,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: colors.white,
  },
  deleteText: {
    color: colors.danger,
  },
});

export default PhotoViewerModal;
