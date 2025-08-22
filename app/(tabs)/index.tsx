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

import { icons } from "@/constants/icons";
import { getSpeechLanguageCode, changeLanguage } from "@/src/locales/i18n";
import SimpleHamburgerMenu from "@/src/components/SimpleHamburgerMenu";
import { useTheme } from "@/src/contexts/ThemeContext";
import { SOSService } from "@/services/sosService";

const { width, height } = Dimensions.get('window');

const Index: React.FC = () => {
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
    console.log('Emergency SOS triggered');
    
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
          onPress: () => {
            console.log('SOS cancelled by user');
            setSOSCountdown(0);
            if (sosTimer.current) {
              clearInterval(sosTimer.current);
              sosTimer.current = null;
            }
            
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
      Speech.speak("Sending emergency SOS now. Please wait.", {
        language: 'en',
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
          language: 'en',
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
      console.error('Emergency SOS failed:', error);
      Alert.alert(
        "Emergency Error",
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
    console.log('Started listening for voice commands');
    
    Speech.speak("Listening for voice commands. Say help help help for emergency.", {
      language: 'en',
      pitch: 1.0,
      rate: 0.8,
    });

    setTimeout(() => {
      setIsListening(false);
      console.log('Stopped listening for voice commands');
    }, 10000);
  };

  // Pan responder for detecting taps on empty areas
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      return true;
    },
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: (evt, gestureState) => {
      console.log('Tap detected on empty area');
      
      const { pageX, pageY } = evt.nativeEvent;
      
      const hamburgerMenuArea = { x: 20, y: 60, width: 56, height: 56 };
      const headerHeight = 250;
      const componentStartY = headerHeight + 50;
      
      if (pageX >= hamburgerMenuArea.x && 
          pageX <= hamburgerMenuArea.x + hamburgerMenuArea.width &&
          pageY >= hamburgerMenuArea.y && 
          pageY <= hamburgerMenuArea.y + hamburgerMenuArea.height) {
        return;
      }
      
      if (pageY >= componentStartY) {
        return;
      }
      
      if (pageY >= headerHeight && pageY <= componentStartY) {
        return;
      }
      
      console.log('Emergency tap detected on empty area');
      triggerEmergencySOS();
    },
  });

  const speakWelcomeMessage = async () => {
    try {
      Speech.stop();
      setIsSpeaking(true);

      const languageCode = getSpeechLanguageCode(i18n.language);
      console.log(`Speaking in language: ${languageCode}`);

      Speech.speak(welcomeMessage, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
        onDone: () => {
          console.log('Speech completed');
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log('Speech stopped');
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);

          Speech.speak(welcomeMessage, {
            pitch: 1.0,
            rate: 0.8,
            onDone: () => setIsSpeaking(false),
            onStopped: () => setIsSpeaking(false),
            onError: (fallbackError) => {
              console.error('Fallback speech also failed:', fallbackError);
              setIsSpeaking(false);
            },
          });
        },
      });
    } catch (error) {
      console.error('Failed to speak welcome message:', error);
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

    return () => {
      if (sosTimer.current) {
        clearInterval(sosTimer.current);
      }
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} {...panResponder.panHandlers}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Emergency SOS Overlay */}
      {(isSendingSOS || sosCountdown > 0) && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          zIndex: 50,
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 32,
            marginHorizontal: 24,
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
                  }}>
                    Tap anywhere to cancel
                  </Text>
                </>
              ) : (
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
              )}
            </View>
          </View>
        </View>
      )}

      {/* Simple Hamburger Menu */}
      <SimpleHamburgerMenu />

      {/* Emergency Help Instructions */}
      <View style={{
        position: 'absolute',
        top: 80,
        right: 16,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        padding: 12,
        zIndex: 40,
      }}>
        <Text style={{
          fontSize: 12,
          fontWeight: '600',
          color: '#B91C1C',
          marginBottom: 4,
        }}>
          Emergency Help
        </Text>
        <Text style={{ fontSize: 10, color: '#DC2626' }}>Tap empty area for SOS</Text>
        <Text style={{ fontSize: 10, color: '#DC2626' }}>Say "help help help"</Text>
        <TouchableOpacity
          onPress={startListening}
          disabled={isListening}
          style={{
            marginTop: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: isListening ? '#FEF2F2' : '#DC2626',
          }}
        >
          <Text style={{
            fontSize: 10,
            fontWeight: '600',
            color: isListening ? '#B91C1C' : '#FFFFFF',
          }}>
            {isListening ? 'Listening...' : 'Enable Voice'}
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
      </ScrollView>
    </View>
  );
};

export default Index;