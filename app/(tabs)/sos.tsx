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
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSOSPress = async () => {
    Alert.alert(
      t('sos.confirmTitle'),
      t('sos.confirmText'),
      [
        {
          text: t('sos.confirmCancel'),
          style: 'cancel'
        },
        {
          text: t('sos.confirmSend'),
          style: 'destructive',
          onPress: sendSOS
        }
      ]
    );
  };

  const sendSOS = async () => {
    setIsSending(true);
    try {
      Speech.speak(t('emergency.sendingNow'), {
        language: getSpeechLanguageCode(i18n.language),
        pitch: 1.1,
        rate: 0.9,
      });

      const result = await SOSService.sendSOS();
      
      if (result.success) {
        const emergencyMsg = result.emergencyMessage || t('emergency.sentSuccess');
        setLastEmergencyMessage(emergencyMsg);
        
        Alert.alert(
          t('common.success'),
          result.message,
          [
            { text: t('common.ok') },
            { text: t('sos.viewFullMessage'), onPress: () => showEmergencyMessage(emergencyMsg) }
          ]
        );
        
        Speech.speak(t('emergency.sentSuccess'), {
          language: getSpeechLanguageCode(i18n.language),
          pitch: 1.0,
          rate: 0.8,
        });
      } else {
        Alert.alert(
          t('common.error'),
          result.message,
          [
            { text: t('common.ok') },
            { text: t('common.next'), onPress: sendSOS },
            { text: t('sos.callManually'), onPress: () => callEmergencyManually() }
          ]
        );
        
        Speech.speak(t('emergency.error'), {
          language: getSpeechLanguageCode(i18n.language),
          pitch: 1.0,
          rate: 0.8,
        });
      }
      await loadSOSHistory();
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => new Date(timestamp).toLocaleString();

  const openLocationInMaps = async (latitude: number, longitude: number) => {
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        Speech.speak(`${t('common.info')}: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, {
          language: getSpeechLanguageCode(i18n.language),
          pitch: 1.0,
          rate: 0.8,
        });
      } else {
        Alert.alert(
          t('common.error'),
          `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\n${url}`,
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      Alert.alert(
        t('common.info'),
        `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\n${url}`,
        [{ text: t('common.ok') }]
      );
    }
  };

  const showEmergencyMessage = (message: string) => {
    Alert.alert(
      t('sos.lastMessageTitle'),
      message,
      [
        { text: t('common.ok') },
      ]
    );
    Speech.speak(`${t('sos.lastMessageTitle')}: ${message}`, {
      language: getSpeechLanguageCode(i18n.language),
      pitch: 1.0,
      rate: 0.7,
    });
  };

  const callEmergencyManually = async () => {
    const result = await SOSService.callEmergencyNumber();
    Speech.speak(result.message, {
      language: getSpeechLanguageCode(i18n.language),
      pitch: 1.0,
      rate: 0.8,
    });
    if (!result.success) {
      Alert.alert(
        t('common.info'),
        result.message,
        [{ text: t('common.ok') }]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      <SimpleHamburgerMenu />
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
            {t('sos.headingTitle')}
          </Text>
          <Text style={{
            fontSize: 18,
            color: '#FEE2E2',
            textAlign: 'center',
            lineHeight: 24,
            paddingHorizontal: 16
          }}>
            {t('sos.headingSubtitle')}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
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
                {t('sos.lastMessageTitle')}
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
                {t('sos.viewFullMessage')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
            accessibilityLabel={t('sos.title')}
            accessibilityHint={t('sos.subtitle')}
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
                  {t('sos.sending')}
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
                  {t('sos.title')}
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
            {t('sos.helpText')}
          </Text>
        </View>

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
            accessibilityLabel={t('sos.callManually')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="call" size={24} color="#DC2626" />
              <Text style={{
                marginLeft: 12,
                fontWeight: '600',
                color: '#B91C1C',
                fontSize: 18
              }}>
                {t('sos.callManually')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

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
              {t('sos.recentEvents')}
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
                {t('sos.loadingHistory')}
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
                        backgroundColor: '#10B981',
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
              {t('sos.noEvents')}
            </Text>
          )}
        </View>

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
                {t('sos.importantNotice')}
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#92400E',
                lineHeight: 26
              }}>
                {t('sos.noticeText')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SOSScreen;