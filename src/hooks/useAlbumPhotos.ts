import {useState, useEffect, useCallback} from 'react';
import type {Buffer} from '@craftzdog/react-native-buffer';
import type {AlbumPhotoMeta} from '../services/StorageService';
import {
  listPhotos,
  savePhoto,
  deletePhoto,
  decryptForView,
  exportToDevice,
} from '../services/AlbumService';

export function useAlbumPhotos() {
  const [photos, setPhotos] = useState<AlbumPhotoMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listPhotos();
      setPhotos(list.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('[useAlbumPhotos] Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPhoto = useCallback(
    async (sourceUri: string, key: Buffer) => {
      const meta = await savePhoto(sourceUri, key);
      setPhotos(prev => [meta, ...prev]);
      return meta;
    },
    [],
  );

  const removePhoto = useCallback(async (id: string) => {
    await deletePhoto(id);
    setPhotos(prev => prev.filter(p => p.id !== id));
  }, []);

  const viewPhoto = useCallback(
    (id: string, key: Buffer) => decryptForView(id, key),
    [],
  );

  const exportPhotoToDevice = useCallback(
    (id: string, key: Buffer) => exportToDevice(id, key),
    [],
  );

  return {
    photos,
    isLoading,
    refresh,
    addPhoto,
    removePhoto,
    viewPhoto,
    exportPhotoToDevice,
  };
}
