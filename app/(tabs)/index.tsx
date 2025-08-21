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
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';

import { icons } from "@/constants/icons";
import { getSpeechLanguageCode, changeLanguage } from "@/src/locales/i18n";
import SimpleHamburgerMenu from "@/src/components/SimpleHamburgerMenu";
import { useTheme } from "@/src/contexts/ThemeContext";
import { SOSService } from "@/services/sosService";

const { width, height } = Dimensions.get('window');

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
  
  // Voice recognition variables
  const speechBuffer = useRef<string[]>([]);
  const lastSpeechTime = useRef<number>(0);
  const sosTimer = useRef<NodeJS.Timeout | null>(null);

  const welcomeMessage = t('home.description');

  // Emergency SOS functionality
  const triggerEmergencySOS = async () => {
    console.log('🚨 [Index] Emergency SOS triggered');
    
    // Stop any ongoing speech
    Speech.stop();
    setIsSpeaking(false);
    
    // Show countdown alert
    Alert.alert(
      "🚨 EMERGENCY SOS",
      "Emergency services will be contacted in 5 seconds. Tap Cancel to stop.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            console.log('❌ [Index] SOS cancelled by user');
            setSOSCountdown(0);
            if (sosTimer.current) {
              clearInterval(sosTimer.current);
              sosTimer.current = null;
            }
            
            // Voice feedback for cancellation
            Speech.speak("Emergency SOS cancelled", {
              language: 'en',
              pitch: 1.0,
              rate: 0.8,
            });
          }
        },
        {
          text: "Send Now",
          style: "destructive",
          onPress: () => executeSOS()
        }
      ]
    );

    // Start countdown
    let countdown = 5;
    setSOSCountdown(countdown);
    
    sosTimer.current = setInterval(() => {
      countdown--;
      setSOSCountdown(countdown);
      
      // Voice countdown
      Speech.speak(`${countdown}`, {
        language: 'en',
        pitch: 1.2,
        rate: 1.0,
      });
      
      if (countdown <= 0) {
        if (sosTimer.current) {
          clearInterval(sosTimer.current);
          sosTimer.current = null;
        }
        setSOSCountdown(0);
        executeSOS();
      }
    }, 1000);
  };

  const executeSOS = async () => {
    setIsSendingSOS(true);
    
    try {
      // Voice feedback
      Speech.speak("Sending emergency SOS now. Please wait.", {
        language: 'en',
        pitch: 1.1,
        rate: 0.9,
      });

      const result = await SOSService.sendSOS();
      
      if (result.success) {
        Alert.alert(
          "✅ Emergency SOS Sent",
          result.message,
          [{ text: "OK" }]
        );
        
        Speech.speak("Emergency SOS sent successfully. Help is on the way.", {
          language: 'en',
          pitch: 1.0,
          rate: 0.8,
        });
      } else {
        Alert.alert(
          "❌ SOS Failed",
          result.message + "\n\nTrying to call emergency services directly.",
          [{ text: "OK" }]
        );
        
        // Fallback: Try to call emergency services
        await SOSService.callEmergencyServices();
      }
    } catch (error) {
      console.error('💥 [Index] Emergency SOS failed:', error);
      Alert.alert(
        "❌ Emergency Error",
        "Failed to send SOS. Please call emergency services directly.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSendingSOS(false);
    }
  };

  // Voice recognition for "help help help"
  const startListening = () => {
    if (isListening) return;
    
    setIsListening(true);
    console.log('🎤 [Index] Started listening for voice commands');
    
    Speech.speak("Listening for voice commands. Say help help help for emergency.", {
      language: 'en',
      pitch: 1.0,
      rate: 0.8,
    });

    // Mock voice recognition - in a real app, you'd use expo-speech-recognition or similar
    // For now, we'll simulate it with a timer that checks for voice input
    setTimeout(() => {
      setIsListening(false);
      console.log('🎤 [Index] Stopped listening for voice commands');
    }, 10000); // Listen for 10 seconds
  };

  // Simulate voice recognition (replace with actual voice recognition in production)
  const handleVoiceInput = (text: string) => {
    const now = Date.now();
    const words = text.toLowerCase().split(' ');
    
    // Add words to buffer
    speechBuffer.current.push(...words);
    lastSpeechTime.current = now;
    
    // Keep only recent words (last 5 seconds)
    const cutoffTime = now - 5000;
    speechBuffer.current = speechBuffer.current.filter((_, index) => {
      return (now - lastSpeechTime.current) < 5000;
    });
    
    // Check for "help help help" pattern
    const bufferText = speechBuffer.current.join(' ');
    const helpCount = (bufferText.match(/help/g) || []).length;
    
    if (helpCount >= 3) {
      console.log('🚨 [Index] Voice emergency trigger detected: "help help help"');
      speechBuffer.current = []; // Clear buffer
      triggerEmergencySOS();
    }
  };

  // Pan responder for detecting taps on empty areas
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to single taps (not drags)
      return true;
    },
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: (evt, gestureState) => {
      // Handle tap on empty area
      console.log('👆 [Index] Tap detected on empty area');
      
      // Check if tap is on an interactive element (rough approximation)
      const { pageX, pageY } = evt.nativeEvent;
      
      // Approximate positions of interactive elements to avoid
      const hamburgerMenuArea = { x: 20, y: 60, width: 56, height: 56 };
      const headerHeight = 200; // Approximate header height
      const featureCardsStartY = headerHeight + 100;
      
      // If tap is in hamburger menu area, ignore
      if (pageX >= hamburgerMenuArea.x && 
          pageX <= hamburgerMenuArea.x + hamburgerMenuArea.width &&
          pageY >= hamburgerMenuArea.y && 
          pageY <= hamburgerMenuArea.y + hamburgerMenuArea.height) {
        return;
      }
      
      // If tap is on feature cards area (approximate), ignore
      if (pageY >= featureCardsStartY) {
        return;
      }
      
      // If tap is on language switcher or buttons, ignore (you can fine-tune these coordinates)
      if (pageY >= headerHeight && pageY <= featureCardsStartY) {
        return;
      }
      
      // Tap is on empty area - trigger emergency alert
      console.log('🚨 [Index] Emergency tap detected on empty area');
      triggerEmergencySOS();
    },
  });

  const speakWelcomeMessage = async () => {
    try {
      // Stop any current speech
      Speech.stop();
      setIsSpeaking(true);

      const languageCode = getSpeechLanguageCode(i18n.language);
      console.log(`🎤 [HomeScreen] Speaking in language: ${languageCode}`);
      console.log(`🎤 [HomeScreen] Message: ${welcomeMessage}`);

      Speech.speak(welcomeMessage, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
        onDone: () => {
          console.log('✅ [HomeScreen] Speech completed');
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log('⏹️ [HomeScreen] Speech stopped');
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('❌ [HomeScreen] Speech error:', error);
          console.log('🔄 [HomeScreen] Trying fallback to English');
          setIsSpeaking(false);

          // Always fallback to English without language specification
          Speech.speak(welcomeMessage, {
            pitch: 1.0,
            rate: 0.8,
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
            onError: (fallbackError) => {
              console.error('❌ [HomeScreen] Fallback speech also failed:', fallbackError);
              setIsSpeaking(false);
            },
          });
        },
      });
    } catch (error) {
      console.error('💥 [HomeScreen] Failed to speak welcome message:', error);
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    // Voice onboarding on component mount
    const initializeWelcome = async () => {
      // Wait a moment for the screen to fully load
      setTimeout(() => {
        speakWelcomeMessage();
      }, 1500);
    };

    initializeWelcome();

    // Cleanup
    return () => {
      if (sosTimer.current) {
        clearInterval(sosTimer.current);
      }
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
      icon: icons.person, // Using person icon for SOS
      title: t('sos.title'),
      description: t('sos.subtitle'),
      onPress: () => router.push("/sos")
    },
    {
      icon: icons.save, // Using save icon for Currency
      title: t('currency.title'),
      description: t('currency.subtitle'),
      onPress: () => router.push("/currency")
    }
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }} {...panResponder.panHandlers}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Emergency SOS Overlay */}
      {(isSendingSOS || sosCountdown > 0) && (
        <View className="absolute inset-0 bg-red-500/90 z-50 flex-1 justify-center items-center">
          <View className="bg-white rounded-xl p-8 mx-6">
            <View className="items-center">
              <Ionicons name="warning" size={48} color="#DC2626" />
              <Text className="text-2xl font-bold text-red-600 mt-4 mb-2">EMERGENCY SOS</Text>
              
              {sosCountdown > 0 ? (
                <>
                  <Text className="text-6xl font-bold text-red-600 my-4">{sosCountdown}</Text>
                  <Text className="text-lg text-gray-700 text-center mb-4">
                    Calling emergency services in {sosCountdown} seconds
                  </Text>
                  <Text className="text-sm text-gray-500 text-center">
                    Tap anywhere to cancel
                  </Text>
                </>
              ) : (
                <>
                  <ActivityIndicator size="large" color="#DC2626" style={{ marginVertical: 16 }} />
                  <Text className="text-lg text-gray-700 text-center">
                    Sending emergency SOS...
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Subtle gradient background */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC', '#F1F5F9']}
        className="absolute inset-0"
      />

      {/* Simple Hamburger Menu */}
      <SimpleHamburgerMenu />

      {/* Emergency Help Instructions */}
      <View className="absolute top-20 right-4 bg-red-100 border border-red-300 rounded-lg p-3 z-40">
        <Text className="text-xs font-semibold text-red-700 mb-1">Emergency Help</Text>
        <Text className="text-xs text-red-600">• Tap empty area for SOS</Text>
        <Text className="text-xs text-red-600">• Say "help help help"</Text>
        <TouchableOpacity
          onPress={startListening}
          disabled={isListening}
          className={`mt-2 px-2 py-1 rounded ${isListening ? 'bg-red-200' : 'bg-red-500'}`}
        >
          <Text className={`text-xs font-semibold ${isListening ? 'text-red-700' : 'text-white'}`}>
            {isListening ? 'Listening...' : 'Enable Voice'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header Section */}
        <View className="items-center px-6 pt-16 pb-8">
          {/* Logo with enhanced styling */}
          <TouchableOpacity
            className="justify-center items-center mb-6 w-20 h-20 bg-blue-500 rounded-2xl shadow-lg"
            style={{
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}
            onPress={() => router.push("/speech")}
          >
            <Image source={icons.logo} className="w-12 h-12" tintColor="#FFFFFF" />
          </TouchableOpacity>

          {/* App name with modern typography */}
          <Text
            className="mb-2 text-3xl font-black tracking-tight text-center text-black"
            accessibilityRole="header"
          >
            {t('home.title')}
          </Text>

          <Text className="mb-4 text-base font-bold tracking-wide text-center text-blue-500">
            {t('home.subtitle').toUpperCase()}
          </Text>

          <Text className="px-4 text-sm font-medium leading-5 text-center text-gray-600">
            {t('home.description')}
          </Text>

          {/* Voice Replay Button */}
          <TouchableOpacity
            onPress={speakWelcomeMessage}
            disabled={isSpeaking}
            className={`mt-4 px-4 py-2 rounded-full border-2 ${isSpeaking ? 'bg-gray-100 border-gray-300' : 'bg-blue-50 border-blue-200'}`}
            style={{
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
            accessibilityRole="button"
            accessibilityLabel="Replay welcome message"
            accessibilityHint="Double tap to hear the welcome message again"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons
                name={isSpeaking ? "volume-high" : "volume-medium-outline"}
                size={16}
                color={isSpeaking ? "#9CA3AF" : "#3B82F6"}
              />
              <Text className={`ml-2 text-sm font-semibold ${isSpeaking ? 'text-gray-500' : 'text-blue-600'}`}>
                {isSpeaking ? t('common.loading') : 'Replay Welcome'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Main CTA Button */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            onPress={() => router.push("/speech")}
            className="overflow-hidden bg-blue-500 rounded-xl shadow-lg"
            style={{
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 10,
            }}
            accessibilityRole="button"
            accessibilityLabel="Start Text to Speech conversion"
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5"
            >
              <View className="flex-row justify-center items-center mb-1">
                <View className="justify-center items-center mr-3 w-8 h-8 rounded-full bg-white/20">
                  <Image source={icons.play} className="w-4 h-4" tintColor="#FFFFFF" />
                </View>
                <Text className="text-lg font-bold text-white">{t('speech.generateSpeech')}</Text>
              </View>
              <Text className="text-sm font-medium text-center text-blue-100">
                {t('home.welcome')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Language Switcher */}
        <View className="px-6 mb-8">
          <View
            className="p-4 bg-white rounded-xl border border-gray-100 shadow-md"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text className="mb-3 text-lg font-bold text-center text-black">
              🌐 {t('language.selectLanguage')}
            </Text>
            <Text className="mb-3 text-sm text-center text-gray-600">
              {t('language.currentLanguage')}: {i18n.language.toUpperCase()}
            </Text>
            <View className="flex-row justify-around">
              <TouchableOpacity
                onPress={async () => {
                  await changeLanguage('en');
                  speakWelcomeMessage(); // Replay welcome in new language
                }}
                className={`px-4 py-2 rounded-lg ${i18n.language === 'en' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
              >
                <Text className={`font-semibold ${i18n.language === 'en' ? 'text-white' : 'text-gray-700'
                  }`}>
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  await changeLanguage('hi');
                  speakWelcomeMessage(); // Replay welcome in new language
                }}
                className={`px-4 py-2 rounded-lg ${i18n.language === 'hi' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
              >
                <Text className={`font-semibold ${i18n.language === 'hi' ? 'text-white' : 'text-gray-700'
                  }`}>
                  हिंदी
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View className="px-6 mb-8">
          <Text
            className="mb-5 text-xl font-bold text-center text-black"
            accessibilityRole="header"
          >
            {t('profile.features')}
          </Text>

          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>

        {/* How it Works Section */}
        <View className="px-6">
          <View
            className="p-6 bg-white rounded-xl border border-gray-100 shadow-md"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text className="mb-6 text-xl font-bold text-center text-black">
              How it Works
            </Text>

            <View className="space-y-5">
              <View className="flex-row items-start">
                <View
                  className="justify-center items-center mt-1 mr-4 w-8 h-8 bg-blue-500 rounded-lg shadow-md"
                  style={{
                    shadowColor: "#2563EB",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text className="text-sm font-bold text-white">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-base font-bold text-black">Upload or Type</Text>
                  <Text className="text-sm font-medium leading-5 text-gray-600">
                    Add your text, upload a PDF, or paste content you want to hear.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View
                  className="justify-center items-center mt-1 mr-4 w-8 h-8 bg-blue-500 rounded-lg shadow-md"
                  style={{
                    shadowColor: "#2563EB",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text className="text-sm font-bold text-white">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-base font-bold text-black">Customize</Text>
                  <Text className="text-sm font-medium leading-5 text-gray-600">
                    Choose voice, speed, and other preferences for the perfect listening experience.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View
                  className="justify-center items-center mt-1 mr-4 w-8 h-8 bg-blue-500 rounded-lg shadow-md"
                  style={{
                    shadowColor: "#2563EB",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text className="text-sm font-bold text-white">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-base font-bold text-black">Listen</Text>
                  <Text className="text-sm font-medium leading-5 text-gray-600">
                    Enjoy clear, natural speech that brings your content to life.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Index;