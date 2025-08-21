import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  PanResponder,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { SOSService } from '@/services/sosService';
import SimpleHamburgerMenu from "@/src/components/SimpleHamburgerMenu";
import { useTranslation } from 'react-i18next';
import { getSpeechLanguageCode } from '@/src/locales/i18n';

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

const HomeScreen = () => {
  const { t, i18n } = useTranslation();
  const [isSosMode, setIsSosMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [soundTranscription, setSoundTranscription] = useState('');
  
  // Refs for managing timers and intervals
  const sosTimer = useRef<NodeJS.Timeout | null>(null);
  const listeningTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Start continuous voice monitoring
    startVoiceMonitoring();
    
    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Cleanup on unmount
    return () => {
      cleanup();
      subscription?.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: string) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground, restart voice monitoring
      startVoiceMonitoring();
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background, but keep essential monitoring
      // (In production, you might want to use background tasks)
    }
    appState.current = nextAppState;
  };

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
    setSosCountdown(0);
    setIsSosMode(false);
  };

  const startVoiceMonitoring = async () => {
    try {
      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Microphone permission denied');
        return;
      }

      // Configure audio for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      startListening();
    } catch (error) {
      console.error('Failed to start voice monitoring:', error);
    }
  };

  const startListening = async () => {
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
      console.error('Failed to start recording:', error);
      // Retry after a delay
      setTimeout(startListening, 2000);
    }
  };

  const processAudio = async (audioRecording: Audio.Recording) => {
    try {
      await audioRecording.stopAndUnloadAsync();
      const uri = audioRecording.getURI();
      
      if (uri) {
        // Here you would implement speech-to-text processing
        // For now, we'll simulate with a placeholder
        // In production, you could use services like:
        // - Google Speech-to-Text API
        // - Azure Speech Service
        // - Amazon Transcribe
        // - Or expo-speech-to-text library
        
        // Simulated transcription check (replace with actual STT)
        const transcription = await simulateTranscription(uri);
        setSoundTranscription(transcription);
        
        // Check if any SOS patterns match
        if (checkForSOSPattern(transcription)) {
          triggerVoiceActivatedSOS();
        }
      }

      setRecording(null);
      setIsListening(false);

      // Continue monitoring
      setTimeout(startListening, 1000);
    } catch (error) {
      console.error('Failed to process audio:', error);
      setRecording(null);
      setIsListening(false);
      
      // Retry listening
      setTimeout(startListening, 2000);
    }
  };

  const simulateTranscription = async (uri: string): Promise<string> => {
    // This is a placeholder for actual speech-to-text implementation
    // In production, you would send the audio to a transcription service
    
    // For demonstration, randomly return an SOS phrase occasionally
    const random = Math.random();
    if (random < 0.05) { // 5% chance for testing
      return 'help help help';
    }
    return ''; // Usually empty for non-emergency speech
  };

  const checkForSOSPattern = (transcription: string): boolean => {
    const lowerTranscription = transcription.toLowerCase();
    return SOS_VOICE_PATTERNS.some(pattern => 
      lowerTranscription.includes(pattern.toLowerCase())
    );
  };

  const triggerVoiceActivatedSOS = () => {
    console.log('🎤 Voice-activated SOS detected!');
    
    // Provide audio feedback
    Speech.speak('Emergency detected. SOS will activate in 5 seconds. Tap screen to cancel.', {
      language: getSpeechLanguageCode(i18n.language),
      pitch: 1.1,
      rate: 0.9,
    });

    setIsSosMode(true);
    setSosCountdown(5);

    // Start countdown
    countdownInterval.current = setInterval(() => {
      setSosCountdown(prev => {
        if (prev <= 1) {
          // Countdown finished - activate SOS
          if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
            countdownInterval.current = null;
          }
          activateSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-activate after 5 seconds if not cancelled
    sosTimer.current = setTimeout(() => {
      activateSOS();
    }, 5000);
  };

  const activateSOS = async () => {
    setIsSosMode(false);
    setSosCountdown(0);
    
    if (sosTimer.current) {
      clearTimeout(sosTimer.current);
      sosTimer.current = null;
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }

    try {
      Speech.speak('Activating emergency SOS now', {
        language: getSpeechLanguageCode(i18n.language),
        pitch: 1.1,
        rate: 0.9,
      });

      const result = await SOSService.sendSOS();
      
      if (result.success) {
        Speech.speak('SOS sent successfully', {
          language: getSpeechLanguageCode(i18n.language),
          pitch: 1.0,
          rate: 0.8,
        });
        
        Alert.alert(
          '✅ SOS Activated',
          result.message,
          [{ text: 'OK' }]
        );
      } else {
        Speech.speak('SOS failed. Please call emergency services manually', {
          language: getSpeechLanguageCode(i18n.language),
          pitch: 1.0,
          rate: 0.8,
        });
        
        Alert.alert(
          '❌ SOS Failed',
          result.message,
          [
            { text: 'OK' },
            { text: 'Call 911', onPress: () => SOSService.callEmergencyNumber() }
          ]
        );
      }
    } catch (error) {
      console.error('SOS activation failed:', error);
      Alert.alert(
        '❌ Error',
        'Failed to activate SOS. Please call emergency services manually.',
        [{ text: 'OK' }]
      );
    }
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
    setSosCountdown(0);
    
    Speech.speak('SOS cancelled', {
      language: getSpeechLanguageCode(i18n.language),
      pitch: 1.0,
      rate: 0.9,
    });
  };

  // Create PanResponder for global tap detection
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => {
      // Only capture taps in empty areas (not on existing buttons)
      const { pageX, pageY } = evt.nativeEvent;
      
      // Define button areas to avoid (approximate positions)
      const hamburgerArea = { x: 20, y: 50, width: 56, height: 56 };
      
      // Check if tap is in hamburger menu area
      if (pageX >= hamburgerArea.x && 
          pageX <= hamburgerArea.x + hamburgerArea.width &&
          pageY >= hamburgerArea.y && 
          pageY <= hamburgerArea.y + hamburgerArea.height) {
        return false; // Don't capture, let hamburger handle it
      }
      
      return true; // Capture tap for SOS
    },
    onPanResponderGrant: (evt, gestureState) => {
      // Handle tap for SOS activation
      handleScreenTap();
    },
  });

  const handleScreenTap = () => {
    if (isSosMode) {
      // If SOS countdown is active, cancel it
      cancelSOS();
      return;
    }

    // Start SOS activation
    Alert.alert(
      '🚨 Emergency SOS',
      'Do you want to activate emergency SOS? This will send your location to emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Activate SOS', 
          style: 'destructive',
          onPress: () => triggerVoiceActivatedSOS()
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      
      {/* Simple Hamburger Menu */}
      <SimpleHamburgerMenu />
      
      {/* SOS Countdown Overlay */}
      {isSosMode && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(220, 38, 38, 0.95)',
          zIndex: 998,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 30,
            alignItems: 'center',
            maxWidth: width * 0.8,
          }}>
            <Ionicons name="warning" size={48} color="#DC2626" />
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#DC2626',
              marginTop: 10,
              textAlign: 'center',
            }}>
              Emergency SOS
            </Text>
            <Text style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#DC2626',
              marginVertical: 20,
            }}>
              {sosCountdown}
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#666',
              textAlign: 'center',
              marginBottom: 20,
            }}>
              SOS will activate automatically.{'\n'}Tap anywhere to cancel.
            </Text>
            <TouchableOpacity
              onPress={cancelSOS}
              style={{
                backgroundColor: '#EF4444',
                paddingHorizontal: 30,
                paddingVertical: 15,
                borderRadius: 10,
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
              }}>
                Cancel SOS
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Home Content */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6', '#60A5FA']}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          {/* App Title */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{
              fontSize: 42,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: 10,
            }}>
              Dhvani
            </Text>
            <Text style={{
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
            }}>
              Voice Assistant App
            </Text>
          </View>

          {/* Voice Status Indicator */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 15,
            padding: 15,
            marginBottom: 30,
            alignItems: 'center',
            minWidth: 200,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons 
                name={isListening ? "mic" : "mic-off"} 
                size={20} 
                color={isListening ? "#10B981" : "rgba(255, 255, 255, 0.7)"} 
              />
              <Text style={{
                color: 'white',
                marginLeft: 8,
                fontSize: 16,
                fontWeight: '500',
              }}>
                {isListening ? 'Listening for "Help"' : 'Voice Monitor Off'}
              </Text>
            </View>
            {soundTranscription ? (
              <Text style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: 12,
                marginTop: 5,
                fontStyle: 'italic',
              }}>
                Last: "{soundTranscription}"
              </Text>
            ) : null}
          </View>

          {/* Features Grid */}
          <View style={{
            width: '100%',
            maxWidth: 350,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 15,
                  padding: 20,
                  alignItems: 'center',
                  width: '48%',
                }}
                onPress={() => {/* Navigate to speech */}}
              >
                <Ionicons name="mic" size={32} color="white" />
                <Text style={{
                  color: 'white',
                  fontSize: 14,
                  fontWeight: '600',
                  marginTop: 8,
                  textAlign: 'center',
                }}>
                  Speech to Text
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 15,
                  padding: 20,
                  alignItems: 'center',
                  width: '48%',
                }}
                onPress={() => {/* Navigate to currency */}}
              >
                <Ionicons name="cash" size={32} color="white" />
                <Text style={{
                  color: 'white',
                  fontSize: 14,
                  fontWeight: '600',
                  marginTop: 8,
                  textAlign: 'center',
                }}>
                  Currency Reader
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.2)',
                  borderWidth: 2,
                  borderColor: 'rgba(220, 38, 38, 0.5)',
                  borderRadius: 15,
                  padding: 20,
                  alignItems: 'center',
                  width: '48%',
                }}
                onPress={() => {/* Navigate to SOS */}}
              >
                <Ionicons name="warning" size={32} color="#FCA5A5" />
                <Text style={{
                  color: '#FCA5A5',
                  fontSize: 14,
                  fontWeight: '600',
                  marginTop: 8,
                  textAlign: 'center',
                }}>
                  Emergency SOS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 15,
                  padding: 20,
                  alignItems: 'center',
                  width: '48%',
                }}
                onPress={() => {/* Navigate to settings */}}
              >
                <Ionicons name="settings" size={32} color="white" />
                <Text style={{
                  color: 'white',
                  fontSize: 14,
                  fontWeight: '600',
                  marginTop: 8,
                  textAlign: 'center',
                }}>
                  Settings
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructions */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 15,
            padding: 20,
            marginTop: 30,
            maxWidth: 350,
          }}>
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: 10,
            }}>
              Emergency Features
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 20,
            }}>
              • Tap anywhere on screen to activate SOS{'\n'}
              • Say "Help Help Help" for voice SOS{'\n'}
              • App listens continuously for emergencies
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default HomeScreen;