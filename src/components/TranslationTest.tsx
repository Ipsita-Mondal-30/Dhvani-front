import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../locales/i18n';

const TranslationTest: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <View style={{ 
      margin: 16, 
      padding: 16, 
      backgroundColor: '#DBEAFE', 
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#3B82F6'
    }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
        🌐 Translation Test
      </Text>
      
      <Text style={{ marginBottom: 8 }}>
        Current Language: {i18n.language}
      </Text>
      
      <Text style={{ marginBottom: 8 }}>
        home.title: "{t('home.title')}"
      </Text>
      
      <Text style={{ marginBottom: 8 }}>
        home.welcome: "{t('home.welcome')}"
      </Text>
      
      <Text style={{ marginBottom: 8 }}>
        home.description: "{t('home.description')}"
      </Text>
      
      <Text style={{ marginBottom: 12 }}>
        navigation.profile: "{t('navigation.profile')}"
      </Text>
      
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => changeLanguage('en')}
          style={{ backgroundColor: '#10B981', padding: 8, borderRadius: 4, flex: 1 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>EN</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => changeLanguage('hi')}
          style={{ backgroundColor: '#F59E0B', padding: 8, borderRadius: 4, flex: 1 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>HI</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => changeLanguage('bn')}
          style={{ backgroundColor: '#8B5CF6', padding: 8, borderRadius: 4, flex: 1 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>BN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TranslationTest;