import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const SimpleHamburgerMenu: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const menuItems = [
    { title: t('navigation.home'), route: '/index', icon: '🏠' },
    { title: t('navigation.speech'), route: '/speech', icon: '🎤' },
    { title: t('navigation.settings'), route: '/settings', icon: '⚙️' },
    { title: t('navigation.sos'), route: '/sos', icon: '🚨' },
    { title: t('navigation.currency'), route: '/currency', icon: '💰' },
    { title: t('navigation.profile'), route: '/profile', icon: '👤' },
  ];

  const navigateTo = (route: string) => {
    setIsVisible(false);
    setTimeout(() => {
      try {
        console.log(`🧭 Navigating to: ${route}`);
        // Use direct tab navigation for all routes
        switch (route) {
          case '/profile':
            router.push('/(tabs)/profile');
            break;
          case '/index':
            router.push('/(tabs)/');
            break;
          case '/speech':
            router.push('/(tabs)/speech');
            break;
          case '/settings':
            router.push('/(tabs)/settings');
            break;
          case '/sos':
            router.push('/(tabs)/sos');
            break;
          case '/currency':
            router.push('/(tabs)/currency');
            break;
          default:
            router.push('/(tabs)/');
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        router.push('/(tabs)/');
      }
    }, 100);
  };

  return (
    <>
      {/* Floating Hamburger Button */}
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        style={{
          position: 'absolute',
          top: 60,
          left: 20,
          zIndex: 999,
          backgroundColor: '#3B82F6',
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View>
          <View style={{ width: 20, height: 2, backgroundColor: 'white', marginBottom: 4 }} />
          <View style={{ width: 20, height: 2, backgroundColor: 'white', marginBottom: 4 }} />
          <View style={{ width: 20, height: 2, backgroundColor: 'white' }} />
        </View>
      </TouchableOpacity>

      {/* Simple Menu Modal */}
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setIsVisible(false)}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              width: '80%',
              maxWidth: 300,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
              Navigation
            </Text>
            
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => navigateTo(item.route)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 15,
                  borderRadius: 10,
                  marginBottom: 10,
                  backgroundColor: '#F3F4F6',
                }}
              >
                <Text style={{ fontSize: 24, marginRight: 15 }}>{item.icon}</Text>
                <Text style={{ fontSize: 18, fontWeight: '600' }}>{item.title}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              onPress={() => setIsVisible(false)}
              style={{
                backgroundColor: '#EF4444',
                padding: 15,
                borderRadius: 10,
                marginTop: 10,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default SimpleHamburgerMenu;