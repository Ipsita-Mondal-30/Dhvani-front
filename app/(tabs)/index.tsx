import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Alert,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  AppState,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';

import { icons } from "../../constants/icons";
import { getSpeechLanguageCode, changeLanguage } from "../../../dhvani-expo-app/src/locales/i18n";
import SimpleHamburgerMenu from "../../../dhvani-expo-app/src/components/SimpleHamburgerMenu";
import { useTheme } from "../../../dhvani-expo-app/src/contexts/ThemeContext";

import { SOSService } from "../../services/sosService";

const { width, height } = Dimensions.get('window');

// Voice recognition patterns for SOS activation
const SOS_VOICE_PATTERNS = [
  'help help help',
  'emergency',
  'help me',
  'urgent help',
  'मदद मदद मदद',
  'आपातकाल',
  'बचाओ',
  'हेल्प हेल्प हेल्प'
];

const FeatureCard = ({ icon, title, description, onPress }: {
  icon: any;
  title: string;
  description: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      padding: 20,
      marginBottom: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F3F4F6',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
    }}
    accessibilityRole="button"
    accessibilityLabel={`${title}: ${description}`}
    accessibilityHint="Double tap to navigate to this feature"
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View style={{
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        width: 48,
        height: 48,
        backgroundColor: '#EFF6FF',
        borderRadius: 12
      }}>
        <Image source={icon} style={{ width: 24, height: 24, tintColor: '#2563EB' }} />
      </View>
      <Text style={{ flex: 1, fontSize: 18, fontWeight: 'bold', color: '#111827' }}>{title}</Text>
    </View>
    <Text style={{ fontSize: 14, fontWeight: '500', lineHeight: 20, color: '#6B7280' }}>{description}</Text>

    {/* Subtle arrow indicator */}
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
      <View style={{
        justifyContent: 'center',
        alignItems: 'center',
        width: 24,
        height: 24,
        backgroundColor: '#F3F4F6',
        borderRadius: 12
      }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9CA3AF' }}>→</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const Index = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [sosCountdown, setSOSCountdown] = useState(0);
  const [isSosMode, setIsSosMode] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [soundTranscription, setSoundTranscription] = useState('');
  
  // Triple tap detection
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTime = useRef<number>(0);
  
  // Voice recognition variables and refs
  const speechBuffer = useRef<string[]>([]);
  const lastSpeechTime = useRef<number>(0);
  const sosTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef<string>(AppState.currentState);

  // Add null check for translation
  const welcomeMessage = t('home.description') || 'Welcome to Dhvani - Your Text to Speech Assistant';

  // Cleanup function for all timers and resources
  const cleanup = () => {
    if (sosTimer.current) {
      clearTimeout(sosTimer.current);
      sosTimer.current = null;
    }
    if (listeningTimer.current) {
      clearTimeout(listeningTimer.current);
      listeningTimer.current = null;
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
    }
    if (recording) {
      recording.stopAndUnloadAsync().catch(error => {
        console.error('Error stopping recording:', error);
      });
      setRecording(null);
    }
    setIsListening(false);
    setSOSCountdown(0);
    setIsSosMode(false);
    setTapCount(0);
    setIsSendingSOS(false);
  };

  // Handle app state changes for background voice monitoring
  const handleAppStateChange = (nextAppState: string) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground, restart voice monitoring if it was active
      if (isListening) {
        startVoiceMonitoring();
      }
    }
    appState.current = nextAppState;
  };

  // Start continuous voice monitoring - FIXED PERMISSIONS AND INITIALIZATION
  const startVoiceMonitoring = async () => {
    try {
      console.log('🎤 Starting voice monitoring...');
      
      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('🎤 Microphone permission denied');
        Alert.alert(
          'Permission Required',
          'Microphone access is needed for voice-activated SOS features. Please enable microphone permission in settings.',
          [
            { text: 'Cancel', onPress: () => setIsListening(false) },
            { text: 'Settings', onPress: () => {
              // Try to open app settings
              Linking.openSettings().catch(() => {
                console.log('Could not open settings');
              });
            }}
          ]
        );
        setIsListening(false);
        return;
      }

      // Configure audio for recording - FIXED FOR iOS (simplified)
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
        
        console.log('✅ Audio mode configured successfully');
        
        // Start the continuous listening loop
        startListeningContinuous();
        
      } catch (audioError) {
        console.error('❌ Failed to configure audio mode:', audioError);
        Alert.alert(
          'Audio Configuration Error',
          'Could not configure audio for voice monitoring. Voice features may not work properly.',
          [{ text: 'OK' }]
        );
        setIsListening(false);
      }
      
    } catch (error) {
      console.error('❌ Failed to start voice monitoring:', error);
      setIsListening(false);
      Alert.alert(
        'Voice Monitoring Error',
        'Could not start voice monitoring. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // FIXED - Continuous listening function with proper iOS audio mode setup
  const startListeningContinuous = async () => {
    if (!isListening) {
      console.log('🎤 Listening disabled, stopping continuous listening');
      return;
    }

    try {
      console.log('🎤 Starting new recording session...');
      
      // Clean up any existing recording
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
          setRecording(null);
        } catch (cleanupError) {
          console.log('⚠️ Error cleaning up previous recording:', cleanupError);
        }
      }

      // Clear any existing timer
      if (listeningTimer.current) {
        clearTimeout(listeningTimer.current);
        listeningTimer.current = null;
      }

      // CRITICAL: Set audio mode again before each recording on iOS (simplified)
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
        console.log('✅ Audio mode set for recording');
      } catch (audioModeError) {
        console.error('❌ Failed to set audio mode:', audioModeError);
        throw audioModeError;
      }

      // Create new recording with correct Expo Audio constants
      try {
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(newRecording);
        console.log('✅ Recording started successfully');

        // Listen for 2 seconds (reduced from 3 for better responsiveness), then process
        listeningTimer.current = setTimeout(() => {
          processAudio(newRecording);
        }, 2000);

      } catch (recordingError) {
        console.error('❌ Failed to create recording:', recordingError);
        setRecording(null);
        
        // Retry after delay if still listening
        if (isListening) {
          console.log('🔄 Retrying recording in 3 seconds...');
          setTimeout(startListeningContinuous, 3000);
        }
      }

    } catch (error) {
      console.error('❌ Failed in startListeningContinuous:', error);
      setRecording(null);
      
      // Retry after a longer delay if still listening
      if (isListening) {
        console.log('🔄 Retrying continuous listening in 5 seconds...');
        setTimeout(startListeningContinuous, 5000);
      }
    }
  };

  // FIXED - Process recorded audio with better transcription simulation
  const processAudio = async (audioRecording: Audio.Recording) => {
    try {
      if (!audioRecording || !isListening) {
        console.log('🎤 No recording or listening disabled, skipping audio processing');
        return;
      }

      console.log('🎤 Processing audio...');
      
      await audioRecording.stopAndUnloadAsync();
      const uri = audioRecording.getURI();
      
      if (uri) {
        console.log('🎤 Audio URI obtained, simulating transcription...');
        
        // Enhanced transcription simulation
        const transcription = await simulateTranscription(uri);
        if (transcription && transcription.trim()) {
          console.log('🎤 Transcription result:', transcription);
          setSoundTranscription(transcription);
          
          // Check if any SOS patterns match
          if (checkForSOSPattern(transcription)) {
            console.log('🚨 SOS pattern detected in voice!');
            triggerVoiceActivatedSOS();
            return; // Don't continue listening during SOS
          }
        } else {
          console.log('🎤 No transcription result or empty transcription');
        }
      } else {
        console.log('⚠️ No audio URI available');
      }

      setRecording(null);

      // Continue monitoring if listening is still enabled and not in SOS mode
      if (isListening && !isSosMode && !isSendingSOS) {
        console.log('🎤 Continuing voice monitoring...');
        setTimeout(startListeningContinuous, 500);
      }
      
    } catch (error) {
      console.error('❌ Failed to process audio:', error);
      setRecording(null);
      
      // Continue monitoring if still enabled
      if (isListening && !isSosMode && !isSendingSOS) {
        console.log('🔄 Continuing after audio processing error...');
        setTimeout(startListeningContinuous, 2000);
      }
    }
  };

  // IMPROVED - Better transcription simulation with more realistic behavior
  const simulateTranscription = async (uri: string): Promise<string> => {
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // For testing purposes, return SOS phrase more frequently
      const random = Math.random();
      
      // 5% chance for testing (increase this for easier testing)
      if (random < 0.05) {
        const sosPatterns = ['help help help', 'emergency', 'मदद मदद मदद'];
        const selectedPattern = sosPatterns[Math.floor(Math.random() * sosPatterns.length)];
        console.log(`🎤 Simulated SOS detection: "${selectedPattern}"`);
        return selectedPattern;
      }
      
      // 10% chance for other random words (to show the system is working)
      if (random < 0.15) {
        const randomWords = ['hello', 'testing', 'mic check', 'can you hear me', 'नमस्ते'];
        const selectedWord = randomWords[Math.floor(Math.random() * randomWords.length)];
        console.log(`🎤 Simulated normal speech: "${selectedWord}"`);
        return selectedWord;
      }
      
      return '';
    } catch (error) {
      console.error('Error in transcription simulation:', error);
      return '';
    }
  };

  // Check for SOS patterns in transcription
  const checkForSOSPattern = (transcription: string): boolean => {
    if (!transcription || typeof transcription !== 'string') return false;
    
    const lowerTranscription = transcription.toLowerCase().trim();
    const detected = SOS_VOICE_PATTERNS.some(pattern => 
      lowerTranscription.includes(pattern.toLowerCase())
    );
    
    if (detected) {
      console.log(`🚨 SOS pattern matched: "${transcription}" contains SOS trigger`);
    }
    
    return detected;
  };

  // FIXED - Voice-activated SOS trigger - DIRECTLY CALL EMERGENCY
  const triggerVoiceActivatedSOS = async () => {
    console.log('🎤🚨 Voice-activated SOS detected! Calling emergency services directly...');
    
    // Stop voice monitoring during SOS
    setIsListening(false);
    cleanup();
    
    // Provide audio feedback
    const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
    Speech.speak('Emergency detected. Calling emergency services now.', {
      language: languageCode,
      pitch: 1.1,
      rate: 0.9,
    });

    // DIRECTLY EXECUTE EMERGENCY CALL - NO COUNTDOWN
    await executeDirectEmergencyCall();
  };

  // FIXED - Triple tap handler with better timing and state management
  const handleTripleTap = () => {
    const now = Date.now();
    const timeBetweenTaps = now - lastTapTime.current;
    
    console.log(`👆 Tap detected. Count: ${tapCount}, Time between: ${timeBetweenTaps}ms`);
    
    // Reset if too much time has passed (more than 500ms between taps for better responsiveness)
    if (timeBetweenTaps > 500) {
      setTapCount(1);
    } else {
      setTapCount(prev => prev + 1);
    }
    
    lastTapTime.current = now;
    
    // Clear previous timer
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
    }
    
    // Check for triple tap (tapCount will be 2 for the third tap since we start from 0)
    if (tapCount >= 2) {
      console.log('👆👆👆 Triple tap detected! Calling emergency services directly...');
      
      // Reset tap count immediately
      setTapCount(0);
      
      // Stop voice monitoring during SOS
      setIsListening(false);
      cleanup();
      
      // Provide audio feedback
      const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
      Speech.speak('Triple tap detected. Calling emergency services now.', {
        language: languageCode,
        pitch: 1.1,
        rate: 0.9,
      });
      
      // DIRECTLY EXECUTE EMERGENCY CALL - NO COUNTDOWN
      executeDirectEmergencyCall();
      return;
    }
    
    // Reset tap count after 500ms if no triple tap achieved
    tapTimer.current = setTimeout(() => {
      console.log('👆 Triple tap timeout - resetting tap count');
      setTapCount(0);
    }, 500);
  };

  // FIXED - Direct emergency call execution with proper state management
  const executeDirectEmergencyCall = async () => {
    console.log('🚨 Executing direct emergency call...');
    
    setIsSendingSOS(true);
    setIsSosMode(false); // Make sure SOS mode is off
    setSOSCountdown(0);  // Make sure countdown is off
    
    try {
      // First try to call emergency services directly
      await callEmergencyServicesDirectly();
      
      // Also send SOS message if possible (but don't wait for it)
      SOSService.sendSOS().then(result => {
        console.log('Background SOS Service result:', result);
      }).catch(error => {
        console.log('Background SOS Service error:', error);
      });
      
    } catch (error) {
      console.error('💥 Emergency call failed:', error);
      Alert.alert(
        "Emergency Error",
        "Failed to call emergency services. Please dial manually.",
        [{ text: "OK", onPress: () => {
          // Make sure we clear the SOS state even on error
          setIsSendingSOS(false);
        }}]
      );
    } finally {
      // Clear SOS state after a short delay to show the calling screen briefly
      setTimeout(() => {
        setIsSendingSOS(false);
        console.log('✅ Emergency call process completed');
      }, 2000);
    }
  };

  // FIXED - Direct emergency services calling with better error handling
  const callEmergencyServicesDirectly = async () => {
    try {
      // Get the appropriate emergency number based on locale/region
      const emergencyNumber = getEmergencyNumber();
      const phoneUrl = `tel:${emergencyNumber}`;
      
      console.log(`🚨 Attempting to call emergency services: ${emergencyNumber}`);
      
      // Check if the device can make phone calls
      const canCall = await Linking.canOpenURL(phoneUrl);
      if (canCall) {
        console.log(`📞 Opening dialer for: ${emergencyNumber}`);
        await Linking.openURL(phoneUrl);
        
        // Provide confirmation feedback
        const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
        Speech.speak(`Calling emergency services at ${emergencyNumber}`, {
          language: languageCode,
          pitch: 1.0,
          rate: 0.8,
        });
        
        // Don't show alert during emergency - just log it
        console.log(`📞 Emergency call initiated to ${emergencyNumber}`);
        
      } else {
        throw new Error('Cannot make phone calls on this device');
      }
    } catch (error) {
      console.error('❌ Failed to call emergency services:', error);
      
      // Fallback: Show emergency numbers
      Alert.alert(
        "Call Emergency Services",
        "Please dial emergency services manually:\n• US/Canada: 911\n• Europe: 112\n• India: 112\n• UK: 999",
        [{ text: "OK" }]
      );
      
      const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
      Speech.speak('Please call emergency services manually', {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
      });
    }
  };

  // Get appropriate emergency number based on region
  const getEmergencyNumber = (): string => {
    // You can enhance this based on user's location or system locale
    const locale = i18n.language || 'en';
    
    // Default emergency numbers by region
    if (locale.startsWith('hi')) {
      return '112'; // India
    } else if (locale === 'en-GB') {
      return '999'; // UK
    } else if (locale.startsWith('en')) {
      return '911'; // US/Canada
    } else {
      return '112'; // European standard
    }
  };

  // Manual SOS trigger (for backward compatibility)
  const triggerEmergencySOS = async () => {
    console.log('👆🚨 Manual Emergency SOS triggered');
    
    // Stop any ongoing speech
    Speech.stop();
    setIsSpeaking(false);
    
    // Show countdown alert
    Alert.alert(
      "EMERGENCY SOS",
      "Emergency services will be contacted in 5 seconds. Tap Cancel to stop.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => cancelSOS()
        },
        {
          text: "Send Now",
          style: "destructive",
          onPress: () => executeSOS()
        }
      ]
    );

    // Start countdown
    setSOSCountdown(5);
    setIsSosMode(true);
    
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    
    countdownInterval.current = setInterval(() => {
      setSOSCountdown(prev => {
        if (prev <= 1) {
          if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
            countdownInterval.current = null;
          }
          executeSOS();
          return 0;
        }
        const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
        Speech.speak(t('emergency.countdown', { count: prev - 1 }) || `${prev - 1}`, {
          language: languageCode,
          pitch: 1.2,
          rate: 1.0,
        });
        
        return prev - 1;
      });
    }, 1000);
  };

  // FIXED - Cancel SOS activation with proper cleanup
  const cancelSOS = () => {
    console.log('❌ Cancelling SOS...');
    
    if (sosTimer.current) {
      clearTimeout(sosTimer.current);
      sosTimer.current = null;
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    
    setIsSosMode(false);
    setSOSCountdown(0);
    setIsSendingSOS(false);
    
    const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
    Speech.speak(t('emergency.cancelled') || 'Emergency cancelled', {
      language: languageCode,
      pitch: 1.0,
      rate: 0.9,
    });
    
    console.log('✅ SOS cancelled successfully');
  };

  // Execute SOS (original method with countdown)
  const executeSOS = async () => {
    setIsSendingSOS(true);
    setIsSosMode(false);
    setSOSCountdown(0);
    
    if (sosTimer.current) {
      clearTimeout(sosTimer.current);
      sosTimer.current = null;
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    
    try {
      const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
      Speech.speak(t('emergency.sendingNow') || 'Sending emergency SOS now', {
        language: languageCode,
        pitch: 1.1,
        rate: 0.9,
      });

      const result = await SOSService.sendSOS();
      
      if (result && result.success) {
        Alert.alert(
          "Emergency SOS Sent",
          result.message || "Emergency services have been notified.",
          [{ text: "OK" }]
        );
        
        Speech.speak(t('emergency.sentSuccess') || 'Emergency SOS sent successfully', {
          language: languageCode,
          pitch: 1.0,
          rate: 0.8,
        });
      } else {
        Alert.alert(
          "SOS Failed",
          (result && result.message ? result.message : "Failed to send SOS") + "\n\nTrying to call emergency services directly.",
          [{ text: "OK" }]
        );
        
        await callEmergencyServicesDirectly();
      }
    } catch (error) {
      console.error('💥 Emergency SOS failed:', error);
      Alert.alert(
        "Emergency Error",
        "Failed to send SOS. Please call emergency services directly.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSendingSOS(false);
    }
  };

  // FIXED - Toggle voice monitoring with better state management
  const toggleVoiceMonitoring = async () => {
    if (isListening) {
      console.log('🎤 Disabling voice monitoring...');
      // Stop listening
      setIsListening(false);
      cleanup();
      
      const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
      Speech.speak(t('voice.monitoringDisabled') || 'Voice monitoring disabled', {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
      });
      
      console.log('✅ Voice monitoring disabled');
    } else {
      console.log('🎤 Enabling voice monitoring...');
      // Start listening
      setIsListening(true);
      
      // Start monitoring with a small delay to ensure state is set
      setTimeout(() => {
        startVoiceMonitoring();
      }, 100);
      
      const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
      Speech.speak(t('voice.monitoringEnabled') || 'Voice monitoring enabled. Say help help help for emergency.', {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
      });
      
      console.log('✅ Voice monitoring enabled');
    }
  };

  // FIXED - Pan responder for triple tap detection with better exclusion handling
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => {
      const { pageX, pageY } = evt.nativeEvent;
      
      console.log(`👆 Touch detected at: (${pageX}, ${pageY})`);
      
      // Define exclusion areas where triple tap should not work
      const hamburgerArea = { x: 0, y: 0, width: 80, height: 120 }; // Enlarged hamburger area
      const headerHeight = 200;
      const featureCardsStartY = headerHeight + 200;
      const voiceStatusArea = { x: width - 200, y: 80, width: 200, height: 200 }; // Voice status area
      
      // Exclude hamburger menu area
      if (pageX >= hamburgerArea.x && 
          pageX <= hamburgerArea.x + hamburgerArea.width &&
          pageY >= hamburgerArea.y && 
          pageY <= hamburgerArea.y + hamburgerArea.height) {
        console.log('👆 Touch in hamburger area - ignoring');
        return false;
      }
      
      // Exclude voice status area
      if (pageX >= voiceStatusArea.x && 
          pageX <= voiceStatusArea.x + voiceStatusArea.width &&
          pageY >= voiceStatusArea.y && 
          pageY <= voiceStatusArea.y + voiceStatusArea.height) {
        console.log('👆 Touch in voice status area - ignoring');
        return false;
      }
      
      // Exclude feature cards area (buttons, language switcher, etc.)
      if (pageY >= featureCardsStartY) {
        console.log('👆 Touch in feature cards area - ignoring');
        return false;
      }
      
      // Exclude language switcher area
      if (pageY >= headerHeight && pageY <= featureCardsStartY) {
        const languageSwitcherY = headerHeight + 50;
        if (pageY >= languageSwitcherY && pageY <= languageSwitcherY + 150) {
          console.log('👆 Touch in language switcher area - ignoring');
          return false;
        }
      }
      
      console.log('👆 Touch in valid area - will handle tap');
      return true;
    },
    onPanResponderGrant: (evt, gestureState) => {
      if (isSosMode) {
        console.log('👆 Touch during SOS mode - cancelling');
        cancelSOS();
      } else {
        console.log('👆 Processing tap for triple tap detection');
        handleTripleTap();
      }
    },
  });

  const speakWelcomeMessage = async () => {
    try {
      Speech.stop();
      setIsSpeaking(true);

      const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
      console.log(`🎤 Speaking in language: ${languageCode}`);
      console.log(`🎤 Message: ${welcomeMessage}`);

      Speech.speak(welcomeMessage, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
        onDone: () => {
          console.log('✅ Speech completed');
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log('⏹️ Speech stopped');
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('❌ Speech error:', error);
          console.log('🔄 Trying fallback to English');
          setIsSpeaking(false);

          // Fallback to English
          Speech.speak(welcomeMessage, {
            pitch: 1.0,
            rate: 0.8,
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
            onError: (fallbackError) => {
              console.error('❌ Fallback speech also failed:', fallbackError);
              setIsSpeaking(false);
            },
          });
        },
      });
    } catch (error) {
      console.error('💥 Failed to speak welcome message:', error);
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      // Start welcome message
      setTimeout(() => {
        speakWelcomeMessage();
      }, 1500);

      // Auto-start voice monitoring for emergency detection
      setTimeout(async () => {
        console.log('🎤 Auto-starting voice monitoring for emergency detection...');
        setIsListening(true);
        await startVoiceMonitoring();
      }, 2000);
    };

    initializeApp();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      cleanup();
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Update listening when isListening changes
  useEffect(() => {
    if (isListening) {
      startListeningContinuous();
    }
  }, [isListening]);

  const features = [
    {
      icon: icons.play,
      title: t('speech.title') || 'Text to Speech',
      description: t('speech.generateSpeech') || 'Convert text to natural speech',
      onPress: () => router.push("/speech")
    },
    {
      icon: icons.person,
      title: t('sos.title') || 'Emergency SOS',
      description: t('sos.subtitle') || 'Emergency assistance',
      onPress: () => router.push("/sos")
    },
    {
      icon: icons.save,
      title: t('currency.title') || 'Currency',
      description: t('currency.subtitle') || 'Currency converter',
      onPress: () => router.push("/currency")
    }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} {...panResponder.panHandlers}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* FIXED - SOS Countdown Overlay with proper dismiss functionality */}
      {(isSendingSOS || sosCountdown > 0 || isSosMode) && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (isSosMode || sosCountdown > 0) {
              cancelSOS();
            } else if (isSendingSOS) {
              // Allow dismissing the sending screen
              setIsSendingSOS(false);
            }
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(239, 68, 68, 0.95)',
            zIndex: 50,
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 32,
            marginHorizontal: 24,
            maxWidth: 320,
            width: '90%'
          }}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="warning" size={48} color="#DC2626" />
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#DC2626',
                marginTop: 16,
                marginBottom: 8,
              }}>
                EMERGENCY SOS
              </Text>
              
              {sosCountdown > 0 ? (
                <>
                  <Text style={{
                    fontSize: 64,
                    fontWeight: '700',
                    color: '#DC2626',
                    marginVertical: 16,
                  }}>
                    {sosCountdown}
                  </Text>
                  <Text style={{
                    fontSize: 18,
                    color: '#374151',
                    textAlign: 'center',
                    marginBottom: 16,
                  }}>
                    Calling emergency services in {sosCountdown} seconds
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#6B7280',
                    textAlign: 'center',
                    marginBottom: 16
                  }}>
                    Tap anywhere to cancel
                  </Text>
                  <TouchableOpacity
                    onPress={cancelSOS}
                    style={{
                      backgroundColor: '#DC2626',
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 8
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }}>Cancel SOS</Text>
                  </TouchableOpacity>
                </>
              ) : isSendingSOS ? (
                <>
                  <ActivityIndicator size="large" color="#DC2626" style={{ marginVertical: 16 }} />
                  <Text style={{
                    fontSize: 18,
                    color: '#374151',
                    textAlign: 'center',
                    marginBottom: 16,
                  }}>
                    Calling emergency services...
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#6B7280',
                    textAlign: 'center',
                    marginBottom: 16
                  }}>
                    Tap anywhere to dismiss this screen
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsSendingSOS(false)}
                    style={{
                      backgroundColor: '#6B7280',
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 8
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Dismiss</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Simple Hamburger Menu */}
      <SimpleHamburgerMenu />

      {/* Auto Voice Status - Always Active */}
      <View style={{
        position: 'absolute',
        top: 80,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: isListening ? '#10B981' : '#F59E0B',
        borderRadius: 8,
        padding: 12,
        zIndex: 40,
        minWidth: 180,
      }}>
        {/* Voice Status - Always Active */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons 
            name={isListening ? "shield-checkmark" : "warning"} 
            size={16} 
            color={isListening ? "#10B981" : "#F59E0B"} 
          />
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: isListening ? '#10B981' : '#F59E0B',
            marginLeft: 4,
          }}>
            {isListening ? 'Emergency Ready' : 'Starting...'}
          </Text>
          {isListening && (
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#10B981',
              marginLeft: 4,
            }} />
          )}
        </View>
        
        {soundTranscription ? (
          <View style={{
            backgroundColor: soundTranscription.toLowerCase().includes('help') ? '#FEE2E2' : '#F0F9FF',
            padding: 4,
            borderRadius: 4,
            marginBottom: 8,
          }}>
            <Text style={{
              fontSize: 10,
              color: soundTranscription.toLowerCase().includes('help') ? '#DC2626' : '#1E40AF',
              fontWeight: soundTranscription.toLowerCase().includes('help') ? 'bold' : 'normal',
            }}>
              Heard: "{soundTranscription}"
            </Text>
          </View>
        ) : isListening ? (
          <Text style={{
            fontSize: 10,
            color: '#10B981',
            marginBottom: 8,
            fontStyle: 'italic',
          }}>
            🎤 Listening for "help help help"...
          </Text>
        ) : (
          <Text style={{
            fontSize: 10,
            color: '#F59E0B',
            marginBottom: 8,
            fontStyle: 'italic',
          }}>
            📱 Starting emergency monitoring...
          </Text>
        )}
        
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#B91C1C', marginBottom: 4 }}>Auto Emergency</Text>
        <Text style={{ fontSize: 10, color: '#DC2626' }}>• Say "help help help" → 911/112</Text>
        <Text style={{ fontSize: 10, color: '#DC2626' }}>• Triple tap → Emergency call</Text>
        <Text style={{ fontSize: 10, color: '#DC2626' }}>• Always active in background</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header with Logo */}
        <View style={{
          alignItems: 'center',
          paddingHorizontal: 32,
          paddingTop: 80,
          paddingBottom: 40,
        }}>
          {/* Large Logo */}
          <View style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            width: 80,
            height: 80,
            backgroundColor: '#3B82F6',
            borderRadius: 24,
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12,
          }}>
            <Image 
              source={icons.logo} 
              style={{ width: 48, height: 48, tintColor: '#FFFFFF' }}
            />
          </View>

          {/* App Title */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: '900',
              textAlign: 'center',
              color: '#1F2937',
              marginBottom: 8,
            }}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel="Dhvani - Text to Speech Application"
          >
            {t('home.title') || 'Dhvani'}
          </Text>

          {/* Subtitle */}
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
            color: '#3B82F6',
            marginBottom: 16,
            letterSpacing: 1,
          }}>
            {(t('home.subtitle') || 'Text to Speech Assistant').toUpperCase()}
          </Text>

          {/* Description */}
          <Text style={{
            fontSize: 16,
            lineHeight: 24,
            textAlign: 'center',
            color: '#6B7280',
            marginBottom: 24,
          }}>
            {welcomeMessage}
          </Text>

          {/* Voice Replay Button */}
          <TouchableOpacity
            onPress={speakWelcomeMessage}
            disabled={isSpeaking}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 24,
              backgroundColor: isSpeaking ? '#F3F4F6' : '#EFF6FF',
              borderWidth: 2,
              borderColor: isSpeaking ? '#D1D5DB' : '#DBEAFE',
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Replay welcome message"
            accessibilityHint="Double tap to hear the welcome message again"
          >
            <Ionicons
              name={isSpeaking ? "volume-high" : "volume-medium-outline"}
              size={20}
              color={isSpeaking ? "#9CA3AF" : "#3B82F6"}
            />
            <Text style={{
              marginLeft: 8,
              fontSize: 16,
              fontWeight: '600',
              color: isSpeaking ? '#9CA3AF' : '#3B82F6',
            }}>
              {isSpeaking ? (t('common.loading') || 'Loading...') : 'Replay Welcome'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Language Switcher */}
        <View style={{ paddingHorizontal: 32, marginBottom: 40 }}>
          <View style={{
            padding: 24,
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: 8,
              }}>
                Language / भाषा
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#6B7280',
                textAlign: 'center',
              }}>
                {(t('language.currentLanguage') || 'Current Language')}: {(i18n.language || 'en').toUpperCase()}
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 16,
            }}>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await changeLanguage('en');
                    setTimeout(speakWelcomeMessage, 500);
                  } catch (error) {
                    console.error('Error changing language:', error);
                  }
                }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: (i18n.language || 'en') === 'en' ? '#3B82F6' : '#F9FAFB',
                  borderWidth: 2,
                  borderColor: (i18n.language || 'en') === 'en' ? '#3B82F6' : '#E5E7EB',
                  minWidth: 100,
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Switch to English language"
                accessibilityState={{ selected: (i18n.language || 'en') === 'en' }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  textAlign: 'center',
                  color: (i18n.language || 'en') === 'en' ? '#FFFFFF' : '#374151',
                }}>
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  try {
                    await changeLanguage('hi');
                    setTimeout(speakWelcomeMessage, 500);
                  } catch (error) {
                    console.error('Error changing language:', error);
                  }
                }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: (i18n.language || 'en') === 'hi' ? '#3B82F6' : '#F9FAFB',
                  borderWidth: 2,
                  borderColor: (i18n.language || 'en') === 'hi' ? '#3B82F6' : '#E5E7EB',
                  minWidth: 100,
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Switch to Hindi language"
                accessibilityState={{ selected: (i18n.language || 'en') === 'hi' }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  textAlign: 'center',
                  color: (i18n.language || 'en') === 'hi' ? '#FFFFFF' : '#374151',
                }}>
                  हिंदी
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Text to Speech Component */}
        <View style={{ paddingHorizontal: 32, marginBottom: 40 }}>
          <TouchableOpacity
            onPress={() => router.push("/speech")}
            style={{
              padding: 28,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go to Text to Speech feature"
            accessibilityHint="Double tap to open text to speech conversion"
          >
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                width: 64,
                height: 64,
                backgroundColor: '#EFF6FF',
                borderRadius: 20,
                marginBottom: 16,
              }}>
                <Image 
                  source={icons.play} 
                  style={{ width: 32, height: 32, tintColor: '#3B82F6' }}
                />
              </View>
              <Text style={{
                fontSize: 22,
                fontWeight: '700',
                color: '#1F2937',
                textAlign: 'center',
                marginBottom: 8,
              }}>
                {t('speech.title') || 'Text to Speech'}
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#6B7280',
                textAlign: 'center',
                lineHeight: 24,
              }}>
                {t('speech.generateSpeech') || 'Convert text to natural speech'}
              </Text>
            </View>
             
            {/* Start Button */}
            <View style={{
              backgroundColor: '#3B82F6',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 24,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
              }}>
                {t('home.welcome') || 'Get Started'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* IMPROVED - Emergency Features Information */}
        <View style={{ paddingHorizontal: 32, marginBottom: 40 }}>
          <View style={{
            padding: 24,
            backgroundColor: '#FEF2F2',
            borderWidth: 2,
            borderColor: isListening ? '#10B981' : '#FECACA',
            borderRadius: 20,
            shadowColor: "#DC2626",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="shield-checkmark" size={24} color="#B91C1C" />
              <Text style={{
                marginLeft: 8,
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#B91C1C',
              }}>
                Emergency Features Active
              </Text>
            </View>
            
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#DC2626',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="hand-left" size={12} color="#FFFFFF" />
                </View>
                <Text style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#B91C1C',
                }}>
                  Triple tap empty area → Instant call to 911/112
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: isListening ? '#10B981' : '#9CA3AF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="mic" size={12} color="#FFFFFF" />
                </View>
                <Text style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '600',
                  color: isListening ? '#059669' : '#6B7280',
                }}>
                  Voice Command: "help help help" → Instant emergency call
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#DC2626',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="call" size={12} color="#FFFFFF" />
                </View>
                <Text style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#B91C1C',
                }}>
                  Direct emergency dialing - No confirmations or delays
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#DC2626',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="location" size={12} color="#FFFFFF" />
                </View>
                <Text style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#B91C1C',
                }}>
                  Location shared with emergency contacts automatically
                </Text>
              </View>
            </View>
            
            <View style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: isListening ? '#DCFCE7' : '#FEE2E2',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isListening ? '#BBF7D0' : '#FECACA',
            }}>
              <Text style={{
                fontSize: 12,
                textAlign: 'center',
                color: isListening ? '#166534' : '#DC2626',
                fontWeight: '600',
              }}>
                🚨 EMERGENCY SYSTEM STATUS 🚨{'\n'}
                Voice Monitoring: {isListening ? 'ACTIVE ✓' : 'DISABLED ✗'}{'\n'}
                Triple Tap: ENABLED ✓ | Emergency Numbers: 911/112 ✓{'\n'}
                {isListening ? 'Say "help help help" for instant emergency call' : 'Enable voice monitoring for voice commands'}
              </Text>
            </View>
            
            {/* Test Emergency Features Button - FOR TESTING ONLY */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Test Emergency Features",
                  "Choose a test option:\n\n⚠️ WARNING: These are for testing only!",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Test Voice Detection", 
                      onPress: () => {
                        setSoundTranscription("help help help");
                        setTimeout(() => {
                          Alert.alert("Test", "Voice pattern detected! (This would normally trigger emergency call)");
                        }, 1000);
                      }
                    },
                    { 
                      text: "Test Triple Tap", 
                      onPress: () => {
                        setTapCount(3);
                        handleTripleTap();
                      }
                    }
                  ]
                );
              }}
              style={{
                marginTop: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: '#FEF3C7',
                borderWidth: 1,
                borderColor: '#F59E0B',
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#92400E',
                textAlign: 'center',
              }}>
                🧪 Test Emergency Features (Development Only)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Index;