import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/src/locales/i18n";
import { useTheme } from "@/src/contexts/ThemeContext";
import SimpleHamburgerMenu from "@/src/components/SimpleHamburgerMenu";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { toggleTheme, isDark, colors } = useTheme();
  const [notifications, setNotifications] = React.useState(true);
  const [voiceEnabled, setVoiceEnabled] = React.useState(true);

  const getCurrentLanguageName = () => {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'hi': 'हिंदी'
    };
    return languageNames[i18n.language] || 'English';
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Simple Hamburger Menu */}
      <SimpleHamburgerMenu />
      
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B', '#334155'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0']}
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
            {t('settings.title')}
          </Text>
          <Text className="text-base text-center text-slate-300">
            {t('settings.subtitle')}
          </Text>
        </View>

        {/* Language Settings */}
        <View className="p-4 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="mb-4 text-lg font-bold text-white">🌐 {t('settings.language')}</Text>
          
          {/* Current Language Display */}
          <View className="p-3 mb-3 bg-slate-700/50 rounded-lg">
            <Text className="text-slate-300 text-sm">{t('language.currentLanguage')}</Text>
            <Text className="text-white font-semibold text-lg">{getCurrentLanguageName()}</Text>
          </View>
          
          {/* Language Selection Buttons */}
          <View className="space-y-2">
            <TouchableOpacity
              onPress={async () => {
                await changeLanguage('en');
              }}
              className={`p-3 rounded-lg border ${
                i18n.language === 'en' 
                  ? 'bg-blue-500/20 border-blue-500' 
                  : 'bg-slate-700/50 border-slate-600'
              }`}
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className={`font-semibold ${
                    i18n.language === 'en' ? 'text-blue-300' : 'text-white'
                  }`}>
                    English
                  </Text>
                  <Text className={`text-sm ${
                    i18n.language === 'en' ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                    English
                  </Text>
                </View>
                {i18n.language === 'en' && (
                  <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={async () => {
                await changeLanguage('hi');
              }}
              className={`p-3 rounded-lg border ${
                i18n.language === 'hi' 
                  ? 'bg-blue-500/20 border-blue-500' 
                  : 'bg-slate-700/50 border-slate-600'
              }`}
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className={`font-semibold ${
                    i18n.language === 'hi' ? 'text-blue-300' : 'text-white'
                  }`}>
                    हिंदी
                  </Text>
                  <Text className={`text-sm ${
                    i18n.language === 'hi' ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                    Hindi
                  </Text>
                </View>
                {i18n.language === 'hi' && (
                  <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* App Settings */}
        <View className="p-4 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="mb-4 text-lg font-bold text-white">⚙️ {t('settings.appSettings')}</Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="font-semibold" style={{ color: colors.text }}>{t('settings.darkMode')}</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>{t('settings.useDarkTheme')}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={isDark ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-white font-semibold">{t('settings.notifications')}</Text>
                <Text className="text-slate-400 text-sm">{t('settings.enableNotifications')}</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={notifications ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-white font-semibold">{t('settings.voiceFeedback')}</Text>
                <Text className="text-slate-400 text-sm">{t('settings.enableVoiceResponses')}</Text>
              </View>
              <Switch
                value={voiceEnabled}
                onValueChange={setVoiceEnabled}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={voiceEnabled ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          </View>
        </View>

        {/* Accessibility */}
        <View className="p-4 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="mb-4 text-lg font-bold text-white">♿ {t('settings.accessibility')}</Text>
          <Text className="text-slate-300 leading-6">
            {t('settings.accessibilityDescription')}
          </Text>
        </View>

        {/* About */}
        <View className="p-4 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="mb-4 text-lg font-bold text-white">ℹ️ {t('settings.about')}</Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-slate-300">{t('settings.version')}</Text>
              <Text className="text-white font-semibold">1.0.0</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-300">{t('settings.build')}</Text>
              <Text className="text-white font-semibold">2024.12.08</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Settings;