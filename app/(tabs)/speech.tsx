import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from 'expo-document-picker';

import { useAppStore } from "@/store/useAppStore";
import { BackendService } from "@/services/backendService";

const Speech = () => {
  const [inputText, setInputText] = useState("");
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [currentBackendUrl, setCurrentBackendUrl] = useState(BackendService.getBaseUrl());
  
  const {
    currentPDF,
    isLoading,
    isUploading,
    error,
    updatePDFText,
    setCurrentPDF,
    setError,
    uploadPDFToBackend,
    loadDocumentsFromBackend,
  } = useAppStore();

  // Auto-detect platform and set appropriate URL
  useEffect(() => {
    console.log('🔍 [Speech] Platform detected:', Platform.OS);
    console.log('🌐 [Speech] Using production backend by default:', BackendService.getBaseUrl());
    
    // Use production URL by default (already set in BackendService)
    // Users can switch to local development URLs if needed
    setCurrentBackendUrl(BackendService.getBaseUrl());
  }, []);

  // Load documents from backend on component mount
  useEffect(() => {
    console.log('🔄 [Speech] Component mounted, loading documents from backend...');
    loadDocumentsFromBackend();
  }, []);

  // Update input text when current PDF changes
  useEffect(() => {
    if (currentPDF) {
      console.log('📄 [Speech] Loading text from current PDF:', currentPDF.name);
      setInputText(currentPDF.extractedText);
    } else {
      setInputText("");
    }
  }, [currentPDF]);

  const handleFileUpload = async () => {
    console.log('🚀 [Speech] Starting PDF upload...');
    console.log('🔗 [Speech] Backend URL:', BackendService.getBaseUrl());
    
    try {
      setError(null);
      
      // Pick PDF file
      console.log('📂 [Speech] Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('👤 [Speech] User cancelled file selection');
        return;
      }

      const file = result.assets[0];
      console.log('✅ [Speech] File picked successfully:');
      console.log('  - Name:', file.name);
      console.log('  - URI:', file.uri);
      console.log('  - Size:', file.size);
      console.log('  - Type:', file.mimeType);

      // Show upload progress
      Alert.alert("Uploading", `Uploading "${file.name}" to server for text extraction...`, [{ text: "OK" }]);
      
      // Upload to backend
      console.log('📤 [Speech] Starting backend upload...');
      const pdfFile = await uploadPDFToBackend(file.uri, file.name, file.size || 0);
      
      console.log('🎉 [Speech] Upload completed successfully!');
      
      // Show success message
      Alert.alert(
        "Text Extracted!", 
        `Successfully extracted ${pdfFile.extractedText.length} characters from "${pdfFile.name}".`,
        [{ text: "Great!" }]
      );

    } catch (error) {
      console.error('💥 [Speech] Upload error occurred:');
      console.error('  - Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('  - Error message:', errorMessage);
      
      Alert.alert(
        "Upload Failed", 
        errorMessage,
        [
          { text: "OK" },
          { 
            text: "Show Debug Info", 
            onPress: () => setShowDebugInfo(true)
          }
        ]
      );
    }
  };

  const handleSaveText = () => {
    if (!inputText.trim()) {
      Alert.alert("No text to save", "Please add some text before saving.");
      return;
    }

    if (currentPDF) {
      updatePDFText(currentPDF.id, inputText);
      Alert.alert("Saved", "Your changes have been saved locally.");
    } else {
      Alert.alert("No PDF Selected", "Please upload a PDF first.");
    }
  };

  const handleClearText = () => {
    Alert.alert(
      "Clear Text",
      "Are you sure you want to clear all text?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => setInputText("")
        }
      ]
    );
  };

  const handleRefreshDocuments = async () => {
    try {
      console.log('🔄 [Speech] Refreshing documents from backend...');
      await loadDocumentsFromBackend();
      Alert.alert("Refreshed", "Documents loaded from server.");
    } catch (error) {
      console.error('💥 [Speech] Refresh error:', error);
      Alert.alert("Error", "Failed to refresh documents.");
    }
  };

  const handleTestConnection = async () => {
    try {
      console.log('🔍 [Speech] Testing backend connection...');
      Alert.alert("Testing Connection", "Checking server connectivity...");
      
      const healthData = await BackendService.checkHealth();
      Alert.alert(
        "Connection Test Passed", 
        `✅ ${healthData.message}\n\nServer Time: ${new Date(healthData.timestamp).toLocaleString()}`
      );
    } catch (error) {
      console.error('💥 [Speech] Connection test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      Alert.alert("Connection Test Failed", `❌ ${errorMessage}`);
    }
  };

  const handleSwitchBackendUrl = () => {
    const options = [
      { text: 'Cancel', style: 'cancel' as const },
      { 
        text: 'Production (Vercel)', 
        onPress: () => {
          BackendService.setUrlForPlatform('production');
          setCurrentBackendUrl(BackendService.getBaseUrl());
          Alert.alert('URL Changed', 'Now using Production URL (Vercel)');
        }
      },
      { 
        text: 'iOS Simulator (localhost)', 
        onPress: () => {
          BackendService.setUrlForPlatform('ios');
          setCurrentBackendUrl(BackendService.getBaseUrl());
          Alert.alert('URL Changed', 'Now using iOS Simulator URL');
        }
      },
      { 
        text: 'Android Emulator (10.0.2.2)', 
        onPress: () => {
          BackendService.setUrlForPlatform('android');
          setCurrentBackendUrl(BackendService.getBaseUrl());
          Alert.alert('URL Changed', 'Now using Android Emulator URL');
        }
      },
    ];

    Alert.alert(
      'Switch Backend URL',
      `Current: ${currentBackendUrl}\n\nChoose the URL for your platform:`,
      options
    );
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
            PDF to Text
          </Text>
          <Text className="text-base text-center text-slate-300">
            Upload PDF files to server for text extraction
          </Text>
          <View className="flex-row justify-center items-center mt-4 gap-4">
            <TouchableOpacity
              onPress={handleRefreshDocuments}
              disabled={isLoading}
              className="px-3 py-1 rounded-lg bg-blue-500/20"
            >
              <Text className="text-sm text-blue-400">
                {isLoading ? "Loading..." : "↻ Refresh"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleTestConnection}
              disabled={isLoading}
              className="px-3 py-1 rounded-lg bg-green-500/20"
            >
              <Text className="text-sm text-green-400">
                🔍 Test Connection
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Backend Info */}
        <TouchableOpacity
          onPress={() => setShowDebugInfo(!showDebugInfo)}
          className="mb-6 p-3 rounded-lg border bg-slate-800/30 border-slate-700/50"
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-slate-400">
              Backend: {currentBackendUrl} {showDebugInfo ? '▼' : '▶'}
            </Text>
            <TouchableOpacity
              onPress={handleSwitchBackendUrl}
              className="px-2 py-1 rounded bg-blue-500/20"
            >
              <Text className="text-xs text-blue-400">Switch</Text>
            </TouchableOpacity>
          </View>
          {showDebugInfo && (
            <View className="mt-2 pt-2 border-t border-slate-700">
              <Text className="text-xs text-slate-500 mb-1">Platform: {Platform.OS}</Text>
              <Text className="text-xs text-slate-500 mb-1">Available URLs:</Text>
              <Text className="text-xs text-slate-400">• Production: https://dhvani-backend.vercel.app</Text>
              <Text className="text-xs text-slate-400">• iOS Simulator: http://localhost:3000</Text>
              <Text className="text-xs text-slate-400">• Android Emulator: http://10.0.2.2:3000</Text>
              <Text className="text-xs text-slate-400">• Physical Device: your computer's IP</Text>
              <Text className="text-xs text-slate-500 mt-1">
                Current: {currentBackendUrl}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Current PDF Info */}
        {currentPDF && (
          <View className="p-4 mb-6 rounded-xl border bg-blue-500/20 border-blue-500/30">
            <Text className="mb-1 text-sm font-semibold text-blue-400">Current PDF</Text>
            <Text className="mb-1 text-lg font-bold text-white">{currentPDF.name}</Text>
            <Text className="text-sm text-slate-300">
              {BackendService.formatFileSize(currentPDF.size)} • {
                currentPDF.createdAt && currentPDF.createdAt instanceof Date 
                  ? currentPDF.createdAt.toLocaleDateString()
                  : 'Recently added'
              }
              {currentPDF.isFromBackend && (
                <Text className="text-green-400"> • From Server</Text>
              )}
            </Text>
          </View>
        )}

        {/* Upload Section */}
        <TouchableOpacity
          onPress={handleFileUpload}
          disabled={isUploading || isLoading}
          className={`bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-xl p-8 items-center mb-6 ${
            isUploading || isLoading ? 'opacity-50' : ''
          }`}
        >
          {isUploading ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : (
            <>
              <Text className="mb-2 text-2xl">📄</Text>
              <Text className="mb-1 text-lg font-semibold text-white">
                {isUploading ? 'Uploading to Server...' : 'Upload PDF'}
              </Text>
              <Text className="text-center text-slate-400">
                Tap to select a PDF file for server processing
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Text Input Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-white">Extracted Text</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleClearText}
                className="px-3 py-1 rounded-lg bg-red-500/20"
              >
                <Text className="text-sm font-semibold text-red-400">Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveText}
                className="px-3 py-1 rounded-lg bg-green-500/20"
              >
                <Text className="text-sm font-semibold text-green-400">Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* PDF Status Indicator */}
          {currentPDF && inputText && (
            <View className="mb-3">
              {inputText.includes('Failed to extract text') || inputText.includes('No text could be extracted') ? (
                <View className="flex-row items-center p-2 rounded-lg border bg-orange-500/20 border-orange-500/30">
                  <Text className="text-sm text-orange-400">⚠️ Text extraction failed - you can edit manually</Text>
                </View>
              ) : (
                <View className="flex-row items-center p-2 rounded-lg border bg-green-500/20 border-green-500/30">
                  <Text className="text-sm text-green-400">✅ Text extracted successfully from server</Text>
                </View>
              )}
            </View>
          )}
          
          <View className="p-4 rounded-xl border bg-slate-800/50 border-slate-700/50">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Upload a PDF file to automatically extract text from server, or type your own text here..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={12}
              className="text-white text-base leading-6 min-h-[200px]"
              textAlignVertical="top"
            />
          </View>
          <Text className="mt-2 text-sm text-slate-400">
            {inputText.length} characters
          </Text>
        </View>

        {/* Error Display */}
        {error && (
          <View className="p-4 mb-6 rounded-xl border bg-red-500/20 border-red-500/30">
            <Text className="font-semibold text-red-400">Error</Text>
            <Text className="text-sm text-red-300">{error}</Text>
          </View>
        )}

        {/* Info */}
        <View className="p-4 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="mb-2 text-lg font-bold text-white">How it works:</Text>
          <Text className="mb-2 text-slate-300">1. Upload a PDF file to the server</Text>
          <Text className="mb-2 text-slate-300">2. Server extracts text using Node.js libraries</Text>
          <Text className="mb-2 text-slate-300">3. Text is saved to database and returned</Text>
          <Text className="mb-2 text-slate-300">4. Edit the text locally if needed</Text>
          <Text className="text-slate-300">5. Ready for TTS processing</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Speech;
