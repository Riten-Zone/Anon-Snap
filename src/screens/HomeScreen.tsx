import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import {Image as ImageIcon, Camera} from 'lucide-react-native';
import type {HomeScreenProps} from '../types';
import {pickImageFromGallery} from '../services';
import {colors} from '../theme';

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
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />

      <View style={styles.header}>
        <Image
          source={require('../../assets/logo/anon_snap_logo_main.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Anon Snap</Text>
        <Text style={styles.subtitle}>Protect your privacy</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.importButton]}
          onPress={handleImportPhoto}
          activeOpacity={0.8}>
          <ImageIcon size={40} color={colors.white} strokeWidth={1.5} />
          <Text style={styles.buttonText}>Import Photo</Text>
          <Text style={styles.buttonHint}>Choose from your gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={handleTakePhoto}
          activeOpacity={0.8}>
          <Camera size={40} color={colors.black} strokeWidth={1.5} />
          <Text style={styles.cameraButtonText}>Take Photo</Text>
          <Text style={styles.cameraButtonHint}>Use camera to capture</Text>
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
    backgroundColor: colors.black,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
    gap: 12,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray300,
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
    gap: 12,
  },
  importButton: {
    backgroundColor: colors.gray700,
    borderWidth: 2,
    borderColor: colors.gray600,
  },
  cameraButton: {
    backgroundColor: colors.white,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.white,
  },
  buttonHint: {
    fontSize: 14,
    color: colors.gray300,
  },
  cameraButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.black,
  },
  cameraButtonHint: {
    fontSize: 14,
    color: colors.gray500,
  },
  privacyNote: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.gray500,
    marginBottom: 40,
    lineHeight: 18,
  },
});

export default HomeScreen;
