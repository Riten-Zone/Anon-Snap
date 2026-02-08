import {NativeModules, Platform} from 'react-native';

const {BackgroundRemover} = NativeModules;

export async function removeBackground(inputUri: string): Promise<string> {
  if (!BackgroundRemover) {
    throw new Error(
      `BackgroundRemover native module not available on ${Platform.OS}`,
    );
  }
  return BackgroundRemover.removeBackground(inputUri);
}
