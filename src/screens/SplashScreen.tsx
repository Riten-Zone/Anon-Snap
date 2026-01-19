import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {Fingerprint} from 'lucide-react-native';
import type {SplashScreenProps} from '../types';
import {colors} from '../theme';

const SplashScreen: React.FC<SplashScreenProps> = ({navigation}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  const handlePress = () => {
    navigation.replace('Home');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={handlePress}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />
      <View style={styles.logoContainer}>
        <Fingerprint size={80} color={colors.white} strokeWidth={1.5} />
        <Text style={styles.title}>Anon Snap</Text>
        <Text style={styles.subtitle}>Take Anonymous Photos</Text>
      </View>
      <Text style={styles.tapHint}>Tap anywhere to continue</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 18,
    color: colors.gray300,
  },
  tapHint: {
    position: 'absolute',
    bottom: 50,
    fontSize: 14,
    color: colors.gray500,
  },
});

export default SplashScreen;
