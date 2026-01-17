import {useCallback, useEffect, useState} from 'react';
import {Alert, Linking, Platform} from 'react-native';
import {Camera} from 'react-native-vision-camera';

export type PermissionStatus = 'granted' | 'denied' | 'not-determined';

export function usePermissions() {
  const [cameraPermission, setCameraPermission] =
    useState<PermissionStatus>('not-determined');
  const [microphonePermission, setMicrophonePermission] =
    useState<PermissionStatus>('not-determined');

  const checkPermissions = useCallback(async () => {
    const camera = await Camera.getCameraPermissionStatus();
    const microphone = await Camera.getMicrophonePermissionStatus();

    setCameraPermission(camera as PermissionStatus);
    setMicrophonePermission(microphone as PermissionStatus);

    return {camera, microphone};
  }, []);

  const requestCameraPermission = useCallback(async () => {
    const status = await Camera.requestCameraPermission();
    setCameraPermission(status as PermissionStatus);

    if (status === 'denied') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in Settings to take photos.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: () => Linking.openSettings()},
        ],
      );
    }

    return status;
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    const status = await Camera.requestMicrophonePermission();
    setMicrophonePermission(status as PermissionStatus);
    return status;
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    cameraPermission,
    microphonePermission,
    checkPermissions,
    requestCameraPermission,
    requestMicrophonePermission,
    hasCameraPermission: cameraPermission === 'granted',
    hasMicrophonePermission: microphonePermission === 'granted',
  };
}
