import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';
import { getSpeechLanguageCode } from '../locales/i18n';

const DebugSpeech: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const testBasicSpeech = () => {
    setIsSpeaking(true);
    console.log('🎤 Testing basic speech...');
    
    Speech.speak('Hello, this is a test', {
      onDone: () => {
        console.log('✅ Basic speech completed');
        setIsSpeaking(false);
      },
      onError: (error) => {
        console.error('❌ Basic speech error:', error);
        setIsSpeaking(false);
        Alert.alert('Speech Error', JSON.stringify(error));
      },
    });
  };

  const testLanguageSpecificSpeech = () => {
    const languageCode = getSpeechLanguageCode(i18n.language);
    const message = t('home.welcome');
    
    setIsSpeaking(true);
    console.log(`🎤 Testing ${i18n.language} (${languageCode}): "${message}"`);
    
    Speech.speak(message, {
      language: languageCode,
      onDone: () => {
        console.log(`✅ ${i18n.language} speech completed`);
        setIsSpeaking(false);
      },
      onError: (error) => {
        console.error(`❌ ${i18n.language} speech error:`, error);
        setIsSpeaking(false);
        Alert.alert('Language Speech Error', `${i18n.language}: ${JSON.stringify(error)}`);
      },
    });
  };

  const testSimpleLanguageCodes = () => {
    const simpleCode = i18n.language; // Just 'en', 'hi', 'bn'
    const message = t('home.welcome');
    
    setIsSpeaking(true);
    console.log(`🎤 Testing simple code ${simpleCode}: "${message}"`);
    
    Speech.speak(message, {
      language: simpleCode,
      onDone: () => {
        console.log(`✅ Simple ${simpleCode} speech completed`);
        setIsSpeaking(false);
      },
      onError: (error) => {
        console.error(`❌ Simple ${simpleCode} speech error:`, error);
        setIsSpeaking(false);
        Alert.alert('Simple Code Error', `${simpleCode}: ${JSON.stringify(error)}`);
      },
    });
  };

  return (
    <View style={{ 
      margin: 16, 
      padding: 16, 
      backgroundColor: '#FEF3C7', 
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#F59E0B'
    }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
        🐛 Speech Debug
      </Text>
      
      <Text style={{ marginBottom: 8, textAlign: 'center' }}>
        Current Language: {i18n.language}
      </Text>
      
      <Text style={{ marginBottom: 12, textAlign: 'center' }}>
        Message: "{t('home.welcome')}"
      </Text>
      
      <View style={{ gap: 8 }}>
        <TouchableOpacity
          onPress={testBasicSpeech}
          disabled={isSpeaking}
          style={{
            backgroundColor: isSpeaking ? '#9CA3AF' : '#10B981',
            padding: 12,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Test Basic Speech (English)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={testLanguageSpecificSpeech}
          disabled={isSpeaking}
          style={{
            backgroundColor: isSpeaking ? '#9CA3AF' : '#3B82F6',
            padding: 12,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Test Current Language ({getSpeechLanguageCode(i18n.language)})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={testSimpleLanguageCodes}
          disabled={isSpeaking}
          style={{
            backgroundColor: isSpeaking ? '#9CA3AF' : '#8B5CF6',
            padding: 12,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Test Simple Code ({i18n.language})
          </Text>
        </TouchableOpacity>
      </View>
      
      {isSpeaking && (
        <Text style={{ marginTop: 8, textAlign: 'center', color: '#F59E0B', fontWeight: 'bold' }}>
          🔊 Speaking...
        </Text>
      )}
    </View>
  );
};

export default DebugSpeech;