import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { SOSService, SOSLog } from '@/services/sosService';
import SimpleHamburgerMenu from "@/src/components/SimpleHamburgerMenu";
import { useTranslation } from 'react-i18next';
import { getSpeechLanguageCode } from '@/src/locales/i18n';
import * as Linking from 'expo-linking';

const { width, height } = Dimensions.get('window');

const SOSScreen = () => {
  const { t, i18n } = useTranslation();
  const [isSending, setIsSending] = useState(false);
  const [sosHistory, setSOSHistory] = useState<SOSLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [lastEmergencyMessage, setLastEmergencyMessage] = useState<string>('');

  useEffect(() => {
    loadSOSHistory();
    
    // Voice announcement when screen loads
    setTimeout(() => {
      Speech.speak(t('sos.subtitle'), {
        language: getSpeechLanguageCode(i18n.language),
        pitch: 1.0,
        rate: 0.8,
      });
    }, 1000);
  }, []);

  const loadSOSHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const result = await SOSService.getSOSHistory();
      if (result.success && result.logs) {
        setSOSHistory(result.logs);
      } else {
        console.warn('Failed to load SOS history:', result.error);
      }
    } catch (error) {
      console.error('Error loading SOS history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSOSPress = async () => {
    // Confirmation dialog
    Alert.alert(
      "🚨 Emergency SOS",
      "This will send your current location to emergency contacts via SMS. Are you sure you want to proceed?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: sendSOS
        }
      ]
    );
  };

  const sendSOS = async () => {
    setIsSending(true);
    
    try {
      // Voice feedback
      Speech.speak("Sending emergency SOS. Please wait.", {
        language: getSpeechLanguageCode(i18n.language),
        pitch: 1.1,
        rate: 0.9,
      });

      const result = await SOSService.sendSOS();
      
      if (result.success) {
        // Store the emergency message for display
        const emergencyMsg = result.emergencyMessage || 'Emergency SOS sent with location.';
        setLastEmergencyMessage(emergencyMsg);
        
        Alert.alert(
          "✅ SOS Sent Successfully",
          result.message,
          [
            { text: "OK" },
            { text: "View Message", onPress: () => showEmergencyMessage(emergencyMsg) }
          ]
        );
        
        // Voice confirmation with specific details
        let voiceMessage = "SOS sent successfully.";
        if (result.message && (result.message.includes('911') || result.message.includes('112'))) {
          voiceMessage += " Emergency services have been contacted automatically.";
        } else if (result.message && result.message.includes('Emergency Call')) {
          voiceMessage += " Emergency call initiated.";
        } else {
          voiceMessage += " Emergency contacts have been notified.";
        }
        
        Speech.speak(voiceMessage, {
          language: getSpeechLanguageCode(i18n.language),
          pitch: 1.0,
          rate: 0.8,
        });
      } else {
        Alert.alert(
          "❌ SOS Failed",
          result.message,
          [
            { text: "OK" },
            { text: "Try Again", onPress: sendSOS },
            { text: "Call 911", onPress: () => callEmergencyManually() }
          ]
        );
        
        // Voice error feedback
        Speech.speak("SOS failed to send. Please try again or contact emergency services directly.", {
          language: 'en',
          pitch: 1.0,
          rate: 0.8,
        });
      }
      
      // Refresh history
      await loadSOSHistory();
      
    } catch (error) {
      console.error('SOS Error:', error);
      Alert.alert(
        "❌ SOS Error",
        "An unexpected error occurred. Please contact emergency services directly if this is a real emergency.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sms sent':
        return '#059669'; // Green
      case 'sms failed':
      case 'error':
        return '#DC2626'; // Red
      case 'permission denied':
        return '#D97706'; // Orange
      default:
        return '#6B7280'; // Gray
    }
  };

  const openLocationInMaps = async (latitude: number, longitude: number) => {
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        Speech.speak(`Opening location ${latitude.toFixed(4)}, ${longitude.toFixed(4)} in maps.`, {
          language: 'en',
          pitch: 1.0,
          rate: 0.8,
        });
      } else {
        Alert.alert(
          "Cannot Open Maps",
          `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nCopy this link: ${url}`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Location",
        `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nMap URL: ${url}`,
        [{ text: "OK" }]
      );
    }
  };

  const showEmergencyMessage = (message: string) => {
    Alert.alert(
      "📱 Emergency Message Sent",
      message,
      [
        { text: "OK" },
        { text: "Copy Message", onPress: () => {
          // In a real app, you'd use Clipboard API
          console.log('Message copied:', message);
        }}
      ]
    );
    
    // Read the message aloud
    Speech.speak(`Emergency message sent: ${message}`, {
      language: 'en',
      pitch: 1.0,
      rate: 0.7,
    });
  };

  const callEmergencyManually = async () => {
    try {
      // Use the new callEmergencyNumber method from SOSService
      const result = await SOSService.callEmergencyNumber();
      
      Speech.speak(result.message, {
        language: 'en',
        pitch: 1.0,
        rate: 0.8,
      });
      
      if (!result.success) {
        Alert.alert(
          "Call Status",
          result.message,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('❌ [SOSScreen] Emergency call failed:', error);
      Alert.alert(
        "Call Failed",
        "Please dial 911, 112, or 100 manually for emergency services.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      
      {/* Simple Hamburger Menu */}
      <SimpleHamburgerMenu />
      
      {/* Header - More spacious and accessible */}
      <LinearGradient
        colors={['#DC2626', '#B91C1C']}
        style={{
          paddingTop: 60,
          paddingBottom: 40,
          paddingHorizontal: 32,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="warning" size={48} color="white" />
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: 'white',
            marginTop: 16,
            marginBottom: 8,
            textAlign: 'center'
          }}>
            Emergency SOS
          </Text>
          <Text style={{
            fontSize: 18,
            color: '#FEE2E2',
            textAlign: 'center',
            lineHeight: 24,
            paddingHorizontal: 16
          }}>
            Send your location to emergency contacts
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Emergency Message Display - More prominent */}
        {lastEmergencyMessage && (
          <View style={{
            backgroundColor: '#EFF6FF',
            borderWidth: 2,
            borderColor: '#DBEAFE',
            borderRadius: 16,
            padding: 24,
            marginBottom: 32
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="mail-outline" size={24} color="#2563EB" />
              <Text style={{
                marginLeft: 12,
                fontSize: 18,
                fontWeight: '600',
                color: '#1E40AF'
              }}>
                Last Emergency Message
              </Text>
            </View>
            <Text style={{
              fontSize: 16,
              color: '#1E40AF',
              lineHeight: 24,
              marginBottom: 16
            }}>
              {lastEmergencyMessage}
            </Text>
            <TouchableOpacity
              onPress={() => showEmergencyMessage(lastEmergencyMessage)}
              style={{
                backgroundColor: '#DBEAFE',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 12,
                alignSelf: 'flex-start'
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#2563EB'
              }}>
                View Full Message
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Emergency Button - Larger and more accessible */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <TouchableOpacity
            onPress={handleSOSPress}
            disabled={isSending}
            style={{
              width: 240,
              height: 240,
              borderRadius: 120,
              backgroundColor: '#DC2626',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isSending ? 0.7 : 1,
              shadowColor: "#DC2626",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 16,
              marginBottom: 24
            }}
            accessibilityRole="button"
            accessibilityLabel="Emergency SOS Button"
            accessibilityHint="Double tap to send emergency location to contacts"
          >
            {isSending ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="large" color="white" />
                <Text style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 18,
                  marginTop: 12
                }}>
                  Sending...
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="call" size={64} color="white" />
                <Text style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 28,
                  marginTop: 12
                }}>
                  SOS
                </Text>
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  marginTop: 4
                }}>
                  Emergency
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={{
            color: '#4B5563',
            textAlign: 'center',
            fontSize: 18,
            lineHeight: 28,
            paddingHorizontal: 16,
            maxWidth: 400
          }}>
            Tap the button above to send your current location to emergency contacts via SMS. If no contacts are configured, emergency services will be called automatically.
          </Text>
        </View>

        {/* Manual Emergency Call Button - More prominent */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <TouchableOpacity
            onPress={callEmergencyManually}
            style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 2,
              borderColor: '#FECACA',
              paddingHorizontal: 32,
              paddingVertical: 20,
              borderRadius: 16,
              minWidth: 200
            }}
            accessibilityRole="button"
            accessibilityLabel="Call emergency services manually"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="call" size={24} color="#DC2626" />
              <Text style={{
                marginLeft: 12,
                fontWeight: '600',
                color: '#B91C1C',
                fontSize: 18
              }}>
                Call 911 Manually
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Instructions - More spacious and readable */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 32,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: '#F3F4F6',
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: 24,
            textAlign: 'center'
          }}>
            How it works:
          </Text>
          
          <View style={{ gap: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: '#FEE2E2',
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 20,
                marginTop: 4
              }}>
                <Text style={{
                  color: '#DC2626',
                  fontSize: 18,
                  fontWeight: 'bold'
                }}>
                  1
                </Text>
              </View>
              <Text style={{
                flex: 1,
                color: '#374151',
                fontSize: 18,
                lineHeight: 28
              }}>
                Gets your current location with GPS
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: '#FEE2E2',
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 20,
                marginTop: 4
              }}>
                <Text style={{
                  color: '#DC2626',
                  fontSize: 18,
                  fontWeight: 'bold'
                }}>
                  2
                </Text>
              </View>
              <Text style={{
                flex: 1,
                color: '#374151',
                fontSize: 18,
                lineHeight: 28
              }}>
                Sends SMS with location link to emergency contacts
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: '#FEE2E2',
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 20,
                marginTop: 4
              }}>
                <Text style={{
                  color: '#DC2626',
                  fontSize: 18,
                  fontWeight: 'bold'
                }}>
                  3
                </Text>
              </View>
              <Text style={{
                flex: 1,
                color: '#374151',
                fontSize: 18,
                lineHeight: 28
              }}>
                Logs the emergency event for your records
              </Text>
            </View>
          </View>
        </View>

        {/* SOS History - More accessible layout */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 32,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: '#F3F4F6',
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#111827'
            }}>
              Recent SOS Events
            </Text>
            <TouchableOpacity 
              onPress={loadSOSHistory} 
              disabled={isLoadingHistory}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#F9FAFB'
              }}
            >
              <Ionicons 
                name="refresh" 
                size={24} 
                color={isLoadingHistory ? "#9CA3AF" : "#6B7280"} 
              />
            </TouchableOpacity>
          </View>
          
          {isLoadingHistory ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <ActivityIndicator size="large" color="#DC2626" />
              <Text style={{
                color: '#6B7280',
                marginTop: 16,
                fontSize: 16
              }}>
                Loading history...
              </Text>
            </View>
          ) : sosHistory.length > 0 ? (
            <View style={{ gap: 16 }}>
              {sosHistory.slice(0, 5).map((log) => (
                <TouchableOpacity
                  key={log.id}
                  onPress={() => openLocationInMaps(log.latitude, log.longitude)}
                  style={{
                    padding: 20,
                    backgroundColor: '#F9FAFB',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E5E7EB'
                  }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: getStatusColor(log.status),
                        marginRight: 12
                      }} />
                      <Text style={{
                        fontWeight: '600',
                        color: '#111827',
                        fontSize: 16
                      }}>
                        {log.status}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 14,
                      color: '#6B7280'
                    }}>
                      {formatTimestamp(log.timestamp)}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 16,
                    color: '#4B5563',
                    lineHeight: 24
                  }}>
                    📍 {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={{
              color: '#6B7280',
              textAlign: 'center',
              paddingVertical: 32,
              fontSize: 18,
              lineHeight: 28
            }}>
              No SOS events recorded yet
            </Text>
          )}
        </View>

        {/* Warning - More prominent and accessible */}
        <View style={{
          backgroundColor: '#FFFBEB',
          borderWidth: 2,
          borderColor: '#FDE68A',
          borderRadius: 20,
          padding: 32
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="warning-outline" size={28} color="#D97706" />
            <View style={{ marginLeft: 20, flex: 1 }}>
              <Text style={{
                fontWeight: '600',
                color: '#92400E',
                marginBottom: 12,
                fontSize: 20
              }}>
                Important Notice
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#92400E',
                lineHeight: 26
              }}>
                This SOS feature is designed to assist in emergencies but should not replace calling emergency services (911, 112, etc.) in life-threatening situations.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SOSScreen;