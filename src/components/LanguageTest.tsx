import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../locales/i18n';

const LanguageTest: React.FC = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang);
  };

  return (
    <View className="p-4 bg-white rounded-lg shadow-md">
      <Text className="mb-4 text-lg font-bold text-center">
        {t('language.title')}
      </Text>
      
      <Text className="mb-2 text-center text-gray-600">
        Current: {i18n.language}
      </Text>
      
      <Text className="mb-4 text-center">
        {t('home.welcome')}
      </Text>
      
      <View className="flex-row justify-around">
        <TouchableOpacity
          onPress={() => handleLanguageChange('en')}
          className={`px-4 py-2 rounded ${i18n.language === 'en' ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <Text className={i18n.language === 'en' ? 'text-white' : 'text-black'}>
            English
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handleLanguageChange('hi')}
          className={`px-4 py-2 rounded ${i18n.language === 'hi' ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <Text className={i18n.language === 'hi' ? 'text-white' : 'text-black'}>
            हिंदी
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handleLanguageChange('bn')}
          className={`px-4 py-2 rounded ${i18n.language === 'bn' ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <Text className={i18n.language === 'bn' ? 'text-white' : 'text-black'}>
            বাংলা
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LanguageTest;