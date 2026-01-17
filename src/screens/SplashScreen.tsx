import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import type {SplashScreenProps} from '../types';

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
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.logoContainer}>
        <Text style={styles.logoEmoji}>🎭</Text>
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
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#a0a0a0',
  },
  tapHint: {
    position: 'absolute',
    bottom: 50,
    fontSize: 14,
    color: '#606080',
  },
});

export default SplashScreen;
