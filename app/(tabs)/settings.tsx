import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/src/locales/i18n";
import { useTheme } from "@/src/contexts/ThemeContext";
import SimpleHamburgerMenu from "@/src/components/SimpleHamburgerMenu";

const Settings: React.FC = () => {
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
    <View style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={isDark ? "#0F172A" : "#FFFFFF"} 
      />
      
      {/* Simple Hamburger Menu */}
      <SimpleHamburgerMenu />
      
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E40AF'] : ['#3B82F6', '#2563EB']}
        style={{
          paddingTop: 60,
          paddingBottom: 40,
          paddingHorizontal: 32,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#FFFFFF',
            marginBottom: 8,
          }}>
            {t('settings.title')}
          </Text>
          <Text style={{
            fontSize: 18,
            textAlign: 'center',
            color: '#E0E7FF',
            lineHeight: 24,
          }}>
            {t('settings.subtitle')}
          </Text>
        </View>
      </LinearGradient>
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: 24, 
          paddingTop: 32, 
          paddingBottom: 40 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Settings */}
        <View style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: 20,
          padding: 32,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: isDark ? '#334155' : '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 16,
          elevation: 8,
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: isDark ? '#FFFFFF' : '#0F172A',
            marginBottom: 24,
            textAlign: 'center',
          }}>
            🌐 {t('settings.language')}
          </Text>
          
          {/* Current Language Display */}
          <View style={{
            backgroundColor: isDark ? '#334155' : '#F8FAFC',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <Text style={{
              color: isDark ? '#CBD5E1' : '#64748B',
              fontSize: 16,
              marginBottom: 8,
            }}>
              {t('language.currentLanguage')}
            </Text>
            <Text style={{
              color: isDark ? '#FFFFFF' : '#0F172A',
              fontWeight: 'bold',
              fontSize: 22,
            }}>
              {getCurrentLanguageName()}
            </Text>
          </View>
          
          {/* Language Selection Buttons */}
          <View style={{ gap: 16 }}>
            <TouchableOpacity
              onPress={async () => {
                await changeLanguage('en');
              }}
              style={{
                backgroundColor: i18n.language === 'en' 
                  ? (isDark ? '#1E40AF' : '#3B82F6')
                  : (isDark ? '#374151' : '#F1F5F9'),
                borderRadius: 16,
                padding: 24,
                borderWidth: 2,
                borderColor: i18n.language === 'en' 
                  ? (isDark ? '#3B82F6' : '#2563EB')
                  : (isDark ? '#4B5563' : '#CBD5E1'),
              }}
              accessibilityRole="button"
              accessibilityLabel="Select English language"
            >
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <View>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: i18n.language === 'en' 
                      ? '#FFFFFF' 
                      : (isDark ? '#FFFFFF' : '#0F172A'),
                    marginBottom: 4,
                  }}>
                    English
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    color: i18n.language === 'en' 
                      ? '#E0E7FF' 
                      : (isDark ? '#94A3B8' : '#64748B'),
                  }}>
                    English
                  </Text>
                </View>
                {i18n.language === 'en' && (
                  <View style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ 
                      color: '#3B82F6', 
                      fontSize: 16, 
                      fontWeight: 'bold' 
                    }}>
                      ✓
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={async () => {
                await changeLanguage('hi');
              }}
              style={{
                backgroundColor: i18n.language === 'hi' 
                  ? (isDark ? '#1E40AF' : '#3B82F6')
                  : (isDark ? '#374151' : '#F1F5F9'),
                borderRadius: 16,
                padding: 24,
                borderWidth: 2,
                borderColor: i18n.language === 'hi' 
                  ? (isDark ? '#3B82F6' : '#2563EB')
                  : (isDark ? '#4B5563' : '#CBD5E1'),
              }}
              accessibilityRole="button"
              accessibilityLabel="Select Hindi language"
            >
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <View>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: i18n.language === 'hi' 
                      ? '#FFFFFF' 
                      : (isDark ? '#FFFFFF' : '#0F172A'),
                    marginBottom: 4,
                  }}>
                    हिंदी
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    color: i18n.language === 'hi' 
                      ? '#E0E7FF' 
                      : (isDark ? '#94A3B8' : '#64748B'),
                  }}>
                    Hindi
                  </Text>
                </View>
                {i18n.language === 'hi' && (
                  <View style={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ 
                      color: '#3B82F6', 
                      fontSize: 16, 
                      fontWeight: 'bold' 
                    }}>
                      ✓
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Settings */}
        <View style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: 20,
          padding: 32,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: isDark ? '#334155' : '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 16,
          elevation: 8,
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: isDark ? '#FFFFFF' : '#0F172A',
            marginBottom: 32,
            textAlign: 'center',
          }}>
            ⚙️ {t('settings.appSettings')}
          </Text>
          
          <View style={{ gap: 24 }}>
            {/* Dark Mode Toggle */}
            <View style={{
              backgroundColor: isDark ? '#334155' : '#F8FAFC',
              borderRadius: 16,
              padding: 24,
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <View style={{ flex: 1, marginRight: 20 }}>
                <Text style={{ 
                  fontWeight: 'bold',
                  color: colors.text,
                  fontSize: 20,
                  marginBottom: 8,
                }}>
                  {t('settings.darkMode')}
                </Text>
                <Text style={{ 
                  fontSize: 16,
                  color: colors.textSecondary,
                  lineHeight: 24,
                }}>
                  {t('settings.useDarkTheme')}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor={isDark ? '#FFFFFF' : '#64748B'}
                style={{ 
                  transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
                }}
                accessibilityLabel={`Dark mode is ${isDark ? 'enabled' : 'disabled'}`}
              />
            </View>

            {/* Notifications Toggle */}
            <View style={{
              backgroundColor: isDark ? '#334155' : '#F8FAFC',
              borderRadius: 16,
              padding: 24,
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <View style={{ flex: 1, marginRight: 20 }}>
                <Text style={{
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontWeight: 'bold',
                  fontSize: 20,
                  marginBottom: 8,
                }}>
                  {t('settings.notifications')}
                </Text>
                <Text style={{
                  color: isDark ? '#94A3B8' : '#64748B',
                  fontSize: 16,
                  lineHeight: 24,
                }}>
                  {t('settings.enableNotifications')}
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor={notifications ? '#FFFFFF' : '#64748B'}
                style={{ 
                  transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
                }}
                accessibilityLabel={`Notifications are ${notifications ? 'enabled' : 'disabled'}`}
              />
            </View>

            {/* Voice Feedback Toggle */}
            <View style={{
              backgroundColor: isDark ? '#334155' : '#F8FAFC',
              borderRadius: 16,
              padding: 24,
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <View style={{ flex: 1, marginRight: 20 }}>
                <Text style={{
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontWeight: 'bold',
                  fontSize: 20,
                  marginBottom: 8,
                }}>
                  {t('settings.voiceFeedback')}
                </Text>
                <Text style={{
                  color: isDark ? '#94A3B8' : '#64748B',
                  fontSize: 16,
                  lineHeight: 24,
                }}>
                  {t('settings.enableVoiceResponses')}
                </Text>
              </View>
              <Switch
                value={voiceEnabled}
                onValueChange={setVoiceEnabled}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor={voiceEnabled ? '#FFFFFF' : '#64748B'}
                style={{ 
                  transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
                }}
                accessibilityLabel={`Voice feedback is ${voiceEnabled ? 'enabled' : 'disabled'}`}
              />
            </View>
          </View>
        </View>

        {/* Accessibility */}
        <View style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: 20,
          padding: 32,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: isDark ? '#334155' : '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 16,
          elevation: 8,
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: isDark ? '#FFFFFF' : '#0F172A',
            marginBottom: 24,
            textAlign: 'center',
          }}>
            ♿ {t('settings.accessibility')}
          </Text>
          
          <View style={{
            backgroundColor: isDark ? '#334155' : '#F8FAFC',
            borderRadius: 16,
            padding: 24,
          }}>
            <Text style={{
              color: isDark ? '#CBD5E1' : '#475569',
              lineHeight: 28,
              fontSize: 16,
              textAlign: 'center',
            }}>
              {t('settings.accessibilityDescription')}
            </Text>
          </View>
        </View>

        {/* About */}
        <View style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderRadius: 20,
          padding: 32,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: isDark ? '#334155' : '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 16,
          elevation: 8,
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: isDark ? '#FFFFFF' : '#0F172A',
            marginBottom: 32,
            textAlign: 'center',
          }}>
            ℹ️ {t('settings.about')}
          </Text>
          
          <View style={{ gap: 20 }}>
            <View style={{
              backgroundColor: isDark ? '#334155' : '#F8FAFC',
              borderRadius: 16,
              padding: 20,
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <Text style={{ 
                color: isDark ? '#CBD5E1' : '#64748B', 
                fontSize: 18,
                fontWeight: '600',
              }}>
                {t('settings.version')}
              </Text>
              <Text style={{ 
                color: isDark ? '#FFFFFF' : '#0F172A',
                fontWeight: 'bold',
                fontSize: 18,
              }}>
                1.0.0
              </Text>
            </View>
            
            <View style={{
              backgroundColor: isDark ? '#334155' : '#F8FAFC',
              borderRadius: 16,
              padding: 20,
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <Text style={{ 
                color: isDark ? '#CBD5E1' : '#64748B', 
                fontSize: 18,
                fontWeight: '600',
              }}>
                {t('settings.build')}
              </Text>
              <Text style={{ 
                color: isDark ? '#FFFFFF' : '#0F172A',
                fontWeight: 'bold',
                fontSize: 18,
              }}>
                2024.12.08
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Settings;