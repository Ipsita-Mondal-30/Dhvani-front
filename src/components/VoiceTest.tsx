import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import { getSpeechLanguageCode, changeLanguage } from '../locales/i18n';

const VoiceTest: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const testVoice = async (lang: string, message: string) => {
    try {
      setIsSpeaking(true);
      Speech.stop();
      
      const languageCode = getSpeechLanguageCode(lang);
      console.log(`🎤 Testing ${lang} (${languageCode}): "${message}"`);
      
      Speech.speak(message, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
        onDone: () => {
          console.log(`✅ ${lang} speech completed`);
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log(`⏹️ ${lang} speech stopped`);
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error(`❌ ${lang} speech error:`, error);
          setIsSpeaking(false);
          Alert.alert('Speech Error', `${lang}: ${JSON.stringify(error)}`);
        },
      });
    } catch (error) {
      console.error(`💥 ${lang} speech failed:`, error);
      setIsSpeaking(false);
    }
  };

  return (
    <View className="p-4 m-4 bg-yellow-50 rounded-lg border border-yellow-200">
      <Text className="mb-4 text-lg font-bold text-center text-yellow-800">
        🎤 Voice Test
      </Text>
      
      <View className="space-y-3">
        <TouchableOpacity
          onPress={() => testVoice('en', 'Welcome to Dhvani. This is English speech test.')}
          disabled={isSpeaking}
          className={`p-3 rounded-lg ${isSpeaking ? 'bg-gray-300' : 'bg-blue-500'}`}
        >
          <Text className={`text-center font-bold ${isSpeaking ? 'text-gray-500' : 'text-white'}`}>
            🇺🇸 Test English
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => testVoice('hi', 'ध्वनि में आपका स्वागत है। यह हिंदी भाषण परीक्षण है।')}
          disabled={isSpeaking}
          className={`p-3 rounded-lg ${isSpeaking ? 'bg-gray-300' : 'bg-green-500'}`}
        >
          <Text className={`text-center font-bold ${isSpeaking ? 'text-gray-500' : 'text-white'}`}>
            🇮🇳 Test Hindi (हिंदी)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => testVoice('bn', 'ধ্বনিতে স্বাগতম। এটি বাংলা ভাষণ পরীক্ষা।')}
          disabled={isSpeaking}
          className={`p-3 rounded-lg ${isSpeaking ? 'bg-gray-300' : 'bg-orange-500'}`}
        >
          <Text className={`text-center font-bold ${isSpeaking ? 'text-gray-500' : 'text-white'}`}>
            🇧🇩 Test Bengali (বাংলা)
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        onPress={() => {
          Speech.stop();
          setIsSpeaking(false);
        }}
        className="mt-3 p-2 bg-red-500 rounded"
      >
        <Text className="text-center font-bold text-white">⏹️ Stop</Text>
      </TouchableOpacity>
      
      {isSpeaking && (
        <Text className="mt-2 text-center text-yellow-700">🔊 Speaking...</Text>
      )}
    </View>
  );
};

export default VoiceTest;