import {useState, useCallback} from 'react';
import type {Buffer} from '@craftzdog/react-native-buffer';
import type {BIOMETRY_TYPE} from 'react-native-keychain';
import {
  unlockAndGetKey,
  getBiometryType,
} from '../services/AlbumAuthService';

// Module-scoped, session-only — never persisted, cleared on lock().
let sessionKey: Buffer | null = null;

export function useAlbumAuth() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometryType, setBiometryType] = useState<BIOMETRY_TYPE | null>(null);

  const unlock = useCallback(async (): Promise<Buffer | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const type = await getBiometryType();
      setBiometryType(type);

      const key = await unlockAndGetKey();
      if (!key) {
        setIsUnlocked(false);
        return null;
      }
      sessionKey = key;
      setIsUnlocked(true);
      return key;
    } catch (err) {
      console.error('[useAlbumAuth] unlock failed:', err);
      setError('Unable to unlock Private Album');
      setIsUnlocked(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const lock = useCallback(() => {
    sessionKey = null;
    setIsUnlocked(false);
  }, []);

  const getKey = useCallback((): Buffer | null => sessionKey, []);

  return {isUnlocked, isLoading, error, biometryType, unlock, lock, getKey};
}
