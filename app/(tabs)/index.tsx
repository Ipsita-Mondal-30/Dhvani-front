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

import { icons } from "@/constants/icons";
import { getSpeechLanguageCode, changeLanguage } from "@/src/locales/i18n";
import SimpleHamburgerMenu from "@/src/components/SimpleHamburgerMenu";
import { useTheme } from "@/src/contexts/ThemeContext";
import { SOSService } from "@/services/sosService";

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

const FeatureCard = ({ icon, title, description, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="p-5 mb-4 bg-white rounded-xl border border-gray-100 shadow-md"
    style={{
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
    <View className="flex-row items-center mb-3">
      <View className="justify-center items-center mr-4 w-12 h-12 bg-blue-50 rounded-xl">
        <Image source={icon} className="w-6 h-6" tintColor="#2563EB" />
      </View>
      <Text className="flex-1 text-lg font-bold text-gray-900">{title}</Text>
    </View>
    <Text className="text-sm font-medium leading-5 text-gray-600">{description}</Text>

    {/* Subtle arrow indicator */}
    <View className="flex-row justify-end mt-3">
      <View className="justify-center items-center w-6 h-6 bg-gray-100 rounded-full">
        <Text className="text-xs font-bold text-gray-400">→</Text>
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
  
  // Voice recognition variables and refs
  const speechBuffer = useRef<string[]>([]);
  const lastSpeechTime = useRef<number>(0);
  const sosTimer = useRef<NodeJS.Timeout | null>(null);
  const listeningTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  const welcomeMessage = t('home.description');

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
    if (recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
    }
    setIsListening(false);
    setSOSCountdown(0);
    setIsSosMode(false);
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

  // Start continuous voice monitoring
  const startVoiceMonitoring = async () => {
    try {
      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('🎤 Microphone permission denied');
        return;
      }

      // Configure audio for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      startListeningContinuous();
    } catch (error) {
      console.error('❌ Failed to start voice monitoring:', error);
    }
  };

  // Continuous listening function
  const startListeningContinuous = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
        },
      });

      setRecording(newRecording);
      setIsListening(true);

      // Listen for 3 seconds, then process
      listeningTimer.current = setTimeout(() => {
        processAudio(newRecording);
      }, 3000);

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      // Retry after a delay
      setTimeout(startListeningContinuous, 2000);
    }
  };

  // Process recorded audio
  const processAudio = async (audioRecording: Audio.Recording) => {
    try {
      await audioRecording.stopAndUnloadAsync();
      const uri = audioRecording.getURI();
      
      if (uri) {
        // Simulated transcription (replace with actual STT in production)
        const transcription = await simulateTranscription(uri);
        setSoundTranscription(transcription);
        
        // Check if any SOS patterns match
        if (checkForSOSPattern(transcription)) {
          triggerVoiceActivatedSOS();
        }
      }

      setRecording(null);

      // Continue monitoring if listening is still enabled
      if (isListening) {
        setTimeout(startListeningContinuous, 1000);
      }
    } catch (error) {
      console.error('❌ Failed to process audio:', error);
      setRecording(null);
      
      // Retry listening if still enabled
      if (isListening) {
        setTimeout(startListeningContinuous, 2000);
      }
    }
  };

  // Simulate transcription (replace with actual STT service)
  const simulateTranscription = async (uri: string): Promise<string> => {
    // For demonstration, randomly return an SOS phrase occasionally
    const random = Math.random();
    if (random < 0.02) { // 2% chance for testing
      return SOS_VOICE_PATTERNS[0]; // 'help help help'
    }
    return '';
  };

  // Check for SOS patterns in transcription
  const checkForSOSPattern = (transcription: string): boolean => {
    const lowerTranscription = transcription.toLowerCase();
    return SOS_VOICE_PATTERNS.some(pattern => 
      lowerTranscription.includes(pattern.toLowerCase())
    );
  };

  // Voice-activated SOS trigger
  const triggerVoiceActivatedSOS = () => {
    console.log('🎤🚨 Voice-activated SOS detected!');
    
    // Provide audio feedback
    Speech.speak('Emergency detected. SOS will activate in 5 seconds. Tap screen to cancel.', {
      language: getSpeechLanguageCode(i18n.language),
      pitch: 1.1,
      rate: 0.9,
    });

    setIsSosMode(true);
    setSOSCountdown(5);

    // Start countdown
    countdownInterval.current = setInterval(() => {
      setSOSCountdown(prev => {
        if (prev <= 1) {
          // Countdown finished - activate SOS
          if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
            countdownInterval.current = null;
          }
          executeSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-activate after 5 seconds if not cancelled
    sosTimer.current = setTimeout(() => {
      executeSOS();
    }, 5000);
  };

  // Manual SOS trigger (tap on empty area)
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
        
        // Voice countdown
        Speech.speak(`${prev - 1}`, {
          language: 'en',
          pitch: 1.2,
          rate: 1.0,
        });
        
        return prev - 1;
      });
    }, 1000);
  };

  // Cancel SOS activation
  const cancelSOS = () => {
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
    
    Speech.speak('SOS cancelled', {
      language: getSpeechLanguageCode(i18n.language),
      pitch: 1.0,
      rate: 0.9,
    });
  };

  // Execute SOS
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
      Speech.speak("Sending emergency SOS now. Please wait.", {
        language: getSpeechLanguageCode(i18n.language),
        pitch: 1.1,
        rate: 0.9,
      });

      const result = await SOSService.sendSOS();
      
      if (result.success) {
        Alert.alert(
          "Emergency SOS Sent",
          result.message,
          [{ text: "OK" }]
        );
        
        Speech.speak("Emergency SOS sent successfully. Help is on the way.", {
          language: getSpeechLanguageCode(i18n.language),
          pitch: 1.0,
          rate: 0.8,
        });
      } else {
        Alert.alert(
          "SOS Failed",
          result.message + "\n\nTrying to call emergency services directly.",
          [{ text: "OK" }]
        );
        
        await SOSService.callEmergencyServices();
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

  // Toggle voice monitoring
  const toggleVoiceMonitoring = () => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      cleanup();
      Speech.speak("Voice monitoring disabled", {
        language: getSpeechLanguageCode(i18n.language),
        pitch: 1.0,
        rate: 0.8,
      });
    } else {
      // Start listening
      startVoiceMonitoring();
      Speech.speak("Voice monitoring enabled. Say help help help for emergency.", {
        language: getSpeechLanguageCode(i18n.language),
        pitch: 1.0,
        rate: 0.8,
      });
    }
  };

  // Pan responder for detecting taps on empty areas
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => {
      // Only capture taps in empty areas (not on existing buttons)
      const { pageX, pageY } = evt.nativeEvent;
      
      // Define areas to avoid (approximate positions)
      const hamburgerArea = { x: 20, y: 50, width: 56, height: 56 };
      const headerHeight = 200;
      const featureCardsStartY = headerHeight + 200;
      
      // Check if tap is in hamburger menu area
      if (pageX >= hamburgerArea.x && 
          pageX <= hamburgerArea.x + hamburgerArea.width &&
          pageY >= hamburgerArea.y && 
          pageY <= hamburgerArea.y + hamburgerArea.height) {
        return false;
      }
      
      // If tap is on feature cards area, ignore
      if (pageY >= featureCardsStartY) {
        return false;
      }
      
      // If tap is on language switcher or other interactive elements
      if (pageY >= headerHeight && pageY <= featureCardsStartY) {
        // Check if it's in the language switcher area (rough approximation)
        const languageSwitcherY = headerHeight + 50;
        if (pageY >= languageSwitcherY && pageY <= languageSwitcherY + 100) {
          return false;
        }
      }
      
      return true;
    },
    onPanResponderGrant: (evt, gestureState) => {
      // Handle SOS activation or cancellation
      if (isSosMode) {
        cancelSOS();
      } else {
        triggerEmergencySOS();
      }
    },
  });

  const speakWelcomeMessage = async () => {
    try {
      Speech.stop();
      setIsSpeaking(true);

      const languageCode = getSpeechLanguageCode(i18n.language);
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
    const initializeWelcome = async () => {
      setTimeout(() => {
        speakWelcomeMessage();
      }, 1500);
    };

    initializeWelcome();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      cleanup();
      subscription?.remove();
    };
  }, []);

  const features = [
    {
      icon: icons.play,
      title: t('speech.title'),
      description: t('speech.generateSpeech'),
      onPress: () => router.push("/speech")
    },
    {
      icon: icons.person,
      title: t('sos.title'),
      description: t('sos.subtitle'),
      onPress: () => router.push("/sos")
    },
    {
      icon: icons.save,
      title: t('currency.title'),
      description: t('currency.subtitle'),
      onPress: () => router.push("/currency")
    }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} {...panResponder.panHandlers}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* SOS Countdown Overlay */}
      {(isSendingSOS || sosCountdown > 0 || isSosMode) && (
        <View className="absolute inset-0 bg-red-500/90 z-50 flex-1 justify-center items-center">
          <View className="bg-white rounded-xl p-8 mx-6">
            <View className="items-center">
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
                  <Text className="text-sm text-gray-500 text-center mb-4">
                    Tap anywhere to cancel
                  </Text>
                  <TouchableOpacity
                    onPress={cancelSOS}
                    className="bg-red-500 px-6 py-3 rounded-lg"
                  >
                    <Text className="color-white font-bold text-lg">Cancel SOS</Text>
                  </TouchableOpacity>
                </>
              ) : isSendingSOS ? (
                <>
                  <ActivityIndicator size="large" color="#DC2626" style={{ marginVertical: 16 }} />
                  <Text style={{
                    fontSize: 18,
                    color: '#374151',
                    textAlign: 'center',
                  }}>
                    Sending emergency SOS...
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </View>
      )}

      {/* Simple Hamburger Menu */}
      <SimpleHamburgerMenu />

      {/* Voice Status and Emergency Help Instructions */}
      <View className="absolute top-20 right-4 bg-white border border-gray-300 rounded-lg p-3 z-40">
        {/* Voice Status */}
        <View className="flex-row items-center mb-2">
          <Ionicons 
            name={isListening ? "mic" : "mic-off"} 
            size={16} 
            color={isListening ? "#10B981" : "#9CA3AF"} 
          />
          <Text className="text-xs font-semibold text-gray-700 ml-1">
            {isListening ? 'Listening' : 'Voice Off'}
          </Text>
        </View>
        
        {soundTranscription ? (
          <Text className="text-xs text-gray-500 mb-2 italic">
            Last: "{soundTranscription}"
          </Text>
        ) : null}
        
        {/* Emergency Instructions */}
        <Text className="text-xs font-semibold text-red-700 mb-1">Emergency Help</Text>
        <Text className="text-xs text-red-600">• Tap empty area for SOS</Text>
        <Text className="text-xs text-red-600">• Say "help help help"</Text>
        
        {/* Voice Toggle Button */}
        <TouchableOpacity
          onPress={toggleVoiceMonitoring}
          className={`mt-2 px-2 py-1 rounded ${isListening ? 'bg-green-500' : 'bg-gray-500'}`}
        >
          <Text className="text-xs font-semibold text-white">
            {isListening ? 'Voice ON' : 'Enable Voice'}
          </Text>
        </TouchableOpacity>
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
            {t('home.title')}
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
            {t('home.subtitle').toUpperCase()}
          </Text>

          {/* Description */}
          <Text style={{
            fontSize: 16,
            lineHeight: 24,
            textAlign: 'center',
            color: '#6B7280',
            marginBottom: 24,
          }}>
            {t('home.description')}
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
              {isSpeaking ? t('common.loading') : 'Replay Welcome'}
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
                {t('language.currentLanguage')}: {i18n.language.toUpperCase()}
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 16,
            }}>
              <TouchableOpacity
                onPress={async () => {
                  await changeLanguage('en');
                  speakWelcomeMessage();
                }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: i18n.language === 'en' ? '#3B82F6' : '#F9FAFB',
                  borderWidth: 2,
                  borderColor: i18n.language === 'en' ? '#3B82F6' : '#E5E7EB',
                  minWidth: 100,
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Switch to English language"
                accessibilityState={{ selected: i18n.language === 'en' }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  textAlign: 'center',
                  color: i18n.language === 'en' ? '#FFFFFF' : '#374151',
                }}>
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  await changeLanguage('hi');
                  speakWelcomeMessage();
                }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: i18n.language === 'hi' ? '#3B82F6' : '#F9FAFB',
                  borderWidth: 2,
                  borderColor: i18n.language === 'hi' ? '#3B82F6' : '#E5E7EB',
                  minWidth: 100,
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Switch to Hindi language"
                accessibilityState={{ selected: i18n.language === 'hi' }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  textAlign: 'center',
                  color: i18n.language === 'hi' ? '#FFFFFF' : '#374151',
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
                {t('speech.title')}
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#6B7280',
                textAlign: 'center',
                lineHeight: 24,
              }}>
                {t('speech.generateSpeech')}
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
                {t('home.welcome')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Emergency Features Information */}
        <View style={{ paddingHorizontal: 32, marginBottom: 40 }}>
          <View style={{
            padding: 24,
            backgroundColor: '#FEF2F2',
            borderWidth: 1,
            borderColor: '#FECACA',
            borderRadius: 20,
            shadowColor: "#DC2626",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <Text style={{
              marginBottom: 16,
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#B91C1C',
            }}>
              🚨 Emergency Features
            </Text>
            
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="hand-left" size={16} color="#DC2626" />
                <Text style={{
                  marginLeft: 12,
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#B91C1C',
                }}>
                  Tap anywhere on empty space to trigger SOS
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="mic" size={16} color="#DC2626" />
                <Text style={{
                  marginLeft: 12,
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#B91C1C',
                }}>
                  Say "Help Help Help" for voice-activated SOS
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="shield-checkmark" size={16} color="#DC2626" />
                <Text style={{
                  marginLeft: 12,
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#B91C1C',
                }}>
                  App listens continuously for emergency keywords
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time" size={16} color="#DC2626" />
                <Text style={{
                  marginLeft: 12,
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#B91C1C',
                }}>
                  5-second countdown allows cancellation of accidental triggers
                </Text>
              </View>
            </View>
            
            <View style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: '#FEE2E2',
              borderRadius: 12,
            }}>
              <Text style={{
                fontSize: 12,
                textAlign: 'center',
                color: '#DC2626',
                fontWeight: '600',
              }}>
                Emergency services will be contacted automatically.{'\n'}
                Your location will be shared with emergency contacts.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Index;