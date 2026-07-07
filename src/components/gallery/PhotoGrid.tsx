import React, {useMemo} from 'react';
import {FlatList, StyleSheet, View, Text, Dimensions} from 'react-native';
import type {Buffer} from '@craftzdog/react-native-buffer';
import type {AlbumPhotoMeta} from '../../services/StorageService';
import GalleryItem from './GalleryItem';
import {colors} from '../../theme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 8;
const NUM_COLUMNS = 3;
const ITEM_SIZE =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface PhotoGridProps {
  photos: AlbumPhotoMeta[];
  albumKey: Buffer;
  onSelectPhoto: (id: string) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({photos, albumKey, onSelectPhoto}) => {
  const columnWrapperStyle = useMemo(() => ({gap: GRID_GAP}), []);

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No photos yet</Text>
        <Text style={styles.emptySubtitle}>
          Photos you save to your Private Album will appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={photos}
      keyExtractor={item => item.id}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={columnWrapperStyle}
      contentContainerStyle={styles.contentContainer}
      renderItem={({item}) => (
        <GalleryItem
          photo={item}
          itemSize={ITEM_SIZE}
          albumKey={albumKey}
          onPress={onSelectPhoto}
        />
      )}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: GRID_PADDING,
    gap: GRID_GAP,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PhotoGrid;
