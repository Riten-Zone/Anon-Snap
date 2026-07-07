import RNFS from 'react-native-fs';
import {Buffer} from '@craftzdog/react-native-buffer';
import {
  encryptBuffer,
  decryptBuffer,
  packBlob,
  unpackBlob,
} from './AlbumCryptoService';
import {
  addAlbumPhoto,
  removeAlbumPhoto,
  getAlbumPhotos,
  type AlbumPhotoMeta,
} from './StorageService';
import {saveToGallery} from './GalleryService';

const ALBUM_DIR = `${RNFS.DocumentDirectoryPath}/private_album`;
const TEMP_DIR = `${RNFS.CachesDirectoryPath}/private_album_tmp`;

async function ensureAlbumDir(): Promise<void> {
  const exists = await RNFS.exists(ALBUM_DIR);
  if (!exists) {
    await RNFS.mkdir(ALBUM_DIR);
  }
}

async function ensureTempDir(): Promise<void> {
  const exists = await RNFS.exists(TEMP_DIR);
  if (!exists) {
    await RNFS.mkdir(TEMP_DIR);
  }
}

/** Best-effort wipe of any leftover decrypted plaintext from a previous session. */
export async function clearTempCache(): Promise<void> {
  const exists = await RNFS.exists(TEMP_DIR);
  if (exists) {
    await RNFS.unlink(TEMP_DIR);
  }
}

export async function savePhoto(
  sourcePath: string,
  key: Buffer,
): Promise<AlbumPhotoMeta> {
  await ensureAlbumDir();

  const normalizedSource = sourcePath.replace('file://', '');
  const base64 = await RNFS.readFile(normalizedSource, 'base64');
  const plain = Buffer.from(base64, 'base64');

  const blob = packBlob(encryptBuffer(plain, key));

  const id = `photo_${Date.now()}`;
  const filename = `${id}.enc`;
  await RNFS.writeFile(`${ALBUM_DIR}/${filename}`, blob.toString('base64'), 'base64');

  const meta: AlbumPhotoMeta = {id, filename, createdAt: Date.now()};
  await addAlbumPhoto(meta);
  return meta;
}

export async function listPhotos(): Promise<AlbumPhotoMeta[]> {
  return getAlbumPhotos();
}

export async function deletePhoto(id: string): Promise<void> {
  const photos = await getAlbumPhotos();
  const photo = photos.find(p => p.id === id);
  if (photo) {
    const filePath = `${ALBUM_DIR}/${photo.filename}`;
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
    }
    await removeAlbumPhoto(id);
  }
}

/**
 * Decrypts a photo to a temp file for viewing/sharing. Caller is responsible
 * for calling cleanupTempFile() once done with the returned URI.
 */
export async function decryptForView(id: string, key: Buffer): Promise<string> {
  const photos = await getAlbumPhotos();
  const photo = photos.find(p => p.id === id);
  if (!photo) {
    throw new Error(`Photo ${id} not found in Private Album`);
  }

  await ensureTempDir();

  const base64 = await RNFS.readFile(`${ALBUM_DIR}/${photo.filename}`, 'base64');
  const blob = Buffer.from(base64, 'base64');
  const {iv, tag, ciphertext} = unpackBlob(blob);
  const plain = decryptBuffer(ciphertext, key, iv, tag);

  const tempPath = `${TEMP_DIR}/${id}.png`;
  await RNFS.writeFile(tempPath, plain.toString('base64'), 'base64');
  return `file://${tempPath}`;
}

export async function cleanupTempFile(path: string): Promise<void> {
  const normalized = path.replace('file://', '');
  const exists = await RNFS.exists(normalized);
  if (exists) {
    await RNFS.unlink(normalized);
  }
}

/** Decrypts and copies the photo to the device Camera Roll. Does not remove it from the Private Album. */
export async function exportToDevice(id: string, key: Buffer): Promise<string> {
  const tempUri = await decryptForView(id, key);
  try {
    return await saveToGallery(tempUri);
  } finally {
    await cleanupTempFile(tempUri);
  }
}
