/**
 * @format
 *
 * react-native-quick-crypto's native (Nitro/JSI) binding isn't available
 * under plain Jest, so it's mocked here with Node's built-in `crypto`
 * module — the AES-256-GCM API surface we use (createCipheriv/
 * createDecipheriv/randomBytes) is effectively identical, so this still
 * exercises AlbumCryptoService's real packing/encryption logic.
 */
import {Buffer} from '@craftzdog/react-native-buffer';

jest.mock('react-native-quick-crypto', () => {
  const nodeCrypto = require('crypto');
  return {
    __esModule: true,
    default: {
      randomBytes: (size: number) => nodeCrypto.randomBytes(size),
      createCipheriv: nodeCrypto.createCipheriv,
      createDecipheriv: nodeCrypto.createDecipheriv,
    },
  };
});

import {
  encryptBuffer,
  decryptBuffer,
  packBlob,
  unpackBlob,
  generateKey,
} from '../src/services/AlbumCryptoService';

test('encrypt -> decrypt round-trip returns the original bytes', () => {
  const key = generateKey();
  const plain = Buffer.from('hello private album', 'utf8');

  const blob = encryptBuffer(plain, key);
  const decrypted = decryptBuffer(blob.ciphertext, key, blob.iv, blob.tag);

  expect(Buffer.from(decrypted).equals(plain)).toBe(true);
});

test('pack -> unpack blob round-trip preserves iv/tag/ciphertext', () => {
  const key = generateKey();
  const plain = Buffer.from('another test payload', 'utf8');

  const original = encryptBuffer(plain, key);
  const packed = packBlob(original);
  const {iv, tag, ciphertext} = unpackBlob(packed);

  expect(Buffer.from(iv).equals(original.iv)).toBe(true);
  expect(Buffer.from(tag).equals(original.tag)).toBe(true);
  expect(Buffer.from(ciphertext).equals(original.ciphertext)).toBe(true);

  const decrypted = decryptBuffer(ciphertext, key, iv, tag);
  expect(Buffer.from(decrypted).equals(plain)).toBe(true);
});

test('decrypting with the wrong key throws', () => {
  const key = generateKey();
  const wrongKey = generateKey();
  const plain = Buffer.from('sensitive', 'utf8');

  const blob = encryptBuffer(plain, key);
  expect(() => decryptBuffer(blob.ciphertext, wrongKey, blob.iv, blob.tag)).toThrow();
});
