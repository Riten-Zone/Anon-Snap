import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import {X, Eraser, Check, RotateCcw} from 'lucide-react-native';
import {colors} from '../../theme';
import {removeBackground} from '../../services/BackgroundRemovalService';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

type ModalStep = 'preview' | 'processing' | 'result' | 'error';

interface CustomStickerUploadModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onSave: (processedUri: string) => void;
}

const CustomStickerUploadModal: React.FC<CustomStickerUploadModalProps> = ({
  visible,
  imageUri,
  onClose,
  onSave,
}) => {
  const [step, setStep] = useState<ModalStep>('preview');
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('preview');
      setProcessedUri(null);
      setErrorMessage('');
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleRemoveBackground = useCallback(async () => {
    if (!imageUri) return;
    setStep('processing');
    try {
      const resultUri = await removeBackground(imageUri);
      setProcessedUri(resultUri);
      setStep('result');
    } catch (error: any) {
      setErrorMessage(error?.message || 'Background removal failed');
      setStep('error');
    }
  }, [imageUri]);

  const handleSaveAsIs = useCallback(() => {
    if (imageUri) {
      onSave(imageUri);
      onClose();
    }
  }, [imageUri, onSave, onClose]);

  const handleSaveProcessed = useCallback(() => {
    if (processedUri) {
      onSave(processedUri);
      onClose();
    }
  }, [processedUri, onSave, onClose]);

  const handleRetry = useCallback(() => {
    setStep('preview');
    setProcessedUri(null);
    setErrorMessage('');
  }, []);

  if (!imageUri) return null;

  const displayUri = step === 'result' && processedUri ? processedUri : imageUri;

  return (
    <View style={styles.wrapper} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View
        style={[styles.container, {transform: [{translateY: slideAnim}]}]}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 'preview' && 'Upload Custom Sticker'}
            {step === 'processing' && 'Removing Background...'}
            {step === 'result' && 'Background Removed'}
            {step === 'error' && 'Error'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={16} color={colors.white} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Image Preview */}
          <View style={styles.imageContainer}>
            {step === 'processing' ? (
              <View style={styles.processingOverlay}>
                <Image
                  source={{uri: imageUri}}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                <View style={styles.spinnerOverlay}>
                  <ActivityIndicator size="large" color={colors.white} />
                  <Text style={styles.processingText}>
                    Processing on device...
                  </Text>
                </View>
              </View>
            ) : (
              <Image
                source={{uri: displayUri}}
                style={[
                  styles.previewImage,
                  step === 'result' && styles.checkerboardBg,
                ]}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {step === 'preview' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleRemoveBackground}
                  activeOpacity={0.7}>
                  <Eraser size={20} color={colors.black} strokeWidth={2} />
                  <Text style={styles.primaryButtonText}>
                    Remove Background
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleSaveAsIs}
                  activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>Use as is</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'result' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleSaveProcessed}
                  activeOpacity={0.7}>
                  <Check size={20} color={colors.black} strokeWidth={2} />
                  <Text style={styles.primaryButtonText}>
                    Save as Sticker
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleSaveAsIs}
                  activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>
                    Use original instead
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'error' && (
              <>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleRetry}
                  activeOpacity={0.7}>
                  <RotateCcw size={20} color={colors.black} strokeWidth={2} />
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleSaveAsIs}
                  activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>
                    Use original instead
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1001,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    backgroundColor: colors.gray900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray700,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  checkerboardBg: {
    backgroundColor: colors.gray700,
  },
  processingOverlay: {
    alignItems: 'center',
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
  },
  processingText: {
    color: colors.white,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.white,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  secondaryButton: {
    backgroundColor: colors.gray700,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray300,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default CustomStickerUploadModal;
