// app/(tabs)/currency/index.tsx - Frontend currency scanner
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import SimpleHamburgerMenu from "@/src/components/SimpleHamburgerMenu";
import { Ionicons } from '@expo/vector-icons';
import { currencyAPI } from '../../lib/currency-api';

type Denomination = 10 | 20 | 50 | 100 | 200 | 500 | 2000 | null;

export default function CurrencyScreen(): JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [type, setType] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedDenomination, setDetectedDenomination] = useState<Denomination>(null);
  const [showCamera, setShowCamera] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  // Location removed as it's not used in demo mode
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      speak('Point your camera at an Indian currency note. Tap the screen to capture.');
    }, 1000);

    // Request location permission
    requestLocationPermission();

    return () => clearTimeout(timer);
  }, []);

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }
    } catch (error) {
      console.log('Location permission error:', error);
      // Continue without location - it's optional
    }
  };

  const speak = (text: string) => {
    Speech.speak(text, {
      language: 'en-US', // Currency detection is primarily in English
      pitch: 1.1,
      rate: 0.9,
    });
  };



  const captureImage = async () => {
    if (isProcessing || !cameraRef.current || !cameraReady) return;

    try {
      setIsProcessing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });

      setCapturedImage(photo.uri);
      setShowCamera(false);

      await processImage(photo.base64);
    } catch (error) {
      console.error('Error capturing image:', error);
      speak('Sorry, there was an error capturing the image. Please try again.');
      setShowCamera(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const processImage = async (base64Image: string | undefined) => {
    if (!base64Image) {
      speak('Failed to capture image. Please try again.');
      setShowCamera(true);
      setIsProcessing(false);
      return;
    }

    try {
      console.log('Processing image with backend API...');

      // Use the currency API to detect currency via backend
      const result = await currencyAPI.detectCurrency(base64Image);

      console.log('Currency detection result:', result);

      if (!result.isIndianCurrency) {
        Alert.alert(
          'Not Indian Currency',
          'This does not appear to be an Indian rupee note. Please capture an Indian currency note.'
        );
        speak('This does not appear to be an Indian currency note. Please try again.');
        throw new Error('Not Indian currency');
      }

      setDetectedDenomination(result.denomination as Denomination);
      setConfidence(result.confidence ? result.confidence : null);

      // Speak the result
      speak(`This is a ${result.denomination} rupee note`);

      // Show success alert
      Alert.alert(
        'Currency Detected!',
        `Detected: ₹${result.denomination} note${result.confidence ? ` (${Math.round(result.confidence * 100)}% confidence)` : ''}`
      );

      // Log the detection to backend (optional - don't block user experience)
      try {
        await currencyAPI.logDetection({
          denomination: result.denomination,
          confidence: result.confidence,
          detectedText: result.detectedText,
          imageUri: capturedImage ?? undefined,
        });
        console.log('Detection logged successfully');
      } catch (logError) {
        console.error('Failed to log detection:', logError);
        // Don't show error to user - logging is optional
      }

    } catch (error) {
      console.error('Error processing image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Check if it's a network/backend connection error
      if (errorMessage.includes('fetch') || errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
        Alert.alert(
          'Backend Connection Error',
          'Unable to connect to the currency detection service. Please ensure:\n• Backend server is running on localhost:3000\n• Network connection is available\n• API endpoints are accessible'
        );
        speak("Unable to connect to the currency detection service. Please check if the backend server is running.");
      } else if (errorMessage.includes('No text detected')) {
        Alert.alert(
          'No Text Found',
          'No text detected in the image. Please ensure:\n• Good lighting\n• Note is clear and unfolded\n• Note fills most of the frame\n• Camera is focused'
        );
        speak("No text was detected in the image. Please try again with better lighting and make sure the note is clearly visible.");
      } else if (errorMessage.includes('Could not determine denomination')) {
        Alert.alert(
          'Denomination Not Found',
          'Text was detected but no valid denomination found. Please try again with:\n• Better lighting\n• Clearer focus\n• Full note visible'
        );
        speak("I could detect text but couldn't determine the denomination. Please try again.");
      } else if (errorMessage.includes('Not Indian currency')) {
        // Already handled above
      } else {
        Alert.alert('Error', `Failed to process image: ${errorMessage}`);
        speak("Sorry, I couldn't recognize the currency. Please try again with better lighting.");
      }

      setShowCamera(true);
    }
  };

  const toggleCameraType = () => {
    setType((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleRetry = () => {
    setDetectedDenomination(null);
    setConfidence(null);
    setCapturedImage(null);
    setShowCamera(true);
  };

  const viewHistory = () => {
    // Navigate to history screen
    router.push('/(tabs)/currency');
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to access the camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Simple Hamburger Menu */}
      <SimpleHamburgerMenu />
      {showCamera ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={type}
            ref={cameraRef}
            onCameraReady={() => setCameraReady(true)}
            autofocus="on"
          >
            {/* Camera overlay and controls */}
            <View style={styles.overlay} pointerEvents="box-none">
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlayLeft} />
                <View style={styles.scanArea}>
                  <View style={[styles.corner, styles.topLeftCorner]} />
                  <View style={[styles.corner, styles.topRightCorner]} />
                  <View style={[styles.corner, styles.bottomLeftCorner]} />
                  <View style={[styles.corner, styles.bottomRightCorner]} />
                </View>
                <View style={styles.overlayRight} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.instructionText}>Position the currency note within the frame</Text>
              </View>
            </View>

            {/* Top controls */}
            <View style={styles.topControls} pointerEvents="box-none">
              <TouchableOpacity style={styles.smallCircle} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>

              <View style={styles.topRightControls}>
                <TouchableOpacity style={styles.smallCircle} onPress={viewHistory}>
                  <Ionicons name="time-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallCircle} onPress={toggleCameraType}>
                  <Ionicons name="camera-reverse" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Capture button */}
            <View style={styles.captureButtonContainer} pointerEvents="box-none">
              <TouchableOpacity
                style={[styles.captureButton, isProcessing && styles.disabledButton]}
                onPress={captureImage}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          {capturedImage && (
            <Image
              source={{ uri: capturedImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}

          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          ) : detectedDenomination ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>
                Detected: ₹{detectedDenomination}
              </Text>
              {confidence && (
                <Text style={styles.confidenceText}>
                  Confidence: {Math.round(confidence * 100)}%
                </Text>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => speak(`This is a ${detectedDenomination} rupee note`)}
              >
                <Ionicons name="volume-high" size={24} color="#fff" />
                <Text style={styles.buttonText}>Hear Again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.retryButton]}
              onPress={handleRetry}
              disabled={isProcessing}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.historyButton]}
              onPress={viewHistory}
              disabled={isProcessing}
            >
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// Styles remain the same as the previous version
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraContainer: { flex: 1, width: '100%' },
  camera: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', pointerEvents: 'box-none' },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayMiddle: { flexDirection: 'row', flex: 2 },
  overlayLeft: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayRight: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  scanArea: { width: '70%', aspectRatio: 1, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#007AFF', borderWidth: 0 },
  topLeftCorner: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  topRightCorner: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  bottomLeftCorner: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  bottomRightCorner: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
  instructionText: { color: 'white', fontSize: 16, textAlign: 'center', marginTop: 20, paddingHorizontal: 20 },
  topControls: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 999 },
  topRightControls: { flexDirection: 'row', gap: 10 },
  smallCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  captureButtonContainer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', zIndex: 999, pointerEvents: 'box-none' },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 6, borderColor: 'rgba(255,255,255,0.3)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
  captureButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#007AFF' },
  disabledButton: { opacity: 0.7 },
  previewContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '100%', height: '60%' },
  processingContainer: { position: 'absolute', top: '50%', alignItems: 'center' },
  processingText: { color: '#fff', marginTop: 10, fontSize: 16 },
  resultContainer: { position: 'absolute', bottom: 200, alignItems: 'center' },
  resultText: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  confidenceText: { color: '#ccc', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  buttonRow: { position: 'absolute', bottom: 50, flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: 20, gap: 10 },
  actionButton: { flexDirection: 'row', backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 25, alignItems: 'center', justifyContent: 'center', flex: 1, maxWidth: 150 },
  retryButton: { backgroundColor: '#FF9500' },
  historyButton: { backgroundColor: '#5856D6' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 6 },
  text: { color: 'white', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
});