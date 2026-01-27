import type {NativeStackScreenProps} from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Editor: {
    photoUri: string;
  };
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
