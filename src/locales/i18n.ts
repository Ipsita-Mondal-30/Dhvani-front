import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Import translation files
import en from './translations/en.json';
import hi from './translations/hi.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      // Fallback to device locale
      const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
      const languageCode = deviceLocale.split('-')[0];

      // Check if we support the device language
      const supportedLanguages = ['en', 'hi'];
      const detectedLanguage = supportedLanguages.includes(languageCode) ? languageCode : 'en';

      callback(detectedLanguage);
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en'); // Fallback to English
    }
  },
  init: () => { },
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    fallbackLng: 'en',
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Helper function to get speech language code based on i18n language
export const getSpeechLanguageCode = (language: string): string => {
  // Use the most basic language codes for maximum compatibility
  if (language === 'hi') {
    return 'hi'; // Try basic Hindi first
  }
  return 'en'; // Default to English
};

// Helper function to change language and persist it
export const changeLanguage = async (languageCode: string): Promise<void> => {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem('user-language', languageCode);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};