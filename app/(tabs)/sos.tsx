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

const { width, height } = Dimensions.get('window');

const SOSScreen = () => {
  const [isSending, setIsSending] = useState(false);
  const [sosHistory, setSOSHistory] = useState<SOSLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    loadSOSHistory();
    
    // Voice announcement when screen loads
    setTimeout(() => {
      Speech.speak("SOS Emergency screen. Tap the red emergency button to send your location to emergency contacts.", {
        language: 'en',
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
        language: 'en',
        pitch: 1.1,
        rate: 0.9,
      });

      const result = await SOSService.sendSOS();
      
      if (result.success) {
        Alert.alert(
          "✅ SOS Sent Successfully",
          result.message,
          [{ text: "OK" }]
        );
        
        // Voice confirmation
        Speech.speak("SOS sent successfully. Emergency contacts have been notified.", {
          language: 'en',
          pitch: 1.0,
          rate: 0.8,
        });
      } else {
        Alert.alert(
          "❌ SOS Failed",
          result.message,
          [
            { text: "OK" },
            { text: "Try Again", onPress: sendSOS }
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
        return '#10B981'; // Green
      case 'sms failed':
      case 'error':
        return '#EF4444'; // Red
      case 'permission denied':
        return '#F59E0B'; // Yellow
      default:
        return '#6B7280'; // Gray
    }
  };

  const openLocationInMaps = (latitude: number, longitude: number) => {
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Alert.alert(
      "Location",
      `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      [
        { text: "Cancel" },
        { text: "Open in Maps", onPress: () => console.log('Open URL:', url) }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      
      {/* Header */}
      <LinearGradient
        colors={['#DC2626', '#B91C1C', '#991B1B']}
        className="pt-12 pb-8 px-6"
      >
        <View className="items-center">
          <Ionicons name="warning" size={32} color="white" />
          <Text className="text-2xl font-bold text-white mt-2 mb-1">Emergency SOS</Text>
          <Text className="text-sm text-red-100 text-center">
            Send your location to emergency contacts
          </Text>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Emergency Button */}
        <View className="items-center mb-8">
          <TouchableOpacity
            onPress={handleSOSPress}
            disabled={isSending}
            className={`w-48 h-48 rounded-full items-center justify-center ${isSending ? 'opacity-70' : ''}`}
            style={{
              backgroundColor: '#DC2626',
              shadowColor: "#DC2626",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel="Emergency SOS Button"
            accessibilityHint="Double tap to send emergency location to contacts"
          >
            {isSending ? (
              <View className="items-center">
                <ActivityIndicator size="large" color="white" />
                <Text className="text-white font-bold mt-2">Sending...</Text>
              </View>
            ) : (
              <View className="items-center">
                <Ionicons name="call" size={48} color="white" />
                <Text className="text-white font-bold text-xl mt-2">SOS</Text>
                <Text className="text-white text-sm">Emergency</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <Text className="text-gray-600 text-center mt-4 px-4">
            Tap the button above to send your current location to emergency contacts via SMS
          </Text>
        </View>

        {/* Instructions */}
        <View className="bg-white rounded-xl p-6 mb-6 border border-gray-100 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">How it works:</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-start">
              <View className="w-6 h-6 bg-red-100 rounded-full items-center justify-center mr-3 mt-0.5">
                <Text className="text-red-600 text-xs font-bold">1</Text>
              </View>
              <Text className="flex-1 text-gray-700">Gets your current location with GPS</Text>
            </View>
            
            <View className="flex-row items-start">
              <View className="w-6 h-6 bg-red-100 rounded-full items-center justify-center mr-3 mt-0.5">
                <Text className="text-red-600 text-xs font-bold">2</Text>
              </View>
              <Text className="flex-1 text-gray-700">Sends SMS with location link to emergency contacts</Text>
            </View>
            
            <View className="flex-row items-start">
              <View className="w-6 h-6 bg-red-100 rounded-full items-center justify-center mr-3 mt-0.5">
                <Text className="text-red-600 text-xs font-bold">3</Text>
              </View>
              <Text className="flex-1 text-gray-700">Logs the emergency event for your records</Text>
            </View>
          </View>
        </View>

        {/* SOS History */}
        <View className="bg-white rounded-xl p-6 mb-6 border border-gray-100 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Recent SOS Events</Text>
            <TouchableOpacity onPress={loadSOSHistory} disabled={isLoadingHistory}>
              <Ionicons 
                name="refresh" 
                size={20} 
                color={isLoadingHistory ? "#9CA3AF" : "#6B7280"} 
              />
            </TouchableOpacity>
          </View>
          
          {isLoadingHistory ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#6B7280" />
              <Text className="text-gray-500 mt-2">Loading history...</Text>
            </View>
          ) : sosHistory.length > 0 ? (
            <View className="space-y-3">
              {sosHistory.slice(0, 5).map((log) => (
                <TouchableOpacity
                  key={log.id}
                  onPress={() => openLocationInMaps(log.latitude, log.longitude)}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center">
                      <View 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getStatusColor(log.status) }}
                      />
                      <Text className="font-semibold text-gray-900">{log.status}</Text>
                    </View>
                    <Text className="text-xs text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-600">
                    📍 {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text className="text-gray-500 text-center py-4">
              No SOS events recorded yet
            </Text>
          )}
        </View>

        {/* Warning */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <View className="flex-row items-start">
            <Ionicons name="warning-outline" size={20} color="#F59E0B" />
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-yellow-800 mb-1">Important Notice</Text>
              <Text className="text-sm text-yellow-700">
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
