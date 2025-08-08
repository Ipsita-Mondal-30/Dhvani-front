import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const router = useRouter();

  useEffect(() => {
    // Voice onboarding on component mount
    const speakWelcome = async () => {
      try {
        // Wait a moment for the screen to fully load
        setTimeout(() => {
          Speech.speak("Welcome to Dhvani. Tap to access features and start converting text to speech.", {
            language: 'en',
            pitch: 1.0,
            rate: 0.8,
          });
        }, 1000);
      } catch (error) {
        console.error('💥 [HomeScreen] Failed to speak welcome message:', error);
      }
    };

    speakWelcome();
  }, []);

  const features = [
    {
      icon: 'play-circle-outline',
      title: 'Text to Speech',
      description: 'Convert any text, PDF, or document into natural-sounding speech',
      route: '/speech',
      color: '#3B82F6',
    },
    {
      icon: 'time-outline',
      title: 'Audio History',
      description: 'Access your previously converted audio files and saved documents',
      route: '/history',
      color: '#10B981',
    },
    {
      icon: 'person-outline',
      title: 'Profile & Settings',
      description: 'Customize voice settings, speed, and accessibility options',
      route: '/profile',
      color: '#8B5CF6',
    },
  ];

  const FeatureCard = ({ icon, title, description, route, color }: any) => (
    <TouchableOpacity
      onPress={() => router.push(route)}
      className="p-6 mb-4 bg-white rounded-xl border border-gray-100 shadow-lg"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
      }}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${description}`}
      accessibilityHint="Double tap to navigate to this feature"
    >
      <View className="flex-row items-center mb-3">
        <View
          className="justify-center items-center mr-4 w-12 h-12 rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1">{title}</Text>
        </View>
      </View>
      <Text className="text-sm text-gray-600 leading-5">{description}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1F2937', '#374151']}
        className="pt-12 pb-8 px-6"
      >
        <View className="items-center">
          <Text className="text-3xl font-bold text-white mb-2">Dhvani</Text>
          <Text className="text-lg text-gray-300 text-center">
            Accessibility-First Text to Speech
          </Text>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View className="flex-1 px-6 pt-6">
        {/* Welcome Message */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Welcome Back!
          </Text>
          <Text className="text-base text-gray-600">
            Choose a feature below to get started with text-to-speech conversion.
          </Text>
        </View>

        {/* Feature Cards */}
        <View className="flex-1">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>

        {/* Quick Access Button */}
        <TouchableOpacity
          onPress={() => router.push('/speech')}
          className="mb-8 p-4 bg-blue-600 rounded-xl"
          style={{
            shadowColor: "#3B82F6",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          accessibilityRole="button"
          accessibilityLabel="Quick start: Go directly to text to speech conversion"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="flash" size={20} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold text-lg">Quick Start</Text>
          </View>
        </TouchableOpacity>

        {/* Accessibility Info */}
        <View className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <View className="flex-row items-center mb-2">
            <Ionicons name="accessibility-outline" size={20} color="#059669" />
            <Text className="ml-2 text-sm font-semibold text-green-800">
              Accessibility Features
            </Text>
          </View>
          <Text className="text-xs text-green-700">
            Voice guidance, high contrast mode, and screen reader support available
          </Text>
        </View>
      </View>
    </View>
  );
};

export default HomeScreen;
