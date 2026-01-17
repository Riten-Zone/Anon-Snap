import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import type {HomeScreenProps} from '../types';
import {pickImageFromGallery} from '../services';

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const handleImportPhoto = async () => {
    const uri = await pickImageFromGallery();
    if (uri) {
      navigation.navigate('Editor', {photoUri: uri});
    }
  };

  const handleTakePhoto = () => {
    navigation.navigate('Camera');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.header}>
        <Text style={styles.logoEmoji}>🎭</Text>
        <Text style={styles.title}>Anon Snap</Text>
        <Text style={styles.subtitle}>Protect your privacy</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.importButton]}
          onPress={handleImportPhoto}
          activeOpacity={0.8}>
          <Text style={styles.buttonEmoji}>🖼️</Text>
          <Text style={styles.buttonText}>Import Photo</Text>
          <Text style={styles.buttonHint}>Choose from your gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={handleTakePhoto}
          activeOpacity={0.8}>
          <Text style={styles.buttonEmoji}>📸</Text>
          <Text style={styles.buttonText}>Take Photo</Text>
          <Text style={styles.buttonHint}>Use camera to capture</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.privacyNote}>
        All processing happens on your device.{'\n'}
        No data is ever uploaded.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  button: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  importButton: {
    backgroundColor: '#2d2d44',
    borderWidth: 2,
    borderColor: '#3d3d5c',
  },
  cameraButton: {
    backgroundColor: '#4a3f8a',
  },
  buttonEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  buttonHint: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  privacyNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#606080',
    marginBottom: 40,
    lineHeight: 18,
  },
});

export default HomeScreen;
