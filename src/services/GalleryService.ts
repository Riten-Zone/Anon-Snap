import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {launchImageLibrary, type ImagePickerResponse} from 'react-native-image-picker';
import {Platform, PermissionsAndroid} from 'react-native';

export async function saveToGallery(imagePath: string): Promise<string> {
  try {
    // Request permission on Android
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'Anon Snap needs permission to save photos to your gallery.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      // On newer Android versions, WRITE_EXTERNAL_STORAGE might not be needed
      // CameraRoll handles it internally
    }

    const asset = await CameraRoll.saveAsset(imagePath, {
      type: 'photo',
      album: 'Anon Snap',
    });

    return asset.node.image.uri;
  } catch (error) {
    console.error('Error saving to gallery:', error);
    throw error;
  }
}

export async function pickImageFromGallery(): Promise<string | null> {
  return new Promise((resolve) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
        selectionLimit: 1,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          resolve(null);
        } else if (response.errorCode) {
          console.error('Image picker error:', response.errorMessage);
          resolve(null);
        } else if (response.assets && response.assets[0]?.uri) {
          resolve(response.assets[0].uri);
        } else {
          resolve(null);
        }
      },
    );
  });
}
