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
  AppStateStatus,
  Platform,
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
  const sosTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  // Add null check for translation
  const welcomeMessage = t('home.description') || 'Welcome to Dhvani - Your Text to Speech Assistant';

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
      recording.stopAndUnloadAsync().catch(error => {
        console.error('Error stopping recording:', error);
      });
      setRecording(null);
    }
    setIsListening(false);
    setSOSCountdown(0);
    setIsSosMode(false);
  };

  // Handle app state changes for background voice monitoring
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      if (isListening) {
        startVoiceMonitoring();
      }
    }
    appState.current = nextAppState;
  };

  const startVoiceMonitoring = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('🎤 Microphone permission denied');
        Alert.alert(
          'Permission Required',
          'Microphone access is needed for voice-activated SOS features.',
          [{ text: 'OK' }]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      startListeningContinuous();
    } catch (error) {
      console.error('❌ Failed to start voice monitoring:', error);
      setIsListening(false);
    }
  };

  const recordingOptions: Audio.RecordingOptions = {
    android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 128000,
    },
    ios: {
      extension: '.m4a',
      outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {},
  };

  const startListeningContinuous = async () => {
    if (!isListening) return;

    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);

      listeningTimer.current = setTimeout(() => {
        if (newRecording) {
          processAudio(newRecording);
        }
      }, 3000) as ReturnType<typeof setTimeout>;

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      setRecording(null);
      // Retry after a delay if still listening
      if (isListening) {
        setTimeout(startListeningContinuous, 2000);
      }
    }
  };

  const processAudio = async (audioRecording: Audio.Recording) => {
    try {
      if (!audioRecording) return;

      await audioRecording.stopAndUnloadAsync();
      const uri = audioRecording.getURI();
      
      if (uri) {
        const transcription = await simulateTranscription(uri);
        if (transcription) {
          setSoundTranscription(transcription);
          
          // Check if any SOS patterns match
          if (checkForSOSPattern(transcription)) {
            triggerVoiceActivatedSOS();
          }
        }
      }

      setRecording(null);

      if (isListening) {
        setTimeout(startListeningContinuous, 1000);
      }
    } catch (error) {
      console.error('❌ Failed to process audio:', error);
      setRecording(null);
      if (isListening) {
        setTimeout(startListeningContinuous, 2000);
      }
    }
  };

  const simulateTranscription = async (uri: string): Promise<string> => {
    try {
      // For demonstration, randomly return an SOS phrase occasionally
      const random = Math.random();
      if (random < 0.02) { // 2% chance for testing
        return SOS_VOICE_PATTERNS[0]; // 'help help help'
      }
      return '';
    } catch (error) {
      console.error('Error in transcription simulation:', error);
      return '';
    }
  };

  const checkForSOSPattern = (transcription: string): boolean => {
    if (!transcription || typeof transcription !== 'string') return false;
    
    const lowerTranscription = transcription.toLowerCase();
    return SOS_VOICE_PATTERNS.some(pattern => 
      lowerTranscription.includes(pattern.toLowerCase())
    );
  };

  const triggerVoiceActivatedSOS = () => {
    console.log('🎤🚨 Voice-activated SOS detected!');
    
    // Stop any existing countdown
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    
    // Provide audio feedback
    const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
    Speech.speak('Emergency detected. SOS will activate in 5 seconds. Tap screen to cancel.', {
      language: languageCode,
      pitch: 1.1,
      rate: 0.9,
    });

    setIsSosMode(true);
    setSOSCountdown(5);

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
        return prev - 1;
      });
    }, 1000) as ReturnType<typeof setInterval>;

    // Auto-activate after 5 seconds if not cancelled
    if (sosTimer.current) {
      clearTimeout(sosTimer.current);
    }
    sosTimer.current = setTimeout(() => {
      executeSOS();
    }, 5000) as ReturnType<typeof setTimeout>;
  };

  const triggerEmergencySOS = async () => {
    Speech.stop();
    setIsSpeaking(false);

    Alert.alert(
      t('emergency.title'),
      t('emergency.callingIn', { seconds: 5 }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => cancelSOS()
        },
        {
          text: t('emergency.cancel'),
          style: 'destructive',
          onPress: () => executeSOS()
        }
      ]
    );

    setSOSCountdown(5);
    setIsSosMode(true);
    
    const lang = getSpeechLanguageCode(i18n.language);
    
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
        Speech.speak(`${prev - 1}`, {
          language: lang,
          pitch: 1.2,
          rate: 1.0,
        });
        return prev - 1;
      });
    }, 1000) as ReturnType<typeof setInterval>;
  };

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
    
    const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
    Speech.speak('SOS cancelled', {
      language: languageCode,
      pitch: 1.0,
      rate: 0.9,
    });
  };

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
      Speech.speak("Sending emergency SOS now. Please wait.", {
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
        
        Speech.speak("Emergency SOS sent successfully. Help is on the way.", {
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
        await SOSService.callEmergencyServices();
      }
    } catch (error) {
      console.error('💥 Emergency SOS failed:', error);
      Alert.alert(
        t('common.error'),
        t('emergency.error'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsSendingSOS(false);
    }
  };

  const toggleVoiceMonitoring = () => {
    if (isListening) {
      setIsListening(false);
      cleanup();
      const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
      Speech.speak("Voice monitoring disabled", {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
      });
    } else {
      // Start listening
      setIsListening(true);
      startVoiceMonitoring();
      const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
      Speech.speak("Voice monitoring enabled. Say help help help for emergency.", {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
      });
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => {
      const { pageX, pageY } = evt.nativeEvent;
      const hamburgerArea = { x: 20, y: 50, width: 56, height: 56 };
      const headerHeight = 200;
      const featureCardsStartY = headerHeight + 200;
      if (pageX >= hamburgerArea.x && 
          pageX <= hamburgerArea.x + hamburgerArea.width &&
          pageY >= hamburgerArea.y && 
          pageY <= hamburgerArea.y + hamburgerArea.height) {
        return false;
      }
      if (pageY >= featureCardsStartY) {
        return false;
      }
      if (pageY >= headerHeight && pageY <= featureCardsStartY) {
        const languageSwitcherY = headerHeight + 50;
        if (pageY >= languageSwitcherY && pageY <= languageSwitcherY + 100) {
          return false;
        }
      }
      return true;
    },
    onPanResponderGrant: (evt, gestureState) => {
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

      const languageCode = getSpeechLanguageCode(i18n.language) || 'en';
      console.log(`🎤 Speaking in language: ${languageCode}`);
      console.log(`🎤 Message: ${welcomeMessage}`);

      Speech.speak(welcomeMessage, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          Speech.speak(welcomeMessage, {
            pitch: 1.0,
            rate: 0.8,
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
          });
        },
      });
    } catch (error) {
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

    const subscription = AppState.addEventListener('change', handleAppStateChange);

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
                {t('emergency.title')}
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
                    {t('emergency.callingIn', { seconds: sosCountdown })}
                  </Text>
                  <Text className="text-sm text-gray-500 text-center mb-4">
                    {t('emergency.tapToCancel')}
                  </Text>
                  <TouchableOpacity
                    onPress={cancelSOS}
                    className="bg-red-500 px-6 py-3 rounded-lg"
                  >
                    <Text className="color-white font-bold text-lg">{t('emergency.cancel')}</Text>
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
                    {t('emergency.sending')}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </View>
      )}

      <SimpleHamburgerMenu />

      <View className="absolute top-20 right-4 bg-white border border-gray-300 rounded-lg p-3 z-40">
        <View className="flex-row items-center mb-2">
          <Ionicons 
            name={isListening ? "mic" : "mic-off"} 
            size={16} 
            color={isListening ? "#10B981" : "#9CA3AF"} 
          />
          <Text className="text-xs font-semibold text-gray-700 ml-1">
            {isListening ? t('voice.statusListening') : t('voice.statusOff')}
          </Text>
        </View>
        
        {soundTranscription ? (
          <Text className="text-xs text-gray-500 mb-2 italic">
            Last: "{soundTranscription}"
          </Text>
        ) : null}
        
        <Text className="text-xs font-semibold text-red-700 mb-1">Emergency Help</Text>
        <Text className="text-xs text-red-600">• Tap empty area for SOS</Text>
        <Text className="text-xs text-red-600">• Say "help help help"</Text>
        
        <TouchableOpacity
          onPress={toggleVoiceMonitoring}
          className={`mt-2 px-2 py-1 rounded ${isListening ? 'bg-green-500' : 'bg-gray-500'}`}
        >
          <Text className="text-xs font-semibold text-white">
            {isListening ? t('voice.toggleOn') : t('voice.toggleEnable')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View style={{
          alignItems: 'center',
          paddingHorizontal: 32,
          paddingTop: 80,
          paddingBottom: 40,
        }}>
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

          <Text style={{
            fontSize: 16,
            lineHeight: 24,
            textAlign: 'center',
            color: '#6B7280',
            marginBottom: 24,
          }}>
            {welcomeMessage}
          </Text>

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
                  {t('language.english')}
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
                  {t('language.hindi')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

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