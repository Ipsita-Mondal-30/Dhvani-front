import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
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

  const welcomeMessage = t('home.description');

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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Subtle gradient background */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B', '#334155'] : ['#FFFFFF', '#F8FAFC', '#F1F5F9']}
        className="absolute inset-0"
      />

      {/* Simple Hamburger Menu */}
      <SimpleHamburgerMenu />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header Section */}
        <View className="items-center px-6 pt-16 pb-8">
          {/* Logo with enhanced styling */}
          <View
            className="justify-center items-center mb-6 w-20 h-20 bg-blue-500 rounded-2xl shadow-lg"
            style={{
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Image source={icons.logo} className="w-12 h-12" tintColor="#FFFFFF" />
          </View>

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