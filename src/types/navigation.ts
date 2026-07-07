import type {NativeStackScreenProps} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Editor: {
    photoUri: string;
  };
  Gallery: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Home'
>;
export type CameraScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Camera'
>;
export type EditorScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Editor'
>;
export type GalleryScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Gallery'
>;
