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
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';

import { icons } from "../../constants/icons";
import { getSpeechLanguageCode, changeLanguage } from "../../src/locales/i18n";


import SimpleHamburgerMenu from "../../src/components/SimpleHamburgerMenu";
import { useTheme } from "../../src/contexts/ThemeContext";

import { SOSService } from "../../services/sosService";

const { width } = Dimensions.get('window');

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
  const { isDark } = useTheme();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [sosCountdown, setSOSCountdown] = useState(0);
  const [isSosMode, setIsSosMode] = useState(false);

  // triple tap detection
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTime = useRef<number>(0);

  const welcomeMessage = t('home.description') || 'Welcome to Dhvani - Your Text to Speech Assistant';

  const handleTripleTap = () => {
    const now = Date.now();
    const timeBetweenTaps = now - lastTapTime.current;

    if (timeBetweenTaps > 500) {
      setTapCount(1);
    } else {
      setTapCount(prev => prev + 1);
    }

    lastTapTime.current = now;

    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
    }

    if (tapCount >= 2) {
      console.log('👆 Triple tap detected! Calling emergency services directly...');
      setTapCount(0);
      callEmergencyServicesDirectly();
      return;
    }

    tapTimer.current = setTimeout(() => {
      setTapCount(0);
    }, 500);
  };

  const callEmergencyServicesDirectly = async () => {
    try {
      const emergencyNumber = getEmergencyNumber();
      const phoneUrl = `tel:${emergencyNumber}`;
      const canCall = await Linking.canOpenURL(phoneUrl);
      if (canCall) {
        await Linking.openURL(phoneUrl);
        Speech.speak(`Calling emergency services at ${emergencyNumber}`, {
          language: getSpeechLanguageCode(i18n.language) || 'en',
          pitch: 1.0,
          rate: 0.8,
        });
      } else {
        throw new Error('Cannot make phone calls');
      }
    } catch (error) {
      Alert.alert(
        "Call Emergency Services",
        "Please dial emergency services manually:\n• US/Canada: 911\n• Europe: 112\n• India: 112\n• UK: 999",
        [{ text: "OK" }]
      );
    }
  };

  const getEmergencyNumber = (): string => {
    const locale = i18n.language || 'en';
    if (locale.startsWith('hi')) return '112';
    if (locale === 'en-GB') return '999';
    if (locale.startsWith('en')) return '911';
    return '112';
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      if (isSosMode) {
        setIsSosMode(false);
        setSOSCountdown(0);
        setIsSendingSOS(false);
      } else {
        handleTripleTap();
      }
    },
  });

  const speakWelcomeMessage = async () => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(welcomeMessage, {
      language: getSpeechLanguageCode(i18n.language) || 'en',
      pitch: 1.0,
      rate: 0.8,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  useEffect(() => {
    setTimeout(() => {
      speakWelcomeMessage();
    }, 1500);
  }, []);

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
      <SimpleHamburgerMenu />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header */}
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
            style={{ fontSize: 32, fontWeight: '900', color: '#1F2937', marginBottom: 8 }}
          >
            {t('home.title') || 'Dhvani'}
          </Text>

          <Text style={{ fontSize: 16, fontWeight: '600', color: '#3B82F6', marginBottom: 16 }}>
            {(t('home.subtitle') || 'Text to Speech Assistant').toUpperCase()}
          </Text>

          <Text style={{ fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#6B7280', marginBottom: 24 }}>
            {welcomeMessage}
          </Text>
        </View>

        {/* Language Switch */}
        <View style={{ paddingHorizontal: 32, marginBottom: 40 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
            Language / भाषा
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
            <TouchableOpacity
              onPress={async () => await changeLanguage('en')}
              style={{
                padding: 16, borderRadius: 12,
                backgroundColor: (i18n.language === 'en') ? '#3B82F6' : '#F9FAFB'
              }}
            >
              <Text style={{ color: (i18n.language === 'en') ? '#FFF' : '#374151' }}>English</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => await changeLanguage('hi')}
              style={{
                padding: 16, borderRadius: 12,
                backgroundColor: (i18n.language === 'hi') ? '#3B82F6' : '#F9FAFB'
              }}
            >
              <Text style={{ color: (i18n.language === 'hi') ? '#FFF' : '#374151' }}>हिंदी</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View style={{ paddingHorizontal: 32 }}>
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </View>

        {/* Emergency Info */}
        <View style={{ paddingHorizontal: 32, marginTop: 40, backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16 }}>
          <Ionicons name="shield-checkmark" size={20} color="#DC2626" />
          <Text style={{ marginTop: 8, fontWeight: 'bold', color: '#B91C1C' }}>
            Emergency Features Active
          </Text>
          <Text style={{ marginTop: 4, color: '#DC2626', fontSize: 14 }}>
            • Triple tap anywhere on empty screen → Call 911/112 instantly
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Index;
