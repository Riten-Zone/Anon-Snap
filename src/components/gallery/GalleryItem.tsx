import React, {useEffect, useState} from 'react';
import {TouchableOpacity, Image, StyleSheet, ActivityIndicator, View} from 'react-native';
import type {Buffer} from '@craftzdog/react-native-buffer';
import type {AlbumPhotoMeta} from '../../services/StorageService';
import {decryptForView, cleanupTempFile} from '../../services/AlbumService';
import {colors} from '../../theme';

interface GalleryItemProps {
  photo: AlbumPhotoMeta;
  itemSize: number;
  albumKey: Buffer;
  onPress: (id: string) => void;
}

const GalleryItem: React.FC<GalleryItemProps> = ({photo, itemSize, albumKey, onPress}) => {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let tempUri: string | null = null;
    let cancelled = false;

    decryptForView(photo.id, albumKey)
      .then(result => {
        if (cancelled) {
          cleanupTempFile(result);
          return;
        }
        tempUri = result;
        setUri(result);
      })
      .catch(error => console.error('[GalleryItem] decrypt failed:', error));

    return () => {
      cancelled = true;
      if (tempUri) {
        cleanupTempFile(tempUri);
      }
    };
  }, [photo.id, albumKey]);

  return (
    <TouchableOpacity
      style={[styles.item, {width: itemSize, height: itemSize}]}
      onPress={() => onPress(photo.id)}
      activeOpacity={0.8}>
      {uri ? (
        <Image source={{uri}} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <ActivityIndicator size="small" color={colors.gray400} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray800,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(GalleryItem);
