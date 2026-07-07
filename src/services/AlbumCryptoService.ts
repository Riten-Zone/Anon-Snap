import QuickCrypto from 'react-native-quick-crypto';
import {Buffer} from '@craftzdog/react-native-buffer';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export interface EncryptedBlob {
  iv: Buffer;
  tag: Buffer;
  ciphertext: Buffer;
}

export function encryptBuffer(plain: Buffer, key: Buffer): EncryptedBlob {
  const iv = QuickCrypto.randomBytes(IV_LENGTH);
  const cipher = QuickCrypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {iv, tag, ciphertext};
}

export function decryptBuffer(
  ciphertext: Buffer,
  key: Buffer,
  iv: Buffer,
  tag: Buffer,
): Buffer {
  const decipher = QuickCrypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** Packs [iv][tag][ciphertext] into a single blob for on-disk storage. */
export function packBlob({iv, tag, ciphertext}: EncryptedBlob): Buffer {
  return Buffer.concat([iv, tag, ciphertext]);
}

/** Reverses packBlob(). */
export function unpackBlob(blob: Buffer): {
  iv: Buffer;
  tag: Buffer;
  ciphertext: Buffer;
} {
  const iv = blob.subarray(0, IV_LENGTH);
  const tag = blob.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = blob.subarray(IV_LENGTH + TAG_LENGTH);
  return {iv, tag, ciphertext};
}

export function generateKey(): Buffer {
  return QuickCrypto.randomBytes(32);
}
