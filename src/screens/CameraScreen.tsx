import React, {useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  PhotoFile,
} from 'react-native-vision-camera';
import {X, RefreshCw} from 'lucide-react-native';
import type {CameraScreenProps} from '../types';
import {usePermissions} from '../hooks';
import {normalizeImageOrientation} from '../services/ImageNormalizer';
import {colors} from '../theme';

const CameraScreen: React.FC<CameraScreenProps> = ({navigation}) => {
  const cameraRef = useRef<Camera>(null);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const {hasCameraPermission, requestCameraPermission} = usePermissions();

  const device = useCameraDevice(cameraPosition);
  const format = useCameraFormat(device, [
    {photoResolution: {width: 1920, height: 1080}},
  ]);

  const handleFlipCamera = useCallback(() => {
    setCameraPosition(prev => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo: PhotoFile = await cameraRef.current.takePhoto({
        flash: 'off',
      });

      // Normalize the photo to bake EXIF rotation into pixels
      const normalizedUri = await normalizeImageOrientation(photo.path);
      navigation.replace('Editor', {photoUri: normalizedUri});
    } catch (error) {
      console.error('Error capturing photo:', error);
      setIsCapturing(false);
    }
  }, [navigation, isCapturing]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Request permission if not granted
  React.useEffect(() => {
    if (!hasCameraPermission) {
      requestCameraPermission();
    }
  }, [hasCameraPermission, requestCameraPermission]);

  if (!hasCameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.black} />
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.black} />
        <ActivityIndicator size="large" color={colors.white} />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />

      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={true}
        photo={true}
        outputOrientation="device"
      />

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <X size={20} color={colors.white} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.flipButton} onPress={handleFlipCamera}>
          <RefreshCw size={22} color={colors.white} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={isCapturing}
          activeOpacity={0.7}>
          {isCapturing ? (
            <ActivityIndicator size="small" color={colors.black} />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    color: colors.black,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.gray300,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
  },
});

export default CameraScreen;
