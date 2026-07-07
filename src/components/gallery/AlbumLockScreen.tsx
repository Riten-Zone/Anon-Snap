import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {Lock} from 'lucide-react-native';
import {BIOMETRY_TYPE} from 'react-native-keychain';
import {colors} from '../../theme';

interface AlbumLockScreenProps {
  isLoading: boolean;
  error: string | null;
  biometryType: BIOMETRY_TYPE | null;
  onUnlock: () => void;
}

function unlockLabel(type: BIOMETRY_TYPE | null): string {
  if (type === BIOMETRY_TYPE.FACE_ID) return 'Unlock with Face ID';
  if (type === BIOMETRY_TYPE.TOUCH_ID) return 'Unlock with Touch ID';
  return 'Unlock Private Album';
}

const AlbumLockScreen: React.FC<AlbumLockScreenProps> = ({
  isLoading,
  error,
  biometryType,
  onUnlock,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Lock size={40} color={colors.white} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>Private Album</Text>
      <Text style={styles.subtitle}>
        Photos here are encrypted and never leave your device.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.unlockButton}
        onPress={onUnlock}
        disabled={isLoading}
        activeOpacity={0.8}>
        {isLoading ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={styles.unlockButtonText}>{unlockLabel(biometryType)}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.gray800,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray300,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  error: {
    fontSize: 14,
    color: colors.danger,
    marginBottom: 16,
    textAlign: 'center',
  },
  unlockButton: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    minWidth: 220,
    alignItems: 'center',
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
});

export default AlbumLockScreen;
