import type {ImageSourcePropType} from 'react-native';

export function toImageSource(source: number | string): ImageSourcePropType {
  return typeof source === 'number' ? source : {uri: source};
}
