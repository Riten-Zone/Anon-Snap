import * as Keychain from 'react-native-keychain';
import {Buffer} from '@craftzdog/react-native-buffer';
import {generateKey} from './AlbumCryptoService';

const KEYCHAIN_SERVICE = 'com.anonsnap.privatealbum';
const KEYCHAIN_USERNAME = 'private_album_key';

const KEYCHAIN_OPTIONS: Keychain.SetOptions = {
  service: KEYCHAIN_SERVICE,
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function ensureKeyExists(): Promise<void> {
  const hasKey = await Keychain.hasGenericPassword({service: KEYCHAIN_SERVICE});
  if (hasKey) {
    return;
  }
  const key = generateKey();
  await Keychain.setGenericPassword(
    KEYCHAIN_USERNAME,
    key.toString('base64'),
    KEYCHAIN_OPTIONS,
  );
}

/**
 * Prompts Face ID/Touch ID (or device passcode fallback) and returns the
 * Private Album's AES key on success. Generates the key on first-ever call.
 * Returns null if the user cancels or authentication fails.
 */
export async function unlockAndGetKey(): Promise<Buffer | null> {
  await ensureKeyExists();
  const credentials = await Keychain.getGenericPassword({
    service: KEYCHAIN_SERVICE,
    authenticationPrompt: {
      title: 'Unlock Private Album',
    },
  });
  if (!credentials) {
    return null;
  }
  return Buffer.from(credentials.password, 'base64');
}

export async function isBiometrySupported(): Promise<boolean> {
  const type = await Keychain.getSupportedBiometryType();
  return type !== null;
}

export async function getBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
  return Keychain.getSupportedBiometryType();
}

/** Destructive: permanently deletes the album key. Any existing encrypted photos become unrecoverable. */
export async function resetAlbumKey(): Promise<void> {
  await Keychain.resetGenericPassword({service: KEYCHAIN_SERVICE});
}
