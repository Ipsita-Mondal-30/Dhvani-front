import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../locales/i18n';
import * as Speech from 'expo-speech';

const MultilingualTest: React.FC = () => {
  const { t, i18n } = useTranslation();

  const testSpeech = () => {
    const message = t('home.welcome');
    Speech.speak(message, {
      language: i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'bn' ? 'bn-IN' : 'en-US',
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const handleLanguageChange = async (lang: string) => {
    try {
      await changeLanguage(lang);
      Alert.alert(
        t('common.success'),
        `Language changed to ${lang.toUpperCase()}`
      );
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to change language');
    }
  };

  return (
    <View className="p-4 m-4 bg-white rounded-lg shadow-lg">
      <Text className="mb-4 text-xl font-bold text-center">
        🌐 Multilingual Test
      </Text>
      
      <Text className="mb-2 text-center text-gray-600">
        Current Language: {i18n.language.toUpperCase()}
      </Text>
      
      <Text className="mb-4 text-center text-lg">
        {t('home.welcome')}
      </Text>
      
      <View className="flex-row justify-around mb-4">
        <TouchableOpacity
          onPress={() => handleLanguageChange('en')}
          className={`px-4 py-2 rounded ${i18n.language === 'en' ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <Text className={i18n.language === 'en' ? 'text-white' : 'text-black'}>
            EN
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handleLanguageChange('hi')}
          className={`px-4 py-2 rounded ${i18n.language === 'hi' ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <Text className={i18n.language === 'hi' ? 'text-white' : 'text-black'}>
            हि
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handleLanguageChange('bn')}
          className={`px-4 py-2 rounded ${i18n.language === 'bn' ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <Text className={i18n.language === 'bn' ? 'text-white' : 'text-black'}>
            বা
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        onPress={testSpeech}
        className="px-4 py-2 bg-green-500 rounded"
      >
        <Text className="font-bold text-center text-white">
          🔊 Test Speech
        </Text>
      </TouchableOpacity>
      
      <View className="mt-4">
        <Text className="text-xs text-center text-gray-500">
          Navigation: {t('navigation.home')} | {t('navigation.settings')} | {t('navigation.profile')}
        </Text>
      </View>
    </View>
  );
};

export default MultilingualTest;