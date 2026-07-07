import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, AppState} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {ChevronLeft} from 'lucide-react-native';
import type {GalleryScreenProps} from '../types';
import {useAlbumAuth} from '../hooks/useAlbumAuth';
import {useAlbumPhotos} from '../hooks/useAlbumPhotos';
import AlbumLockScreen from '../components/gallery/AlbumLockScreen';
import PhotoGrid from '../components/gallery/PhotoGrid';
import PhotoViewerModal from '../components/gallery/PhotoViewerModal';
import {colors} from '../theme';

const GalleryScreen: React.FC<GalleryScreenProps> = ({navigation}) => {
  const {isUnlocked, isLoading, error, biometryType, unlock, lock, getKey} =
    useAlbumAuth();
  const {photos, removePhoto, viewPhoto, exportPhotoToDevice} = useAlbumPhotos();
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  useFocusEffect(
    useCallback(() => {
      if (!isUnlocked) {
        unlock();
      }
    }, [isUnlocked, unlock]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        lock();
        setSelectedPhotoId(null);
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [lock]);

  const albumKey = getKey();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={28} color={colors.white} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Private Album</Text>
        <View style={styles.placeholder} />
      </View>

      {isUnlocked && albumKey ? (
        <PhotoGrid photos={photos} albumKey={albumKey} onSelectPhoto={setSelectedPhotoId} />
      ) : (
        <AlbumLockScreen
          isLoading={isLoading}
          error={error}
          biometryType={biometryType}
          onUnlock={unlock}
        />
      )}

      <PhotoViewerModal
        visible={selectedPhotoId !== null}
        photoId={selectedPhotoId}
        albumKey={albumKey}
        onClose={() => setSelectedPhotoId(null)}
        onDelete={removePhoto}
        viewPhoto={viewPhoto}
        exportPhotoToDevice={exportPhotoToDevice}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
});

export default GalleryScreen;
