import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import { getSpeechLanguageCode, changeLanguage } from '../locales/i18n';

const SpeechTest: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const testSpeech = async (language: string) => {
    try {
      // Change language first
      await changeLanguage(language);
      
      // Get the welcome message in the new language
      const message = t('home.welcome');
      const languageCode = getSpeechLanguageCode(language);
      
      console.log(`🎤 Testing speech in ${language} (${languageCode}): ${message}`);
      
      setIsSpeaking(true);
      Speech.stop();
      
      Speech.speak(message, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
        onDone: () => {
          console.log(`✅ Speech completed in ${language}`);
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log(`⏹️ Speech stopped in ${language}`);
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error(`❌ Speech error in ${language}:`, error);
          setIsSpeaking(false);
          Alert.alert('Speech Error', `Failed to speak in ${language}. Error: ${JSON.stringify(error)}`);
        },
      });
    } catch (error) {
      console.error('Error in testSpeech:', error);
      setIsSpeaking(false);
      Alert.alert('Error', `Failed to test speech: ${error}`);
    }
  };

  return (
    <View className="p-4 m-4 bg-blue-50 rounded-lg border border-blue-200">
      <Text className="mb-4 text-lg font-bold text-center text-blue-800">
        🎤 Speech Test
      </Text>
      
      <Text className="mb-2 text-center text-gray-600">
        Current: {i18n.language.toUpperCase()}
      </Text>
      
      <Text className="mb-4 text-center">
        {t('home.welcome')}
      </Text>
      
      <View className="space-y-2">
        <TouchableOpacity
          onPress={() => testSpeech('en')}
          disabled={isSpeaking}
          className={`p-3 rounded-lg ${isSpeaking ? 'bg-gray-300' : 'bg-blue-500'}`}
        >
          <Text className={`text-center font-bold ${isSpeaking ? 'text-gray-500' : 'text-white'}`}>
            🇺🇸 Test English Speech
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => testSpeech('hi')}
          disabled={isSpeaking}
          className={`p-3 rounded-lg ${isSpeaking ? 'bg-gray-300' : 'bg-green-500'}`}
        >
          <Text className={`text-center font-bold ${isSpeaking ? 'text-gray-500' : 'text-white'}`}>
            🇮🇳 Test Hindi Speech (हिंदी)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => testSpeech('bn')}
          disabled={isSpeaking}
          className={`p-3 rounded-lg ${isSpeaking ? 'bg-gray-300' : 'bg-orange-500'}`}
        >
          <Text className={`text-center font-bold ${isSpeaking ? 'text-gray-500' : 'text-white'}`}>
            🇧🇩 Test Bengali Speech (বাংলা)
          </Text>
        </TouchableOpacity>
      </View>
      
      {isSpeaking && (
        <View className="mt-4 p-2 bg-yellow-100 rounded">
          <Text className="text-center text-yellow-800">
            🔊 Speaking...
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        onPress={() => Speech.stop()}
        className="mt-2 p-2 bg-red-500 rounded"
      >
        <Text className="text-center font-bold text-white">
          ⏹️ Stop Speech
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SpeechTest;