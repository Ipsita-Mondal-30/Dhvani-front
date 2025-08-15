import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../locales/i18n';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
];

const LanguageScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      Alert.alert(
        t('common.success'),
        t('language.languageChanged', { language: languages.find(l => l.code === languageCode)?.nativeName })
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        'Failed to change language. Please try again.'
      );
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        className="absolute inset-0"
      />
      
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="mt-16 mb-8">
          <Text className="mb-2 text-3xl font-bold text-center text-white">
            {t('language.title')}
          </Text>
          <Text className="text-base text-center text-slate-300">
            {t('language.subtitle')}
          </Text>
        </View>

        {/* Current Language */}
        <View className="p-4 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="mb-2 text-lg font-bold text-white">
            {t('language.currentLanguage')}
          </Text>
          <Text className="text-slate-300">
            {languages.find(l => l.code === currentLanguage)?.nativeName || 'English'}
          </Text>
        </View>

        {/* Language Options */}
        <View className="p-4 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="mb-4 text-lg font-bold text-white">
            {t('language.selectLanguage')}
          </Text>
          
          <View className="space-y-3">
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                onPress={() => handleLanguageChange(language.code)}
                className={`p-4 rounded-lg border ${
                  currentLanguage === language.code
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-slate-700/50 border-slate-600'
                }`}
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className={`font-semibold ${
                      currentLanguage === language.code ? 'text-blue-300' : 'text-white'
                    }`}>
                      {language.nativeName}
                    </Text>
                    <Text className={`text-sm ${
                      currentLanguage === language.code ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {language.name}
                    </Text>
                  </View>
                  
                  {currentLanguage === language.code && (
                    <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                      <Text className="text-white text-xs font-bold">✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Info */}
        <View className="p-4 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="mb-2 text-lg font-bold text-white">ℹ️ {t('common.info', 'Information')}</Text>
          <Text className="leading-6 text-slate-300">
            Changing the language will update all text in the app and also adjust the voice synthesis language for speech features.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default LanguageScreen;