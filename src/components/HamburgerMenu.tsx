import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface HamburgerMenuProps {
  currentRoute?: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ currentRoute }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const router = useRouter();
  const { t } = useTranslation();

  const menuItems = [
    { key: 'index', title: t('navigation.home'), icon: '🏠', route: '/' },
    { key: 'speech', title: t('navigation.speech'), icon: '🎤', route: '/speech' },
    { key: 'settings', title: t('navigation.settings'), icon: '⚙️', route: '/settings' },
    { key: 'sos', title: t('navigation.sos'), icon: '🚨', route: '/sos' },
    { key: 'currency', title: t('navigation.currency'), icon: '💰', route: '/currency' },
    { key: 'profile', title: t('navigation.profile'), icon: '👤', route: '/profile' },
  ];

  const openMenu = () => {
    setIsVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const navigateTo = (route: string) => {
    closeMenu();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  return (
    <>
      {/* Hamburger Button */}
      <TouchableOpacity
        onPress={openMenu}
        style={{
          position: 'absolute',
          top: 50,
          left: 20,
          zIndex: 1000,
          backgroundColor: 'white',
          padding: 12,
          borderRadius: 25,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 8,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 24, height: 3, backgroundColor: '#333', marginBottom: 3 }} />
          <View style={{ width: 24, height: 3, backgroundColor: '#333', marginBottom: 3 }} />
          <View style={{ width: 24, height: 3, backgroundColor: '#333' }} />
        </View>
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <View className="flex-1">
          {/* Backdrop */}
          <TouchableOpacity
            className="flex-1 bg-black/50"
            activeOpacity={1}
            onPress={closeMenu}
          />

          {/* Menu Panel */}
          <Animated.View
            style={{
              transform: [{ translateX: slideAnim }],
              position: 'absolute',
              left: 0,
              top: 0,
              width: width * 0.8,
              height: height,
            }}
          >
            <LinearGradient
              colors={['#1E293B', '#334155', '#475569']}
              className="flex-1"
            >
              <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
              
              {/* Header */}
              <View className="pt-16 pb-8 px-6 border-b border-slate-600">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-2xl font-bold text-white">Dhvani</Text>
                    <Text className="text-slate-300 text-sm">{t('home.subtitle')}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={closeMenu}
                    className="p-2 bg-slate-700 rounded-full"
                  >
                    <Text className="text-white text-lg">✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Menu Items */}
              <View className="flex-1 px-4 py-6">
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => navigateTo(item.route)}
                    className={`flex-row items-center p-4 mb-2 rounded-xl ${
                      currentRoute === item.route
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-slate-700/30'
                    }`}
                  >
                    <Text className="text-2xl mr-4">{item.icon}</Text>
                    <Text
                      className={`text-lg font-semibold ${
                        currentRoute === item.route ? 'text-blue-300' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </Text>
                    {currentRoute === item.route && (
                      <View className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Footer */}
              <View className="px-6 py-4 border-t border-slate-600">
                <Text className="text-slate-400 text-sm text-center">
                  {t('profile.footerText')}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

export default HamburgerMenu;