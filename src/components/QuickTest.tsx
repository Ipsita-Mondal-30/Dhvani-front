import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';

const QuickTest: React.FC = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const testProfile = () => {
    console.log('🧪 Testing profile navigation...');
    router.push('/(tabs)/profile');
  };

  const testHindiSpeech = () => {
    console.log('🧪 Testing Hindi speech...');
    const message = "नमस्ते, यह हिंदी में परीक्षण है";
    
    Speech.speak(message, {
      language: 'hi',
      onDone: () => console.log('✅ Hindi speech completed'),
      onError: (error) => {
        console.error('❌ Hindi speech failed:', error);
        // Try without language specification
        Speech.speak(message, {
          onDone: () => console.log('✅ Fallback speech completed'),
          onError: (err) => console.error('❌ Fallback also failed:', err),
        });
      },
    });
  };

  const testBasicSpeech = () => {
    console.log('🧪 Testing basic speech...');
    Speech.speak('Hello, this is a basic test', {
      onDone: () => console.log('✅ Basic speech completed'),
      onError: (error) => console.error('❌ Basic speech failed:', error),
    });
  };

  return (
    <View style={{ 
      margin: 16, 
      padding: 16, 
      backgroundColor: '#FEE2E2', 
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#EF4444'
    }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
        🧪 Quick Tests
      </Text>
      
      <View style={{ gap: 8 }}>
        <TouchableOpacity
          onPress={testProfile}
          style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 6 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Test Profile Navigation
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={testBasicSpeech}
          style={{ backgroundColor: '#10B981', padding: 12, borderRadius: 6 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Test Basic Speech
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={testHindiSpeech}
          style={{ backgroundColor: '#F59E0B', padding: 12, borderRadius: 6 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Test Hindi Speech
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={{ marginTop: 8, fontSize: 12, textAlign: 'center', color: '#7F1D1D' }}>
        Check console for test results
      </Text>
    </View>
  );
};

export default QuickTest;